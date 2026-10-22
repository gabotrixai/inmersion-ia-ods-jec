// =====================================================================
//  CIRCUITO ODS · Datos del juego
//  Problemáticas reales (Colombia primero), niveles, misiones extra,
//  eventos caos, roles, emblemas, insignias y rúbrica.
//  Edita este archivo para cambiar el contenido sin tocar la lógica.
// =====================================================================

window.ODS = {
  1: { nombre: "Fin de la pobreza", color: "#E5243B" },
  2: { nombre: "Hambre cero", color: "#DDA63A" },
  3: { nombre: "Salud y bienestar", color: "#4C9F38" },
  4: { nombre: "Educación de calidad", color: "#C5192D" },
  5: { nombre: "Igualdad de género", color: "#FF3A21" },
  6: { nombre: "Agua limpia y saneamiento", color: "#26BDE2" },
  7: { nombre: "Energía asequible y no contaminante", color: "#FCC30B" },
  8: { nombre: "Trabajo decente y crecimiento económico", color: "#A21942" },
  9: { nombre: "Industria, innovación e infraestructura", color: "#FD6925" },
  10: { nombre: "Reducción de las desigualdades", color: "#DD1367" },
  11: { nombre: "Ciudades y comunidades sostenibles", color: "#FD9D24" },
  12: { nombre: "Producción y consumo responsables", color: "#BF8B2E" },
  13: { nombre: "Acción por el clima", color: "#3F7E44" },
  14: { nombre: "Vida submarina", color: "#0A97D9" },
  15: { nombre: "Vida de ecosistemas terrestres", color: "#56C02B" },
  16: { nombre: "Paz, justicia e instituciones sólidas", color: "#00689D" },
  17: { nombre: "Alianzas para lograr los objetivos", color: "#19486A" },
};

