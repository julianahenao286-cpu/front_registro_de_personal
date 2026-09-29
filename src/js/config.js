// Se usa el mismo hostname de la página (localhost o 127.0.0.1) para que
// el navegador envíe la cookie de sesión al backend.
const API_PORT = 3000;
const hostname = window.location.hostname || "localhost";

export const API_URL = `${window.location.protocol === "https:" ? "https" : "http"}://${hostname}:${API_PORT}`;
