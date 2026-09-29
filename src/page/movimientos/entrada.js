import { iniciarVentanaPrivada } from "../../js/layout.js";
import { $, crearElemento, debounce, formatearFecha, formatearHora, icono } from "../../js/utils.js";
import { confirmar, elegirOpcion, mostrarAlerta, mostrarError, notificar } from "../../js/notificaciones.js";
import { TIPOS, buscarPersonal, obtenerEstado, obtenerPresentes, registrarMovimiento } from "./entrada.api.js";

const MAX_SUGERENCIAS = 8;
// Otros equipos también registran: la lista de presentes se refresca sola
const REFRESCO_PRESENTES = 60_000;

const btnEntrada = $("#btnEntrada");
const btnSalida = $("#btnSalida");
const estadoActual = $("#estadoActual");
const tablaPresentes = $("#tablaPresentes");
const filtroPresentes = $("#filtrarPresentes");

let empleadoSeleccionado = null;
let presentes = [];

// ---------- Reloj ----------

const actualizarFechaHora = () => {
    const ahora = new Date();
    $("#fechaActual").textContent = formatearFecha(ahora).replaceAll("/", " / ");
    $("#horaActual").textContent = formatearHora(ahora, { segundos: true });
};

// ---------- Vista ----------

const mostrarEmpleado = (empleado) => {
    $("#nombreEmpleado").textContent = empleado?.nombre ?? "Seleccione un empleado";
    $("#cargoEmpleado").textContent = empleado?.cargo ?? "---";
    $("#documentoEmpleado").textContent = empleado?.documento ?? "---";
    $("#areaEmpleado").textContent = empleado?.area ?? "---";
};

const mostrarEstado = (estado) => {
    const adentro = estado === "ADENTRO";
    estadoActual.textContent = estado ?? "---";
    estadoActual.className = `estado ${estado ? (adentro ? "adentro" : "afuera") : ""}`;
    btnEntrada.disabled = !estado || adentro;
    btnSalida.disabled = !estado || !adentro;
};

const mostrarUltimoMovimiento = (registro) => {
    if (!registro) {
        $("#tituloMovimiento").textContent = "Último movimiento";
        $("#detalleMovimiento").textContent = "Aún no se ha registrado ningún movimiento hoy.";
        $("#iconoMovimiento").className = "fas fa-clock";
        return;
    }

    const esEntrada = registro.tipo === TIPOS.ENTRADA;
    const accion = esEntrada ? "entrada" : "salida";
    $("#tituloMovimiento").textContent = esEntrada ? "Entrada registrada" : "Salida registrada";
    $("#detalleMovimiento").textContent =
        `${empleadoSeleccionado.nombre} registró su ${accion} a las ${formatearHora(registro.fecha)}`;
    $("#iconoMovimiento").className = esEntrada ? "fas fa-right-to-bracket" : "fas fa-right-from-bracket";
};

// ---------- Acciones ----------

const seleccionarEmpleado = async (empleado) => {
    empleadoSeleccionado = empleado;
    mostrarEmpleado(empleado);
    mostrarEstado(null);

    const { estado, ultimo } = await obtenerEstado(empleado.id);
    mostrarEstado(estado);
    mostrarUltimoMovimiento(ultimo);
};

// Prioriza la coincidencia exacta por documento; si hay varias por nombre deja elegir
const elegirResultado = (resultados, texto) => {
    const porDocumento = resultados.find((emp) => emp.documento === texto);
    if (porDocumento || resultados.length === 1) return porDocumento ?? resultados[0];

    const visibles = resultados.slice(0, MAX_SUGERENCIAS);
    const faltan = resultados.length - visibles.length;
    return elegirOpcion({
        titulo: `${resultados.length} coincidencias`,
        mensaje: faltan > 0
            ? `Selecciona el empleado. Hay ${faltan} más: escribe el documento para precisar.`
            : "Selecciona el empleado que deseas registrar.",
        opciones: visibles.map((emp) => ({ texto: emp.nombre, detalle: emp.documento, valor: emp })),
    });
};

const buscarEmpleado = async (event) => {
    event.preventDefault();
    const texto = $("#buscarEmpleado").value.trim();

    if (!texto) {
        mostrarAlerta({ tipo: "advertencia", titulo: "Búsqueda vacía", mensaje: "Escribe un nombre o documento." });
        return;
    }

    try {
        const resultados = await buscarPersonal(texto);
        if (resultados.length === 0) {
            mostrarAlerta({
                tipo: "advertencia",
                titulo: "Empleado no encontrado",
                mensaje: `No hay ningún empleado que coincida con "${texto}".`,
            });
            return;
        }

        const empleado = await elegirResultado(resultados, texto);
        if (empleado) await seleccionarEmpleado(empleado);
    } catch (error) {
        mostrarError(error);
    }
};

