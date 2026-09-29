export const $ = (selector, raiz = document) => raiz.querySelector(selector);

// Crea un elemento asignando texto de forma segura (sin innerHTML)
export const crearElemento = (tag, { className, texto, attrs = {} } = {}, hijos = []) => {
    const elemento = document.createElement(tag);
    if (className) elemento.className = className;
    if (texto !== undefined) elemento.textContent = texto;
    Object.entries(attrs).forEach(([clave, valor]) => elemento.setAttribute(clave, valor));
    elemento.append(...hijos);
    return elemento;
};

export const icono = (clases) => crearElemento("i", { className: clases, attrs: { "aria-hidden": "true" } });

export const debounce = (fn, espera = 300) => {
    let temporizador;
    return (...args) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => fn(...args), espera);
    };
};

const dosDigitos = (n) => String(n).padStart(2, "0");

// "2026-09-29" (formato de <input type="date"> y de la API) en hora local
export const fechaISO = (fecha = new Date()) =>
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;

export const formatearFecha = (valor) => {
    const fecha = new Date(valor);
    return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
};

// La API devuelve el día como "YYYY-MM-DD": se formatea sin pasar por UTC
export const formatearDia = (dia) => dia.split("-").reverse().join("/");

export const formatearHora = (valor, { segundos = false } = {}) =>
    new Date(valor).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: segundos ? "2-digit" : undefined,
        hour12: true,
    });

// "HH:MM" en 24 horas, formato de <input type="time">
export const horaInput = (valor) => {
    const fecha = new Date(valor);
    return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
};

// Une un día "YYYY-MM-DD" y una hora "HH:MM" (hora local) en un ISO para la API
export const combinarDiaYHora = (dia, hora) => {
    const [anio, mes, d] = dia.split("-").map(Number);
    const [horas, minutos] = hora.split(":").map(Number);
    return new Date(anio, mes - 1, d, horas, minutos).toISOString();
};