// Problemáticas reales. El equipo NO recibe una solución: recibe el problema y construye la idea.
// "sensores" sugiere qué puede captar el XIAO ESP32S3 Sense u otro dispositivo (humedad = sensor Grove; camara y microfono = integrados).
window.RETOS = [
  {
    clave: "deslizamientos", titulo: "Laderas en riesgo", ods: [11, 13], territorio: "Manizales · Caldas",
    contexto: "Manizales está construida sobre laderas. Cuando llueve mucho, el suelo se satura y se mueve. En abril de 2017 una noche de lluvias intensas dejó 17 personas muertas y decenas de casas destruidas en la ciudad.",
    dato: "Muchos barrios de ladera no tienen forma de saber a tiempo que la tierra está saturada de agua.",
    preguntas: ["¿Quién vive en la ladera y quién decide evacuar?", "¿Qué señal temprana podría leer un sensor?", "¿Cómo avisarías a una familia a las 2 a. m.?"],
    sensores: ["humedad", "camara"],
  },
  {
    clave: "cafe_clima", titulo: "Café bajo presión", ods: [2, 8, 13], territorio: "Eje Cafetero",
    contexto: "Caldas hace parte del Paisaje Cultural Cafetero. Cientos de miles de familias en Colombia viven del café, y el clima cambiante (lluvias extremas, sequías, roya y broca) golpea las cosechas de las fincas pequeñas.",
    dato: "Un caficultor suele descubrir la roya o la broca cuando ya se extendió por el lote.",
    preguntas: ["¿Qué ve el caficultor cada mañana y qué no alcanza a ver?", "¿Qué dato le cambiaría una decisión hoy?", "¿Cómo funciona sin señal de celular en la finca?"],
    sensores: ["camara", "humedad"],
  },
  {
    clave: "agua_racionamiento", titulo: "Cada gota cuenta", ods: [6, 11], territorio: "Bogotá · Colombia",
    contexto: "Entre abril de 2024 y abril de 2025 Bogotá vivió racionamiento de agua por turnos porque los embalses que la abastecen bajaron a niveles críticos. Muchos municipios de Colombia tienen cortes de agua cada año en temporada seca.",
    dato: "Buena parte del agua se pierde en fugas y en usos que nadie mide dentro de casas y colegios.",
    preguntas: ["¿Dónde se desperdicia agua en tu colegio o barrio?", "¿Qué medirías y cada cuánto?", "¿Cómo logras que la gente cambie un hábito?"],
    sensores: ["humedad", "camara"],
  },
  {
    clave: "residuos", titulo: "Basura que vale", ods: [12, 11], territorio: "Colombia",
    contexto: "Colombia recicla solo una pequeña parte de sus residuos (cerca del 17 % según el DNP). El resto va a rellenos como Doña Juana, en Bogotá, que ya está al límite. Miles de recicladores de oficio viven de separar lo que otros mezclaron.",
    dato: "La mayoría de la gente no separa porque no sabe en qué caneca va cada cosa.",
    preguntas: ["¿Quién se beneficia si se separa bien y quién pierde hoy?", "¿Cómo podría una cámara ayudar a decidir?", "¿Qué pasa con el residuo después de tu solución?"],
    sensores: ["camara"],
  },
  {
    clave: "aire", titulo: "Aire que se respira", ods: [3, 11, 13], territorio: "Medellín · Bogotá · Manizales",
    contexto: "Medellín declara casi todos los años episodios de contingencia ambiental por material particulado. En enero de 2024 los incendios forestales llenaron de humo a Bogotá. Manizales también convive con ceniza volcánica y quemas.",
    dato: "Los niños, las personas con asma y los adultos mayores son los primeros en sentir el aire sucio.",
    preguntas: ["¿Quién necesita saber hoy que el aire está mal?", "¿Qué harías distinto si supieras el nivel de contaminación en tu colegio?", "¿Cómo lo mides sin un equipo costoso?"],
    sensores: ["camara", "microfono"],
  },
  {
    clave: "desperdicio_alimentos", titulo: "Comida que no llega", ods: [2, 12], territorio: "Colombia",
    contexto: "Según el DNP, en Colombia se pierden o desperdician cerca de 9,7 millones de toneladas de alimentos al año: alrededor de un tercio de lo que se produce. Al mismo tiempo, muchas familias no comen tres veces al día.",
    dato: "Mucha comida se pierde en el camino: cosecha, transporte, tiendas, restaurantes y casas.",
    preguntas: ["¿En qué punto de la cadena atacarías primero?", "¿Qué dato permitiría rescatar comida antes de que se dañe?", "¿Quién la recibe y cómo?"],
    sensores: ["camara", "humedad"],
  },
  {
    clave: "rios", titulo: "Ríos vivos", ods: [6, 14, 15], territorio: "Río Chinchiná · Río Bogotá",
    contexto: "El río Chinchiná, que baja por Manizales y Villamaría, recibe aguas residuales y basura. El río Bogotá es uno de los más contaminados del país. Las quebradas de los barrios suelen ser los primeros vertederos.",
    dato: "Nadie monitorea en tiempo real qué le está llegando a la quebrada del barrio.",
    preguntas: ["¿Qué cambios se pueden ver o medir en el agua?", "¿Quién debería recibir la alerta y qué haría?", "¿Cómo involucras al barrio?"],
    sensores: ["camara", "humedad"],
  },
  {
    clave: "brecha_digital", titulo: "Conectar el campo", ods: [4, 10, 9], territorio: "Colombia rural",
    contexto: "Según el DANE, menos de un tercio de los hogares rurales de Colombia tiene internet, frente a la gran mayoría de los hogares urbanos. Hay sedes educativas rurales en Caldas donde la señal llega por ratos o no llega.",
    dato: "Las soluciones digitales que exigen internet permanente dejan por fuera justo a quienes más las necesitan.",
    preguntas: ["¿Qué necesita hacer un estudiante rural y hoy no puede?", "¿Cómo funciona tu idea sin conexión y se sincroniza después?", "¿Qué dispositivo barato lo haría posible?"],
    sensores: ["camara", "microfono"],
  },
  {
    clave: "convivencia", titulo: "Convivencia escolar", ods: [3, 4, 16], territorio: "Colegios de Colombia",
    contexto: "Estudios del ICBF y de universidades colombianas muestran que una parte importante de los estudiantes reporta haber sufrido acoso escolar, y que los problemas de salud mental en adolescentes crecieron después de la pandemia.",
    dato: "Las señales de que alguien está mal suelen verse tarde y nadie sabe a quién avisar.",
    preguntas: ["¿Cómo detectas una situación sin vigilar ni invadir la privacidad?", "¿Quién responde y en cuánto tiempo?", "¿Qué datos NO deberías guardar?"],
    sensores: ["microfono", "boton"],
  },
  {
    clave: "fauna_vias", titulo: "Fauna en la vía", ods: [15, 11], territorio: "Caldas · Quindío · Risaralda",
    contexto: "En las carreteras del Eje Cafetero mueren atropellados cada año zarigüeyas, osos perezosos, monos aulladores, serpientes y aves. Los pasos de fauna existen, pero los animales no siempre los usan y los conductores no reducen la velocidad.",
    dato: "Las zonas y horas de mayor atropellamiento son conocidas, pero no hay alertas en el momento.",
    preguntas: ["¿Qué puede detectar una cámara de noche?", "¿Cómo avisas al conductor en segundos?", "¿Qué haces con los datos acumulados?"],
    sensores: ["camara"],
  },
  {
    clave: "motos", titulo: "Vías seguras", ods: [3, 11], territorio: "Colombia",
    contexto: "Más de la mitad de las personas que mueren en accidentes de tránsito en Colombia van en moto, según la Agencia Nacional de Seguridad Vial. En Manizales y los municipios de Caldas la moto es el transporte principal de muchos jóvenes.",
    dato: "Exceso de velocidad, no usar casco y conducir cansado son causas que se pueden detectar.",
    preguntas: ["¿Quién usa tu solución: el motociclista, la familia o la ciudad?", "¿Qué dato se puede captar sin distraer al conductor?", "¿Cómo haces que quieran usarla?"],
    sensores: ["camara", "microfono"],
  },
  {
    clave: "energia", titulo: "Luz para todos", ods: [7, 10], territorio: "La Guajira · Chocó · Amazonía",
    contexto: "Cientos de miles de colombianos viven en Zonas No Interconectadas: comunidades de La Guajira, el Pacífico y la Amazonía que dependen de plantas diésel que solo funcionan unas horas al día, o que no tienen electricidad.",
    dato: "Sin energía confiable no hay refrigeración de vacunas, ni clases de noche, ni carga de celulares.",
    preguntas: ["¿Qué actividad cambiaría con pocas horas de energía bien administradas?", "¿Cómo decide tu sistema qué encender primero?", "¿Qué pasa cuando no hay sol?"],
    sensores: ["luz", "humedad"],
  },
  {
    clave: "inundaciones", titulo: "Agua que sube", ods: [13, 1, 11], territorio: "La Mojana · Caribe",
    contexto: "Desde 2021 la región de La Mojana (Sucre, Bolívar, Córdoba y Antioquia) ha vivido inundaciones prolongadas tras la ruptura del dique en Cara de Gato. Miles de familias pierden cultivos, animales y casas cada temporada de lluvias.",
    dato: "Las comunidades conocen el río, pero no tienen datos a tiempo para mover a la gente ni a los animales.",
    preguntas: ["¿Qué nivel de agua es la señal de salir?", "¿Cómo llega la alerta a una vereda sin internet?", "¿Qué hace la gente con 6 horas de ventaja?"],
    sensores: ["humedad", "camara"],
  },
  {
    clave: "plastico_mar", titulo: "Mares sin plástico", ods: [14, 12], territorio: "Pacífico y Caribe colombiano",
    contexto: "Las playas de Buenaventura, Bahía Solano, Cartagena y Santa Marta reciben toneladas de plástico traído por los ríos y el mar. Pescadores artesanales encuentran cada vez más basura en sus redes y menos peces.",
    dato: "El plástico que llega al mar sale de los ríos y de las ciudades, lejos de la playa.",
    preguntas: ["¿Dónde interceptas el plástico antes de que llegue al mar?", "¿Cómo clasificas y cuentas lo recogido?", "¿Quién paga o se beneficia?"],
    sensores: ["camara"],
  },
  {
    clave: "huerta", titulo: "Huertas que alimentan", ods: [2, 4, 12], territorio: "Colegios de Caldas",
    contexto: "Muchas instituciones educativas tienen huertas escolares que se secan en vacaciones o se encharcan en invierno porque nadie sabe cuándo regar. Una huerta que funciona puede complementar el Programa de Alimentación Escolar.",
    dato: "El 'guardián de la huerta' casi siempre es un profesor con mil cosas más por hacer.",
    preguntas: ["¿Qué necesita la planta y quién lo decide hoy?", "¿Qué mide el sensor de humedad y qué haces con el dato?", "¿Cómo lo vuelves sostenible cuando el proyecto termine?"],
    sensores: ["humedad", "camara"],
  },
  {
    clave: "adultos_mayores", titulo: "Cuidar a los abuelos", ods: [3, 10], territorio: "Caldas",
    contexto: "Caldas es uno de los departamentos con mayor índice de envejecimiento de Colombia. Muchos adultos mayores viven solos en el campo y en los barrios, y una caída o una medicina olvidada puede volverse grave sin que nadie se entere.",
    dato: "La familia se entera horas o días después, y a veces por vecinos.",
    preguntas: ["¿Qué le cuesta hacer hoy a un adulto mayor que vive solo?", "¿Cómo detectas algo grave sin cámaras dentro de la casa?", "¿Qué tan fácil debe ser para alguien de 80 años?"],
    sensores: ["boton", "microfono", "humedad"],
  },
  {
    clave: "deforestacion", titulo: "Bosque en alerta", ods: [15, 13], territorio: "Amazonía · Andes",
    contexto: "La Amazonía colombiana concentra la mayor parte de la deforestación del país, según el IDEAM. Los bosques andinos de Caldas también pierden árboles por ganadería, cultivos y tala ilegal. Las alertas del Estado llegan por satélite, semanas después.",
    dato: "Una motosierra se escucha a cientos de metros antes de que caiga el árbol.",
    preguntas: ["¿Qué sonido o imagen delata la tala?", "¿A quién le avisas y qué puede hacer?", "¿Cómo funciona meses sin mantenimiento en la selva?"],
    sensores: ["microfono", "camara"],
  },
  {
    clave: "volcan", titulo: "Vivir junto al volcán", ods: [11, 13], territorio: "Nevado del Ruiz · Caldas y Tolima",
    contexto: "En 1985 la erupción del Nevado del Ruiz borró a Armero y mató a unas 25.000 personas. En 2023 el volcán estuvo en alerta naranja durante meses y miles de habitantes de Caldas y Tolima tuvieron que prepararse para evacuar.",
    dato: "La ceniza afecta el agua, el aire y los cultivos de Manizales y Villamaría con frecuencia.",
    preguntas: ["¿Qué mide tu sistema: ceniza, agua, ruido, movimiento?", "¿Cómo evitas el pánico y a la vez avisas rápido?", "¿Qué pasa con las personas sin celular?"],
    sensores: ["humedad", "camara", "microfono"],
  },
];

