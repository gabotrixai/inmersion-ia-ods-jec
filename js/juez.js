// =====================================================================
//  CIRCUITO ODS · Panel de control (facilitador + jurado)
// =====================================================================
pintarBarra('juez.html'); pintarPie();

const J = { cred: sesion.juez, jornada: null, equipos: [], entregas: [], eventos: [], votos: [], ranking: [], lecturas: {}, tab: 'control', timer: null, off: null, verHist: false };
const ICON_NIVEL = { 1: 'eye', 2: 'map', 3: 'box', 4: 'wifi', 5: 'mic' };
const auth = () => ({ p_codigo: J.cred.codigo, p_pin: J.cred.pin });

// ---------------------------------------------------------------- login
$('#form-login').onsubmit = async (e) => {
  e.preventDefault(); $('#l-err').textContent = '';
  const cred = { codigo: $('#l-cod').value.trim().toUpperCase(), pin: $('#l-pin').value };
  try { await rpc('juez_auth', { p_codigo: cred.codigo, p_pin: cred.pin }); J.cred = cred; sesion.juez = cred; iniciar(); } catch (ex) { $('#l-err').textContent = ex.message; }
};
$('#form-crear').onsubmit = async (e) => {
  e.preventDefault(); $('#c-err').textContent = '';
  try {
    const r = await rpc('crear_jornada', { p_nombre: $('#c-nombre').value.trim(), p_pin: $('#c-pin').value });
    J.cred = { codigo: r.codigo, pin: $('#c-pin').value }; sesion.juez = J.cred; toast(`Jornada creada. Código: <b>${r.codigo}</b>`); iniciar();
  } catch (ex) { $('#c-err').textContent = ex.message; }
};
if (J.cred) iniciar();

async function iniciar() {
  try { J.jornada = await rpc('juez_auth', auth()); } catch (ex) { sesion.juez = null; J.cred = null; toast(ex.message, 'error'); return; }
  $('#login').classList.add('oculto'); $('#app').classList.remove('oculto');
  await cargar();
  if (J.off) J.off();
  J.off = suscribir('juez-' + J.jornada.id, ['jornadas', 'equipos', 'entregas', 'eventos', 'votos', 'lecturas'], async (p) => {
    const antes = J.entregas.filter((x) => x.estado === 'pendiente').length; await cargar();
    const ahora = J.entregas.filter((x) => x.estado === 'pendiente').length;
    if (!p.sondeo && ahora > antes) { beep('alerta'); toast(`${ico('send')} Nueva entrega por revisar`); }
  });
}

async function cargar() {
  try {
    const [jor, eqs] = await Promise.all([rpc('juez_auth', auth()), rpc('juez_equipos', auth())]);
    J.jornada = jor; J.equipos = eqs || [];
    const ids = J.equipos.map((e) => e.id);
    const [en, ev, vt, rk, le] = await Promise.all([
      ids.length ? sb.from('entregas').select('*').in('equipo_id', ids).order('created_at', { ascending: false }) : { data: [] },
      sb.from('eventos').select('*').eq('jornada_id', jor.id).order('created_at', { ascending: false }).limit(60),
      sb.from('votos').select('*').eq('jornada_id', jor.id),
      sb.from('ranking').select('*').eq('jornada_id', jor.id).order('total', { ascending: false }),
      ids.length ? sb.from('lecturas').select('equipo_id, tipo, valor, imagen_url, created_at').in('equipo_id', ids).order('created_at', { ascending: false }).limit(4000) : { data: [] },
    ]);
    J.entregas = en.data || []; J.eventos = ev.data || []; J.votos = vt.data || []; J.ranking = rk.data || [];
    J.lecturas = {}; (le.data || []).forEach((l) => { (J.lecturas[l.equipo_id] = J.lecturas[l.equipo_id] || []).push(l); });
    render();
  } catch (ex) { toast(ex.message, 'error'); }
}

const eq = (id) => J.equipos.find((e) => e.id === id) || { nombre: '¿?', emblema: 'bolt', color: '#666' };
const pendientes = () => J.entregas.filter((x) => x.estado === 'pendiente');

