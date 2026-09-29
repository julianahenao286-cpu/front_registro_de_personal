import { crearElemento, icono } from "./utils.js";

// Reemplazan a alert() y confirm() del navegador. Los estilos están en style/base.css.

const ICONOS = {
    error: "fas fa-circle-xmark",
    advertencia: "fas fa-triangle-exclamation",
    exito: "fas fa-circle-check",
    info: "fas fa-circle-info",
    peligro: "fas fa-trash-can",
};

// Título del error según el código HTTP que devolvió la API (ApiError.status)
const TITULOS_ERROR = {
    0: "Sin conexión con el servidor",
    400: "Datos no válidos",
    403: "Acceso denegado",
    404: "No encontrado",
    409: "Registro duplicado",
};

// Los diálogos se muestran de a uno: si llegan varios, esperan su turno
let cola = Promise.resolve();

/**
 * Abre un diálogo y resuelve con el valor del botón u opción elegida.
 * Escape o un clic fuera de la caja resuelven con valorCancelar.
 */
const abrirDialogo = ({ tipo, titulo, mensaje, botones, opciones = [], valorCancelar }) =>
    new Promise((resolve) => {
        const focoAnterior = document.activeElement;

        const botonesEl = botones.map(({ texto, clase, valor }) =>
            crearElemento("button", { className: clase, texto, attrs: { type: "button" } }),
        );
        const opcionesEl = opciones.map(({ texto, detalle }) =>
            crearElemento("button", { attrs: { type: "button" } }, [
                crearElemento("span", { texto }),
                crearElemento("small", { texto: detalle ?? "" }),
            ]),
        );

        const caja = crearElemento("div", {
            className: "dialogo-caja",
            attrs: { role: "alertdialog", "aria-modal": "true", "aria-labelledby": "dialogo-titulo", "aria-describedby": "dialogo-mensaje" },
        }, [
            crearElemento("div", { className: "dialogo-icono" }, [icono(ICONOS[tipo])]),
            crearElemento("h2", { texto: titulo, attrs: { id: "dialogo-titulo" } }),
            crearElemento("p", { texto: mensaje, attrs: { id: "dialogo-mensaje" } }),
            ...(opcionesEl.length
                ? [crearElemento("ul", { className: "dialogo-opciones" }, opcionesEl.map((b) => crearElemento("li", {}, [b])))]
                : []),
            crearElemento("div", { className: "dialogo-botones" }, botonesEl),
        ]);
        const fondo = crearElemento("div", { className: `dialogo dialogo-${tipo}` }, [caja]);

        const cerrar = (valor) => {
            window.removeEventListener("keydown", teclado, true);
            fondo.remove();
            focoAnterior?.focus?.();
            resolve(valor);
        };

        // En captura y sin propagar: el Escape no debe cerrar además el modal que está debajo
        const teclado = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                event.preventDefault();
                cerrar(valorCancelar);
            }
            if (event.key === "Tab") {
                const enfocables = [...caja.querySelectorAll("button")];
                const primero = enfocables[0];
                const ultimo = enfocables.at(-1);
                if (event.shiftKey && document.activeElement === primero) {
                    event.preventDefault();
                    ultimo.focus();
                } else if (!event.shiftKey && document.activeElement === ultimo) {
                    event.preventDefault();
                    primero.focus();
                }
            }
        };

        botonesEl.forEach((boton, i) => boton.addEventListener("click", () => cerrar(botones[i].valor)));
        opcionesEl.forEach((boton, i) => boton.addEventListener("click", () => cerrar(opciones[i].valor)));
        fondo.addEventListener("click", (event) => {
            if (event.target === fondo) cerrar(valorCancelar);
        });
        window.addEventListener("keydown", teclado, true);

        document.body.append(fondo);
        (opcionesEl[0] ?? botonesEl.at(-1)).focus();
    });

const encolar = (opciones) => {
    const resultado = cola.then(() => abrirDialogo(opciones));
    cola = resultado.catch(() => {});
    return resultado;
};

// Aviso con un solo botón. tipo: "error" | "advertencia" | "exito" | "info"
export const mostrarAlerta = ({ tipo = "info", titulo, mensaje, textoBoton = "Entendido" }) =>
    encolar({
        tipo,
        titulo,
        mensaje,
        botones: [{ texto: textoBoton, clase: tipo === "error" ? "btn-eliminar" : "btn-primario" }],
    });

// Resuelve true si el usuario confirma. Con peligro: true el botón es rojo (eliminar)
export const confirmar = ({ titulo, mensaje, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", peligro = false }) =>
    encolar({
        tipo: peligro ? "peligro" : "advertencia",
        titulo,
        mensaje,
        valorCancelar: false,
        botones: [
            { texto: textoCancelar, clase: "btn-cancelar", valor: false },
            { texto: textoConfirmar, clase: peligro ? "btn-eliminar" : "btn-primario", valor: true },
        ],
    });

// Lista de opciones: resuelve con el valor de la elegida o null si se cancela
export const elegirOpcion = ({ titulo, mensaje, opciones }) =>
    encolar({
        tipo: "info",
        titulo,
        mensaje,
        opciones,
        valorCancelar: null,
        botones: [{ texto: "Cancelar", clase: "btn-cancelar", valor: null }],
    });

export const mostrarError = (error) => {
    console.error(error);
    // La sesión expiró: api.js ya está redirigiendo al login
    if (error?.status === 401) return Promise.resolve();

    return mostrarAlerta({
        tipo: "error",
        titulo: TITULOS_ERROR[error?.status] ?? "Ocurrió un error",
        mensaje: error?.message ?? "Ocurrió un error inesperado. Intenta de nuevo.",
    });
};

// ---------- Notificación breve que desaparece sola ----------

const DURACION_TOAST = 3500;

// tipo: "exito" | "info"
export const notificar = (mensaje, tipo = "exito") => {
    let contenedor = document.querySelector(".toasts");
    if (!contenedor) {
        contenedor = crearElemento("div", { className: "toasts", attrs: { "aria-live": "polite" } });
        document.body.append(contenedor);
    }

    const toast = crearElemento("div", { className: `toast toast-${tipo}`, attrs: { role: "status" } }, [
        icono(ICONOS[tipo]),
        crearElemento("span", { texto: mensaje }),
    ]);
    contenedor.append(toast);

    setTimeout(() => {
        toast.classList.add("saliendo");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, DURACION_TOAST);
};