const registrar = async (tipo) => {
    if (!empleadoSeleccionado) {
        mostrarAlerta({ tipo: "advertencia", titulo: "Sin empleado", mensaje: "Primero debes buscar un empleado." });
        return;
    }

    btnEntrada.disabled = true;
    btnSalida.disabled = true;
    try {
        const registro = await registrarMovimiento(empleadoSeleccionado.id, tipo);
        mostrarUltimoMovimiento(registro);
        mostrarEstado(tipo === TIPOS.ENTRADA ? "ADENTRO" : "AFUERA");
        notificar(`${tipo === TIPOS.ENTRADA ? "Entrada" : "Salida"} de ${empleadoSeleccionado.nombre} registrada`);
    } catch (error) {
        mostrarError(error);
        // Se resincroniza con el backend por si el estado cambió en otro equipo
        await seleccionarEmpleado(empleadoSeleccionado).catch(mostrarError);
    }
    await cargarPresentes();
};

// ---------- Personal dentro de la institución ----------

const crearFilaPresente = (jornada) =>
    crearElemento("tr", {}, [
        crearElemento("td", { texto: jornada.personal.nombre }),
        crearElemento("td", { texto: jornada.personal.documento }),
        crearElemento("td", { texto: jornada.personal.cargo }),
        crearElemento("td", { texto: formatearHora(jornada.entrada) }),
        crearElemento("td", {}, [
            crearElemento("button", {
                className: "btn-salida",
                attrs: {
                    type: "button",
                    "data-id": jornada.personal.id,
                    "aria-label": `Registrar salida de ${jornada.personal.nombre}`,
                },
            }, [icono("fas fa-right-from-bracket"), crearElemento("span", { texto: "Registrar salida" })]),
        ]),
    ]);

const mostrarPresentes = () => {
    const texto = filtroPresentes.value.trim().toLowerCase();
    const visibles = presentes.filter(({ personal }) =>
        personal.nombre.toLowerCase().includes(texto) || personal.documento.includes(texto),
    );
    $("#totalPresentes").textContent = presentes.length;

    if (visibles.length === 0) {
        const mensaje = presentes.length === 0
            ? "No hay personal dentro de la institución en este momento"
            : "Ninguna persona presente coincide con el filtro";
        tablaPresentes.replaceChildren(
            crearElemento("tr", {}, [crearElemento("td", { className: "fila-vacia", texto: mensaje, attrs: { colspan: 5 } })]),
        );
        return;
    }
    tablaPresentes.replaceChildren(...visibles.map(crearFilaPresente));
};

const cargarPresentes = async () => {
    try {
        presentes = await obtenerPresentes();
        mostrarPresentes();
    } catch (error) {
        mostrarError(error);
    }
};

const registrarSalidaPresente = async (boton) => {
    const { personal } = presentes.find((jornada) => jornada.personal.id === boton.dataset.id);
    const confirmado = await confirmar({
        titulo: "Registrar salida",
        mensaje: `¿Registrar la salida de ${personal.nombre} a las ${formatearHora(new Date())}?`,
        textoConfirmar: "Registrar salida",
    });
    if (!confirmado) return;

    boton.disabled = true;
    try {
        await registrarMovimiento(personal.id, TIPOS.SALIDA);
        notificar(`Salida de ${personal.nombre} registrada`);
    } catch (error) {
        mostrarError(error);
    }
    // Si es la persona mostrada en el panel, se actualiza su estado
    if (empleadoSeleccionado?.id === personal.id) {
        await seleccionarEmpleado(empleadoSeleccionado).catch(mostrarError);
    }
    await cargarPresentes();
};

// ---------- Eventos ----------

$("#form-buscar").addEventListener("submit", buscarEmpleado);
btnEntrada.addEventListener("click", () => registrar(TIPOS.ENTRADA));
btnSalida.addEventListener("click", () => registrar(TIPOS.SALIDA));
filtroPresentes.addEventListener("input", debounce(mostrarPresentes, 150));
tablaPresentes.addEventListener("click", (event) => {
    const boton = event.target.closest("button[data-id]");
    if (boton && !boton.disabled) registrarSalidaPresente(boton);
});

// ---------- Inicio ----------

await iniciarVentanaPrivada();
actualizarFechaHora();
setInterval(actualizarFechaHora, 1000);
await cargarPresentes();
setInterval(cargarPresentes, REFRESCO_PRESENTES);