// ---------------------------------------------------------------- render
function render() {
  const j = J.jornada; const estados = { lobby: 'Lobby', en_juego: 'En juego', votacion: 'Votación', cerrada: 'Cerrada' };
  $('#app').innerHTML = `
  <div class="card" style="padding:16px 22px">
    <div class="fila espacio">
      <div class="fila" style="gap:16px">
        <div><span class="eyebrow" style="margin:0">Jornada · ${estados[j.estado] || j.estado}</span><h2 style="margin:2px 0">${esc(j.nombre)}</h2></div>
        <div class="terminal" style="padding:8px 16px;text-align:center"><div class="apagado" style="font-size:.62rem;letter-spacing:.2em">CÓDIGO PARA EQUIPOS</div><div style="font-size:1.8rem;letter-spacing:.3em;color:var(--lima);font-weight:700">${j.codigo}</div></div>
      </div>
      <div class="fila" style="gap:10px">
        <div class="stat" style="text-align:center"><div class="num">${J.equipos.length}</div><div class="lbl">equipos</div></div>
        <div class="stat" style="text-align:center"><div class="num" style="color:${pendientes().length ? 'var(--amarillo)' : 'var(--lima)'}">${pendientes().length}</div><div class="lbl">por revisar</div></div>
        <div class="stat" style="text-align:center;min-width:120px"><div class="num mono" id="timer" style="font-size:1.6rem">--:--</div><div class="lbl">${esc(j.timer_label || 'cronómetro')}</div></div>
        <a class="btn chico" href="pantalla.html?j=${j.codigo}" target="_blank">${ico('monitor')} Pantalla</a>
        <button class="btn chico fantasma" id="salir">Salir</button>
      </div>
    </div>
  </div>
  <div class="tabs" style="margin-top:18px">
    ${[['control', 'Control'], ['entregas', `Entregas${pendientes().length ? `<span class="n">${pendientes().length}</span>` : ''}`], ['equipos', 'Equipos'], ['cierre', 'Votación y cierre'], ['exportar', 'Evidencias']].map(([k, t]) => `<button class="tab ${J.tab === k ? 'activo' : ''}" data-tab="${k}">${t}</button>`).join('')}
  </div>
  <div id="tab"></div>`;
  $('#salir').onclick = () => { sesion.juez = null; location.reload(); };
  $$('.tab').forEach((b) => (b.onclick = () => { J.tab = b.dataset.tab; render(); }));
  clearInterval(J.timer); J.timer = iniciarTimer(() => J.jornada.timer_fin, $('#timer'));
  ({ control: tabControl, entregas: tabEntregas, equipos: tabEquipos, cierre: tabCierre, exportar: tabExportar })[J.tab]();
}

// ---------------------------------------------------------------- control
async function set(cambios, msg) { try { J.jornada = await rpc('juez_set', { ...auth(), p_cambios: cambios }); if (msg) toast(msg); await cargar(); } catch (ex) { toast(ex.message, 'error'); } }

