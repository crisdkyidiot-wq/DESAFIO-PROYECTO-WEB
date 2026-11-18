const SESSION_KEY = 'simtele_session_v1';
const HOY = new Date(2026, 10, 18);
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const fmtDate = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
const soloDia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const mismaFecha = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const esPasada = d => soloDia(d) < soloDia(HOY);

const MODULOS = {
    home: { num: '00', title: 'Resumen General', tag: 'MI TELEFÉRICO' },
    m1: { num: '01', title: 'Detención de emergencia', tag: 'd = (v/3.6)·t' },
    m2: { num: '02', title: 'Mantenimiento programado', tag: 'Componentes + ventanas' },
    m3: { num: '03', title: 'Viento y oscilación', tag: '5 mediciones' },
    m4: { num: '04', title: 'Registro de sensores', tag: '/^SEN-\\d{3}$/' }
};

let mantenimientos = [];
let selInicio = null, selFin = null;
let mesActual = HOY.getMonth(), anioActual = HOY.getFullYear();
let colorActualHex = "#388e3c";
const coloresLineas = { 'verde':'#388e3c', 'roja':'#d32f2f', 'amarilla':'#fbc02d', 'azul':'#1976d2', 'celeste':'#0288d1', 'morada':'#7b1fa2', 'naranja':'#f57c00', 'blanca':'#eeeeee' };

// Claves de historial
const HIST_M1_KEY = 'simtele_hist_m1';
const HIST_M3_KEY = 'simtele_hist_m3';

document.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) { window.location.href = 'index.html'; return; }
    const user = JSON.parse(session);
    document.getElementById('userNameDisplay').textContent = user.name;
    document.getElementById('welcomeName').textContent = user.name;

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'index.html';
    });

    const reloj = document.getElementById('reloj');
    document.getElementById('fechaHoy').textContent = fmtDate(HOY);
    setInterval(() => {
        const n = new Date();
        reloj.textContent = [n.getHours(),n.getMinutes(),n.getSeconds()].map(v=>String(v).padStart(2,'0')).join(':');
    }, 1000);

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.mod').forEach(mod => mod.hidden = mod.id !== target);
            const meta = MODULOS[target];
            document.getElementById('eyebrow').textContent = `Módulo ${meta.num}`;
            document.getElementById('tituloModulo').textContent = meta.title;
            document.getElementById('headTag').textContent = meta.tag;
            document.getElementById('viewport').scrollTop = 0;
        });
    });

    initDetencion();
    initMantenimiento();
    initViento();
    initSensores();
});

// --- MÓDULO 1: DETENCIÓN (CON HISTORIAL) ---
function initDetencion() {
    const form = document.getElementById('formDetencion');
    const out = document.getElementById('resultadoDetencion');
    if(!form) return;

    renderHistorialM1(); // Render inicial del historial

    form.addEventListener('submit', e => {
        e.preventDefault();
        const v = parseFloat(document.getElementById('velocidad').value);
        const t = parseFloat(document.getElementById('reaccion').value);
        if(isNaN(v) || isNaN(t) || v <= 0 || v > 80 || t <= 0 || t > 5) {
            out.hidden = false;
            out.innerHTML = `<div class="msg-line danger">⚠ Ingresa valores válidos (Vel: 1-80, Tiempo: 0.1-5).</div>`;
            return;
        }
        const d = (v / 3.6) * t;
        let nivel, clase, msg;
        if(d > 50){ nivel='ALTO'; clase='danger'; msg='Distancia ALTA. Aviso didáctico.'; }
        else if(d > 25){ nivel='MEDIO'; clase='warn'; msg='Distancia MEDIA.'; }
        else { nivel='BAJO'; clase='ok'; msg='Distancia dentro de parámetros bajos.'; }

        out.hidden = false;
        out.innerHTML = `
            <h3>Resultado</h3>
            <div class="result-grid">
                <div class="metric"><span class="metric-label">Distancia</span><span class="metric-value ${clase}">${d.toFixed(2)} m</span></div>
                <div class="metric"><span class="metric-label">Nivel</span><span class="metric-value ${clase}">${nivel}</span></div>
                <div class="metric"><span class="metric-label">Velocidad</span><span class="metric-value">${v} km/h</span></div>
                <div class="metric"><span class="metric-label">Reacción</span><span class="metric-value">${t} s</span></div>
            </div>
            <div class="msg-line ${clase}">${msg}</div>`;

        // Guardar en historial
        guardarHistorial('m1', { fecha: new Date().toLocaleString(), v, t, d, nivel });
        renderHistorialM1();
    });
}

