import { login, obtenerSesion } from "../../js/auth.js";
import { irA } from "../../js/rutas.js";
import { $ } from "../../js/utils.js";

const form = $("#login");
const email = $("#email");
const password = $("#password");
const mensajeError = $("#mensaje-error");
const botonIngresar = $("#btn-ingresar");

const mostrarMensaje = (texto) => {
    mensajeError.textContent = texto;
    mensajeError.hidden = !texto;
};

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    mostrarMensaje("");

    if (!email.value.trim() || !password.value) {
        mostrarMensaje("Ingresa tu correo y contraseña");
        return;
    }

    botonIngresar.disabled = true;
    try {
        await login(email.value.trim(), password.value);
        irA("personal");
    } catch (error) {
        mostrarMensaje(error.message);
        password.value = "";
        password.focus();
    } finally {
        botonIngresar.disabled = false;
    }
});

// Si ya hay una sesión activa no tiene sentido volver a iniciarla
if (await obtenerSesion()) {
    irA("personal");
}