function tabControl() {
  const j = J.jornada; const ab = j.niveles_abiertos || [];
  $('#tab').innerHTML = `
  <div class="grid g2">
    <div class="card">
      <h3>${ico('settings')} Estado de la jornada</h3>
      <div class="fila">${[['lobby', 'Lobby'], ['en_juego', 'En juego'], ['votacion', 'Abrir votación'], ['cerrada', 'Cerrar jornada']].map(([k, t]) => `<button class="btn ${j.estado === k ? 'primario' : ''}" data-estado="${k}">${t}</button>`).join('')}</div>
      <p class="ayuda" style="margin-top:8px">Lobby: los equipos se registran. En juego: se habilitan entregas. Votación: cada equipo vota por otros. Cerrada: se muestra el podio.</p>
      <h3 style="margin-top:20px">${ico('unlock')} Niveles abiertos</h3>
      <div class="fila">${NIVELES.map((n) => `<button class="toggle ${ab.includes(n.n) ? 'on' : ''}" data-nivel="${n.n}">${ico(ab.includes(n.n) ? 'unlock' : 'lock')} ${n.n} · ${n.codigo}</button>`).join('')}</div>
      <p class="ayuda" style="margin-top:8px">Abrir un nivel no salta las dependencias: un equipo sigue necesitando el anterior aprobado. Un nivel cerrado deja adelantar la llave, no la entrega.</p>
      <h3 style="margin-top:20px">${ico('cpu')} Señal del dispositivo</h3>
      <button class="toggle ${j.config?.requiere_lecturas === false ? '' : 'on'}" id="tg-lecturas">${j.config?.requiere_lecturas === false ? 'Nivel 4 SIN exigir lecturas (modo contingencia)' : 'Nivel 4 exige ≥ 3 lecturas reales'}</button>
      <p class="ayuda" style="margin-top:6px">Solo apáguenlo si falla la red del salón. Alternativa: «Simular lectura» por equipo en la pestaña Equipos.</p>
    </div>
    <div class="card">
      <h3>${ico('clock')} Cronómetro y fase</h3>
      <label>Nombre de la fase (se ve en consolas y pantalla)</label>
      <input type="text" id="fase-label" value="${esc(j.timer_label || '')}" placeholder="Ej: Nivel 2 · Mapa lógico">
      <div class="fila" style="margin-top:10px">${[5, 10, 15, 20, 25, 30, 35, 45].map((m) => `<button class="btn chico" data-min="${m}">${m} min</button>`).join('')}<button class="btn chico peligro" data-min="0">Detener</button></div>
      <h3 style="margin-top:20px">${ico('zap')} Agenda rápida</h3>
      <p class="ayuda">Un click: pone el nombre de la fase, abre los niveles del bloque y arranca el cronómetro.</p>
      <div class="grid" style="gap:6px">${AGENDA.map((a, i) => `<button class="btn chico" style="justify-content:space-between" data-agenda="${i}"><span><span class="mono lima">${a.t}</span> · ${esc(a.titulo)}</span><span class="apagado mono">${a.dur} min</span></button>`).join('')}</div>
    </div>
    <div class="card">
      <h3>${ico('alert')} Lanzar evento caos</h3>
      <label>Evento</label>
      <select id="caos-sel">${CAOS.map((c) => `<option value="${c.clave}">${esc(c.titulo)} · +${c.xp} XP</option>`).join('')}<option value="__custom">Personalizado…</option></select>
      <div id="caos-custom" class="oculto"><label>Título</label><input type="text" id="caos-tit"><label>Descripción</label><textarea id="caos-desc"></textarea><label>XP sugerido</label><input type="number" id="caos-xp" value="40"></div>
      <div class="grid g2" style="gap:10px">
        <div><label>Para</label><select id="caos-eq"><option value="">Todos los equipos</option>${J.equipos.map((e) => `<option value="${e.id}">${esc(e.nombre)}</option>`).join('')}</select></div>
        <div><label>Minutos para responder</label><input type="number" id="caos-min" value="6" min="1" max="30"></div>
      </div>
      <button class="btn primario" style="margin-top:12px" id="btn-caos">${ico('zap')} Lanzar</button>
      <p class="ayuda" style="margin-top:8px">Úsenlo con los equipos que van adelantados o cuando el salón se enfríe. La respuesta llega a Entregas.</p>
    </div>
    <div class="card">
      <h3>${ico('radio')} Anuncio a todos</h3>
      <label>Mensaje</label><input type="text" id="an-tit" placeholder="Ej: Refrigerio en 5 minutos. El sistema sigue abierto.">
      <label>Detalle (opcional)</label><input type="text" id="an-desc">
      <button class="btn" style="margin-top:12px" id="btn-anuncio">${ico('send')} Publicar (visible 10 min)</button>
      <h3 style="margin-top:20px">${ico('clock')} Últimos eventos</h3>
      <div class="grid" style="gap:6px">${J.eventos.slice(0, 8).map((e) => `<div class="fila espacio" style="font-size:.86rem"><span><span class="chip ${e.tipo === 'caos' ? 'amarillo' : 'lima'}">${e.tipo}</span> ${esc(e.titulo)} ${e.equipo_id ? '→ ' + esc(eq(e.equipo_id).nombre) : ''}</span><span class="apagado mono">${fmtHora(e.created_at)}</span></div>`).join('') || '<div class="ayuda">Sin eventos.</div>'}</div>
    </div>
  </div>`;
  $$('[data-estado]').forEach((b) => (b.onclick = () => { if (b.dataset.estado === 'cerrada' && !confirm('¿Cerrar la jornada? Se mostrará el podio en la pantalla.')) return; set({ estado: b.dataset.estado }, 'Estado actualizado'); }));
  $$('[data-nivel]').forEach((b) => (b.onclick = () => { const n = +b.dataset.nivel; const nuevo = ab.includes(n) ? ab.filter((x) => x !== n) : [...ab, n].sort(); set({ niveles_abiertos: nuevo }); }));
  $('#tg-lecturas').onclick = () => set({ config: { requiere_lecturas: j.config?.requiere_lecturas === false } });
  $$('[data-min]').forEach((b) => (b.onclick = () => { const m = +b.dataset.min; set({ timer_label: $('#fase-label').value, timer_fin: m ? new Date(Date.now() + m * 60000).toISOString() : '' }, m ? `Cronómetro: ${m} min` : 'Cronómetro detenido'); }));
  $('#fase-label').onchange = () => set({ timer_label: $('#fase-label').value });
  $$('[data-agenda]').forEach((b) => (b.onclick = () => { const a = AGENDA[+b.dataset.agenda]; set({ estado: j.estado === 'lobby' ? 'en_juego' : j.estado, timer_label: a.titulo, niveles_abiertos: a.niveles, timer_fin: new Date(Date.now() + a.dur * 60000).toISOString() }, `Fase: ${a.titulo}`); }));
  $('#caos-sel').onchange = () => $('#caos-custom').classList.toggle('oculto', $('#caos-sel').value !== '__custom');
  $('#btn-caos').onclick = async () => {
    const k = $('#caos-sel').value; let c = CAOS.find((x) => x.clave === k);
    if (k === '__custom') c = { clave: 'custom', titulo: $('#caos-tit').value.trim(), desc: $('#caos-desc').value.trim(), xp: +$('#caos-xp').value || 40 };
    if (!c?.titulo) return toast('Falta el título', 'error');
    try { await rpc('juez_evento', { ...auth(), p_equipo: $('#caos-eq').value || null, p_tipo: 'caos', p_titulo: c.titulo, p_descripcion: c.desc, p_payload: { clave: c.clave, xp: c.xp }, p_minutos: +$('#caos-min').value || 6 }); beep('alerta'); toast('Evento caos lanzado'); await cargar(); } catch (ex) { toast(ex.message, 'error'); }
  };
  $('#btn-anuncio').onclick = async () => {
    const t = $('#an-tit').value.trim(); if (!t) return;
    try { await rpc('juez_evento', { ...auth(), p_equipo: null, p_tipo: 'anuncio', p_titulo: t, p_descripcion: $('#an-desc').value.trim(), p_payload: {}, p_minutos: 10 }); toast('Anuncio publicado'); await cargar(); } catch (ex) { toast(ex.message, 'error'); }
  };
}