function renderHistorialM1() {
    const tbody = document.getElementById('historialM1');
    if (!tbody) return;
    const hist = JSON.parse(localStorage.getItem(HIST_M1_KEY)) || [];
    tbody.innerHTML = '';
    if (hist.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Sin simulaciones registradas.</td></tr>`;
        return;
    }
    hist.slice().reverse().forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-size:10px">${h.fecha}</td><td>${h.v} km/h</td><td>${h.t} s</td><td>${h.d.toFixed(2)} m</td><td>${h.nivel}</td>`;
        tbody.appendChild(tr);
    });
}

// --- MÓDULO 2: MANTENIMIENTO (Lógica intacta, ya tiene su propia tabla) ---
function initMantenimiento() {
    const saved = localStorage.getItem('simtele_mantenimientos_v2');
    if(saved) {
        try { mantenimientos = JSON.parse(saved).map(m => ({ ...m, inicio: new Date(m.inicio), fin: new Date(m.fin) })); } 
        catch(e) { mantenimientos = []; }
    }
    const form = document.getElementById('formMantenimiento');
    if(!form) return;

    document.getElementById('selectLinea').addEventListener('change', () => {
        colorActualHex = coloresLineas[document.getElementById('selectLinea').value];
        generarCalendario();
    });

    generarCalendario();
    renderizarTabla();

    form.addEventListener('submit', agregarTarea);
    document.getElementById('btnMesPrev').addEventListener('click', () => cambiarMes(-1));
    document.getElementById('btnMesNext').addEventListener('click', () => cambiarMes(1));
    document.getElementById('btnLimpiarRango').addEventListener('click', limpiarSeleccion);
}

function generarCalendario(){
    const cont = document.getElementById("calendario");
    if(!cont) return;
    cont.innerHTML = "";
    document.getElementById("mesAnioTexto").textContent = `${MESES[mesActual]} ${anioActual}`;
    ["Lu","Ma","Mi","Ju","Vi","Sá","Do"].forEach(d=>{ cont.innerHTML += `<div class="calendar-header">${d}</div>`; });

    const primerDia = new Date(anioActual, mesActual, 1);
    let offset = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
    for(let i=0;i<offset;i++) cont.innerHTML += `<div class="calendar-day empty"></div>`;

    const diasEnMes = new Date(anioActual, mesActual+1, 0).getDate();
    for(let dia=1; dia<=diasEnMes; dia++){
        const fecha = new Date(anioActual, mesActual, dia);
        let clases = "calendar-day";
        if(esPasada(fecha)) clases += " disabled";

        let tieneTarea = false;
        mantenimientos.forEach(m=>{ if(fecha >= m.inicio && fecha <= m.fin) tieneTarea = true; });
        if(tieneTarea) clases += " has-task";

        if(selInicio && selFin){ if(fecha >= selInicio && fecha <= selFin) clases += " in-range"; }
        else if(selInicio && mismaFecha(fecha, selInicio)){ clases += " in-range"; }
        if(selInicio && mismaFecha(fecha, selInicio)) clases += " start-day";
        if(selFin && mismaFecha(fecha, selFin)) clases += " end-day";

        const style = (selInicio && selFin && fecha >= selInicio && fecha <= selFin) ? `background-color: ${colorActualHex}33;` : '';
        const onclick = esPasada(fecha) ? "" : `onclick="clickDia(${anioActual}, ${mesActual}, ${dia})"`;
        cont.innerHTML += `<div class="${clases}" style="${style}" ${onclick}>${dia}</div>`;
    }
}

function cambiarMes(delta){
    mesActual += delta;
    if(mesActual < 0){ mesActual = 11; anioActual--; }
    else if(mesActual > 11){ mesActual = 0; anioActual++; }
    generarCalendario();
}

window.clickDia = function(anio, mes, dia){
    const fecha = new Date(anio, mes, dia);
    if(selInicio === null){ selInicio = fecha; selFin = null; actualizarInfoSeleccion(); }
    else if(selFin === null){
        if(fecha < selInicio){ selFin = selInicio; selInicio = fecha; } else { selFin = fecha; }
        actualizarInfoSeleccion();
        document.getElementById("btnAddComp").disabled = false;
    } else {
        selInicio = fecha; selFin = null; document.getElementById("btnAddComp").disabled = true; actualizarInfoSeleccion();
    }
    generarCalendario();
};

function actualizarInfoSeleccion(){
    const info = document.getElementById("infoSeleccion");
    if(!info) return;
    if(selInicio && selFin){
        const dias = Math.round((soloDia(selFin) - soloDia(selInicio)) / 86400000) + 1;
        info.innerHTML = `› Rango: <b>${fmtDate(selInicio)}</b> → <b>${fmtDate(selFin)}</b> · ${dias} día${dias===1?'':'s'}`;
    } else if(selInicio){ info.innerHTML = `› Inicio: <b>${fmtDate(selInicio)}</b>. Elige el día de fin.`; }
    else { info.innerHTML = "› Sin rango seleccionado."; }
}

