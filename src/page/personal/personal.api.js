import { api } from "../../js/api.js";

export const listarPersonal = (q) => api("/personal", { query: { q } });

export const crearPersonal = (datos) => api("/personal", { method: "POST", body: datos });

export const actualizarPersonal = (id, datos) => api(`/personal/${id}`, { method: "PUT", body: datos });

export const eliminarPersonal = (id) => api(`/personal/${id}`, { method: "DELETE" });
