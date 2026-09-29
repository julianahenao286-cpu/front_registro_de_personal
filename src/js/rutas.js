// Rutas de las ventanas, resueltas desde esta carpeta (src/js)
const ruta = (path) => new URL(path, import.meta.url).href;

export const RUTAS = Object.freeze({
    inicio: ruta("../page/inicio/inicio.html"),
    login: ruta("../page/login/login.html"),
    personal: ruta("../page/personal/personal.html"),
    movimientos: ruta("../page/movimientos/entrada.html"),
    historial: ruta("../page/historial/historial.html"),
    reportes: ruta("../page/reportes/reportes.html"),
    usuarios: ruta("../page/usuarios/usuarios.html"),
});

export const irA = (ventana) => window.location.assign(RUTAS[ventana]);
