# Circuito ODS · Jornada de inmersión en IA (JEC · Confa Educación)

Plataforma gamificada para la jornada de inmersión de 4 horas del Diplomado de IA Aplicada y Prototipado (Jornada Escolar Complementaria, Confa, Manizales). Los equipos recorren un **circuito de 5 niveles con compuertas** —llave (acertijo), entrega con rúbrica y validación humana— para resolver una problemática real de Colombia alineada con los ODS. Ellos proponen la solución; nadie se la da.

- **Sitio:** https://gabotrixai.github.io/inmersion-ia-ods-jec/
- **Backend:** Supabase (proyecto `rjrwzxryxssvapoewpqi`): Postgres + RLS + funciones RPC + Realtime + Storage + Edge Function `ingesta` (webhook para el XIAO ESP32S3 Sense).
- **Sin build:** HTML + CSS + JS puro servido por GitHub Pages. Para cambiar el contenido del juego (problemas, niveles, misiones, caos, rúbricas, agenda) edita `js/datos.js`.

## Páginas

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Todos | Portada, reglas, entrar con código, registrar equipo. |
| `equipo.html` | Equipos (celular/portátil) | Consola: mapa del circuito, llaves, formularios por nivel, misiones extra, eventos caos, datos del dispositivo, votación, ranking. |
| `juez.html` | Facilitador y monitores | Control: crear jornada, fases/cronómetro, abrir niveles, revisar entregas con rúbrica, caos, anuncios, equipos (códigos/tokens/XP/simular lectura), votación, cierre, evidencias (JSON/CSV/fichas imprimibles). |
| `pantalla.html?j=CODIGO` | Videobeam | Lobby con QR, ranking en vivo, matriz del circuito, cronómetro, overlay de caos, podio. |
| `hardware.html` | Equipos (nivel 4) | Firmware, webhook, prueba de POST, cómo leer datos desde Lovable. |
| `guia.html` | Facilitador | Agenda minuto a minuto, distribución del salón (plano), rúbricas, materiales, alistamiento. |

## Flujo del juego

```
BOOT → 1 SCAN → 2 MAP → (3 BUILD ‖ 4 CONNECT) → 5 PITCH → DEMO DAY → votación → podio
```

Cada nivel: **llave** (acertijo aleatorio por equipo; fallar bloquea 20 s × intento) → **entrega** (formulario concreto) → **control** aprueba o devuelve con comentario. El nivel 4 exige **≥ 3 lecturas reales** del dispositivo vía webhook (se puede desactivar en Control si falla la red).

XP: registro 25 · llave 30/20/10 · niveles 100/150/200/250/300 · rúbrica hasta 50 · señal 50 · 10 lecturas 30 · imagen 40 · extras/caos 30–80 · voto recibido 40.

## Operación el día de la jornada

1. En `juez.html` crea **una jornada por grupo** (nombre + PIN). Anota el código de 6 caracteres.
2. Abre `pantalla.html?j=CODIGO` en el videobeam (botón ⛶ para pantalla completa).
3. Los monitores entran a `juez.html` desde el celular con código + PIN.
4. Los equipos se registran desde `index.html` → "Registrar equipo" con el código de la jornada. Reciben su **código de equipo** (acceso) y en la consola está su **token** (firmware).
5. Usa la **agenda rápida** del Control para abrir niveles y arrancar el cronómetro por bloque.
6. Lanza **eventos caos** a los equipos adelantados; las respuestas llegan a Entregas.
7. Al final: "Abrir votación" → "Cerrar jornada" → podio en pantalla → Evidencias (JSON/CSV/imprimir fichas).

## Webhook del dispositivo

`POST https://rjrwzxryxssvapoewpqi.supabase.co/functions/v1/ingesta`

```json
{ "token": "ods_XXXXXXXXXXXXXX", "tipo": "humedad", "valor": 42, "extra": { "unidad": "%", "etiqueta": "humedo" }, "imagen_base64": "…opcional…" }
```

También acepta `Content-Type: image/jpeg` con `?token=…&tipo=camara`. Firmware listo para el XIAO ESP32S3 Sense en `firmware/xiao_esp32s3_ods.ino` (humedad Grove en A0 + foto de la cámara). Las apps de los equipos leen la tabla pública `lecturas` filtrando por `equipo_id` (ejemplo y prompt para Lovable en `hardware.html`).

## Modelo de datos (Supabase)

`jornadas` · `jornada_secretos` (PIN) · `equipos` · `equipo_secretos` (código, token) · `llaves` (acertijos; vista pública sin respuesta) · `entregas` (nivel/extra/caos, estado, puntaje, xp_otorgado) · `lecturas` · `eventos` (caos/anuncio) · `votos` · `xp_log` · vista `ranking`.

Toda escritura pasa por funciones `security definer` que validan código de equipo o código + PIN del control; la clave `anon` solo lee. Realtime activo en jornadas, equipos, entregas, lecturas, eventos y votos. Buckets públicos `entregas` (fotos de maquetas, subida anónima limitada a imágenes) y `capturas` (cámara del XIAO, solo vía Edge Function).

## Desarrollo

Es un sitio estático: abre `index.html` con cualquier servidor local (`python -m http.server 8080`). Las credenciales públicas están en `js/config.js`.
