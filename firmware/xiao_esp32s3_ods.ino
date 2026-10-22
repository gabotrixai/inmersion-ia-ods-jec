/*
 * CIRCUITO ODS · Firmware para Seeed Studio XIAO ESP32S3 Sense
 * ------------------------------------------------------------
 * Envía al webhook del Circuito ODS:
 *   - Humedad del suelo (sensor Grove analógico en el pin A0) cada INTERVALO_HUMEDAD_MS
 *   - Una foto de la cámara OV2640 (JPEG) cada INTERVALO_FOTO_MS (opcional)
 *
 * PASOS:
 *   1. Arduino IDE → Preferencias → URLs adicionales de gestor de tarjetas:
 *        https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 *   2. Gestor de tarjetas → instalar "esp32" by Espressif (2.0.x o 3.x).
 *   3. Herramientas → Placa: "XIAO_ESP32S3".  PSRAM: "OPI PSRAM".  USB CDC On Boot: "Enabled".
 *   4. Cambien WIFI_SSID, WIFI_PASS y TOKEN_EQUIPO (el token está en la consola del equipo, nivel CONNECT).
 *   5. Subir. Abrir el Monitor Serie a 115200 para ver qué pasa.
 *
 * CONEXIÓN DEL SENSOR DE HUMEDAD GROVE:
 *   VCC → 3V3   ·   GND → GND   ·   SIG → A0 (D0)
 *   Sin sensor: pongan USAR_HUMEDAD en false y el firmware solo manda fotos (o un valor simulado si SIMULAR = true).
 *
 * El webhook también acepta cualquier otro cliente: celular con la app "HTTP Shortcuts", Make, n8n, Python, curl…
 *   curl -X POST https://rjrwzxryxssvapoewpqi.supabase.co/functions/v1/ingesta \
 *        -H "Content-Type: application/json" \
 *        -d '{"token":"ods_XXXXXXXXXXXXXX","tipo":"humedad","valor":42,"extra":{"unidad":"%"}}'
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "esp_camera.h"
#include "mbedtls/base64.h"

// ======================= CONFIGURACIÓN DEL EQUIPO =======================
const char* WIFI_SSID   = "NOMBRE_DEL_WIFI";
const char* WIFI_PASS   = "CLAVE_DEL_WIFI";
const char* TOKEN_EQUIPO = "ods_XXXXXXXXXXXXXX";   // ← token del equipo (consola → nivel CONNECT)
const char* WEBHOOK_URL = "https://rjrwzxryxssvapoewpqi.supabase.co/functions/v1/ingesta";

const bool USAR_HUMEDAD = true;      // sensor Grove en A0
const bool USAR_CAMARA  = true;      // foto JPEG cada INTERVALO_FOTO_MS
const bool SIMULAR      = false;     // true = manda humedad inventada (para probar sin sensor)

const unsigned long INTERVALO_HUMEDAD_MS = 15000;   // 15 s
const unsigned long INTERVALO_FOTO_MS    = 60000;   // 60 s

// Calibración del sensor: valor crudo (0-4095) en seco y en agua. Midan los suyos en la estación.
const int CRUDO_SECO = 3200;
const int CRUDO_AGUA = 1300;
// ========================================================================

#define PIN_HUMEDAD A0

// Pines de la cámara del XIAO ESP32S3 Sense
#define PWDN_GPIO_NUM  -1
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM  10
#define SIOD_GPIO_NUM  40
#define SIOC_GPIO_NUM  39
#define Y9_GPIO_NUM    48
#define Y8_GPIO_NUM    11
#define Y7_GPIO_NUM    12
#define Y6_GPIO_NUM    14
#define Y5_GPIO_NUM    16
#define Y4_GPIO_NUM    18
#define Y3_GPIO_NUM    17
#define Y2_GPIO_NUM    15
#define VSYNC_GPIO_NUM 38
#define HREF_GPIO_NUM  47
#define PCLK_GPIO_NUM  13

unsigned long ultimaHumedad = 0, ultimaFoto = 0;
bool camaraLista = false;

// ---------------------------------------------------------------- WiFi
void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[wifi] conectando a %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long t = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t < 20000) { delay(400); Serial.print("."); }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) Serial.printf("[wifi] OK · IP %s\n", WiFi.localIP().toString().c_str());
  else Serial.println("[wifi] sin conexión, reintento luego");
}

// ---------------------------------------------------------------- HTTP
bool enviarJSON(const String& cuerpo) {
  if (WiFi.status() != WL_CONNECTED) { conectarWiFi(); if (WiFi.status() != WL_CONNECTED) return false; }
  WiFiClientSecure cliente; cliente.setInsecure();       // TLS sin validar certificado (suficiente para el taller)
  HTTPClient http; http.setTimeout(15000);
  if (!http.begin(cliente, WEBHOOK_URL)) { Serial.println("[http] begin falló"); return false; }
  http.addHeader("Content-Type", "application/json");
  int codigo = http.POST(cuerpo);
  String resp = http.getString();
  http.end();
  Serial.printf("[http] %d · %s\n", codigo, resp.substring(0, 160).c_str());
  return codigo >= 200 && codigo < 300;
}

// ---------------------------------------------------------------- Humedad
void enviarHumedad() {
  int crudo; float pct;
  if (SIMULAR) { crudo = random(1200, 3300); }
  else { long suma = 0; for (int i = 0; i < 10; i++) { suma += analogRead(PIN_HUMEDAD); delay(10); } crudo = suma / 10; }
  pct = 100.0 * (CRUDO_SECO - crudo) / (float)(CRUDO_SECO - CRUDO_AGUA);
  pct = constrain(pct, 0, 100);
  const char* etiqueta = pct < 30 ? "seco" : (pct < 70 ? "humedo" : "encharcado");
  String cuerpo = String("{\"token\":\"") + TOKEN_EQUIPO + "\",\"tipo\":\"humedad\",\"valor\":" + String(pct, 1) +
                  ",\"extra\":{\"unidad\":\"%\",\"crudo\":" + crudo + ",\"etiqueta\":\"" + etiqueta + "\"" + (SIMULAR ? ",\"simulada\":true" : "") + "}}";
  Serial.printf("[humedad] crudo=%d · %.1f%% · %s\n", crudo, pct, etiqueta);
  enviarJSON(cuerpo);
}

// ---------------------------------------------------------------- Cámara
bool iniciarCamara() {
  camera_config_t c = {};
  c.ledc_channel = LEDC_CHANNEL_0; c.ledc_timer = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM; c.pin_d1 = Y3_GPIO_NUM; c.pin_d2 = Y4_GPIO_NUM; c.pin_d3 = Y5_GPIO_NUM;
  c.pin_d4 = Y6_GPIO_NUM; c.pin_d5 = Y7_GPIO_NUM; c.pin_d6 = Y8_GPIO_NUM; c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM; c.pin_pclk = PCLK_GPIO_NUM; c.pin_vsync = VSYNC_GPIO_NUM; c.pin_href = HREF_GPIO_NUM;
  c.pin_sccb_sda = SIOD_GPIO_NUM; c.pin_sccb_scl = SIOC_GPIO_NUM; c.pin_pwdn = PWDN_GPIO_NUM; c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000; c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size = FRAMESIZE_VGA;      // 640x480: suficiente y liviano (~30-40 KB)
  c.jpeg_quality = 14; c.fb_count = psramFound() ? 2 : 1;
  c.fb_location = psramFound() ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;
  c.grab_mode = CAMERA_GRAB_LATEST;
  esp_err_t err = esp_camera_init(&c);
  if (err != ESP_OK) { Serial.printf("[camara] init falló 0x%x\n", err); return false; }
  Serial.println("[camara] lista");
  return true;
}

void enviarFoto() {
  if (!camaraLista) return;
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { Serial.println("[camara] sin frame"); return; }
  size_t lenB64 = 0;
  mbedtls_base64_encode(nullptr, 0, &lenB64, fb->buf, fb->len);
  unsigned char* b64 = (unsigned char*)malloc(lenB64 + 1);
  if (!b64) { esp_camera_fb_return(fb); Serial.println("[camara] sin memoria"); return; }
  mbedtls_base64_encode(b64, lenB64 + 1, &lenB64, fb->buf, fb->len);
  b64[lenB64] = 0;
  Serial.printf("[camara] %u bytes JPEG → enviando\n", fb->len);
  String cuerpo; cuerpo.reserve(lenB64 + 200);
  cuerpo += "{\"token\":\""; cuerpo += TOKEN_EQUIPO; cuerpo += "\",\"tipo\":\"camara\",\"extra\":{\"ancho\":"; cuerpo += fb->width; cuerpo += ",\"alto\":"; cuerpo += fb->height; cuerpo += "},\"imagen_base64\":\"";
  cuerpo += (char*)b64; cuerpo += "\"}";
  free(b64); esp_camera_fb_return(fb);
  enviarJSON(cuerpo);
}

// ---------------------------------------------------------------- Arduino
void setup() {
  Serial.begin(115200); delay(800);
  Serial.println("\n=== CIRCUITO ODS · XIAO ESP32S3 Sense ===");
  analogReadResolution(12);
  if (USAR_CAMARA) camaraLista = iniciarCamara();
  conectarWiFi();
  // Primer envío inmediato para que el equipo vea la señal al instante
  if (USAR_HUMEDAD || SIMULAR) enviarHumedad();
  if (USAR_CAMARA && camaraLista) enviarFoto();
  ultimaHumedad = ultimaFoto = millis();
}

void loop() {
  unsigned long ahora = millis();
  if ((USAR_HUMEDAD || SIMULAR) && ahora - ultimaHumedad >= INTERVALO_HUMEDAD_MS) { ultimaHumedad = ahora; enviarHumedad(); }
  if (USAR_CAMARA && camaraLista && ahora - ultimaFoto >= INTERVALO_FOTO_MS) { ultimaFoto = ahora; enviarFoto(); }
  if (WiFi.status() != WL_CONNECTED) { conectarWiFi(); }
  delay(200);
}
