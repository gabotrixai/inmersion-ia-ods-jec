// =====================================================================
//  CIRCUITO ODS · Consola del equipo
// =====================================================================
pintarBarra('equipo.html'); pintarPie();

const params = new URLSearchParams(location.search);
if (params.get('c')) sesion.equipo = params.get('c').toUpperCase();
const CODIGO = sesion.equipo;
if (!CODIGO) location.replace('index.html#entrar');

const S = { d: null, nivelSel: null, ranking: [], votos: [], timer: null, borradores: {}, bloques: null, vistos: new Set(JSON.parse(localStorage.getItem('ods_vistos') || '[]')) };
const ICON_NIVEL = { 1: 'eye', 2: 'map', 3: 'box', 4: 'wifi', 5: 'mic' };

// ---------------------------------------------------------------- carga
async function cargar() {
  try {
    S.d = await rpc('equipo_estado', { p_codigo: CODIGO });
    const jid = S.d.jornada.id;
    const [{ data: rk }, { data: vt }] = await Promise.all([
      sb.from('ranking').select('*').eq('jornada_id', jid).order('total', { ascending: false }),
      sb.from('votos').select('*').eq('votante_id', S.d.equipo.id),
    ]);
    S.ranking = rk || []; S.votos = vt || [];
    if (S.nivelSel == null) S.nivelSel = nivelSugerido();
    render();
  } catch (e) {
    if (/no válido/i.test(e.message)) { sesion.equipo = ''; location.replace('index.html#entrar'); return; }
    toast(e.message, 'error');
  }
}

const entregaNivel = (n) => (S.d.entregas || []).find((x) => x.tipo === 'nivel' && x.nivel === n);
const aprobado = (n) => entregaNivel(n)?.estado === 'aprobada';
const abiertoPorControl = (n) => (S.d.jornada.niveles_abiertos || []).includes(n);
function prerequisito(n) {
  if (n === 1) return null;
  if (n === 2) return aprobado(1) ? null : 'Necesitan el nivel 1 aprobado.';
  if (n === 3 || n === 4) return aprobado(2) ? null : 'Necesitan el nivel 2 aprobado.';
  if (n === 5) return aprobado(3) && aprobado(4) ? null : 'Necesitan los niveles 3 y 4 aprobados.';
  return null;
}
function estadoNivel(n) {
  const e = entregaNivel(n);
  if (e) return e.estado; // pendiente | aprobada | rechazada
  if (!abiertoPorControl(n) || prerequisito(n)) return 'bloqueado';
  return 'abierto';
}
function nivelSugerido() {
  for (const n of [1, 2, 3, 4, 5]) { const s = estadoNivel(n); if (s === 'abierto' || s === 'rechazada' || s === 'pendiente') return n; }
  return aprobado(5) ? 5 : 1;
}
const llaveOk = (n) => !!S.d.llaves?.[String(n)]?.ok;

// ---------------------------------------------------------------- render
// Los bloques con formularios solo se redibujan si cambió su "firma": así una actualización
// en tiempo real nunca borra lo que el equipo está escribiendo.
S.firmas = {};
function siCambia(clave, firma, fn) { const f = JSON.stringify(firma); if (S.firmas[clave] !== f) { S.firmas[clave] = f; fn(); } }
function firmaPanel() {
  const n = S.nivelSel; const e = entregaNivel(n); const L = S.d.llaves?.[String(n)];
  return [n, estadoNivel(n), L?.ok, L?.intentos, L?.bloqueado_hasta, S.d.jornada.niveles_abiertos, e?.created_at, e?.revisado_en, e?.feedback, e?.estado, n === 4 ? (S.d.lecturas || 0) >= 3 : null];
}
function render() {
  const { equipo: eq, jornada: j } = S.d;
  renderCabecera(eq, j);
  renderAnuncios(j);
  renderCircuito();
  siCambia('panel', firmaPanel(), renderPanel);
  actualizarLecturasPanel();
  siCambia('votacion', [j.estado, S.votos, S.ranking.map((r) => r.id)], () => renderVotacion(eq, j));
  siCambia('extras', [(S.d.entregas || []).filter((x) => x.tipo === 'extra').map((x) => [x.ref, x.estado, x.created_at]), !!entregaNivel(1)], renderExtras);
  siCambia('caos', [(S.d.eventos || []).filter((x) => x.tipo === 'caos').map((x) => x.id), (S.d.entregas || []).filter((x) => x.tipo === 'caos').map((x) => [x.ref, x.estado, x.created_at])], renderCaos);
  renderLecturas();
  renderRanking();
  revisarCaosNuevo();
}
function actualizarLecturasPanel() {
  const el = $('#n-lecturas'); if (!el) return;
  el.textContent = S.d.lecturas || 0;
}