function limpiarSeleccion(){
    selInicio = null; selFin = null; document.getElementById("btnAddComp").disabled = true;
    actualizarInfoSeleccion(); generarCalendario();
}

function agregarTarea(e) {
    e.preventDefault();
    const componente = document.getElementById("componente").value.trim();
    const horas = parseInt(document.getElementById("horasUso").value, 10);
    const estado = document.getElementById("estadoComp").value;
    const linea = document.getElementById("selectLinea").value;

    if(!componente){ alert('Ingresa el nombre del componente.'); return; }
    if(isNaN(horas) || horas < 0){ alert('Horas de uso inválidas.'); return; }
    if(!estado){ alert('Selecciona un estado.'); return; }
    if(!(selInicio && selFin)){ alert('Selecciona una ventana en el calendario.'); return; }

    mantenimientos.push({ id: Date.now(), componente, horas, estado, linea, inicio: selInicio, fin: selFin, completada: false });
    localStorage.setItem('simtele_mantenimientos_v2', JSON.stringify(mantenimientos));
    document.getElementById("formMantenimiento").reset();
    limpiarSeleccion(); renderizarTabla();
}

function renderizarTabla() {
    const tbody = document.getElementById("tablaMantenimiento");
    const counter = document.getElementById("contadorComp");
    if(!tbody) return;
    tbody.innerHTML = "";
    counter.textContent = `${mantenimientos.length} reg.`;
    if(mantenimientos.length === 0){ tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Sin registros todavía.</td></tr>`; return; }

    mantenimientos.slice().sort((a,b)=>a.inicio-b.inicio).forEach(m => {
        const estadoTxt = m.estado === 'normal' ? 'Normal' : m.estado === 'revision' ? 'Revisión' : 'Urgente';
        const colorLinea = coloresLineas[m.linea] || '#388e3c';
        const nombreLinea = m.linea ? (m.linea.charAt(0).toUpperCase() + m.linea.slice(1)) : '—';
        const tachado = m.completada ? 'text-decoration: line-through; opacity: 0.6;' : '';
        const checkBtn = m.completada ? '' : `<button type="button" class="btn btn-success btn-sm" onclick="completarTarea(${m.id})" title="Marcar como realizada">✔</button>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="${tachado}">${m.componente}</td>
            <td><span style="display:inline-block;width:8px;height:8px;background:${colorLinea};border:1px solid var(--ink);margin-right:6px;vertical-align:middle;"></span><span style="${tachado}">${nombreLinea}</span></td>
            <td style="${tachado}; font-family:'JetBrains Mono',monospace;font-size:11px">${m.horas} h</td>
            <td><span class="state-pill ${m.estado}" style="${tachado}">${estadoTxt}</span></td>
            <td style="${tachado}; font-family:'JetBrains Mono',monospace;font-size:10px">${fmtDate(m.inicio)}<br>→ ${fmtDate(m.fin)}</td>
            <td style="white-space:nowrap;">${checkBtn}<button type="button" class="btn btn-danger btn-sm" onclick="eliminarMantenimiento(${m.id})" title="Eliminar">✕</button></td>`;
        tbody.appendChild(tr);
    });
}

window.completarTarea = function(id) {
    const t = mantenimientos.find(m => m.id === id);
    if(t) { t.completada = true; localStorage.setItem('simtele_mantenimientos_v2', JSON.stringify(mantenimientos)); renderizarTabla(); }
};

window.eliminarMantenimiento = function(id) {
    mantenimientos = mantenimientos.filter(m => m.id !== id);
    localStorage.setItem('simtele_mantenimientos_v2', JSON.stringify(mantenimientos));
    renderizarTabla(); generarCalendario();
};

// --- MÓDULO 3: VIENTO (CON HISTORIAL) ---
function initViento() {
    const form = document.getElementById('formViento');
    const out = document.getElementById('resultadoViento');
    if(!form) return;

    renderHistorialM3(); // Render inicial del historial

    form.addEventListener('submit', e => {
        e.preventDefault();
        const vals = [];
        for(let i=1;i<=5;i++) {
            const val = parseFloat(document.getElementById('w'+i).value);
            if(isNaN(val) || val < 0 || val > 200) {
                out.hidden = false; out.innerHTML = `<div class="msg-line danger">⚠ Medición ${i} inválida (0–200 km/h).</div>`; return;
            }
            vals.push(val);
        }
        let suma = 0, maximo = vals[0];
        vals.forEach(v => { suma += v; if(v > maximo) maximo = v; });
        const prom = suma / vals.length;
        let clasif, clase;
        if(prom < 15){ clasif='CALMA'; clase='ok'; }
        else if(prom < 30){ clasif='MODERADO'; clase='warn'; }
        else if(prom < 45){ clasif='FUERTE'; clase='warn'; }
        else { clasif='MUY FUERTE'; clase='danger'; }
        out.hidden = false;
        out.innerHTML = `
            <h3>Análisis de viento</h3>
            <div class="result-grid">
                <div class="metric"><span class="metric-label">Promedio</span><span class="metric-value ${clase}">${prom.toFixed(2)} km/h</span></div>
                <div class="metric"><span class="metric-label">Máximo</span><span class="metric-value ${clase}">${maximo.toFixed(2)} km/h</span></div>
                <div class="metric"><span class="metric-label">Clasificación</span><span class="metric-value ${clase}">${clasif}</span></div>
            </div>
            <div class="msg-line ${clase}">Umbrales: &lt;15 calma · &lt;30 moderado · &lt;45 fuerte · ≥45 muy fuerte.</div>`;

        // Guardar en historial
        guardarHistorial('m3', { fecha: new Date().toLocaleString(), vals: vals.join(' · '), prom, maximo, clasif });
        renderHistorialM3();
    });
}

function renderHistorialM3() {
    const tbody = document.getElementById('historialM3');
    if (!tbody) return;
    const hist = JSON.parse(localStorage.getItem(HIST_M3_KEY)) || [];
    tbody.innerHTML = '';
    if (hist.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Sin análisis registrados.</td></tr>`;
        return;
    }
    hist.slice().reverse().forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-size:10px">${h.fecha}</td><td>${h.vals}</td><td>${h.prom.toFixed(2)} km/h</td><td>${h.maximo.toFixed(2)} km/h</td><td>${h.clasif}</td>`;
        tbody.appendChild(tr);
    });
}