// ---------------------------------------------------------------- entregas
function tabEntregas() {
  const pend = pendientes(); const hist = J.entregas.filter((x) => x.estado !== 'pendiente');
  $('#tab').innerHTML = `
    <div class="fila espacio" style="margin-bottom:12px"><h3 style="margin:0">${ico('send')} Por revisar (${pend.length})</h3><span class="ayuda">Las más antiguas primero. Rúbrica 0–10 por criterio: suma hasta 50 puntos extra.</span></div>
    <div class="grid" style="gap:14px" id="pend">${pend.slice().reverse().map(cardEntrega).join('') || '<div class="card ayuda">Nada pendiente. Buen momento para lanzar un evento caos o recorrer las mesas.</div>'}</div>
    <div class="fila espacio" style="margin:24px 0 12px"><h3 style="margin:0">Historial (${hist.length})</h3><button class="btn chico" id="tg-hist">${J.verHist ? 'Ocultar' : 'Mostrar'}</button></div>
    <div class="grid" style="gap:10px" id="hist">${J.verHist ? hist.map(cardEntrega).join('') : ''}</div>`;
  $('#tg-hist').onclick = () => { J.verHist = !J.verHist; tabEntregas(); };
  enlazarEntregas();
}

function contenidoHTML(e) {
  const c = e.contenido || {}; const n = e.nivel;
  if (e.tipo !== 'nivel') return `<div class="terminal"><pre>${esc(c.respuesta || JSON.stringify(c, null, 2))}</pre></div>`;
  if (n === 1) { const r = retoPorClave(c.reto); return `<div class="fila" style="gap:4px;margin-bottom:6px">${(c.reto === 'propio' ? [] : r?.ods || []).map(odsMini).join('')}</div>
    <p><b>Problema:</b> ${esc(c.reto === 'propio' ? `${c.propio_titulo} (propio · ODS ${c.propio_ods}) — ${c.propio_contexto}` : r?.titulo)}</p>
    <p><b>Afectados:</b> ${esc(c.afectados)}</p><p><b>Evidencia:</b> ${esc(c.evidencia)} <span class="apagado">(${esc(c.fuente)})</span></p>
    <div class="terminal"><pre>Ayudamos a ${esc(c.quien)} a ${esc(c.que)} cuando ${esc(c.cuando)} usando ${esc(c.tecnologia)}.</pre></div>`; }
  if (n === 2) return `${(c.bloques || []).map((b) => `<div class="bloque" style="border-left-color:${BLOQUES[b.tipo]?.color};padding:8px 12px;margin-bottom:4px"><div><span class="tipo" style="color:${BLOQUES[b.tipo]?.color}">${BLOQUES[b.tipo]?.nombre}</span> <b>${esc(b.opcion)}</b> <span class="suave">— ${esc(b.detalle)}</span></div></div>`).join('')}
    <p style="margin-top:8px"><b>Riesgo:</b> ${esc(c.riesgo)}<br><b>Plan B:</b> ${esc(c.plan_b)}</p>`;
  if (n === 3) return `<div class="grid g2" style="gap:10px">${c.foto ? `<a href="${esc(c.foto)}" target="_blank"><img src="${esc(c.foto)}" style="border-radius:10px;max-height:280px"></a>` : '<div class="ayuda">Sin foto</div>'}<div><p><b>Partes:</b><br>${nl(c.partes)}</p><p><b>Materiales:</b> ${esc(c.materiales)}</p><p><b>30 s:</b> ${esc(c.explicacion)}</p></div></div>`;
  if (n === 4) { const ls = J.lecturas[e.equipo_id] || []; return `<p><b>App:</b> <a href="${esc(c.app_url)}" target="_blank">${esc(c.app_url)} ↗</a></p><p><b>Muestra:</b> ${esc(c.app_que)}</p><p><b>Pruebas:</b> ${esc(c.pruebas)}</p>
    <div class="fila" style="gap:6px"><span class="chip ${ls.length >= 3 ? 'lima' : 'rojo'}">${ls.length} lecturas</span>${ls.slice(0, 5).map((l) => `<span class="chip">${esc(l.tipo)} ${l.valor ?? ''}</span>`).join('')}${ls.find((l) => l.imagen_url) ? `<a href="${esc(ls.find((l) => l.imagen_url).imagen_url)}" target="_blank"><img src="${esc(ls.find((l) => l.imagen_url).imagen_url)}" style="height:40px;border-radius:6px"></a>` : ''}</div>`; }
  if (n === 5) return `<p><b>${esc(c.nombre_proyecto)}</b> · ${esc(c.impacto)}</p><p><b>Problema:</b> ${esc(c.problema)}<br><b>Solución:</b> ${esc(c.solucion)}</p><ol style="padding-left:18px"><li>${esc(c.paso1)}</li><li>${esc(c.paso2)}</li><li>${esc(c.paso3)}</li></ol><p><b>Sigue:</b> ${esc(c.siguiente)}<br><b>Reparto:</b> ${esc(c.reparto)}</p>`;
  return `<div class="terminal"><pre>${esc(JSON.stringify(c, null, 2))}</pre></div>`;
}

