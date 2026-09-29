import { iniciarVentanaPrivada } from "../../js/layout.js";
import { esAdmin } from "../../js/auth.js";
import {
    $,
    combinarDiaYHora,
    crearElemento,
    fechaISO,
    formatearDia,
    formatearHora,
    horaInput,
    icono,
} from "../../js/utils.js";
import { confirmar, mostrarAlerta, mostrarError, notificar } from "../../js/notificaciones.js";
import { corregirJornada, eliminarJornada, obtenerHistorial } from "./historial.api.js";

const filtros = $("#form-filtros");
const tabla = $("#tablaHistorial");
const modal = $("#modal");
const formJornada = $("#form-jornada");

// Estado que devuelve la API → texto y clase CSS
const ESTADOS = {
    COMPLETO: { texto: "Completo", clase: "completo" },
    EN_CURSO: { texto: "En curso", clase: "curso" },
    SIN_SALIDA: { texto: "Sin salida", clase: "curso" },
};

let jornadas = [];
let jornadaEditando = null;
let puedeCorregir = false;

// ---------- Tabla ----------

const crearFila = (jornada) => {
    const estado = ESTADOS[jornada.estado];
    const fila = crearElemento("tr", {}, [
        crearElemento("td", { texto: formatearDia(jornada.dia) }),
        crearElemento("td", { texto: jornada.personal.nombre }),
        crearElemento("td", { texto: jornada.personal.cargo }),
        crearElemento("td", { texto: formatearHora(jornada.entrada) }),
        crearElemento("td", { texto: jornada.salida ? formatearHora(jornada.salida) : "---" }),
        crearElemento("td", {}, [crearElemento("span", { className: estado.clase, texto: estado.texto })]),
    ]);

    if (puedeCorregir) {
        fila.append(
            crearElemento("td", {}, [
                crearElemento("button", {
                    className: "editar",
                    attrs: {
                        type: "button",
                        "data-id": jornada.entradaId,
                        "aria-label": `Corregir jornada de ${jornada.personal.nombre}`,
                    },
                }, [icono("fas fa-pen")]),
            ]),
        );
    }
    return fila;
};

const mostrarMensaje = (texto) => {
    const columnas = puedeCorregir ? 7 : 6;
    tabla.replaceChildren(
        crearElemento("tr", {}, [crearElemento("td", { className: "fila-vacia", texto, attrs: { colspan: columnas } })]),
    );
};

const buscar = async (event) => {
    event?.preventDefault();
    const valores = {
        desde: filtros.desde.value,
        hasta: filtros.hasta.value,
        cargo: filtros.cargo.value,
    };

    if (valores.desde && valores.hasta && valores.desde > valores.hasta) {
        mostrarAlerta({
            tipo: "advertencia",
            titulo: "Rango de fechas no válido",
            mensaje: "La fecha de inicio no puede ser mayor que la fecha fin.",
        });
        return;
    }

    mostrarMensaje("Cargando...");
    try {
        jornadas = await obtenerHistorial(valores);
        if (jornadas.length === 0) {
            mostrarMensaje("No hay registros para los filtros seleccionados");
            return;
        }
        tabla.replaceChildren(...jornadas.map(crearFila));
    } catch (error) {
        mostrarMensaje("No se pudo cargar el historial");
        mostrarError(error);
    }
};

// ---------- Corrección de jornada (ADMIN) ----------

const abrirModal = (jornada) => {
    jornadaEditando = jornada;
    $("#detalle-jornada").textContent = `${jornada.personal.nombre} · ${formatearDia(jornada.dia)}`;
    formJornada.entrada.value = horaInput(jornada.entrada);
    formJornada.salida.value = jornada.salida ? horaInput(jornada.salida) : "";
    modal.style.display = "flex";
    formJornada.entrada.focus();
};

const cerrarModal = () => {
    modal.style.display = "none";
    jornadaEditando = null;
};

// Ejecuta una acción del modal deshabilitando sus botones mientras dura
const conBotonesDeshabilitados = async (accion) => {
    const botones = formJornada.querySelectorAll("button");
    botones.forEach((boton) => { boton.disabled = true; });
    try {
        await accion();
    } finally {
        botones.forEach((boton) => { boton.disabled = false; });
    }
};

const guardarCorreccion = async (event) => {
    event.preventDefault();
    const { entrada, salida } = formJornada;

    if (!entrada.value) {
        mostrarAlerta({ tipo: "advertencia", titulo: "Falta la hora de entrada", mensaje: "La hora de entrada es obligatoria." });
        return;
    }
    if (salida.value && salida.value <= entrada.value) {
        mostrarAlerta({
            tipo: "advertencia",
            titulo: "Horas no válidas",
            mensaje: "La hora de salida debe ser posterior a la de entrada.",
        });
        return;
    }

    await conBotonesDeshabilitados(async () => {
        try {
            const { dia, entradaId } = jornadaEditando;
            await corregirJornada(entradaId, {
                entrada: combinarDiaYHora(dia, entrada.value),
                salida: salida.value ? combinarDiaYHora(dia, salida.value) : null,
            });
            cerrarModal();
            notificar("Jornada corregida");
            await buscar();
        } catch (error) {
            mostrarError(error);
        }
    });
};

const eliminarJornadaActual = async () => {
    const { personal, dia, entradaId } = jornadaEditando;
    const confirmado = await confirmar({
        titulo: "Eliminar jornada",
        mensaje: `¿Eliminar la entrada y la salida de ${personal.nombre} del ${formatearDia(dia)}?`,
        textoConfirmar: "Eliminar",
        peligro: true,
    });
    if (!confirmado) return;

    await conBotonesDeshabilitados(async () => {
        try {
            await eliminarJornada(entradaId);
            cerrarModal();
            notificar("Jornada eliminada");
            await buscar();
        } catch (error) {
            mostrarError(error);
        }
    });
};

// ---------- Eventos ----------

filtros.addEventListener("submit", buscar);

tabla.addEventListener("click", (event) => {
    const boton = event.target.closest("button[data-id]");
    if (boton) abrirModal(jornadas.find((j) => j.entradaId === boton.dataset.id));
});

formJornada.addEventListener("submit", guardarCorreccion);
$("#btn-eliminar").addEventListener("click", eliminarJornadaActual);
$("#btn-cancelar").addEventListener("click", cerrarModal);
modal.addEventListener("click", (event) => {
    if (event.target === modal) cerrarModal();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") cerrarModal();
});

// ---------- Inicio ----------

const usuario = await iniciarVentanaPrivada();
puedeCorregir = esAdmin(usuario);
$("#columna-acciones").hidden = !puedeCorregir;

// Por defecto se muestran los registros de hoy
filtros.desde.value = fechaISO();
filtros.hasta.value = fechaISO();
await buscar();
