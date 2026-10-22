// =====================================================================
//  CIRCUITO ODS · Pantalla para el videobeam
// =====================================================================
const P = { codigo: (new URLSearchParams(location.search).get('j') || localStorage.getItem('ods_pantalla') || '').toUpperCase(), j: null, equipos: [], entregas: [], eventos: [], votos: [], ranking: [], timer: null, vistos: new Set(), inicio: Date.now() };
$('#fs').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());

if (!P.codigo) {
  $('#root').innerHTML = `<div class="estrecho" style="grid-column:1/-1;align-self:center"><div class="card lima-borde centro"><span class="eyebrow">Pantalla</span><h2>Código de la jornada</h2><form id="f"><input class="codigo" id="c" maxlength="6" type="text" required><button class="btn primario bloque" style="margin-top:14px">Mostrar</button></form></div></div>`;
  $('#f').onsubmit = (e) => { e.preventDefault(); location.search = '?j=' + $('#c').value.trim().toUpperCase(); };
} else { localStorage.setItem('ods_pantalla', P.codigo); arrancar(); }

async function cargar() {
  const { data: j, error } = await sb.from('jornadas').select('*').eq('codigo', P.codigo).maybeSingle();
  if (error || !j) { $('#root').innerHTML = `<div class="card centro" style="grid-column:1/-1;align-self:center"><h2>Jornada no encontrada</h2><p class="suave">Revisa el código: ${esc(P.codigo)}</p><a class="btn" href="pantalla.html">Cambiar</a></div>`; localStorage.removeItem('ods_pantalla'); return; }
  P.j = j;
  const [eq, rk, ev, vt] = await Promise.all([
    sb.from('equipos').select('*').eq('jornada_id', j.id).order('created_at'),
    sb.from('ranking').select('*').eq('jornada_id', j.id).order('total', { ascending: false }),
    sb.from('eventos').select('*').eq('jornada_id', j.id).order('created_at', { ascending: false }).limit(30),
    sb.from('votos').select('id').eq('jornada_id', j.id),
  ]);
  P.equipos = eq.data || []; P.ranking = rk.data || []; P.eventos = ev.data || []; P.votos = vt.data || [];
  const ids = P.equipos.map((e) => e.id);
  P.entregas = ids.length ? (await sb.from('entregas').select('id,equipo_id,tipo,nivel,estado,xp_otorgado,created_at,revisado_en').in('equipo_id', ids)).data || [] : [];
  render();
}

function render() {
  const j = P.j; const root = $('#root');
  const cab = `<div class="pantalla-cab">
    <div class="fila" style="gap:16px"><span class="logo-confa" style="font-size:1.8rem">Confa<small>Contigo, con todo</small></span><span class="sep" style="width:1px;height:36px;background:var(--borde-fuerte)"></span><div><div class="eyebrow" style="margin:0">Circuito ODS · ${esc(j.nombre)}</div><h2 style="margin:0">${esc(j.estado === 'lobby' ? 'Registro de equipos' : j.estado === 'votacion' ? 'Votación abierta' : j.estado === 'cerrada' ? 'Resultados' : (j.timer_label || 'En juego'))}</h2></div></div>
    <div class="fila" style="gap:24px"><div class="centro"><div class="timer-grande" id="timer">--:--</div></div><div class="terminal centro" style="padding:8px 18px"><div class="apagado" style="font-size:.62rem;letter-spacing:.2em">CÓDIGO</div><div style="font-size:1.6rem;letter-spacing:.3em;color:var(--lima);font-weight:700">${j.codigo}</div></div></div>
  </div>`;
  let cuerpo = '';
  if (j.estado === 'lobby') cuerpo = lobby();
  else if (j.estado === 'cerrada') cuerpo = cierre();
  else cuerpo = juego();
  root.innerHTML = cab + cuerpo + ticker();
  if (j.estado === 'lobby' && window.QRCode) { const q = $('#qr'); if (q) { q.innerHTML = ''; new QRCode(q, { text: CONFIG.BASE_URL + 'index.html#registrar', width: 150, height: 150 }); } }
  clearInterval(P.timer); P.timer = iniciarTimer(() => P.j.timer_fin, $('#timer'), { vacio: '--:--', fin: '¡TIEMPO!' });
  revisarCaos();
}

