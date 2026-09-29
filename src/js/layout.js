import { esAdmin, logout, requerirSesion } from "./auth.js";
import { irA } from "./rutas.js";
import { mostrarError } from "./notificaciones.js";

// Enlaza el menú lateral (<li data-ventana="...">) y el botón de cerrar sesión.
// Las opciones con data-solo-admin solo se muestran a un administrador.
const initMenu = (usuario) => {
    document.querySelectorAll(".menu li[data-solo-admin]").forEach((item) => {
        item.hidden = !esAdmin(usuario);
    });

    document.querySelectorAll(".menu li[data-ventana]").forEach((item) => {
        item.addEventListener("click", () => irA(item.dataset.ventana));
    });

    document.querySelector(".btn-cerrar")?.addEventListener("click", async () => {
        try {
            await logout();
        } catch (error) {
            await mostrarError(error);
        } finally {
            irA("login");
        }
    });
};

/**
 * Punto de entrada común de las ventanas privadas: valida la sesión,
 * activa el menú y muestra la página. Devuelve el usuario en sesión.
 * Con { soloAdmin: true } un usuario sin rol ADMIN vuelve a Personal sin ver la página.
 */
export const iniciarVentanaPrivada = async ({ soloAdmin = false } = {}) => {
    const usuario = await requerirSesion();
    if (soloAdmin && !esAdmin(usuario)) {
        irA("personal");
        return new Promise(() => {});
    }
    initMenu(usuario);
    document.body.hidden = false;
    return usuario;
};