window.RETO_PROPIO = {
  clave: "propio", titulo: "Tu propia problemática", ods: [], territorio: "Tu barrio, vereda o colegio",
  contexto: "Si hay un problema real que viven tus compañeros, tu familia o tu barrio y no está en la lista, propónlo. Debe ser real, verificable y conectado con al menos un ODS.",
  dato: "Tendrás que escribir un dato o evidencia y decir de dónde lo sacaste.",
  preguntas: ["¿Quién sufre el problema y cuántas personas son?", "¿Qué evidencia tienes?", "¿Con qué ODS se conecta?"],
  sensores: ["humedad", "camara", "microfono"],
};

window.SENSORES = {
  humedad: { nombre: "Sensor de humedad del suelo", icono: "drop" },
  camara: { nombre: "Cámara del XIAO ESP32S3 Sense", icono: "eye" },
  microfono: { nombre: "Micrófono del XIAO", icono: "radio" },
  boton: { nombre: "Botón / pulsador", icono: "bolt" },
  luz: { nombre: "Sensor de luz", icono: "sun" },
};

// ---------------------------------------------------------------------
// Niveles del circuito. Orden: 1 → 2 → (3 ‖ 4) → 5. Cada nivel tiene una LLAVE (acertijo) y una ENTREGA que valida el control.
// ---------------------------------------------------------------------
window.NIVELES = [
  {
    n: 1, codigo: "SCAN", titulo: "Escaneo del problema", xp: 100, minutos: 30,
    resumen: "Elijan una problemática real, descubran a quién afecta en su entorno y escriban su frase de misión.",
    zona: "Zona SCAN · Muro de problemas",
    objetivo: "Nadie construye nada todavía. Primero entienden el problema mejor que cualquiera en el salón.",
    pasos: [
      "Lean al menos 3 problemáticas del muro antes de escoger una.",
      "Decidan a quién afecta ese problema en Caldas o en su barrio (personas concretas).",
      "Escriban un dato o evidencia y de dónde salió.",
      "Completen la frase de misión. El control la revisa: si es vaga, la devuelve.",
    ],
    entregable: "Ficha SCAN: problema, afectados, evidencia y frase de misión.",
  },
  {
    n: 2, codigo: "MAP", titulo: "Mapa lógico", xp: 150, minutos: 35,
    resumen: "Diseñen cómo funciona la solución por dentro: entradas, procesamiento con IA, decisiones y salidas.",
    zona: "Zona MAP · Mesa de bloques",
    objetivo: "Un mapa que otra persona pueda leer y entender qué hace el sistema paso a paso.",
    pasos: [
      "Armen el flujo con bloques: ENTRADA → PROCESO → DECISIÓN → SALIDA.",
      "Cada bloque debe decir qué dato entra, qué regla decide y qué pasa al final.",
      "Escriban qué puede fallar y cuál es su plan B.",
      "Muéstrenlo al control en la mesa de bloques antes de enviarlo.",
    ],
    entregable: "Diagrama de flujo con mínimo 4 bloques y un riesgo con plan B.",
  },
  {
    n: 3, codigo: "BUILD", titulo: "Prototipo físico", xp: 200, minutos: 45,
    resumen: "Construyan la maqueta con LEGO o cualquier material: debe mostrar dónde va el sensor, qué procesa y cómo responde.",
    zona: "Zona BUILD · Mesa de materiales",
    objetivo: "Que alguien entienda la solución con solo mirar la maqueta y una explicación de 30 segundos.",
    pasos: [
      "Dibujen en papel qué va a representar cada parte antes de construir.",
      "Construyan con LEGO, cartón, plastilina o reciclaje. Marquen ENTRADA, PROCESO y SALIDA.",
      "Tomen una foto nítida con buena luz y súbanla.",
      "El control pasa por la mesa a validar la maqueta en vivo.",
    ],
    entregable: "Foto de la maqueta + lista de partes y qué representa cada una.",
  },
  {
    n: 4, codigo: "CONNECT", titulo: "Conexión real", xp: 250, minutos: 50,
    resumen: "Hagan que el XIAO ESP32S3 Sense envíe datos reales (cámara o humedad) por webhook y muéstrenlos en su app.",
    zona: "Zona CONNECT · Mesa de hardware",
    objetivo: "El sistema debe recibir señal real de su dispositivo: mínimo 3 lecturas. Sin señal no hay nivel.",
    pasos: [
      "Copien el token del equipo y la URL del webhook.",
      "Carguen el firmware en el XIAO (guía en Hardware) con el WiFi del salón.",
      "Verifiquen que las lecturas aparecen en su consola.",
      "Creen la app (Lovable u otra) que lea los datos de su equipo y muestre algo útil para el usuario.",
    ],
    entregable: "Señal recibida (≥ 3 lecturas) + enlace de la app + qué muestra.",
  },
  {
    n: 5, codigo: "PITCH", titulo: "Pitch final", xp: 300, minutos: 25,
    resumen: "Cuenten el proyecto en 60 segundos: problema, solución, cómo funciona, impacto y qué sigue.",
    zona: "Zona PITCH · Escenario",
    objetivo: "Convencer al jurado y a los otros equipos de que su solución vale la pena y funciona.",
    pasos: [
      "Completen la ficha del pitch. El generador arma el guion de 60 segundos.",
      "Repartan quién dice qué. Todos hablan al menos una vez.",
      "Ensayen con el cronómetro de la consola al menos dos veces.",
      "Suban la ficha y esperen el turno en el escenario.",
    ],
    entregable: "Ficha de pitch + guion de 60 s + demo en vivo.",
  },
];

