// URL base del backend - cambia esta IP si el backend corre en otro equipo
const API_BASE_URL = 'http://192.168.1.200:3000/api/users';

// Variables globales
let currentUser = null;
let chart = null;
let authToken = sessionStorage.getItem('authToken') || null;

// Definición de actividades disponibles
const activityTypes = {
    yoga:     { nombre: "Yoga", duracion: 60, calorias: 200 },
    deportes: { nombre: "Deportes en Equipo", duracion: 90, calorias: 400 },
    natacion: { nombre: "Natación", duracion: 45, calorias: 350 },
    gimnasio: { nombre: "Gimnasio", duracion: 75, calorias: 300 },
    correr:   { nombre: "Correr", duracion: 30, calorias: 300 },
    ciclismo: { nombre: "Ciclismo", duracion: 60, calorias: 400 },
    baile:    { nombre: "Baile", duracion: 45, calorias: 250 }
};

// Helper para fetch con token Authorization
function authFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (authToken) options.headers['Authorization'] = 'Bearer ' + authToken;
    return fetch(url, options);
}

// Inicialización al cargar página
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Cargar sesión si existe usuario guardado y token válido
function initializeApp() {
    const sessionId = sessionStorage.getItem('currentUserId');
    authToken = sessionStorage.getItem('authToken');

    if (sessionId && authToken) {
        authFetch(`${API_BASE_URL}/${sessionId}`)
            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    logout();
                    throw new Error('No autorizado');
                }
                return res.json();
            })
            .then(u => {
                if (u._id) {
                    currentUser = u;
                    showMainApp();
                } else {
                    showLogin();
                }
            })
            .catch(() => showLogin());
    } else {
        showLogin();
    }
}

// Configurar eventos de formularios y UI
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    const historialDateInput = document.getElementById('historialDate');
    if (historialDateInput) {
        historialDateInput.value = getTodayISO();
        historialDateInput.addEventListener('change', (e) => {
            renderHistorialData(e.target.value);
        });

        const btnActualizar = document.getElementById('btnActualizarHistorial');
        if (btnActualizar) {
            btnActualizar.addEventListener('click', () => {
                const fecha = historialDateInput.value;
                if (fecha) renderHistorialData(fecha);
                else Swal.fire('Error', 'Selecciona una fecha válida', 'error');
            });
        }
    }
}

// Validar email básico
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Registro
async function handleRegister(e) {
    e.preventDefault();

    const nombre = document.getElementById('registrarnombre').value.trim();
    const email = document.getElementById('registarEmail').value.trim();
    const password = document.getElementById('registrarPassword').value;
    const confirmarPassword = document.getElementById('confirmarPassword').value;

    if (!nombre) return Swal.fire('Error', 'Por favor ingresa tu nombre.', 'error');
    if (!email) return Swal.fire('Error', 'Por favor ingresa tu correo electrónico.', 'error');
    if (!validarEmail(email)) return Swal.fire('Error', 'Ingresa un correo válido.', 'error');
    if (!password) return Swal.fire('Error', 'Por favor ingresa una contraseña.', 'error');
    if (password.length < 6) return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres.', 'error');
    if (password !== confirmarPassword) return Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');

    try {
        const res = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            await Swal.fire('¡Bienvenido!', 'Registro exitoso. Ahora puedes iniciar sesión.', 'success');
            showLogin();
        } else {
            Swal.fire('Error', data.msg || 'Error al registrar', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Error de conexión al registrar.', 'error');
    }
}

// Login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email) return Swal.fire('Error', 'Por favor ingresa tu correo electrónico.', 'error');
    if (!validarEmail(email)) return Swal.fire('Error', 'Ingresa un correo válido.', 'error');
    if (!password) return Swal.fire('Error', 'Por favor ingresa tu contraseña.', 'error');

    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.token && data.user) {
            authToken = data.token;
            sessionStorage.setItem('authToken', authToken);
            sessionStorage.setItem('currentUserId', data.user._id);
            currentUser = data.user;
            showMainApp();
            Swal.fire('¡Bienvenido!', `Hola ${currentUser.nombre}`, 'success');
        } else {
            Swal.fire('Error', data.msg || 'Credenciales incorrectas', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Error de conexión al iniciar sesión.', 'error');
    }
}