function cardEntrega(e) {
  const E = eq(e.equipo_id); const pend = e.estado === 'pendiente';
  const crit = RUBRICA[e.tipo === 'nivel' ? e.nivel : e.tipo] || RUBRICA.extra;
  const titulo = e.tipo === 'nivel' ? `Nivel ${e.nivel} · ${NIVELES[e.nivel - 1].codigo} · ${NIVELES[e.nivel - 1].titulo}` : e.tipo === 'caos' ? `CAOS · ${e.contenido?.titulo || ''}` : `EXTRA · ${e.contenido?.titulo || e.ref}`;
  const sugerido = e.tipo === 'nivel' ? 30 : (e.contenido?.xp_sugerido || 40);
  return `<div class="card entrega-card ${pend ? 'lima-borde' : ''}" data-id="${e.id}">
    <div class="fila espacio" style="align-items:flex-start">
      <div class="fila" style="gap:10px">${emblemaHTML(E.emblema, E.color)}<div><b style="font-size:1.05rem">${esc(E.nombre)}</b><div class="ayuda">${esc(titulo)} · ${fmtHora(e.created_at)}${E.reto_clave ? ' · ' + esc(retoPorClave(E.reto_clave)?.titulo || '') : ''}</div></div></div>
      <span class="chip ${e.estado === 'aprobada' ? 'lima' : e.estado === 'rechazada' ? 'rojo' : 'amarillo'}">${e.estado}${e.xp_otorgado ? ' · +' + e.xp_otorgado : ''}</span>
    </div>
    <div class="contenido" style="margin-top:12px">${contenidoHTML(e)}</div>
    ${e.feedback && !pend ? `<p class="ayuda" style="margin-top:8px">Comentario: ${esc(e.feedback)}</p>` : ''}
    <details ${pend ? 'open' : ''} style="margin-top:12px"><summary class="ayuda" style="cursor:pointer">${pend ? 'Evaluar' : 'Re-evaluar'}</summary>
      <div class="grid g2" style="gap:14px;margin-top:10px">
        <div class="rubrica">${e.tipo === 'nivel' ? crit.map((c, i) => `<div class="r"><span>${esc(c)}</span><input type="range" min="0" max="10" value="6" data-r="${i}"><b class="mono lima" data-v="${i}">6</b></div>`).join('') + `<div class="fila espacio" style="margin-top:6px"><span class="ayuda">Puntos de rúbrica</span><b class="mono lima" data-total>30</b></div>` : `<label>Puntos a otorgar</label><input type="number" data-puntaje value="${sugerido}" min="0" max="200"><div class="ayuda">Sugerido: ${sugerido}. Criterios: ${crit.join(' · ').toLowerCase()}.</div>`}</div>
        <div><label>Comentario para el equipo</label><textarea data-fb placeholder="Qué estuvo bien y qué falta. Si devuelven, digan exactamente qué corregir.">${esc(pend ? '' : e.feedback || '')}</textarea>
          <div class="fila" style="margin-top:10px"><button class="btn primario" data-ok>${ico('check')} Aprobar</button><button class="btn peligro" data-no>${ico('x')} Devolver</button></div></div>
      </div></details>
  </div>`;
}