function lobby() {
  return `<div class="card centro" style="grid-column:1/-1;display:flex;flex-direction:column;justify-content:center;gap:18px">
    <span class="eyebrow" style="justify-content:center">Entren desde cualquier celular</span>
    <h1 style="font-size:clamp(1.6rem,4vw,3rem)">1. Escaneen o entren a <span class="resaltado">${esc(CONFIG.BASE_URL.replace(/^https?:\/\//, ''))}</span></h1>
    <div class="fila" style="justify-content:center;gap:40px;align-items:center">
      <div id="qr"></div>
      <div style="text-align:left"><h2 style="margin:0">2. «Registrar equipo»</h2><p class="suave" style="font-size:1.2rem">Código de la jornada: <b class="mono lima" style="font-size:1.6rem;letter-spacing:.2em">${P.j.codigo}</b></p><h2 style="margin:0">3. Nombre, emblema y 4 roles</h2><p class="suave" style="font-size:1.1rem">Líder · Hardware · Software · Comunicador</p></div>
    </div>
    <div class="lobby-equipos">${P.equipos.map((e) => `<div class="e">${emblemaHTML(e.emblema, e.color)}${esc(e.nombre)}</div>`).join('') || '<span class="ayuda">Esperando al primer equipo…</span>'}</div>
    <div class="apagado mono" style="font-size:.8rem">${P.equipos.length} equipos registrados · hay premios para los mejores equipos</div>
  </div>`;
}

function juego() {
  const estadoCelda = (eqId, n) => { const e = P.entregas.find((x) => x.equipo_id === eqId && x.tipo === 'nivel' && x.nivel === n); if (e) return e.estado; return (P.j.niveles_abiertos || []).includes(n) ? 'abierto' : ''; };
  const txt = { aprobada: '✓', pendiente: '…', rechazada: '↺', abierto: '', '': '' };
  return `
  <div class="card" style="overflow:hidden;display:flex;flex-direction:column">
    <span class="eyebrow">Ranking en vivo</span>
    <div class="grid" style="gap:8px;overflow:auto">${P.ranking.slice(0, 10).map((r, i) => `
      <div class="rank-fila ${i < 3 ? 'top' : ''}"><div class="pos">${i + 1}</div>
        <div class="fila" style="gap:12px">${emblemaHTML(r.emblema, r.color)}<div><b style="font-size:1.15rem">${esc(r.nombre)}</b><div class="ayuda">${esc(retoPorClave(r.reto_clave)?.titulo || 'sin problema elegido')} · ${r.votos ? r.votos + ' votos' : ''}</div></div></div>
        <div class="pts" style="font-size:1.5rem">${r.total}</div></div>`).join('') || '<div class="ayuda">Aún no hay equipos.</div>'}</div>
    ${P.j.estado === 'votacion' ? `<div class="callout" style="margin-top:12px"><b>Votación abierta.</b> Cada equipo vota en su consola por 3 categorías. ${P.votos.length} votos emitidos.</div>` : ''}
  </div>
  <div class="card" style="overflow:auto">
    <div class="fila espacio"><span class="eyebrow">Estado del circuito</span><span class="apagado mono" style="font-size:.7rem">✓ aprobado · … en revisión · ↺ devuelto</span></div>
    <div class="matriz">
      <div class="mf"><span></span>${NIVELES.map((n) => `<span class="centro mono" style="font-size:.7rem;color:${(P.j.niveles_abiertos || []).includes(n.n) ? 'var(--lima)' : 'var(--texto-apagado)'}">${n.codigo}</span>`).join('')}</div>
      ${P.equipos.map((e) => `<div class="mf"><div class="fila" style="gap:8px;flex-wrap:nowrap;min-width:0">${emblemaHTML(e.emblema, e.color)}<b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.nombre)}</b></div>${[1, 2, 3, 4, 5].map((n) => { const s = estadoCelda(e.id, n); return `<div class="celda ${s}">${txt[s]}</div>`; }).join('')}</div>`).join('')}
    </div>
  </div>`;
}