// Mostrar pantalla login
function showLogin() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('registerScreen').classList.remove('active');
    document.getElementById('mainApp').classList.remove('active');
}

// Mostrar pantalla registro
function showRegister() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('registerScreen').classList.add('active');
    document.getElementById('mainApp').classList.remove('active');
}

// Cerrar sesión
function logout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUserId');
    authToken = null;
    currentUser = null;
    Swal.fire('Adiós', 'Has cerrado sesión correctamente.', 'success');
    showLogin();
}

// Mostrar app principal
function showMainApp() {
    showLoginScreenOff();
    document.getElementById('userName').textContent = currentUser.nombre;

    updateStats();  // Ahora actualiza con datos del día actual
    initializeNutrition();
    renderTodaysActivitiesSimple();

    const historialDateInput = document.getElementById('historialDate');
    if (historialDateInput) renderHistorialData(historialDateInput.value);

    showSection('inicio');
}

// Mostrar la app y esconder login/registro
function showLoginScreenOff() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('registerScreen').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
}

// Navegación entre secciones
function showSection(sectionName, event = null) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(sectionName).classList.add('active');
    if (event && event.target) event.target.classList.add('active');

    if (sectionName === 'panel') {
        setTimeout(() => updateStats(), 100); // Actualiza datos del día para el panel
    }
}

// Actualiza estadísticas en panel y gráfica solo con datos del día
function updateStats(fecha = getTodayISO()) {
    if (!currentUser || !currentUser.datosPorDia) return;

    // Buscar datosPorDia para la fecha
    const datosDelDia = currentUser.datosPorDia.find(d => d.fecha === fecha);

    if (!datosDelDia) {
        document.getElementById('caloriesConsumed').textContent = 0;
        document.getElementById('activityMinutes').textContent = 0;
        document.getElementById('caloriesBurned').textContent = 0;
        if (chart) chart.destroy();
        return;
    }

    const s = datosDelDia.estadisticas;

    document.getElementById('caloriesConsumed').textContent = s.caloriasConsumidas || 0;
    document.getElementById('activityMinutes').textContent = s.minutosActividad || 0;
    document.getElementById('caloriesBurned').textContent = s.caloriasQuemadas || 0;

    initializeChart(s);
}