function enlazarEntregas() {
  $$('.entrega-card').forEach((card) => {
    const id = card.dataset.id;
    const rangos = $$('[data-r]', card);
    const total = () => rangos.reduce((s, r) => s + +r.value, 0);
    rangos.forEach((r) => (r.oninput = () => { $(`[data-v="${r.dataset.r}"]`, card).textContent = r.value; $('[data-total]', card).textContent = total(); }));
    const revisar = async (estado) => {
      const puntaje = rangos.length ? total() : +($('[data-puntaje]', card)?.value || 0);
      const fb = $('[data-fb]', card).value.trim();
      if (estado === 'rechazada' && !fb) return toast('Si devuelven, escriban qué corregir.', 'aviso');
      try { await rpc('juez_revisar', { ...auth(), p_entrega: id, p_estado: estado, p_puntaje: estado === 'aprobada' ? puntaje : 0, p_feedback: fb || null }); beep(estado === 'aprobada' ? 'ok' : 'err'); toast(estado === 'aprobada' ? 'Aprobada' : 'Devuelta'); await cargar(); } catch (ex) { toast(ex.message, 'error'); }
    };
    $('[data-ok]', card).onclick = () => revisar('aprobada');
    $('[data-no]', card).onclick = () => revisar('rechazada');
  });
}

// ---------------------------------------------------------------- equipos
function tabEquipos() {
  $('#tab').innerHTML = `<div class="card" style="overflow:auto">
    <div class="fila espacio" style="margin-bottom:10px"><h3 style="margin:0">${ico('users')} Equipos (${J.equipos.length})</h3><span class="ayuda">Código = acceso a la consola · Token = firmware del XIAO</span></div>
    <table><thead><tr><th>Equipo</th><th>Integrantes</th><th>Problema</th><th>Código</th><th>Token</th><th>XP</th><th>Nivel</th><th>Señal</th><th></th></tr></thead><tbody>
    ${J.equipos.map((e) => `<tr>
      <td><div class="fila" style="gap:8px;flex-wrap:nowrap">${emblemaHTML(e.emblema, e.color)}<b>${esc(e.nombre)}</b></div></td>
      <td style="font-size:.85rem">${(e.integrantes || []).map((i) => `${esc(i.nombre)} <span class="apagado">(${esc(i.rol)})</span>`).join('<br>')}</td>
      <td style="font-size:.85rem">${esc(retoPorClave(e.reto_clave)?.titulo || '—')}</td>
      <td class="mono lima">${e.codigo}</td>
      <td><button class="btn chico fantasma mono" data-copiar="${e.token}" title="Copiar token">${e.token.slice(0, 10)}… ${ico('copy')}</button></td>
      <td class="mono">${e.xp}</td><td class="mono">${Math.min(e.nivel_actual, 5)}${e.nivel_actual > 5 ? ' ✓' : ''}</td>
      <td class="mono ${(J.lecturas[e.id] || []).length ? 'lima' : 'apagado'}">${(J.lecturas[e.id] || []).length}</td>
      <td><div class="fila" style="gap:4px;flex-wrap:nowrap">
        <button class="btn chico" data-xp="${e.id}" title="Sumar o restar XP">± XP</button>
        <button class="btn chico" data-sim="${e.token}" title="Inyectar una lectura de prueba (contingencia)">Simular lectura</button>
        <button class="btn chico peligro" data-del="${e.id}" title="Eliminar equipo">${ico('trash')}</button></div></td>
    </tr>`).join('') || '<tr><td colspan="9" class="ayuda">Todavía no hay equipos. Compartan el código de la jornada.</td></tr>'}
    </tbody></table></div>`;
  $$('[data-copiar]').forEach((b) => (b.onclick = () => copiar(b.dataset.copiar, 'Token copiado')));
  $$('[data-xp]').forEach((b) => (b.onclick = async () => { const d = prompt('XP a sumar (negativo para restar):', '20'); if (d === null) return; const m = prompt('Motivo (lo verá el equipo en su historial):', 'Bonificación del jurado'); try { await rpc('juez_xp', { ...auth(), p_equipo: b.dataset.xp, p_delta: parseInt(d, 10) || 0, p_motivo: m }); toast('XP ajustado'); await cargar(); } catch (ex) { toast(ex.message, 'error'); } }));
  $$('[data-sim]').forEach((b) => (b.onclick = async () => { const v = prompt('Valor de humedad simulado (%):', String(Math.round(20 + Math.random() * 60))); if (v === null) return; try { await rpc('registrar_lectura', { p_token: b.dataset.sim, p_tipo: 'humedad', p_valor: +v, p_extra: { unidad: '%', simulada: true }, p_imagen_url: null }); toast('Lectura simulada registrada'); await cargar(); } catch (ex) { toast(ex.message, 'error'); } }));
  $$('[data-del]').forEach((b) => (b.onclick = async () => { if (!confirm(`¿Eliminar al equipo "${eq(b.dataset.del).nombre}" y todas sus entregas?`)) return; try { await rpc('juez_eliminar_equipo', { ...auth(), p_equipo: b.dataset.del }); toast('Equipo eliminado'); await cargar(); } catch (ex) { toast(ex.message, 'error'); } }));
}