// --- FUNCIÓN GENÉRICA PARA GUARDAR Y LIMPIAR HISTORIALES ---
function guardarHistorial(mod, data) {
    const key = mod === 'm1' ? HIST_M1_KEY : HIST_M3_KEY;
    let hist = JSON.parse(localStorage.getItem(key)) || [];
    hist.push(data);
    // Limitar a los últimos 20 registros para no saturar
    if (hist.length > 20) hist.shift();
    localStorage.setItem(key, JSON.stringify(hist));
}

window.limpiarHistorial = function(mod) {
    const key = mod === 'm1' ? HIST_M1_KEY : HIST_M3_KEY;
    if (confirm('¿Seguro que deseas borrar todo el historial?')) {
        localStorage.removeItem(key);
        if (mod === 'm1') renderHistorialM1();
        else if (mod === 'm3') renderHistorialM3();
    }
};

// --- MÓDULO 4: SENSORES (Lógica intacta, ya tiene su propia tabla) ---
function initSensores() {
    const form = document.getElementById('formSensores');
    const errBox = document.getElementById('errorSensor');
    if(!form) return;
    const RE_SENSOR = /^SEN-\d{3}$/;
    let sensores = JSON.parse(localStorage.getItem('sensores')) || [];
    renderTablaSensores(sensores);

    form.addEventListener('submit', e => {
        e.preventDefault();
        errBox.hidden = true;
        const codigo = document.getElementById('codigoSensor').value.trim().toUpperCase();
        const tipo = document.getElementById('tipoSensor').value;
        const lectura = parseFloat(document.getElementById('lecturaSensor').value);

        if(!RE_SENSOR.test(codigo)) { errBox.hidden = false; errBox.textContent = `⚠ Código inválido. Formato: SEN-001.`; return; }
        if(!tipo) { errBox.hidden = false; errBox.textContent = `⚠ Selecciona un tipo.`; return; }
        if(isNaN(lectura)) { errBox.hidden = false; errBox.textContent = `⚠ La lectura debe ser numérica.`; return; }

        sensores.push({ id: Date.now(), codigo, tipo, lectura });
        localStorage.setItem('sensores', JSON.stringify(sensores));
        renderTablaSensores(sensores);
        form.reset();
    });
}

function renderTablaSensores(sensores) {
    const tbody = document.getElementById('tablaSensores');
    const counter = document.getElementById('contadorSensores');
    if(!tbody) return;
    tbody.innerHTML = '';
    counter.textContent = `${sensores.length} reg.`;
    if(sensores.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="empty-row">Sin sensores registrados.</td></tr>`; return; }
    sensores.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:11px">${s.codigo}</td>
            <td>${s.tipo}</td>
            <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${s.lectura}</td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="eliminarSensor(${s.id})">✕</button></td>`;
        tbody.appendChild(tr);
    });
}

window.eliminarSensor = function(id) {
    let sensores = JSON.parse(localStorage.getItem('sensores')) || [];
    sensores = sensores.filter(s => s.id !== id);
    localStorage.setItem('sensores', JSON.stringify(sensores));
    renderTablaSensores(sensores);
};