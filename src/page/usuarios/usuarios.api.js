import { api } from "../../js/api.js";

export const listarUsuarios = () => api("/usuario");

export const listarRoles = () => api("/rol");

export const crearUsuario = (datos) => api("/usuario", { method: "POST", body: datos });

export const actualizarUsuario = (id, datos) => api(`/usuario/${id}`, { method: "PUT", body: datos });

export const eliminarUsuario = (id) => api(`/usuario/${id}`, { method: "DELETE" });