// Bloques para el Mapa lógico (nivel 2)
window.BLOQUES = {
  entrada: {
    nombre: "ENTRADA", color: "#22D3EE",
    opciones: ["Sensor de humedad del suelo", "Cámara (imagen)", "Micrófono (sonido)", "Botón o pulsador", "Formulario en la app", "Datos abiertos / internet", "Ubicación GPS del celular", "Sensor de luz"],
    placeholder: "¿Qué dato exacto entra? Ej: humedad en % cada 10 min",
  },
  proceso: {
    nombre: "PROCESO", color: "#A9C719",
    opciones: ["IA clasifica la imagen", "IA reconoce un sonido", "Compara con un umbral", "Cuenta eventos en el tiempo", "Calcula un promedio", "IA genera un mensaje", "Combina dos datos"],
    placeholder: "¿Qué hace con el dato? Ej: clasifica seco / húmedo / encharcado",
  },
  decision: {
    nombre: "DECISIÓN", color: "#FACC15",
    opciones: ["¿Valor mayor que el umbral?", "¿La clase detectada es la peligrosa?", "¿Confianza mayor a 70 %?", "¿Es de noche?", "¿Se repitió 3 veces seguidas?", "¿Hay una persona cerca?"],
    placeholder: "La regla exacta. Ej: SI humedad < 30 % Y hora entre 6 p. m. y 6 a. m.",
  },
  salida: {
    nombre: "SALIDA", color: "#FB923C",
    opciones: ["Alerta en la app", "LED o alarma sonora", "Mensaje de WhatsApp / correo", "Webhook a un tablero", "Gráfica histórica", "Activa riego, motor o puerta", "Mensaje de voz", "Reporte para la alcaldía o el colegio"],
    placeholder: "¿Qué pasa y quién lo recibe? Ej: la familia recibe alerta y un mapa",
  },
};

