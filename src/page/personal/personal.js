import { iniciarVentanaPrivada } from "../../js/layout.js";
import { puedeGestionarPersonal } from "../../js/auth.js";
import { $, crearElemento, debounce, icono } from "../../js/utils.js";
import { confirmar, mostrarAlerta, mostrarError, notificar } from "../../js/notificaciones.js";
import { actualizarPersonal, crearPersonal, eliminarPersonal, listarPersonal } from "./personal.api.js";

const tabla = $("#tablaPersonal");
const buscador = $("#buscar");
const modal = $("#modal");
const form = $("#form-personal");

let personal = [];
let idEditando = null;
let puedeEditar = false;

// ---------- Tabla ----------

const crearFila = (persona) => {
    const fila = crearElemento("tr", {}, [
        crearElemento("td", { texto: persona.nombre }),
        crearElemento("td", { texto: persona.documento }),
        crearElemento("td", { texto: persona.cargo }),
        crearElemento("td", { texto: persona.area ?? "---" }),
    ]);

    if (puedeEditar) {
        fila.append(
            crearElemento("td", {}, [
                crearElemento("button", {
                    className: "editar",
                    attrs: { type: "button", "data-accion": "editar", "data-id": persona.id, "aria-label": `Editar ${persona.nombre}` },
                }, [icono("fas fa-pen")]),
                crearElemento("button", {
                    className: "eliminar",
                    attrs: { type: "button", "data-accion": "eliminar", "data-id": persona.id, "aria-label": `Eliminar ${persona.nombre}` },
                }, [icono("fas fa-trash")]),
            ]),
        );
    }
    return fila;
};

const mostrarTabla = () => {
    if (personal.length === 0) {
        const columnas = puedeEditar ? 5 : 4;
        tabla.replaceChildren(
            crearElemento("tr", {}, [
                crearElemento("td", { className: "fila-vacia", texto: "No hay personal registrado", attrs: { colspan: columnas } }),
            ]),
        );
        return;
    }
    tabla.replaceChildren(...personal.map(crearFila));
};

const cargarPersonal = async () => {
    try {
        personal = await listarPersonal(buscador.value.trim());
        mostrarTabla();
    } catch (error) {
        mostrarError(error);
    }
};

// ---------- Modal ----------

const abrirModal = (persona = null) => {
    idEditando = persona?.id ?? null;
    form.reset();
    $("#titulo-modal").textContent = persona ? "Editar Personal" : "Registrar Personal";
    $("#texto-guardar").textContent = persona ? "Guardar cambios" : "Registrar";

    if (persona) {
        form.nombre.value = persona.nombre;
        form.documento.value = persona.documento;
        form.cargo.value = persona.cargo;
        form.area.value = persona.area ?? "";
    }

    modal.style.display = "flex";
    form.nombre.focus();
};

const cerrarModal = () => {
    modal.style.display = "none";
    idEditando = null;
};

const leerFormulario = () => ({
    nombre: form.nombre.value.trim(),
    documento: form.documento.value.trim(),
    cargo: form.cargo.value,
    area: form.area.value.trim(),
});

const guardarEmpleado = async (event) => {
    event.preventDefault();
    const datos = leerFormulario();

    if (!datos.nombre || !datos.documento || !datos.cargo) {
        mostrarAlerta({
            tipo: "advertencia",
            titulo: "Faltan datos",
            mensaje: "Nombre, documento y cargo son obligatorios.",
        });
        return;
    }

    const boton = $("#btn-guardar");
    boton.disabled = true;
    try {
        const editando = Boolean(idEditando);
        if (editando) {
            await actualizarPersonal(idEditando, datos);
        } else {
            await crearPersonal(datos);
        }
        cerrarModal();
        notificar(editando ? "Datos del empleado actualizados" : "Empleado registrado correctamente");
        await cargarPersonal();
    } catch (error) {
        mostrarError(error);
    } finally {
        boton.disabled = false;
    }
};

const eliminar = async (id) => {
    const persona = personal.find((p) => p.id === id);
    const confirmado = await confirmar({
        titulo: "Eliminar empleado",
        mensaje: `¿Eliminar a ${persona.nombre}? Su historial de registros se conserva.`,
        textoConfirmar: "Eliminar",
        peligro: true,
    });
    if (!confirmado) return;

    try {
        await eliminarPersonal(id);
        notificar(`Se eliminó a ${persona.nombre}`);
        await cargarPersonal();
    } catch (error) {
        mostrarError(error);
    }
};

// ---------- Eventos ----------

// Un solo listener para todos los botones de la tabla (delegación de eventos)
tabla.addEventListener("click", (event) => {
    const boton = event.target.closest("button[data-accion]");
    if (!boton) return;

    const { accion, id } = boton.dataset;
    if (accion === "editar") abrirModal(personal.find((p) => p.id === id));
    if (accion === "eliminar") eliminar(id);
});

buscador.addEventListener("input", debounce(cargarPersonal));
$("#boton_agregar").addEventListener("click", () => abrirModal());
$("#btn-cancelar").addEventListener("click", cerrarModal);
form.addEventListener("submit", guardarEmpleado);
modal.addEventListener("click", (event) => {
    if (event.target === modal) cerrarModal();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") cerrarModal();
});

// ---------- Inicio ----------

const usuario = await iniciarVentanaPrivada();
puedeEditar = puedeGestionarPersonal(usuario);
$("#boton_agregar").hidden = !puedeEditar;
$("#columna-acciones").hidden = !puedeEditar;
await cargarPersonal();
