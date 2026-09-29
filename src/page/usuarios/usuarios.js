import { iniciarVentanaPrivada } from "../../js/layout.js";
import { $, crearElemento, icono } from "../../js/utils.js";
import { confirmar, mostrarAlerta, mostrarError, notificar } from "../../js/notificaciones.js";
import { actualizarUsuario, crearUsuario, eliminarUsuario, listarRoles, listarUsuarios } from "./usuarios.api.js";

const MIN_PASSWORD = 8;

const tabla = $("#tablaUsuarios");
const buscador = $("#buscar");
const modal = $("#modal");
const form = $("#form-usuario");

let usuarios = [];
let idEditando = null;
let idActual = null;

// ---------- Tabla ----------

const botonAccion = (accion, usuario, clases, deshabilitado) =>
    crearElemento("button", {
        className: accion,
        attrs: {
            type: "button",
            "data-accion": accion,
            "data-id": usuario.id,
            "aria-label": `${accion === "editar" ? "Editar" : "Eliminar"} ${usuario.nombre}`,
            ...(deshabilitado && { disabled: "", title: "No puede eliminar su propio usuario" }),
        },
    }, [icono(clases)]);

const crearFila = (usuario) => {
    const esActual = usuario.id === idActual;
    const nombre = crearElemento("td", { texto: usuario.nombre });
    if (esActual) nombre.append(crearElemento("span", { className: "etiqueta-tu", texto: "(tú)" }));

    return crearElemento("tr", {}, [
        nombre,
        crearElemento("td", { texto: usuario.email }),
        crearElemento("td", { texto: usuario.rol.name }),
        crearElemento("td", {}, [
            botonAccion("editar", usuario, "fas fa-pen", false),
            botonAccion("eliminar", usuario, "fas fa-trash", esActual),
        ]),
    ]);
};

// El filtro es local: la lista de cuentas es corta y ya está cargada
const mostrarTabla = () => {
    const texto = buscador.value.trim().toLowerCase();
    const visibles = usuarios.filter(
        (u) => u.nombre.toLowerCase().includes(texto) || u.email.includes(texto),
    );

    if (visibles.length === 0) {
        tabla.replaceChildren(
            crearElemento("tr", {}, [crearElemento("td", { className: "fila-vacia", texto: "No hay usuarios", attrs: { colspan: 4 } })]),
        );
        return;
    }
    tabla.replaceChildren(...visibles.map(crearFila));
};

const cargarUsuarios = async () => {
    try {
        usuarios = await listarUsuarios();
        mostrarTabla();
    } catch (error) {
        mostrarError(error);
    }
};

const cargarRoles = async () => {
    const roles = await listarRoles();
    form.rol.append(
        ...roles.map((rol) => crearElemento("option", { texto: rol.name, attrs: { value: rol.id } })),
    );
};

// ---------- Modal ----------

const abrirModal = (usuario = null) => {
    idEditando = usuario?.id ?? null;
    form.reset();
    $("#titulo-modal").textContent = usuario ? "Editar Usuario" : "Registrar Usuario";
    $("#texto-guardar").textContent = usuario ? "Guardar cambios" : "Registrar";
    $("#ayuda-password").textContent = usuario
        ? "Déjala vacía para conservar la contraseña actual."
        : `Mínimo ${MIN_PASSWORD} caracteres.`;

    if (usuario) {
        form.nombre.value = usuario.nombre;
        form.email.value = usuario.email;
        form.rol.value = usuario.id_rol;
    }

    modal.style.display = "flex";
    form.nombre.focus();
};

const cerrarModal = () => {
    modal.style.display = "none";
    idEditando = null;
};

// Al editar, la contraseña solo se envía si se escribió una nueva
const leerFormulario = () => {
    const datos = {
        nombre: form.nombre.value.trim(),
        email: form.email.value.trim().toLowerCase(),
        id_rol: form.rol.value,
    };
    if (form.password.value) datos.password = form.password.value;
    return datos;
};

const validar = (datos) => {
    if (!datos.nombre || !datos.email || !datos.id_rol) return "Nombre, correo y rol son obligatorios";
    if (!form.email.checkValidity()) return "El correo no es válido";
    if (!idEditando && !datos.password) return "La contraseña es obligatoria";
    if (datos.password && datos.password.length < MIN_PASSWORD) {
        return `La contraseña debe tener mínimo ${MIN_PASSWORD} caracteres`;
    }
    return null;
};

const guardarUsuario = async (event) => {
    event.preventDefault();
    const datos = leerFormulario();

    const error = validar(datos);
    if (error) {
        mostrarAlerta({ tipo: "advertencia", titulo: "Revisa el formulario", mensaje: error });
        return;
    }

    const boton = $("#btn-guardar");
    boton.disabled = true;
    try {
        const editando = Boolean(idEditando);
        if (editando) {
            await actualizarUsuario(idEditando, datos);
        } else {
            await crearUsuario(datos);
        }
        cerrarModal();
        notificar(editando ? "Usuario actualizado" : "Usuario creado correctamente");
        await cargarUsuarios();
    } catch (error) {
        mostrarError(error);
    } finally {
        boton.disabled = false;
    }
};

const eliminar = async (id) => {
    const usuario = usuarios.find((u) => u.id === id);
    const confirmado = await confirmar({
        titulo: "Eliminar usuario",
        mensaje: `¿Eliminar la cuenta de ${usuario.nombre}? Ya no podrá iniciar sesión.`,
        textoConfirmar: "Eliminar",
        peligro: true,
    });
    if (!confirmado) return;

    try {
        await eliminarUsuario(id);
        notificar(`La cuenta de ${usuario.nombre} fue eliminada`);
        await cargarUsuarios();
    } catch (error) {
        mostrarError(error);
    }
};

// ---------- Eventos ----------

tabla.addEventListener("click", (event) => {
    const boton = event.target.closest("button[data-accion]");
    if (!boton || boton.disabled) return;

    const { accion, id } = boton.dataset;
    if (accion === "editar") abrirModal(usuarios.find((u) => u.id === id));
    if (accion === "eliminar") eliminar(id);
});

buscador.addEventListener("input", mostrarTabla);
$("#boton_agregar").addEventListener("click", () => abrirModal());
$("#btn-cancelar").addEventListener("click", cerrarModal);
form.addEventListener("submit", guardarUsuario);
modal.addEventListener("click", (event) => {
    if (event.target === modal) cerrarModal();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") cerrarModal();
});

// ---------- Inicio ----------

const usuario = await iniciarVentanaPrivada({ soloAdmin: true });
idActual = usuario.id;
try {
    await cargarRoles();
} catch (error) {
    mostrarError(error);
}
await cargarUsuarios();