function renderCabecera(eq, j) {
  const pos = S.ranking.findIndex((r) => r.id === eq.id) + 1;
  const reto = retoPorClave(eq.reto_clave);
  const nivelMax = 5; const aprobados = [1, 2, 3, 4, 5].filter(aprobado).length;
  const faseTxt = j.estado === 'lobby' ? 'Esperando arranque' : j.estado === 'votacion' ? 'Votación abierta' : j.estado === 'cerrada' ? 'Jornada cerrada' : (j.timer_label || 'En juego');
  $('#cabecera').innerHTML = `
  <div class="card" style="padding:18px 22px">
    <div class="fila espacio" style="align-items:flex-start">
      <div class="fila" style="gap:14px">
        ${emblemaHTML(eq.emblema, eq.color, true)}
        <div>
          <div class="eyebrow" style="margin:0">${esc(j.nombre)} · <span style="color:var(--texto-suave)">${esc(faseTxt)}</span></div>
          <h2 style="margin:4px 0 2px">${esc(eq.nombre)}</h2>
          <div class="fila" style="gap:6px">
            ${(eq.integrantes || []).map((i) => `<span class="chip">${esc(i.nombre)} · ${esc(ROLES.find((r) => r.clave === i.rol)?.nombre || i.rol)}</span>`).join('')}
            ${reto ? `<span class="chip lima">${esc(reto.titulo)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="fila" style="gap:10px">
        <div class="stat" style="text-align:center;min-width:92px"><div class="num">${eq.xp}</div><div class="lbl">XP</div></div>
        <div class="stat" style="text-align:center;min-width:92px"><div class="num">${pos ? '#' + pos : '–'}</div><div class="lbl">posición</div></div>
        <div class="stat" style="text-align:center;min-width:110px"><div class="num mono" id="timer" style="font-size:1.5rem">--:--</div><div class="lbl">${esc(j.timer_label || 'cronómetro')}</div></div>
      </div>
    </div>
    <div style="margin-top:14px" class="fila espacio">
      <div style="flex:1;min-width:220px"><div class="xp-barra"><span style="width:${(aprobados / nivelMax) * 100}%"></span></div><div class="ayuda">${aprobados} de ${nivelMax} niveles aprobados</div></div>
      <div class="insignias">${Object.keys(INSIGNIAS).map((k) => `<span class="insignia ${eq.insignias?.includes(k) ? '' : 'gris'}" title="${esc(INSIGNIAS[k].desc)}"><span class="ico">${ICONOS[k.startsWith('nivel') ? ICON_NIVEL[k.split('_')[1]] : k === 'senal' ? 'wifi' : k === 'vision' ? 'eye' : k === 'flujo' ? 'wave' : k === 'caos' ? 'alert' : k === 'extra' ? 'star' : k === 'descifrador' ? 'key' : 'check']}</span>${esc(INSIGNIAS[k].nombre)}</span>`).join('')}</div>
      <div class="fila" style="gap:6px"><span class="chip mono">código ${esc(S.d.codigo)}</span><button class="btn btn-sonido" id="sonido"></button><button class="btn chico fantasma" id="btn-salir">Salir</button></div>
    </div>
  </div>`;
  $('#btn-salir').onclick = () => { sesion.equipo = ''; location.href = 'index.html'; };
  botonSonido($('#sonido'));
  // En la consola solo suenan el último minuto y el fin de tiempo (los avisos completos los da la pantalla del salón)
  clearInterval(S.timer); S.timer = iniciarTimer(() => S.d.jornada.timer_fin, $('#timer'), { sonidos: 'final' });
}

function renderAnuncios(j) {
  const an = (S.d.eventos || []).filter((e) => e.tipo === 'anuncio' && (!e.expira_en || new Date(e.expira_en) > Date.now())).slice(0, 2);
  $('#anuncios').innerHTML = an.map((e) => `<div class="callout" style="margin-top:12px"><b>${esc(e.titulo)}</b>${e.descripcion ? ' · ' + esc(e.descripcion) : ''} <span class="apagado mono" style="font-size:.7rem">${fmtHora(e.created_at)}</span></div>`).join('');
}

function renderCircuito() {
  const txt = { bloqueado: 'Bloqueado', abierto: 'Abierto', pendiente: 'En revisión', aprobada: 'Aprobado', rechazada: 'Devuelto' };
  $('#circuito').innerHTML = NIVELES.map((n) => {
    const st = estadoNivel(n.n); const ll = llaveOk(n.n);
    return `<button class="nodo ${st} ${(n.n === 3 || n.n === 4) ? 'paralelo' : ''} ${S.nivelSel === n.n ? 'activo' : ''}" style="grid-area:n${n.n}" data-n="${n.n}">
      <div class="fila espacio"><span class="num">NIVEL ${n.n} · ${n.codigo}</span><span style="color:${ll ? 'var(--lima)' : 'var(--texto-apagado)'}">${ICONOS[ll ? 'unlock' : 'lock'].replace('<svg', '<svg width="16" height="16"')}</span></div>
      <div class="tit">${esc(n.titulo)}</div>
      <div class="est">${txt[st]}${st === 'aprobada' ? ' · +' + (entregaNivel(n.n).xp_otorgado) + ' XP' : ''}</div>
      ${n.n !== 5 ? '<span class="traza"></span>' : ''}
    </button>`;
  }).join('');
  $$('#circuito .nodo').forEach((b) => (b.onclick = () => { S.nivelSel = +b.dataset.n; S.bloques = null; renderCircuito(); siCambia('panel', firmaPanel(), renderPanel); $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
}

// ---------------------------------------------------------------- panel de nivel
function renderPanel() {
  const n = S.nivelSel; const N = NIVELES.find((x) => x.n === n); const st = estadoNivel(n); const e = entregaNivel(n);
  const pre = prerequisito(n); const abierto = abiertoPorControl(n);
  let cuerpo = '';
  if (st === 'bloqueado') {
    cuerpo = `<div class="callout aviso">${ico('lock')} ${!abierto ? 'El control todavía no ha abierto este nivel. Mientras tanto pueden adelantar la llave.' : esc(pre)}</div>`;
  }
  const llave = renderLlave(n, st);
  const puedeFormulario = st !== 'bloqueado' && llaveOk(n);
  let form = '';
  if (puedeFormulario) {
    if (st === 'aprobada') form = renderAprobado(e, N);
    else {
      if (st === 'rechazada') form += `<div class="callout aviso" style="margin-bottom:14px"><b>${ico('alert')} El control devolvió la entrega.</b><br>${nl(e.feedback || 'Revisen los criterios y vuelvan a enviar.')}</div>`;
      if (st === 'pendiente') form += `<div class="callout" style="margin-bottom:14px"><b>${ico('clock')} Entrega en revisión.</b> Pueden mejorarla y reenviarla; el control la verá actualizada. Mientras tanto: misiones extra.</div>`;
      form += `<form id="form-nivel" data-n="${n}">${formularioNivel(n, e?.contenido || {})}<div id="err-nivel" class="error"></div>
        <div class="fila" style="margin-top:16px"><button class="btn primario" type="submit">${ico('send')} ${st === 'pendiente' ? 'Reenviar entrega' : 'Enviar al control'}</button><span class="ayuda">El control la revisa en vivo en la zona ${esc(N.zona)}.</span></div></form>`;
    }
  } else if (st !== 'bloqueado' && !llaveOk(n)) {
    form = `<div class="ayuda" style="margin-top:12px">${ico('lock')} El formulario del nivel aparece cuando descifren la llave.</div>`;
  }
  $('#panel').innerHTML = `
  <div class="card lima-borde">
    <div class="fila espacio" style="align-items:flex-start">
      <div>
        <span class="eyebrow">Nivel ${n} · ${N.codigo} · ${esc(N.zona)}</span>
        <h2>${ico(ICON_NIVEL[n])} ${esc(N.titulo)}</h2>
        <p class="suave">${esc(N.resumen)}</p>
      </div>
      <div class="fila" style="gap:8px"><span class="chip lima">+${N.xp} XP base</span><span class="chip">~${N.minutos} min</span></div>
    </div>
    ${cuerpo}
    <div class="grid g2" style="margin-top:14px">
      <div class="card" style="background:var(--panel-2)">
        <h3>${ico('check')} Qué deben hacer</h3>
        <ol style="padding-left:18px;color:var(--texto-suave);margin:0;line-height:1.6">${N.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
        <p style="margin:12px 0 0"><b>Entregable:</b> <span class="suave">${esc(N.entregable)}</span></p>
        <p style="margin:6px 0 0"><b>Objetivo:</b> <span class="suave">${esc(N.objetivo)}</span></p>
      </div>
      ${llave}
    </div>
    <div style="margin-top:18px">${form}</div>
  </div>`;
  enlazarPanel(n);
}

function renderLlave(n, st) {
  const L = S.d.llaves?.[String(n)];
  if (!L) return `<div class="card" style="background:var(--panel-2)"><h3>${ico('key')} Llave</h3><p class="suave">Este nivel no tiene llave.</p></div>`;
  if (L.ok) return `<div class="card" style="background:var(--panel-2);border-color:var(--lima-profundo)"><h3>${ico('unlock')} Llave descifrada</h3><p class="suave">${esc(L.enunciado)}</p><span class="chip lima">ACCESO CONCEDIDO</span></div>`;
  const bloqueado = L.bloqueado_hasta && new Date(L.bloqueado_hasta) > Date.now();
  return `<div class="card" style="background:var(--panel-2)">
    <h3>${ico('key')} Llave del nivel ${n}</h3>
    <div class="terminal" style="margin-bottom:10px"><span class="etiqueta">cifrado · ${esc(L.tipo)}</span><pre style="padding-top:6px"><span class="prompt">></span> ${esc(L.enunciado)}</pre></div>
    <form id="form-llave" class="fila" style="gap:8px;flex-wrap:nowrap">
      <input type="text" id="resp-llave" placeholder="Respuesta" autocomplete="off" ${bloqueado ? 'disabled' : ''} style="flex:1">
      <button class="btn primario" type="submit" ${bloqueado ? 'disabled' : ''}>Probar</button>
    </form>
    <div class="fila espacio" style="margin-top:8px">
      <span class="ayuda" id="llave-estado">${bloqueado ? `Bloqueado ${Math.ceil((new Date(L.bloqueado_hasta) - Date.now()) / 1000)} s por intento fallido` : L.intentos ? `${L.intentos} intento(s) fallido(s)` : 'Primer intento correcto: +30 XP'}</span>
      ${L.pista ? `<button type="button" class="btn chico fantasma" id="btn-pista">Pista</button>` : ''}
    </div>
    <div id="pista" class="ayuda oculto" style="margin-top:6px;color:var(--amarillo)">${esc(L.pista || '')}</div>
  </div>`;
}

function renderAprobado(e, N) {
  const c = e.contenido || {};
  return `<div class="callout"><b>${ico('check')} Nivel aprobado · +${e.xp_otorgado} XP</b>${e.puntaje ? ` · rúbrica ${e.puntaje}/50` : ''}${e.feedback ? `<br><span class="suave">Control: ${nl(e.feedback)}</span>` : ''}</div>
  <div class="terminal" style="margin-top:12px"><pre>${esc(resumenContenido(e.nivel, c))}</pre></div>`;
}

function resumenContenido(n, c) {
  if (n === 1) { const r = retoPorClave(c.reto) || {}; return `PROBLEMA: ${c.reto === 'propio' ? c.propio_titulo : r.titulo}\nAFECTADOS: ${c.afectados}\nEVIDENCIA: ${c.evidencia} (${c.fuente})\nMISIÓN: Ayudamos a ${c.quien} a ${c.que} cuando ${c.cuando} usando ${c.tecnologia}.`; }
  if (n === 2) return (c.bloques || []).map((b, i) => `${i + 1}. [${BLOQUES[b.tipo]?.nombre}] ${b.opcion} — ${b.detalle}`).join('\n') + `\n\nRIESGO: ${c.riesgo}\nPLAN B: ${c.plan_b}`;
  if (n === 3) return `PARTES:\n${c.partes}\nMATERIALES: ${c.materiales}\nEXPLICACIÓN 30 s: ${c.explicacion}` + (c.foto ? `\nFOTO: ${c.foto}` : '');
  if (n === 4) return `APP: ${c.app_url}\nMUESTRA: ${c.app_que}\nPRUEBAS: ${c.pruebas}`;
  if (n === 5) return guionPitch(c);
  return JSON.stringify(c, null, 2);
}

// ---------------------------------------------------------------- formularios por nivel
function formularioNivel(n, c) {
  if (n === 1) return formScan(c);
  if (n === 2) return formMap(c);
  if (n === 3) return formBuild(c);
  if (n === 4) return formConnect(c);
  if (n === 5) return formPitch(c);
}

function formScan(c) {
  const sel = c.reto || S.d.equipo.reto_clave || '';
  return `
  <h3>${ico('eye')} Muro de problemas</h3>
  <p class="suave">Lean varios antes de elegir. Click en uno para ver las preguntas guía.</p>
  <div class="lista-retos" id="lista-retos">
    ${RETOS.map((r) => `<button type="button" class="reto ${sel === r.clave ? 'sel' : ''}" data-k="${r.clave}">
      <div class="fila" style="gap:4px">${r.ods.map(odsMini).join('')}</div>
      <div class="t">${esc(r.titulo)}</div><div class="terr">${esc(r.territorio)}</div>
      <p>${esc(r.dato)}</p></button>`).join('')}
    <button type="button" class="reto ${sel === 'propio' ? 'sel' : ''}" data-k="propio" style="border-style:dashed"><div class="t">${ico('plus')} ${esc(RETO_PROPIO.titulo)}</div><div class="terr">${esc(RETO_PROPIO.territorio)}</div><p>${esc(RETO_PROPIO.contexto)}</p></button>
  </div>
  <input type="hidden" name="reto" value="${esc(sel)}">
  <div id="detalle-reto" style="margin-top:14px"></div>
  <div id="propio" class="${sel === 'propio' ? '' : 'oculto'}">
    <label>Título del problema propio</label><input type="text" name="propio_titulo" value="${esc(c.propio_titulo || '')}" maxlength="80">
    <label>ODS relacionados (números separados por coma, ej: 3, 11)</label><input type="text" name="propio_ods" value="${esc(c.propio_ods || '')}" placeholder="3, 11">
    <label>Contexto real (qué pasa, dónde, desde cuándo)</label><textarea name="propio_contexto">${esc(c.propio_contexto || '')}</textarea>
  </div>
  <label>¿A quién afecta en su entorno? Personas concretas, no "la gente"</label>
  <textarea name="afectados" required placeholder="Ej: las 40 familias del barrio Bajo Cervantes que viven en la ladera sobre la quebrada; mi abuela que vive sola en Villamaría…">${esc(c.afectados || '')}</textarea>
  <div class="grid g2" style="gap:12px">
    <div><label>Dato o evidencia</label><textarea name="evidencia" required placeholder="Un número, una noticia, algo que vieron o alguien que entrevistaron">${esc(c.evidencia || '')}</textarea></div>
    <div><label>¿De dónde salió?</label><input type="text" name="fuente" required placeholder="DANE, IDEAM, noticia, entrevista a…" value="${esc(c.fuente || '')}"></div>
  </div>
  <label>Frase de misión</label>
  <div class="terminal" style="padding:14px"><div class="grid" style="grid-template-columns:auto 1fr;gap:8px 10px;align-items:center;font-family:var(--mono)">
    <span class="lima">Ayudamos a</span><input type="text" name="quien" required placeholder="quién" value="${esc(c.quien || '')}">
    <span class="lima">a</span><input type="text" name="que" required placeholder="qué logran" value="${esc(c.que || '')}">
    <span class="lima">cuando</span><input type="text" name="cuando" required placeholder="en qué situación" value="${esc(c.cuando || '')}">
    <span class="lima">usando</span><input type="text" name="tecnologia" required placeholder="qué tecnología / dato / IA" value="${esc(c.tecnologia || '')}">
  </div></div>`;
}

function formMap(c) {
  S.bloques = S.bloques || (c.bloques ? JSON.parse(JSON.stringify(c.bloques)) : []);
  return `
  <h3>${ico('map')} Constructor del mapa lógico</h3>
  <p class="suave">Agreguen bloques en orden. Mínimo uno de cada tipo. Sean concretos: umbrales, clases, destinatarios.</p>
  <div class="card" style="background:var(--panel-2)">
    <div class="grid" style="grid-template-columns:150px 1fr 1fr auto;gap:8px;align-items:end">
      <div><label>Tipo</label><select id="b-tipo">${Object.entries(BLOQUES).map(([k, b]) => `<option value="${k}">${b.nombre}</option>`).join('')}</select></div>
      <div><label>Bloque</label><select id="b-opcion"></select></div>
      <div><label>Detalle concreto</label><input type="text" id="b-detalle" placeholder=""></div>
      <button type="button" class="btn" id="b-add">${ico('plus')} Agregar</button>
    </div>
  </div>
  <div id="bloques-lista" style="margin-top:14px"></div>
  <div class="grid g2" style="gap:12px;margin-top:8px">
    <div><label>¿Qué puede fallar?</label><textarea name="riesgo" required placeholder="Ej: el sensor se tapa de barro y marca siempre húmedo">${esc(c.riesgo || '')}</textarea></div>
    <div><label>Plan B</label><textarea name="plan_b" required placeholder="Ej: si 3 lecturas iguales seguidas, el sistema avisa 'sensor sospechoso'">${esc(c.plan_b || '')}</textarea></div>
  </div>`;
}

function pintarBloques() {
  const el = $('#bloques-lista'); if (!el) return;
  if (!S.bloques.length) { el.innerHTML = `<div class="ayuda">Todavía no hay bloques. Empiecen por la ENTRADA.</div>`; return; }
  el.innerHTML = S.bloques.map((b, i) => `
    <div class="bloque" style="border-left-color:${BLOQUES[b.tipo].color}">
      <div><div class="tipo" style="color:${BLOQUES[b.tipo].color}">${BLOQUES[b.tipo].nombre}</div><div class="que">${esc(b.opcion)}</div><div class="det">${esc(b.detalle)}</div></div>
      <div class="fila" style="gap:4px;flex-wrap:nowrap">
        <button type="button" class="btn chico fantasma" data-mv="${i}:-1" title="Subir">↑</button>
        <button type="button" class="btn chico fantasma" data-mv="${i}:1" title="Bajar">↓</button>
        <button type="button" class="btn chico peligro" data-del="${i}">${ico('x')}</button>
      </div>
    </div>${i < S.bloques.length - 1 ? '<div class="flecha">▼</div>' : ''}`).join('') +
    `<div class="terminal" style="margin-top:12px"><span class="etiqueta">pseudocódigo</span><pre style="padding-top:6px">${esc(pseudocodigo(S.bloques))}</pre></div>`;
  $$('[data-mv]', el).forEach((b) => (b.onclick = () => { const [i, d] = b.dataset.mv.split(':').map(Number); const j = i + d; if (j < 0 || j >= S.bloques.length) return; [S.bloques[i], S.bloques[j]] = [S.bloques[j], S.bloques[i]]; pintarBloques(); }));
  $$('[data-del]', el).forEach((b) => (b.onclick = () => { S.bloques.splice(+b.dataset.del, 1); pintarBloques(); }));
}
function pseudocodigo(bl) {
  const ent = bl.filter((b) => b.tipo === 'entrada'), pro = bl.filter((b) => b.tipo === 'proceso'), dec = bl.filter((b) => b.tipo === 'decision'), sal = bl.filter((b) => b.tipo === 'salida');
  const l = [];
  l.push('CADA ciclo:');
  ent.forEach((b) => l.push(`  LEER ${b.opcion}${b.detalle ? ' → ' + b.detalle : ''}`));
  pro.forEach((b) => l.push(`  PROCESAR: ${b.opcion}${b.detalle ? ' (' + b.detalle + ')' : ''}`));
  dec.forEach((b, i) => l.push(`  ${i ? 'Y SI' : 'SI'} ${b.detalle || b.opcion}`));
  if (dec.length) l.push('  ENTONCES:');
  sal.forEach((b) => l.push(`    ${dec.length ? '  ' : ''}${b.opcion}${b.detalle ? ' → ' + b.detalle : ''}`));
  if (!sal.length) l.push('    (sin salida: ¿qué pasa al final?)');
  return l.join('\n');
}

function formBuild(c) {
  return `
  <h3>${ico('box')} Prototipo físico</h3>
  <div class="grid g2" style="gap:14px">
    <div>
      <label>Foto de la maqueta</label>
      <input type="file" id="foto-archivo" accept="image/*" capture="environment">
      <input type="hidden" name="foto" id="foto-url" value="${esc(S.fotoNivel3 || c.foto || '')}">
      <div id="foto-prev" style="margin-top:8px">${(S.fotoNivel3 || c.foto) ? `<img src="${esc(S.fotoNivel3 || c.foto)}" style="border-radius:12px;max-height:260px"><div class="ayuda lima">${ico('check')} Foto cargada</div>` : '<div class="ayuda">Buena luz, fondo limpio, que se vean las partes marcadas.</div>'}</div>
    </div>
    <div>
      <label>Partes y qué representa cada una</label>
      <textarea name="partes" required style="min-height:120px" placeholder="Pieza roja → sensor de humedad enterrado&#10;Torre amarilla → caja del XIAO con antena&#10;Casa verde → familia que recibe la alerta">${esc(c.partes || '')}</textarea>
      <label>Materiales usados</label><input type="text" name="materiales" required placeholder="LEGO, cartón, plastilina, tapas…" value="${esc(c.materiales || '')}">
    </div>
  </div>
  <label>Explicación de 30 segundos (lo que dirán cuando el control llegue a la mesa)</label>
  <textarea name="explicacion" required placeholder="Esto es… Aquí entra… Esto decide… Y al final…">${esc(c.explicacion || '')}</textarea>`;
}

function formConnect(c) {
  const n = S.d.lecturas || 0; const ok = n >= 3;
  return `
  <h3>${ico('wifi')} Conexión con el XIAO ESP32S3 Sense</h3>
  <div class="grid g2" style="gap:14px">
    <div class="card" style="background:var(--panel-2)">
      <label>Token del equipo (va en el firmware)</label>
      <div class="terminal"><pre id="token-txt">${esc(S.d.token)}</pre><button type="button" class="btn chico copiar" data-copiar="${esc(S.d.token)}">${ico('copy')}</button></div>
      <label>URL del webhook</label>
      <div class="terminal"><pre>${esc(CONFIG.WEBHOOK_URL)}</pre><button type="button" class="btn chico copiar" data-copiar="${esc(CONFIG.WEBHOOK_URL)}">${ico('copy')}</button></div>
      <p class="ayuda" style="margin-top:10px">Guía paso a paso, firmware listo y cómo leer los datos desde Lovable: <a href="hardware.html?c=${esc(S.d.codigo)}" target="_blank">Hardware ↗</a></p>
    </div>
    <div class="card" style="background:var(--panel-2);border-color:${ok ? 'var(--lima-profundo)' : '#6b5600'}">
      <h3 style="margin:0">${ico(ok ? 'check' : 'alert')} Señal del dispositivo</h3>
      <div class="num" style="font-family:var(--display);font-size:2.4rem;font-weight:800;color:${ok ? 'var(--lima)' : 'var(--amarillo)'}"><span id="n-lecturas">${n}</span> <span style="font-size:1rem;color:var(--texto-suave)">lecturas</span></div>
      <p class="ayuda">${ok ? 'Señal suficiente. Ahora la app.' : 'El sistema exige mínimo 3 lecturas reales antes de aceptar la entrega.'}</p>
      <div class="ayuda">Las lecturas aparecen abajo en «Datos del dispositivo» en tiempo real.</div>
    </div>
  </div>
  <label>Enlace de la app (Lovable u otra)</label><input type="url" name="app_url" required placeholder="https://..." value="${esc(c.app_url || '')}">
  <label>¿Qué muestra la app y para quién?</label><textarea name="app_que" required placeholder="Ej: muestra la humedad del suelo de la huerta en una gráfica y manda alerta cuando baja de 30 %">${esc(c.app_que || '')}</textarea>
  <label>¿Cómo probaron que funciona?</label><textarea name="pruebas" required placeholder="Ej: metimos el sensor en tierra seca y luego mojada, y el valor cambió de 12 % a 78 %">${esc(c.pruebas || '')}</textarea>
  <p class="ayuda">Consejo: en Lovable, pídanle que lea la tabla <code>lecturas</code> de Supabase filtrando por su <code>equipo_id</code> (está en Hardware).</p>`;
}

function formPitch(c) {
  return `
  <h3>${ico('mic')} Ficha del pitch (60 segundos)</h3>
  <div class="grid g2" style="gap:12px">
    <div><label>Nombre del proyecto</label><input type="text" name="nombre_proyecto" required value="${esc(c.nombre_proyecto || '')}"></div>
    <div><label>ODS principal e impacto</label><input type="text" name="impacto" required placeholder="ODS 11 · evita que 40 familias duerman sin alerta" value="${esc(c.impacto || '')}"></div>
  </div>
  <label>El problema en una frase</label><input type="text" name="problema" required value="${esc(c.problema || '')}">
  <label>La solución en una frase</label><input type="text" name="solucion" required value="${esc(c.solucion || '')}">
  <label>Cómo funciona, en 3 pasos</label>
  <input type="text" name="paso1" required placeholder="1. Entra…" value="${esc(c.paso1 || '')}" style="margin-bottom:6px">
  <input type="text" name="paso2" required placeholder="2. La IA / la regla…" value="${esc(c.paso2 || '')}" style="margin-bottom:6px">
  <input type="text" name="paso3" required placeholder="3. Sale / avisa…" value="${esc(c.paso3 || '')}">
  <label>Qué sigue / qué pedimos</label><input type="text" name="siguiente" required placeholder="Probarlo 1 mes en la huerta del colegio" value="${esc(c.siguiente || '')}">
  <label>Quién dice qué</label><textarea name="reparto" required placeholder="Ana: problema · Juan: solución · Sofía: demo · Mateo: cierre">${esc(c.reparto || '')}</textarea>
  <div class="card" style="background:var(--panel-2);margin-top:14px">
    <div class="fila espacio"><h3 style="margin:0">${ico('clock')} Guion generado</h3><div class="fila" style="gap:8px"><span class="mono" id="crono" style="font-size:1.4rem;color:var(--lima)">60</span><button type="button" class="btn chico" id="btn-crono">Ensayar 60 s</button></div></div>
    <div class="terminal" style="margin-top:10px"><pre id="guion">${esc(guionPitch(c))}</pre></div>
  </div>`;
}
function guionPitch(c) {
  return `[0-10 s] Hola, somos ${S.d.equipo.nombre} y esto es ${c.nombre_proyecto || '…'}.
[10-20 s] El problema: ${c.problema || '…'}
[20-30 s] Nuestra solución: ${c.solucion || '…'}
[30-45 s] Funciona así: ${c.paso1 || '…'} ${c.paso2 || '…'} ${c.paso3 || '…'}
[45-55 s] Impacto: ${c.impacto || '…'}
[55-60 s] Lo que sigue: ${c.siguiente || '…'} ¡Gracias!`;
}

// ---------------------------------------------------------------- eventos del panel
function enlazarPanel(n) {
  // Llave
  const fl = $('#form-llave');
  if (fl) {
    fl.onsubmit = async (e) => {
      e.preventDefault(); const v = $('#resp-llave').value.trim(); if (!v) return;
      try {
        const r = await rpc('equipo_resolver_llave', { p_codigo: CODIGO, p_nivel: n, p_respuesta: v });
        if (r.ok) { Sonido.llave(); toast(`${ico('unlock')} Llave descifrada. Acceso concedido.`); }
        else if (r.bloqueado) { beep('err'); toast(`Bloqueado ${r.segundos} s`, 'aviso'); }
        else { beep('err'); toast(`Respuesta incorrecta. Espera ${r.segundos} s para volver a intentar.`, 'error'); }
        S.firmas.panel = null; await cargar();
      } catch (ex) { toast(ex.message, 'error'); }
    };
    $('#btn-pista') && ($('#btn-pista').onclick = () => $('#pista').classList.toggle('oculto'));
    const L = S.d.llaves?.[String(n)];
    if (L?.bloqueado_hasta && new Date(L.bloqueado_hasta) > Date.now()) {
      const it = setInterval(() => { const s = Math.ceil((new Date(L.bloqueado_hasta) - Date.now()) / 1000); const el = $('#llave-estado'); if (!el) return clearInterval(it); if (s <= 0) { clearInterval(it); S.firmas.panel = null; siCambia('panel', firmaPanel(), renderPanel); } else el.textContent = `Bloqueado ${s} s por intento fallido`; }, 500);
    }
  }
  $$('[data-copiar]').forEach((b) => (b.onclick = () => copiar(b.dataset.copiar)));

  const f = $('#form-nivel'); if (!f) return;
  if (n === 1) {
    const pintarDetalle = () => {
      const k = f.reto.value; const r = retoPorClave(k); const d = $('#detalle-reto'); $('#propio').classList.toggle('oculto', k !== 'propio');
      if (!r) { d.innerHTML = ''; return; }
      d.innerHTML = `<div class="callout"><div class="fila" style="gap:4px;margin-bottom:6px">${(r.ods || []).map(odsChip).join('')}</div><b>${esc(r.titulo)}</b> · <span class="suave">${esc(r.contexto)}</span><ul style="margin:8px 0 0;padding-left:18px;color:var(--texto-suave)">${r.preguntas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><div class="fila" style="gap:6px;margin-top:8px">${(r.sensores || []).map((s) => `<span class="chip cian">${ico(SENSORES[s]?.icono || 'bolt')} ${esc(SENSORES[s]?.nombre || s)}</span>`).join('')}</div></div>`;
    };
    $('#lista-retos').onclick = (e) => { const b = e.target.closest('.reto'); if (!b) return; f.reto.value = b.dataset.k; $$('.reto', f).forEach((x) => x.classList.toggle('sel', x === b)); pintarDetalle(); };
    pintarDetalle();
  }
  if (n === 2) {
    const tipo = $('#b-tipo'), op = $('#b-opcion'), det = $('#b-detalle');
    const pintarOp = () => { const B = BLOQUES[tipo.value]; op.innerHTML = B.opciones.map((o) => `<option>${esc(o)}</option>`).join('') + '<option value="__otro">Otro…</option>'; det.placeholder = B.placeholder; };
    tipo.onchange = pintarOp; pintarOp(); pintarBloques();
    $('#b-add').onclick = () => {
      let opcion = op.value; if (opcion === '__otro') { opcion = prompt('Nombre del bloque:') || ''; if (!opcion.trim()) return; }
      if (!det.value.trim()) { toast('Escriban el detalle concreto del bloque.', 'aviso'); det.focus(); return; }
      S.bloques.push({ tipo: tipo.value, opcion, detalle: det.value.trim() }); det.value = ''; pintarBloques(); beep('ok');
    };
  }
  if (n === 3) {
    $('#foto-archivo').onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return; $('#foto-prev').innerHTML = '<div class="ayuda">Subiendo foto…</div>';
      try {
        const url = await subirImagen(file, `${S.d.equipo.id}/nivel3_${Date.now()}.jpg`);
        S.fotoNivel3 = url; const h = $('#foto-url'); if (h) h.value = url;
        $('#foto-prev').innerHTML = `<img src="${url}" style="border-radius:12px;max-height:260px"><div class="ayuda lima">${ico('check')} Foto cargada</div>`; toast('Foto subida'); beep('ok');
      } catch (ex) { toast(ex.message, 'error'); $('#foto-prev').innerHTML = `<div class="error">${esc(ex.message)}. Intenten con otra foto o tómenla directamente con la cámara.</div>`; }
    };
  }
  if (n === 5) {
    const upd = () => { $('#guion').textContent = guionPitch(Object.fromEntries(new FormData(f))); };
    f.addEventListener('input', upd);
    let it; $('#btn-crono').onclick = () => { clearInterval(it); let s = 60; const el = $('#crono'); el.textContent = s; Sonido.ultimoMinuto(); it = setInterval(() => { s--; el.textContent = s; el.style.color = s <= 10 ? '#ff6b6b' : 'var(--lima)'; if (s <= 10 && s > 0) Sonido.tick(s); if (s <= 0) { clearInterval(it); Sonido.tiempo(); toast('¡Tiempo!', 'aviso'); } }, 1000); };
  }
  f.onsubmit = async (e) => {
    e.preventDefault(); const err = $('#err-nivel'); err.textContent = '';
    const c = Object.fromEntries(new FormData(f));
    try {
      if (n === 1) {
        if (!c.reto) throw new Error('Elijan un problema del muro.');
        if (c.reto === 'propio' && (!c.propio_titulo || !c.propio_contexto)) throw new Error('Describan el problema propio y sus ODS.');
        await rpc('equipo_actualizar', { p_codigo: CODIGO, p_cambios: { reto_clave: c.reto, reto_custom: c.reto === 'propio' ? { titulo: c.propio_titulo, ods: c.propio_ods, contexto: c.propio_contexto } : null } });
      }
      if (n === 2) {
        c.bloques = S.bloques;
        const tipos = new Set(S.bloques.map((b) => b.tipo));
        if (!['entrada', 'proceso', 'decision', 'salida'].every((t) => tipos.has(t))) throw new Error('El mapa necesita al menos un bloque de cada tipo: ENTRADA, PROCESO, DECISIÓN y SALIDA.');
        c.pseudocodigo = pseudocodigo(S.bloques);
      }
      if (n === 3) { c.foto = c.foto || S.fotoNivel3 || ''; if (!c.foto) throw new Error('Falta la foto de la maqueta: toquen «Elegir archivo», esperen el aviso «Foto cargada» y vuelvan a enviar.'); }
      if (n === 4 && (S.d.lecturas || 0) < 3) throw new Error('El sistema aún no recibe señal suficiente del dispositivo (mínimo 3 lecturas).');
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      await rpc('equipo_entregar', { p_codigo: CODIGO, p_tipo: 'nivel', p_nivel: n, p_ref: null, p_contenido: c });
      beep('ok'); toast(`${ico('send')} Entrega enviada. El control la revisa en vivo.`); if (n === 2) S.bloques = null; if (n === 3) S.fotoNivel3 = null;
      S.firmas.panel = null; await cargar();
    } catch (ex) { err.textContent = ex.message; beep('err'); const btn = f.querySelector('button[type=submit]'); if (btn) btn.disabled = false; }
  };
}

// ---------------------------------------------------------------- misiones extra
function renderExtras() {
  const ent = (S.d.entregas || []).filter((x) => x.tipo === 'extra');
  const puede = aprobado(1) || entregaNivel(1);
  $('#extras').innerHTML = `<div class="card">
    <span class="eyebrow">Misiones extra</span>
    <h3 style="margin-top:4px">${ico('star')} Para cuando esperan validación</h3>
    ${!puede ? '<p class="ayuda">Se desbloquean al enviar el nivel 1.</p>' : ''}
    <div class="grid" style="gap:10px">${EXTRAS.map((x) => {
      const e = ent.find((y) => y.ref === x.clave);
      const st = e?.estado; const chip = st === 'aprobada' ? `<span class="chip lima">+${e.xp_otorgado} XP</span>` : st === 'pendiente' ? '<span class="chip amarillo">en revisión</span>' : st === 'rechazada' ? '<span class="chip rojo">devuelta</span>' : `<span class="chip">+${x.xp} XP</span>`;
      return `<div class="card" style="background:var(--panel-2);padding:14px">
        <div class="fila espacio"><b>${esc(x.titulo)}</b>${chip}</div>
        <p class="suave" style="font-size:.88rem;margin:6px 0">${esc(x.desc)}</p>
        ${st === 'rechazada' && e.feedback ? `<div class="ayuda" style="color:var(--amarillo)">Control: ${esc(e.feedback)}</div>` : ''}
        ${st === 'aprobada' ? '' : puede ? `<details ${st === 'rechazada' ? 'open' : ''}><summary class="ayuda" style="cursor:pointer">${st ? 'Editar y reenviar' : 'Responder'}</summary>
          <form data-extra="${x.clave}" style="margin-top:8px"><textarea name="respuesta" required placeholder="${esc(x.campo)}">${esc(e?.contenido?.respuesta || '')}</textarea>
          <button class="btn chico primario" style="margin-top:8px">${ico('send')} Enviar</button></form></details>` : ''}
      </div>`;
    }).join('')}</div></div>`;
  $$('[data-extra]').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault(); const x = EXTRAS.find((y) => y.clave === f.dataset.extra);
    try { await rpc('equipo_entregar', { p_codigo: CODIGO, p_tipo: 'extra', p_nivel: null, p_ref: x.clave, p_contenido: { titulo: x.titulo, xp_sugerido: x.xp, respuesta: f.respuesta.value.trim() } }); beep('ok'); toast('Misión enviada al control.'); S.firmas.extras = null; await cargar(); }
    catch (ex) { toast(ex.message, 'error'); }
  }));
}

// ---------------------------------------------------------------- caos
function eventosCaos() { return (S.d.eventos || []).filter((e) => e.tipo === 'caos'); }
function renderCaos() {
  const ev = eventosCaos(); const ent = (S.d.entregas || []).filter((x) => x.tipo === 'caos');
  $('#caos').innerHTML = `<div class="card">
    <span class="eyebrow">Eventos caos</span>
    <h3 style="margin-top:4px">${ico('alert')} Lo inesperado</h3>
    ${!ev.length ? '<p class="ayuda">Nada todavía. El control puede lanzar un evento en cualquier momento: tendrán pocos minutos para responder.</p>' : ''}
    <div class="grid" style="gap:10px">${ev.map((e) => {
      const r = ent.find((y) => y.ref === e.id); const exp = e.expira_en && new Date(e.expira_en) < Date.now();
      const chip = r?.estado === 'aprobada' ? `<span class="chip lima">+${r.xp_otorgado} XP</span>` : r ? '<span class="chip amarillo">en revisión</span>' : exp ? '<span class="chip rojo">expirado</span>' : `<span class="chip amarillo mono" data-exp="${e.expira_en}">${fmtMMSS((new Date(e.expira_en) - Date.now()) / 1000)}</span>`;
      return `<div class="card" style="background:var(--panel-2);padding:14px;border-color:${!r && !exp ? '#6b5600' : 'var(--borde)'}">
        <div class="fila espacio"><b style="color:var(--amarillo)">${esc(e.titulo)}</b>${chip}</div>
        <p class="suave" style="font-size:.9rem;margin:6px 0">${esc(e.descripcion || '')}${e.equipo_id ? ' <span class="chip">solo para ustedes</span>' : ''}</p>
        ${r || exp ? (r ? `<div class="terminal"><pre>${esc(r.contenido?.respuesta || '')}</pre></div>` : '') : `<form data-caos="${e.id}"><textarea name="respuesta" required placeholder="Respuesta corta y concreta del equipo"></textarea><button class="btn chico primario" style="margin-top:8px">${ico('send')} Responder</button></form>`}
      </div>`;
    }).join('')}</div></div>`;
  $$('[data-caos]').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault(); const ev = eventosCaos().find((y) => y.id === f.dataset.caos);
    try { await rpc('equipo_entregar', { p_codigo: CODIGO, p_tipo: 'caos', p_nivel: null, p_ref: ev.id, p_contenido: { titulo: ev.titulo, xp_sugerido: ev.payload?.xp || 40, respuesta: f.respuesta.value.trim() } }); beep('ok'); toast('Respuesta enviada.'); $('#overlay').innerHTML = ''; S.firmas.caos = null; await cargar(); }
    catch (ex) { toast(ex.message, 'error'); }
  }));
}
function revisarCaosNuevo() {
  const nuevos = eventosCaos().filter((e) => !S.vistos.has(e.id) && (!e.expira_en || new Date(e.expira_en) > Date.now()) && !(S.d.entregas || []).some((x) => x.tipo === 'caos' && x.ref === e.id));
  if (!nuevos.length) return;
  const e = nuevos[0]; S.vistos.add(e.id); localStorage.setItem('ods_vistos', JSON.stringify([...S.vistos]));
  Sonido.caos(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  $('#overlay').innerHTML = `<div class="overlay"><div class="card" style="border-color:var(--amarillo)">
    <span class="eyebrow" style="color:var(--amarillo)">Evento caos</span>
    <div class="caos-titulo">${esc(e.titulo)}</div>
    <p style="font-size:1.1rem">${esc(e.descripcion || '')}</p>
    <p class="ayuda">Tienen hasta las ${e.expira_en ? fmtHora(e.expira_en) : '—'} para responder desde la sección «Eventos caos». Respuesta corta y concreta.</p>
    <button class="btn primario bloque" id="cerrar-ov">Entendido, vamos</button>
  </div></div>`;
  $('#cerrar-ov').onclick = () => { $('#overlay').innerHTML = ''; $('#caos').scrollIntoView({ behavior: 'smooth' }); };
}
setInterval(() => $$('[data-exp]').forEach((c) => { const s = (new Date(c.dataset.exp) - Date.now()) / 1000; c.textContent = s > 0 ? fmtMMSS(s) : 'expirado'; }), 1000);

// ---------------------------------------------------------------- lecturas
function renderLecturas() {
  const ls = S.d.ultimas_lecturas || [];
  $('#lecturas').innerHTML = `<div class="card">
    <span class="eyebrow">Datos del dispositivo</span>
    <h3 style="margin-top:4px">${ico('cpu')} ${S.d.lecturas || 0} lecturas recibidas</h3>
    ${!ls.length ? `<p class="ayuda">Nada todavía. Cuando el XIAO envíe datos al webhook con su token, aparecen aquí al instante. Pasos en <a href="hardware.html?c=${esc(S.d.codigo)}" target="_blank">Hardware ↗</a>.</p>` : `
    <table><thead><tr><th>Hora</th><th>Tipo</th><th>Valor</th><th>Extra</th></tr></thead><tbody>
      ${ls.map((l) => `<tr><td class="mono">${fmtHora(l.created_at)}</td><td>${esc(l.tipo)}</td><td class="mono lima">${l.valor ?? '—'}${l.extra?.unidad ? ' ' + esc(l.extra.unidad) : ''}</td><td class="suave" style="font-size:.85rem">${l.imagen_url ? `<a href="${esc(l.imagen_url)}" target="_blank"><img src="${esc(l.imagen_url)}" style="height:40px;border-radius:6px;vertical-align:middle"></a> ` : ''}${esc(Object.entries(l.extra || {}).filter(([k]) => k !== 'unidad').map(([k, v]) => `${k}: ${v}`).join(' · '))}</td></tr>`).join('')}
    </tbody></table>`}
  </div>`;
}

// ---------------------------------------------------------------- ranking
function renderRanking() {
  const yo = S.d.equipo.id;
  $('#ranking').innerHTML = `<div class="card">
    <span class="eyebrow">Ranking en vivo</span>
    <h3 style="margin-top:4px">${ico('trophy')} ${S.ranking.length} equipos</h3>
    <div class="grid" style="gap:6px">${S.ranking.slice(0, 12).map((r, i) => `
      <div class="rank-fila ${i < 3 ? 'top' : ''}" style="${r.id === yo ? 'outline:2px solid var(--lima)' : ''}">
        <div class="pos">${i + 1}</div>
        <div class="fila" style="gap:10px">${emblemaHTML(r.emblema, r.color)}<div><b>${esc(r.nombre)}</b><div class="ayuda">nivel ${Math.min(r.nivel_actual, 5)}${r.nivel_actual > 5 ? ' · circuito completo' : ''} · ${r.votos} votos</div></div></div>
        <div class="pts">${r.total}</div>
      </div>`).join('')}</div>
    <p class="ayuda" style="margin-top:10px">Total = XP + 40 por cada voto recibido. El jurado puede sumar bonificaciones. Hay premios para los mejores equipos.</p>
  </div>`;
}

// ---------------------------------------------------------------- votación
function renderVotacion(eq, j) {
  const el = $('#votacion');
  if (j.estado !== 'votacion' && j.estado !== 'cerrada') { el.innerHTML = ''; return; }
  if (j.estado === 'cerrada') {
    const top = S.ranking.slice(0, 3);
    el.innerHTML = `<div class="card lima-borde"><span class="eyebrow">Jornada cerrada</span><h2>${ico('trophy')} Resultados</h2>
      <div class="podio">${top.map((r, i) => `<div class="p ${['uno', 'dos', 'tres'][i]}">${emblemaHTML(r.emblema, r.color, true)}<div class="pos" style="font-family:var(--display);font-size:2rem;font-weight:800;color:var(--lima)">#${i + 1}</div><b>${esc(r.nombre)}</b><div class="pts mono lima">${r.total} pts</div></div>`).join('')}</div>
      <p class="suave centro" style="margin-top:14px">Los premios se entregan en el cierre. Gracias por hackear un problema real.</p></div>`;
    return;
  }
  const otros = S.ranking.filter((r) => r.id !== eq.id);
  el.innerHTML = `<div class="card lima-borde"><span class="eyebrow">Votación abierta</span><h2>${ico('star')} Voten por otros equipos</h2>
    <p class="suave">Un voto por categoría. No pueden votar por su propio equipo. Cada voto suma 40 puntos al equipo elegido.</p>
    <div class="grid g3">${Object.entries(CATEGORIAS_VOTO).map(([k, c]) => {
      const v = S.votos.find((x) => x.categoria === k);
      return `<div class="card" style="background:var(--panel-2)"><b>${esc(c.nombre)}</b><p class="ayuda">${esc(c.desc)}</p>
        <select data-cat="${k}"><option value="">— elegir —</option>${otros.map((o) => `<option value="${o.id}" ${v?.votado_id === o.id ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('')}</select>
        ${v ? '<div class="ayuda lima" style="margin-top:6px">Voto registrado</div>' : ''}</div>`;
    }).join('')}</div></div>`;
  $$('[data-cat]').forEach((s) => (s.onchange = async () => { if (!s.value) return; try { await rpc('votar', { p_codigo: CODIGO, p_votado: s.value, p_categoria: s.dataset.cat }); beep('ok'); toast('Voto registrado'); S.firmas.votacion = null; await cargar(); } catch (ex) { toast(ex.message, 'error'); } }));
}

// ---------------------------------------------------------------- arranque
(async () => {
  await cargar();
  if (!S.d) return;
  const jid = S.d.jornada.id, eid = S.d.equipo.id;
  suscribir('equipo-' + eid, [
    { table: 'jornadas', filter: `id=eq.${jid}` }, { table: 'equipos', filter: `jornada_id=eq.${jid}` }, { table: 'entregas', filter: `equipo_id=eq.${eid}` },
    { table: 'lecturas', filter: `equipo_id=eq.${eid}` }, { table: 'eventos', filter: `jornada_id=eq.${jid}` }, { table: 'votos', filter: `jornada_id=eq.${jid}` },
  ], async (p) => {
    const antes = S.d; await cargar();
    if (!p.sondeo && antes && S.d) {
      const a = [1, 2, 3, 4, 5].filter((n) => (antes.entregas || []).find((x) => x.tipo === 'nivel' && x.nivel === n)?.estado !== 'aprobada' && aprobado(n));
      if (a.length) { Sonido.aprobado(); toast(`${ico('check')} ¡Nivel ${a[0]} aprobado! +${entregaNivel(a[0]).xp_otorgado} XP`); }
      const r = [1, 2, 3, 4, 5].filter((n) => (antes.entregas || []).find((x) => x.tipo === 'nivel' && x.nivel === n)?.estado !== 'rechazada' && entregaNivel(n)?.estado === 'rechazada');
      if (r.length) { Sonido.devuelto(); toast(`${ico('alert')} El control devolvió el nivel ${r[0]}. Revisen el comentario.`, 'aviso'); S.nivelSel = r[0]; S.bloques = null; renderCircuito(); siCambia('panel', firmaPanel(), renderPanel); }
      if ((S.d.lecturas || 0) > (antes.lecturas || 0) && (antes.lecturas || 0) === 0) { Sonido.senal(); toast(`${ico('wifi')} ¡Primera señal del dispositivo recibida! +50 XP`); }
      const abAntes = (antes.jornada.niveles_abiertos || []).length, abAhora = (S.d.jornada.niveles_abiertos || []).length;
      if (abAhora > abAntes) { Sonido.nivel(); toast(`${ico('unlock')} El control abrió un nuevo nivel.`); }
      if (antes.jornada.estado !== 'votacion' && S.d.jornada.estado === 'votacion') { Sonido.voto(); toast(`${ico('star')} ¡Votación abierta! Voten por otros equipos.`); }
      if (antes.jornada.estado !== 'cerrada' && S.d.jornada.estado === 'cerrada') Sonido.fanfarria();
    }
  });
})();