// Misiones extra: para equipos que esperan validación o van adelantados. Las valida el control.
window.EXTRAS = [
  { clave: "sensecraft", titulo: "Entrena tu propia IA", xp: 80, desc: "Entrenen un modelo en SenseCraft AI con 2 clases propias (ej. hoja sana / hoja enferma) y muéstrenlo funcionando al control.", campo: "¿Qué clases entrenaron y qué porcentaje de confianza lograron?" },
  { clave: "plan_b", titulo: "Modo sin internet", xp: 50, desc: "Expliquen cómo funciona su solución si se cae el internet durante 24 horas.", campo: "¿Qué guarda el dispositivo, qué decide solo y qué sincroniza después?" },
  { clave: "sesgo", titulo: "Caza el sesgo", xp: 50, desc: "Encuentren un caso en el que su IA se equivocaría por culpa de los datos con que se entrenó.", campo: "¿Qué error cometería, a quién perjudica y cómo lo evitarían?" },
  { clave: "privacidad", titulo: "Regla de privacidad", xp: 50, desc: "Su solución toca datos de personas. Escriban su regla de privacidad en 3 líneas (Ley 1581 de 2012).", campo: "¿Qué datos capturan, qué NO guardan y quién puede verlos?" },
  { clave: "entrevista", titulo: "Agente doble", xp: 40, desc: "Entrevisten a otro equipo sobre su problema y díganles un riesgo que no habían visto.", campo: "¿A qué equipo entrevistaron y qué riesgo les señalaron?" },
  { clave: "ods_secundario", titulo: "Segundo ODS", xp: 30, desc: "Identifiquen otro ODS que su solución impacta sin proponérselo y expliquen cómo.", campo: "¿Qué ODS y por qué?" },
  { clave: "costo", titulo: "Cuánto cuesta", xp: 50, desc: "Estimen cuánto costaría construir 1 unidad real de su solución y cuánto 100 unidades.", campo: "Lista de componentes con precio aproximado y total." },
  { clave: "historia", titulo: "Un día en la vida", xp: 40, desc: "Escriban la historia (ficticia) de una persona real usando su solución un día normal.", campo: "Nombre ficticio, dónde vive, qué le pasa y cómo cambia con la solución." },
  { clave: "marca", titulo: "Nombre y logo", xp: 40, desc: "Diseñen el nombre y el logo del proyecto en papel y súbanlo en la foto de la maqueta o descríbanlo.", campo: "Nombre del proyecto y qué significa el logo." },
];