function cierre() {
  const top = P.ranking.slice(0, 3);
  return `<div class="card centro" style="grid-column:1/-1;display:flex;flex-direction:column;justify-content:center;gap:20px">
    <span class="eyebrow" style="justify-content:center">Circuito completado</span>
    <h1 style="font-size:clamp(2rem,5vw,4rem)">${ico('trophy')} Podio</h1>
    <div class="podio" style="max-width:900px;margin:0 auto;width:100%">${top.map((r, i) => `<div class="p ${['uno', 'dos', 'tres'][i]}">${emblemaHTML(r.emblema, r.color, true)}<div style="font-family:var(--display);font-size:3rem;font-weight:800;color:var(--lima)">#${i + 1}</div><b style="font-size:1.3rem">${esc(r.nombre)}</b><div class="ayuda">${esc(retoPorClave(r.reto_clave)?.titulo || '')}</div><div class="pts mono lima" style="font-size:1.4rem">${r.total} pts</div></div>`).join('')}</div>
    <div class="fila" style="justify-content:center;gap:8px">${P.ranking.slice(3).map((r, i) => `<span class="chip">#${i + 4} ${esc(r.nombre)} · ${r.total}</span>`).join('')}</div>
    <p class="suave" style="font-size:1.2rem">Hay premios para los mejores equipos. Gracias por hackear un problema real de Colombia.</p>
  </div>`;
}

function ticker() {
  const items = [];
  P.entregas.filter((e) => e.estado === 'aprobada' && e.revisado_en).sort((a, b) => new Date(b.revisado_en) - new Date(a.revisado_en)).slice(0, 8).forEach((e) => { const E = P.equipos.find((x) => x.id === e.equipo_id); if (E) items.push(`✓ ${E.nombre} aprobó ${e.tipo === 'nivel' ? 'el nivel ' + e.nivel : e.tipo === 'caos' ? 'un evento caos' : 'una misión extra'} (+${e.xp_otorgado} XP)`); });
  P.eventos.slice(0, 5).forEach((e) => items.push(`${e.tipo === 'caos' ? '⚡ CAOS' : '📢'} ${e.titulo}${e.equipo_id ? ' → ' + (P.equipos.find((x) => x.id === e.equipo_id)?.nombre || '') : ''}`));
  if (!items.length) items.push('Cinco niveles. Para avanzar hay que pasar. Hay premios para los mejores equipos.');
  return `<div class="ticker"><span>${items.map(esc).join('   ·   ')}</span></div>`;
}

function revisarCaos() {
  const nuevos = P.eventos.filter((e) => e.tipo === 'caos' && !P.vistos.has(e.id) && new Date(e.created_at) > P.inicio - 5000 && (!e.expira_en || new Date(e.expira_en) > Date.now()));
  P.eventos.forEach((e) => P.vistos.add(e.id));
  if (!nuevos.length) return;
  const e = nuevos[0]; beep('alerta');
  const E = e.equipo_id ? P.equipos.find((x) => x.id === e.equipo_id) : null;
  $('#overlay').innerHTML = `<div class="overlay"><div class="card centro" style="border-color:var(--amarillo);max-width:900px"><span class="eyebrow" style="color:var(--amarillo);justify-content:center">Evento caos ${E ? '· solo para ' + esc(E.nombre) : '· todos los equipos'}</span><div class="caos-titulo" style="font-size:clamp(2rem,7vw,5rem)">${esc(e.titulo)}</div><p style="font-size:1.4rem">${esc(e.descripcion || '')}</p><p class="ayuda" style="font-size:1rem">Respondan desde la consola antes de las ${e.expira_en ? fmtHora(e.expira_en) : '—'}.</p></div></div>`;
  setTimeout(() => ($('#overlay').innerHTML = ''), 12000);
}

async function arrancar() {
  await cargar(); if (!P.j) return;
  suscribir('pantalla-' + P.j.id, [{ table: 'jornadas', filter: `id=eq.${P.j.id}` }, { table: 'equipos', filter: `jornada_id=eq.${P.j.id}` }, 'entregas', { table: 'eventos', filter: `jornada_id=eq.${P.j.id}` }, { table: 'votos', filter: `jornada_id=eq.${P.j.id}` }], cargar);
}
