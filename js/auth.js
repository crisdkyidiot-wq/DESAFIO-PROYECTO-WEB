/* =========================================================
   AUTENTICACIÓN · auth.js
   ========================================================= */
const USERS_KEY = 'simtele_users_v1';
const SESSION_KEY = 'simtele_session_v1';

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY)) || [];
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesión, redirigir al dashboard
    if (localStorage.getItem(SESSION_KEY)) {
        window.location.href = 'dashboard.html';
        return;
    }

    const forms = {
        login: document.getElementById('auth-login'),
        register: document.getElementById('auth-register'),
        recover: document.getElementById('auth-recover')
    };

    function showForm(name) {
        Object.values(forms).forEach(f => f.classList.remove('active'));
        forms[name].classList.add('active');
    }

    document.querySelectorAll('[data-auth]').forEach(btn => {
        btn.addEventListener('click', () => showForm(btn.dataset.auth));
    });

    // --- REGISTRO ---
    document.getElementById('formRegister').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const pass = document.getElementById('regPass').value;
        const pass2 = document.getElementById('regPass2').value;
        const err = document.getElementById('registerError');
        const ok = document.getElementById('registerSuccess');
        err.hidden = true; ok.hidden = true;

        if (!name || !email || !pass) return showErr(err, 'Todos los campos son obligatorios.');
        if (pass.length < 6) return showErr(err, 'La contraseña debe tener al menos 6 caracteres.');
        if (pass !== pass2) return showErr(err, 'Las contraseñas no coinciden.');

        let users = getUsers();
        if (users.find(u => u.email === email)) return showErr(err, 'Este correo ya está registrado.');

        users.push({ name, email, pass });
        saveUsers(users);
        
        ok.hidden = false; ok.textContent = '¡Registro exitoso! Ya puedes iniciar sesión.';
        document.getElementById('formRegister').reset();
        setTimeout(() => { ok.hidden = true; showForm('login'); document.getElementById('loginEmail').value = email; }, 2000);
    });

    // --- LOGIN ---
    document.getElementById('formLogin').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const pass = document.getElementById('loginPass').value;
        const err = document.getElementById('loginError');
        err.hidden = true;

        if (!email || !pass) return showErr(err, 'Ingresa correo y contraseña.');

        const user = getUsers().find(u => u.email === email && u.pass === pass);
        if (!user) return showErr(err, 'Correo o contraseña incorrectos.');

        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        window.location.href = 'dashboard.html';
    });

    // --- RECUPERAR ---
    const recForm = document.getElementById('formRecover');
    const recStep2 = document.getElementById('recoverStep2');
    let recoverEmail = null;

    recForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('recEmail').value.trim().toLowerCase();
        const err = document.getElementById('recoverError');
        const ok = document.getElementById('recoverSuccess');
        err.hidden = true; ok.hidden = true;

        if (!recoverEmail) {
            if (!email) return showErr(err, 'Ingresa tu correo.');
            if (!getUsers().find(u => u.email === email)) return showErr(err, 'No existe una cuenta con este correo.');

            recoverEmail = email;
            recStep2.hidden = false;
            document.getElementById('btnRecover').textContent = 'Guardar nueva contraseña';
            document.getElementById('recEmail').disabled = true;
            ok.hidden = false; ok.textContent = 'Correo verificado. Ingresa tu nueva contraseña.';
            return;
        }

        const newPass = document.getElementById('recNewPass').value;
        const newPass2 = document.getElementById('recNewPass2').value;

        if (newPass.length < 6) return showErr(err, 'La nueva contraseña debe tener al menos 6 caracteres.');
        if (newPass !== newPass2) return showErr(err, 'Las contraseñas no coinciden.');

        let users = getUsers();
        const idx = users.findIndex(u => u.email === recoverEmail);
        if (idx !== -1) {
            users[idx].pass = newPass;
            saveUsers(users);
            ok.hidden = false; ok.textContent = '¡Contraseña actualizada! Redirigiendo...';
            recForm.reset(); recoverEmail = null; recStep2.hidden = true;
            document.getElementById('recEmail').disabled = false;
            document.getElementById('btnRecover').textContent = 'Restablecer';
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        }
    });

    function showErr(el, msg) {
        el.hidden = false;
        el.textContent = `⚠ ${msg}`;
    }
});