// Eventos caos: el control los lanza a un equipo o a todos. El equipo responde en pocos minutos.
window.CAOS = [
  { clave: "sin_internet", titulo: "¡SE CAYÓ EL INTERNET!", desc: "El colegio se quedó sin conexión por 24 horas. ¿Qué hace su solución mientras tanto?", xp: 40 },
  { clave: "apagon", titulo: "¡APAGÓN!", desc: "No hay energía en el barrio. Su dispositivo solo tiene una batería pequeña. ¿Qué apagan primero y qué mantienen vivo?", xp: 40 },
  { clave: "sensor_roto", titulo: "¡SENSOR DAÑADO!", desc: "El sensor empezó a enviar siempre 0. ¿Cómo se da cuenta el sistema y qué hace?", xp: 50 },
  { clave: "lluvia", titulo: "¡AGUACERO!", desc: "La cámara está empañada y el micrófono solo escucha lluvia. ¿Cómo sigue funcionando?", xp: 40 },
  { clave: "abuela", titulo: "¡NUEVO USUARIO!", desc: "La solución la va a usar una persona de 78 años que no usa celular. Adapten la salida.", xp: 50 },
  { clave: "caras", titulo: "¡DATOS PRIVADOS!", desc: "Su cámara grabó caras de personas sin permiso. ¿Qué cambian ahora mismo?", xp: 50 },
  { clave: "presupuesto", titulo: "¡RECORTE!", desc: "Les quitaron la mitad del presupuesto. ¿Qué eliminan sin perder lo esencial?", xp: 40 },
  { clave: "alcalde", titulo: "¡LLAMÓ EL ALCALDE!", desc: "Quiere la solución para todo el municipio en 6 meses. Expliquen en 3 frases cómo escalarían.", xp: 60 },
  { clave: "falsa_alarma", titulo: "¡FALSA ALARMA!", desc: "Su sistema dio 3 alertas falsas en una noche y la gente ya no le cree. ¿Cómo recuperan la confianza?", xp: 50 },
  { clave: "ruido", titulo: "¡DEMASIADO RUIDO!", desc: "El lugar es tan ruidoso que el micrófono no sirve. Cambien la entrada sin perder la función.", xp: 40 },
];

