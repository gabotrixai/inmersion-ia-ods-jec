// =====================================================================
//  CIRCUITO ODS · Utilidades compartidas
// =====================================================================
(function () {
  const C = window.CONFIG;
  window.sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 5 } } });

  // ---------- Iconos SVG (trazo) ----------
  const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  window.ICONOS = {
    bolt: P('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'),
    cpu: P('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>'),
    leaf: P('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
    drop: P('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'),
    shield: P('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    rocket: P('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'),
    eye: P('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
    radio: P('<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>'),
    flame: P('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    globe: P('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
    wave: P('<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0M2 6c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>'),
    check: P('<path d="M20 6 9 17l-5-5"/>'),
    x: P('<path d="M18 6 6 18M6 6l12 12"/>'),
    lock: P('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    unlock: P('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
    key: P('<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>'),
    copy: P('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    camera: P('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
    send: P('<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>'),
    alert: P('<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'),
    clock: P('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    trophy: P('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>'),
    monitor: P('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    settings: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    users: P('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
    book: P('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    trash: P('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>'),
    refresh: P('<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>'),
    star: P('<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'),
    download: P('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
    link: P('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
    map: P('<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16M16 6v16"/>'),
    box: P('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12"/>'),
    mic: P('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>'),
    wifi: P('<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>'),
    zap: P('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'),
  };
  window.ico = (n, cls = '') => `<span class="ico ${cls}" style="display:inline-flex;width:1em;height:1em;vertical-align:-.15em">${ICONOS[n] || ICONOS.bolt}</span>`;

  // ---------- Helpers DOM ----------
  window.$ = (s, r = document) => r.querySelector(s);
  window.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  window.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  window.nl = (s) => esc(s).replace(/\n/g, '<br>');
  window.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.ahora = () => new Date();
  window.fmtHora = (d) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  window.fmtMMSS = (seg) => { seg = Math.max(0, Math.round(seg)); const m = Math.floor(seg / 60), s = seg % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
  window.odsChip = (n) => { const o = ODS[n]; return o ? `<span class="ods-chip" style="background:${o.color}">ODS ${n} · ${esc(o.nombre)}</span>` : ''; };
  window.odsMini = (n) => { const o = ODS[n]; return o ? `<span class="ods-chip" style="background:${o.color}" title="${esc(o.nombre)}">ODS ${n}</span>` : ''; };
  window.emblemaHTML = (e, color, grande = false) => `<span class="emblema ${grande ? 'grande' : ''}" style="background:${esc(color || '#A9C719')}">${ICONOS[e] || ICONOS.bolt}</span>`;
  window.retoPorClave = (k) => (k === 'propio' ? RETO_PROPIO : RETOS.find((r) => r.clave === k)) || null;

  // ---------- Toasts ----------
  let zona;
  window.toast = (msg, tipo = '') => {
    if (!zona) { zona = document.createElement('div'); zona.className = 'toast-zona'; document.body.appendChild(zona); }
    const t = document.createElement('div'); t.className = `toast ${tipo}`; t.innerHTML = msg; zona.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, tipo === 'error' ? 6000 : 3800);
  };
  window.copiar = async (texto, aviso = 'Copiado') => { try { await navigator.clipboard.writeText(texto); toast(aviso); } catch { prompt('Copia el texto:', texto); } };

  // ---------- RPC con manejo de error ----------
  window.rpc = async (fn, args) => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) { const m = (error.message || '').replace(/^.*?:\s*/, ''); throw new Error(m || 'Error de conexión'); }
    return data;
  };

  // ---------- Encabezado / pie ----------
  window.pintarBarra = (activo) => {
    const el = $('#barra'); if (!el) return;
    const links = [
      ['index.html', 'Inicio'], ['equipo.html', 'Mi equipo'], ['pantalla.html', 'Pantalla'], ['juez.html', 'Control'], ['hardware.html', 'Hardware'], ['guia.html', 'Guía'],
    ];
    el.className = 'barra';
    el.innerHTML = `<div class="contenedor">
      <a class="marca" href="index.html" style="text-decoration:none">
        <span class="logo-confa">Confa<small>Contigo, con todo</small></span>
        <span class="sep"></span>
        <span class="nombre">Circuito <b>ODS</b></span>
      </a>
      <nav>${links.map(([h, t]) => `<a href="${h}" class="${activo === h ? 'activo' : ''}">${t}</a>`).join('')}</nav>
    </div>`;
  };
  window.pintarPie = () => {
    const el = $('#pie'); if (!el) return;
    el.className = 'pie';
    el.innerHTML = `<div class="contenedor">
      <div><span class="logo-confa" style="font-size:1.1rem">Confa<small>Contigo, con todo</small></span></div>
      <div class="suave">Confa Educación · Jornada Escolar Complementaria · Diplomado de IA Aplicada y Prototipado · Manizales, Caldas</div>
      <div class="lema">Jornada de inmersión · Retos con impacto en los ODS</div>
    </div>`;
  };

  // ---------- Timer de jornada ----------
  window.iniciarTimer = (getFin, el, opciones = {}) => {
    const tick = () => {
      const fin = getFin();
      if (!fin) { el.textContent = opciones.vacio ?? '--:--'; el.classList.remove('alerta', 'critico'); return; }
      const seg = (new Date(fin) - Date.now()) / 1000;
      el.textContent = seg <= 0 ? (opciones.fin ?? '00:00') : fmtMMSS(seg);
      el.classList.toggle('alerta', seg > 0 && seg <= 300);
      el.classList.toggle('critico', seg > 0 && seg <= 60);
    };
    tick(); return setInterval(tick, 500);
  };

  // ---------- Realtime (con repliegue a sondeo) ----------
  window.suscribir = (nombre, tablas, cb) => {
    let canal = sb.channel(nombre);
    let deb;
    const avisar = (p) => { clearTimeout(deb); deb = setTimeout(() => cb(p), 250); };
    tablas.forEach((t) => {
      const filtro = typeof t === 'string' ? { table: t } : t;
      canal = canal.on('postgres_changes', { event: '*', schema: 'public', ...filtro }, avisar);
    });
    canal.subscribe();
    const sondeo = setInterval(() => cb({ sondeo: true }), 20000);
    return () => { clearInterval(sondeo); sb.removeChannel(canal); };
  };

  // ---------- Imágenes: comprimir antes de subir ----------
  window.comprimirImagen = (file, max = 1400, calidad = 0.82) => new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const esc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => { URL.revokeObjectURL(url); b ? res(b) : rej(new Error('No se pudo procesar la imagen')); }, 'image/jpeg', calidad);
    };
    img.onerror = () => rej(new Error('Archivo de imagen no válido'));
    img.src = url;
  });
  window.subirImagen = async (file, ruta) => {
    // Si el navegador no puede decodificar la imagen (p. ej. HEIC), se sube el archivo original si es imagen y pesa menos de 8 MB
    let blob;
    try { blob = await comprimirImagen(file); }
    catch (e) { if (/^image\//.test(file.type) && file.size < 8 * 1024 * 1024) blob = file; else throw e; }
    const { error } = await sb.storage.from('entregas').upload(ruta, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw new Error('No se pudo subir la foto: ' + error.message);
    return sb.storage.from('entregas').getPublicUrl(ruta).data.publicUrl + '?v=' + Date.now();
  };

  // ---------- Sesión local ----------
  window.sesion = {
    get equipo() { return localStorage.getItem('ods_equipo') || ''; },
    set equipo(v) { v ? localStorage.setItem('ods_equipo', v) : localStorage.removeItem('ods_equipo'); },
    get juez() { try { return JSON.parse(localStorage.getItem('ods_juez') || 'null'); } catch { return null; } },
    set juez(v) { v ? localStorage.setItem('ods_juez', JSON.stringify(v)) : localStorage.removeItem('ods_juez'); },
  };

  // ---------- Sonidos cortos (WebAudio, sin archivos) ----------
  let ctx;
  window.beep = (tipo = 'ok') => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime;
      if (tipo === 'ok') { o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(990, t + .09); }
      else if (tipo === 'err') { o.frequency.setValueAtTime(220, t); o.frequency.setValueAtTime(160, t + .12); }
      else { o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(880, t + .08); o.frequency.setValueAtTime(440, t + .16); }
      g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.start(t); o.stop(t + .32);
    } catch { /* sin audio */ }
  };
})();