// Inicializar gráfica con Chart.js con datos del día
function initializeChart(stats) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    if (chart) chart.destroy();
    if (!stats) return;

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Calorías Consumidas', 'Minutos de Actividad', 'Calorías Quemadas'],
            datasets: [{
                data: [stats.caloriasConsumidas || 0, stats.minutosActividad || 0, stats.caloriasQuemadas || 0],
                backgroundColor: ['#395afb', '#3cba9f', '#f2545b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Fecha hoy en formato ISO
function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

// Obtiene o crea datosPorDia para una fecha
function getDatosDelDia(fecha) {
    if (!currentUser.datosPorDia) currentUser.datosPorDia = [];

    let datos = currentUser.datosPorDia.find(d => d.fecha === fecha);
    if (!datos) {
        datos = {
            fecha,
            comidas: { desayuno: null, comida: null, cena: null },
            estadisticas: { caloriasConsumidas: 0, minutosActividad: 0, caloriasQuemadas: 0 }
        };
        currentUser.datosPorDia.push(datos);
    }
    return datos;
}

// --- ACTIVIDADES DEL DÍA ---

function renderTodaysActivitiesSimple() {
    const container = document.getElementById('activitiesToday');
    if (!currentUser || !currentUser.actividades) {
        container.innerHTML = "<p>No has realizado actividades hoy.</p>";
        return;
    }
    const today = getTodayISO();
    const acts = currentUser.actividades.filter(a => a.fecha === today);
    if (acts.length === 0) {
        container.innerHTML = "<p>No has realizado actividades hoy.</p>";
        return;
    }

    container.innerHTML = "";
    acts.forEach((act, idx) => {
        const div = document.createElement('div');
        div.className = 'activity-done-card';
        div.innerHTML = `
            <strong>${act.nombre}</strong> — ${act.duracion} min, ${act.calorias} cal
            <button onclick="editActivitySimple(${idx})">Editar</button>
            <button onclick="deleteActivitySimple(${idx})">Eliminar</button>
        `;
        container.appendChild(div);
    });
}

function getTodaysActivitiesSimpleWithIndexes() {
    if (!currentUser || !currentUser.actividades) return [];
    const today = getTodayISO();
    return currentUser.actividades
        .map((a, idx) => ({ ...a, _globalIdx: idx }))
        .filter(a => a.fecha === today);
}

async function editActivitySimple(idx) {
    const acts = getTodaysActivitiesSimpleWithIndexes();
    const act = acts[idx];
    if (!act) return;

    let options = "";
    Object.entries(activityTypes).forEach(([key, value]) => {
        options += `<option value="${key}" ${value.nombre === act.nombre ? "selected" : ""}>${value.nombre}</option>`;
    });

    const { value: updatedActivity } = await Swal.fire({
        title: "Editar actividad",
        html: `
            <select id="swal-actividad" class="swal2-input">${options}</select>
            <input id="swal-duracion" class="swal2-input" value="${act.duracion}" disabled>
            <input id="swal-calorias" class="swal2-input" value="${act.calorias}" disabled>
        `,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        focusConfirm: false,
        didOpen: () => {
            document.getElementById("swal-actividad").addEventListener("change", function () {
                const actKey = this.value;
                document.getElementById("swal-duracion").value = activityTypes[actKey].duracion;
                document.getElementById("swal-calorias").value = activityTypes[actKey].calorias;
            });
        },
        preConfirm: () => {
            const actKey = document.getElementById("swal-actividad").value;
            return activityTypes[actKey];
        },
    });

    if (!updatedActivity) return;

    const actividad = currentUser.actividades[act._globalIdx];
    const fecha = actividad.fecha;
    const datosDelDia = getDatosDelDia(fecha);

    const deltaDuracion = updatedActivity.duracion - actividad.duracion;
    const deltaCalorias = updatedActivity.calorias - actividad.calorias;

    // Actualizar solo datos del día en estadisticas
    datosDelDia.estadisticas.minutosActividad += deltaDuracion;
    datosDelDia.estadisticas.caloriasQuemadas += deltaCalorias;

    actividad.nombre = updatedActivity.nombre;
    actividad.duracion = updatedActivity.duracion;
    actividad.calorias = updatedActivity.calorias;

    await updateUserOnServer();

    renderTodaysActivitiesSimple();
    updateStats(fecha);
    Swal.fire("¡Modificada!", "Actividad modificada correctamente.", "success");
}

async function deleteActivitySimple(idx) {
    const acts = getTodaysActivitiesSimpleWithIndexes();
    const act = acts[idx];
    if (!act) return;

    const confirmed = await Swal.fire({
        title: `Eliminar ${act.nombre}?`,
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
    });

    if (!confirmed.isConfirmed) return;

    const datosDelDia = getDatosDelDia(act.fecha);

    datosDelDia.estadisticas.minutosActividad -= act.duracion;
    datosDelDia.estadisticas.caloriasQuemadas -= act.calorias;

    currentUser.actividades.splice(act._globalIdx, 1);

    await updateUserOnServer();

    renderTodaysActivitiesSimple();
    updateStats(act.fecha);
    Swal.fire("Eliminada", "La actividad fue eliminada.", "success");
}

async function startActivity(nombre, duracion, calorias) {
    if (!currentUser) return;

    if (!currentUser.actividades) currentUser.actividades = [];

    const today = getTodayISO();

    currentUser.actividades.push({ fecha: today, nombre, duracion, calorias });

    const datosDelDia = getDatosDelDia(today);
    datosDelDia.estadisticas.minutosActividad += duracion;
    datosDelDia.estadisticas.caloriasQuemadas += calorias;

    await updateUserOnServer();

    updateStats(today);
    renderTodaysActivitiesSimple();

    Swal.fire({
        icon: "success",
        title: "¡Actividad iniciada!",
        text: `Iniciaste ${nombre}, quemaste ${calorias} cal en ${duracion} min.`,
        timer: 1800,
        showConfirmButton: false,
    });
}

// --- HISTORIAL ---

function renderHistorialData(dateISO) {
    renderHistorialActivities(dateISO);
    renderHistorialStats(dateISO);
    renderHistorialMeals(dateISO);
}

function renderHistorialActivities(dateISO) {
    const container = document.getElementById("historialActivitiesList");
    if (!currentUser || !currentUser.actividades) {
        container.innerHTML = "<p>No hay actividades para esta fecha.</p>";
        return;
    }
    const acts = currentUser.actividades.filter(a => a.fecha === dateISO);

    if (acts.length === 0) {
        container.innerHTML = "<p>No hay actividades para esta fecha.</p>";
        return;
    }

    container.innerHTML = "";
    acts.forEach((act, idx) => {
        container.innerHTML += `
            <div class="activity-done-card">
                <strong>${act.nombre}</strong> — ${act.duracion} min, ${act.calorias} cal 
                <button onclick="editHistorialActivity('${dateISO}', ${idx})">Editar</button>
                <button onclick="deleteHistorialActivity('${dateISO}', ${idx})">Eliminar</button>
            </div>
        `;
    });
}

function getHistorialActivitiesWithIndexes(dateISO) {
    if (!currentUser || !currentUser.actividades) return [];
    return currentUser.actividades
        .map((a, idx) => ({ ...a, _globalIdx: idx }))
        .filter(a => a.fecha === dateISO);
}

async function editHistorialActivity(dateISO, idx) {
    const acts = getHistorialActivitiesWithIndexes(dateISO);
    const act = acts[idx];
    if (!act) return;

    let options = "";
    Object.entries(activityTypes).forEach(([key, value]) => {
        options += `<option value="${key}" ${value.nombre === act.nombre ? "selected" : ""}>${value.nombre}</option>`;
    });

    const { value: updatedActivity } = await Swal.fire({
        title: "Editar actividad",
        html: `
            <select id="swal-actividad" class="swal2-input">${options}</select>
            <input id="swal-duracion" class="swal2-input" value="${act.duracion}" disabled>
            <input id="swal-calorias" class="swal2-input" value="${act.calorias}" disabled>
        `,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        focusConfirm: false,
        didOpen: () => {
            document.getElementById("swal-actividad").addEventListener("change", function () {
                const actKey = this.value;
                document.getElementById("swal-duracion").value = activityTypes[actKey].duracion;
                document.getElementById("swal-calorias").value = activityTypes[actKey].calorias;
            });
        },
        preConfirm: () => {
            const actKey = document.getElementById("swal-actividad").value;
            return activityTypes[actKey];
        },
    });

    if (!updatedActivity) return;

    const actividad = currentUser.actividades[act._globalIdx];
    const datosDelDia = getDatosDelDia(dateISO);
    const deltaDuracion = updatedActivity.duracion - actividad.duracion;
    const deltaCalorias = updatedActivity.calorias - actividad.calorias;

    datosDelDia.estadisticas.minutosActividad += deltaDuracion;
    datosDelDia.estadisticas.caloriasQuemadas += deltaCalorias;

    actividad.nombre = updatedActivity.nombre;
    actividad.duracion = updatedActivity.duracion;
    actividad.calorias = updatedActivity.calorias;

    await updateUserOnServer();

    renderHistorialActivities(dateISO);
    renderHistorialStats(dateISO);

    Swal.fire("¡Modificada!", "Actividad modificada correctamente.", "success");
}

async function deleteHistorialActivity(dateISO, idx) {
    const acts = getHistorialActivitiesWithIndexes(dateISO);
    const act = acts[idx];
    if (!act) return;

    const confirmed = await Swal.fire({
        title: `Eliminar ${act.nombre}?`,
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
    });

    if (!confirmed.isConfirmed) return;

    const datosDelDia = getDatosDelDia(dateISO);

    datosDelDia.estadisticas.minutosActividad -= act.duracion;
    datosDelDia.estadisticas.caloriasQuemadas -= act.calorias;

    currentUser.actividades.splice(act._globalIdx, 1);

    await updateUserOnServer();

    renderHistorialActivities(dateISO);
    renderHistorialStats(dateISO);

    Swal.fire("Eliminada", "La actividad fue eliminada.", "success");
}

// Actualiza estadísticas del historial
function renderHistorialStats(dateISO) {
    const s = currentUser.datosPorDia?.find(d => d.fecha === dateISO)?.estadisticas;
    if (!s) {
        document.getElementById("histCaloriesConsumed").textContent = 0;
        document.getElementById("histActivityMinutes").textContent = 0;
        document.getElementById("histCaloriesBurned").textContent = 0;
        return;
    }
    document.getElementById("histCaloriesConsumed").textContent = s.caloriasConsumidas || 0;
    document.getElementById("histActivityMinutes").textContent = s.minutosActividad || 0;
    document.getElementById("histCaloriesBurned").textContent = s.caloriasQuemadas || 0;
}

// Renderiza comidas en historial
function renderHistorialMeals(dateISO) {
    const comidas = currentUser.datosPorDia?.find(d => d.fecha === dateISO)?.comidas;
    if (!comidas) {
        document.getElementById("histBreakfast").textContent = "No hay datos";
        document.getElementById("histLunch").textContent = "No hay datos";
        document.getElementById("histDinner").textContent = "No hay datos";
        return;
    }
    document.getElementById("histBreakfast").textContent = comidas.desayuno ? `${comidas.desayuno.nombre} (${comidas.desayuno.calorias} cal)` : "No hay datos";
    document.getElementById("histLunch").textContent = comidas.comida ? `${comidas.comida.nombre} (${comidas.comida.calorias} cal)` : "No hay datos";
    document.getElementById("histDinner").textContent = comidas.cena ? `${comidas.cena.nombre} (${comidas.cena.calorias} cal)` : "No hay datos";
}

// --- NUTRICIÓN ---

function initializeNutrition() {
    updateDailyCalories();
    updateSelectedMeals();
    highlightSelectedMeals();
}

// Seleccionar comida y actualizar estadísticas y datosPorDia
async function selectMeal(mealType, meal) {
    if (!currentUser) return;

    if (!currentUser.comidas) currentUser.comidas = {};
    if (!currentUser.estadisticas) currentUser.estadisticas = { caloriasConsumidas: 0, minutosActividad: 0, caloriasQuemadas: 0 };

    const today = getTodayISO();
    const datosDelDia = getDatosDelDia(today);

    let difCalorias = meal.calorias;
    if (datosDelDia.comidas[mealType]) {
        difCalorias -= datosDelDia.comidas[mealType].calorias;
    }

    datosDelDia.comidas[mealType] = meal;
    datosDelDia.estadisticas.caloriasConsumidas += difCalorias;

    currentUser.comidas[mealType] = meal;

    await updateUserOnServer();

    updateStats(today);
    updateDailyCalories();
    updateSelectedMeals();
    highlightSelectedMeals();

    Swal.fire({
        icon: "success",
        title: "¡Comida registrada!",
        text: `Has seleccionado: ${meal.nombre} (${meal.calorias} calorías)`,
        timer: 1600,
        showConfirmButton: false,
    });
}

// Actualizar contador de calorías
function updateDailyCalories() {
    if (!currentUser || !currentUser.comidas) return;
    let total = 0;
    if (currentUser.comidas.desayuno) total += currentUser.comidas.desayuno.calorias;
    if (currentUser.comidas.comida) total += currentUser.comidas.comida.calorias;
    if (currentUser.comidas.cena) total += currentUser.comidas.cena.calorias;
    document.getElementById("dailyCalories").textContent = total;
}

// Mostrar comidas seleccionadas con resaltado
function updateSelectedMeals() {
    if (!currentUser || !currentUser.comidas) return;

    const breakfastEl = document.getElementById("selectedBreakfast");
    if (currentUser.comidas.desayuno) {
        breakfastEl.innerHTML = `
            <p><strong>Seleccionado:</strong> ${currentUser.comidas.desayuno.nombre}</p>
            <p>${currentUser.comidas.desayuno.calorias} calorías</p>
        `;
    } else breakfastEl.innerHTML = "<p>No hay desayuno seleccionado</p>";

    const lunchEl = document.getElementById("selectedLunch");
    if (currentUser.comidas.comida) {
        lunchEl.innerHTML = `
            <p><strong>Seleccionado:</strong> ${currentUser.comidas.comida.nombre}</p>
            <p>${currentUser.comidas.comida.calorias} calorías</p>
        `;
    } else lunchEl.innerHTML = "<p>No hay comida seleccionada</p>";

    const dinnerEl = document.getElementById("selectedDinner");
    if (currentUser.comidas.cena) {
        dinnerEl.innerHTML = `
            <p><strong>Seleccionado:</strong> ${currentUser.comidas.cena.nombre}</p>
            <p>${currentUser.comidas.cena.calorias} calorías</p>
        `;
    } else dinnerEl.innerHTML = "<p>No hay cena seleccionada</p>";
}

// Resaltar opciones seleccionadas en UI
function highlightSelectedMeals() {
    if (!currentUser || !currentUser.comidas) return;

    document.querySelectorAll(".meal-option").forEach(option => option.classList.remove("selected"));

    if (currentUser.comidas.desayuno) {
        const breakfastOptions = document.querySelectorAll("#nutricion .meal-section:nth-child(1) .meal-option");
        breakfastOptions.forEach(option => {
            if (option.querySelector("h4").textContent === currentUser.comidas.desayuno.nombre) option.classList.add("selected");
        });
    }
    if (currentUser.comidas.comida) {
        const lunchOptions = document.querySelectorAll("#nutricion .meal-section:nth-child(2) .meal-option");
        lunchOptions.forEach(option => {
            if (option.querySelector("h4").textContent === currentUser.comidas.comida.nombre) option.classList.add("selected");
        });
    }
    if (currentUser.comidas.cena) {
        const dinnerOptions = document.querySelectorAll("#nutricion .meal-section:nth-child(3) .meal-option");
        dinnerOptions.forEach(option => {
            if (option.querySelector("h4").textContent === currentUser.comidas.cena.nombre) option.classList.add("selected");
        });
    }
}

// Actualizar usuario en servidor (con token en header)
async function updateUserOnServer() {
    if (!authToken) {
        logout();
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/${currentUser._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + authToken
            },
            body: JSON.stringify({
                estadisticas: currentUser.estadisticas,
                actividades: currentUser.actividades,
                comidas: currentUser.comidas,
                datosPorDia: currentUser.datosPorDia
            }),
        });

        if (res.status === 401 || res.status === 403) {
            logout();
            return;
        }

        if (res.ok) {
            currentUser = await res.json();
        } else {
            console.error("Error actualizando usuario");
            Swal.fire('Error', 'No se pudo actualizar la información en el servidor.', 'error');
        }
    } catch (err) {
        console.error("Error actualizando usuario", err);
        Swal.fire('Error', 'Error de conexión al actualizar usuario.', 'error');
    }
}