window.ROLES = [
  { clave: "lider", nombre: "Líder", desc: "Coordina, controla el tiempo y toma decisiones cuando no hay acuerdo." },
  { clave: "hardware", nombre: "Hardware", desc: "Sensor, dispositivo XIAO, conexiones y maqueta." },
  { clave: "software", nombre: "Software", desc: "Mapa lógico, app, datos y webhook." },
  { clave: "comunicador", nombre: "Comunicador", desc: "Llena las fichas, documenta con fotos y presenta el pitch." },
];

window.EMBLEMAS = ["bolt", "cpu", "leaf", "drop", "shield", "rocket", "eye", "radio", "flame", "globe", "sun", "wave"];
window.COLORES = ["#A9C719", "#22D3EE", "#FB923C", "#E879F9", "#FACC15", "#F87171", "#60A5FA", "#4ADE80", "#F472B6", "#2DD4BF"];

window.INSIGNIAS = {
  registro: { nombre: "Conectados", desc: "Equipo registrado en el sistema." },
  descifrador: { nombre: "Descifrador", desc: "Una llave resuelta al primer intento." },
  nivel_1: { nombre: "Escáner", desc: "Nivel SCAN aprobado." },
  nivel_2: { nombre: "Arquitecto", desc: "Nivel MAP aprobado." },
  nivel_3: { nombre: "Constructor", desc: "Nivel BUILD aprobado." },
  nivel_4: { nombre: "Enlace", desc: "Nivel CONNECT aprobado." },
  nivel_5: { nombre: "Orador", desc: "Nivel PITCH aprobado." },
  senal: { nombre: "Primera señal", desc: "El dispositivo envió su primer dato." },
  flujo: { nombre: "Flujo de datos", desc: "10 lecturas recibidas." },
  vision: { nombre: "Ojo digital", desc: "Primera imagen de la cámara recibida." },
  caos: { nombre: "Antifrágil", desc: "Respondió a un evento caos." },
  extra: { nombre: "Explorador", desc: "Completó una misión extra." },
};