// ---------------------------------------------------------------- cierre
function tabCierre() {
  const j = J.jornada; const conteo = {};
  J.votos.forEach((v) => { conteo[v.categoria] = conteo[v.categoria] || {}; conteo[v.categoria][v.votado_id] = (conteo[v.categoria][v.votado_id] || 0) + 1; });
  $('#tab').innerHTML = `<div class="grid g2">
    <div class="card">
      <h3>${ico('star')} Votación entre equipos</h3>
      <p class="suave">Estado: <b>${j.estado === 'votacion' ? 'ABIERTA' : 'cerrada'}</b> · ${J.votos.length} votos emitidos de ${J.equipos.length * 3} posibles.</p>
      <div class="fila"><button class="btn ${j.estado === 'votacion' ? '' : 'primario'}" id="v-abrir">Abrir votación</button><button class="btn" id="v-cerrar">Volver a «en juego»</button></div>
      ${Object.entries(CATEGORIAS_VOTO).map(([k, c]) => { const t = Object.entries(conteo[k] || {}).sort((a, b) => b[1] - a[1]); return `<h4 style="margin:16px 0 6px">${esc(c.nombre)}</h4>${t.length ? t.map(([id, n]) => `<div class="fila espacio" style="font-size:.9rem"><span>${esc(eq(id).nombre)}</span><b class="mono lima">${n}</b></div>`).join('') : '<div class="ayuda">Sin votos</div>'}`; }).join('')}
    </div>
    <div class="card">
      <h3>${ico('trophy')} Ranking final</h3>
      <div class="grid" style="gap:6px">${J.ranking.map((r, i) => `<div class="rank-fila ${i < 3 ? 'top' : ''}"><div class="pos">${i + 1}</div><div class="fila" style="gap:10px">${emblemaHTML(r.emblema, r.color)}<div><b>${esc(r.nombre)}</b><div class="ayuda">${r.xp} XP + ${r.votos} votos × 40</div></div></div><div class="pts">${r.total}</div></div>`).join('')}</div>
      <div class="callout aviso" style="margin-top:14px">Para desempatar o reconocer categorías, usen «± XP» en Equipos con un motivo claro. El podio en pantalla sale al pulsar «Cerrar jornada» en Control. No se publican cuántos premios hay ni cuáles son.</div>
    </div>
  </div>`;
  $('#v-abrir').onclick = () => set({ estado: 'votacion', timer_label: 'Votación', timer_fin: new Date(Date.now() + 8 * 60000).toISOString() }, 'Votación abierta (8 min)');
  $('#v-cerrar').onclick = () => set({ estado: 'en_juego' }, 'De vuelta al juego');
}