// Rúbrica del control (0–10 cada criterio, máximo 50 puntos extra sobre el XP base del nivel)
window.RUBRICA = {
  1: ["Problema real y bien delimitado", "Afectados concretos (no 'la gente')", "Evidencia o dato con fuente", "Frase de misión clara", "Trabajo de todo el equipo"],
  2: ["Tiene entrada, proceso, decisión y salida", "Las reglas son concretas (umbrales, clases)", "Se entiende sin explicación", "Riesgo y plan B realistas", "Usa IA con sentido, no por moda"],
  3: ["Se identifican entrada, proceso y salida", "Representa la solución, no solo decora", "Explicación de 30 s clara", "Creatividad con los materiales", "Participaron todos"],
  4: ["Señal real del dispositivo recibida", "La app muestra datos del equipo", "La salida es útil para el usuario", "Resolvieron problemas técnicos solos", "Entienden el flujo de datos"],
  5: ["Problema e impacto claros", "Solución y funcionamiento entendibles", "Demo o evidencia en vivo", "Tiempo (60 s) y todos participan", "Conexión con el ODS y con Colombia"],
  extra: ["Cumple lo pedido", "Profundidad", "Creatividad", "Claridad", "Equipo"],
  caos: ["Responde al evento", "Solución viable", "Rapidez", "Claridad", "Equipo"],
};

window.CATEGORIAS_VOTO = {
  impacto: { nombre: "Mayor impacto ODS", desc: "El que más cambiaría la vida de alguien." },
  prototipo: { nombre: "Mejor prototipo", desc: "El que mejor funciona y mejor se entiende." },
  pitch: { nombre: "Mejor pitch", desc: "El que mejor contó su historia." },
};

// Agenda sugerida (4 horas). Las fases las controla el facilitador desde el panel de control.
window.AGENDA = [
  { t: "0:00", dur: 15, fase: "BOOT", titulo: "Arranque", desc: "Bienvenida, reglas del juego, registro de equipos y roles. Se abre el nivel 1." , niveles: [1] },
  { t: "0:15", dur: 30, fase: "SCAN", titulo: "Nivel 1 · Escaneo", desc: "Muro de problemas. Llave binaria. Ficha SCAN. El control aprueba o devuelve.", niveles: [1] },
  { t: "0:45", dur: 35, fase: "MAP", titulo: "Nivel 2 · Mapa lógico", desc: "Mesa de bloques. Flujo entrada → proceso → decisión → salida. Primer evento caos a los equipos rápidos.", niveles: [1, 2] },
  { t: "1:20", dur: 15, fase: "PAUSA", titulo: "Refrigerio", desc: "El sistema sigue abierto: los equipos pueden descifrar la siguiente llave mientras comen.", niveles: [1, 2] },
  { t: "1:35", dur: 50, fase: "BUILD + CONNECT", titulo: "Niveles 3 y 4 en paralelo", desc: "El equipo se divide: Hardware + Líder en la mesa CONNECT con el XIAO; Comunicador + Software en BUILD con LEGO. Luego intercambian.", niveles: [1, 2, 3, 4] },
  { t: "2:25", dur: 40, fase: "CONNECT + APP", titulo: "Conexión y app", desc: "Todos los equipos deben tener señal. Se crea la app con Lovable que lee los datos. Eventos caos para los que ya terminaron.", niveles: [1, 2, 3, 4] },
  { t: "3:05", dur: 25, fase: "PITCH", titulo: "Nivel 5 · Pitch", desc: "Ficha de pitch, guion de 60 s, ensayo cronometrado. Se abre el nivel 5.", niveles: [1, 2, 3, 4, 5] },
  { t: "3:30", dur: 20, fase: "DEMO DAY", titulo: "Presentaciones", desc: "60 segundos por equipo + 30 de preguntas del jurado. Se abre la votación.", niveles: [1, 2, 3, 4, 5] },
  { t: "3:50", dur: 10, fase: "CIERRE", titulo: "Ranking y premios", desc: "Podio en pantalla, insignias, foto grupal. Hay premios para los mejores equipos.", niveles: [1, 2, 3, 4, 5] },
];