// ---------------------------------------------------------------- evidencias
function tabExportar() {
  $('#tab').innerHTML = `<div class="grid g2">
    <div class="card"><h3>${ico('download')} Descargar evidencias</h3>
      <p class="suave">Para el informe de ejecución (sección 16 de la propuesta): equipos, problema trabajado, fichas por nivel, puntajes, votos y lecturas.</p>
      <div class="fila"><button class="btn primario" id="x-json">JSON completo</button><button class="btn" id="x-csv">CSV de entregas</button><button class="btn" id="x-print">Fichas imprimibles</button></div>
    </div>
    <div class="card"><h3>${ico('book')} Resumen</h3>
      <table><tr><td>Equipos</td><td class="mono">${J.equipos.length}</td></tr><tr><td>Participantes</td><td class="mono">${J.equipos.reduce((s, e) => s + (e.integrantes || []).length, 0)}</td></tr>
      <tr><td>ODS distintos abordados</td><td class="mono">${new Set(J.equipos.flatMap((e) => retoPorClave(e.reto_clave)?.ods || [])).size}</td></tr>
      <tr><td>Equipos con circuito completo</td><td class="mono">${J.equipos.filter((e) => e.nivel_actual > 5).length}</td></tr>
      <tr><td>Equipos con señal del dispositivo</td><td class="mono">${J.equipos.filter((e) => (J.lecturas[e.id] || []).length).length}</td></tr>
      <tr><td>Entregas aprobadas / devueltas</td><td class="mono">${J.entregas.filter((x) => x.estado === 'aprobada').length} / ${J.entregas.filter((x) => x.estado === 'rechazada').length}</td></tr></table>
    </div></div>
    <div id="print" class="print-only"></div>`;
  const descargar = (nombre, contenido, tipo) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenido], { type: tipo })); a.download = nombre; a.click(); };
  const slug = J.jornada.nombre.replace(/[^a-z0-9]+/gi, '_');
  $('#x-json').onclick = () => descargar(`evidencias_${slug}.json`, JSON.stringify({ jornada: J.jornada, equipos: J.equipos.map(({ token, ...e }) => e), entregas: J.entregas, votos: J.votos, ranking: J.ranking, eventos: J.eventos, lecturas: J.lecturas }, null, 2), 'application/json');
  $('#x-csv').onclick = () => {
    const f = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    const filas = [['equipo', 'problema', 'tipo', 'nivel', 'ref', 'estado', 'puntaje', 'xp_otorgado', 'feedback', 'enviado', 'contenido'].join(',')];
    J.entregas.forEach((e) => { const E = eq(e.equipo_id); filas.push([E.nombre, retoPorClave(E.reto_clave)?.titulo || '', e.tipo, e.nivel ?? '', e.ref, e.estado, e.puntaje, e.xp_otorgado, e.feedback, e.created_at, JSON.stringify(e.contenido)].map(f).join(',')); });
    descargar(`entregas_${slug}.csv`, '﻿' + filas.join('\n'), 'text/csv;charset=utf-8');
  };
  $('#x-print').onclick = () => {
    $('#print').innerHTML = J.equipos.map((E) => {
      const r = retoPorClave(E.reto_clave); const ent = (n) => J.entregas.find((x) => x.equipo_id === E.id && x.tipo === 'nivel' && x.nivel === n);
      return `<div style="page-break-after:always;font-family:Arial;color:#111"><h2 style="color:#7E9400">Ficha de reto ODS · ${esc(E.nombre)}</h2><p><b>Jornada:</b> ${esc(J.jornada.nombre)} · <b>Integrantes:</b> ${(E.integrantes || []).map((i) => `${esc(i.nombre)} (${esc(i.rol)})`).join(', ')}</p><p><b>Problema:</b> ${esc(r?.titulo || '')} · ODS ${(r?.ods || []).join(', ')} · <b>XP:</b> ${E.xp}</p>
        ${[1, 2, 3, 4, 5].map((n) => { const e = ent(n); return `<h3 style="margin:14px 0 4px">Nivel ${n} · ${NIVELES[n - 1].titulo} — ${e ? e.estado + (e.puntaje ? ` (${e.puntaje}/50)` : '') : 'sin entrega'}</h3>${e ? contenidoHTML(e).replace(/<img[^>]*>/g, '[foto]') : ''}${e?.feedback ? `<p><i>Control: ${esc(e.feedback)}</i></p>` : ''}`; }).join('')}</div>`;
    }).join('');
    window.print();
  };
}
