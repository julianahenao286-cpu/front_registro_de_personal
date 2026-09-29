import { api } from "../../js/api.js";

// filtros: { desde: "YYYY-MM-DD", hasta: "YYYY-MM-DD", cargo }
export const obtenerHistorial = (filtros) => api("/registro/historial", { query: filtros });

// Solo ADMIN. entradaId identifica la jornada; salida null la deja sin salida
export const corregirJornada = (entradaId, { entrada, salida }) =>
    api(`/registro/jornada/${entradaId}`, { method: "PUT", body: { entrada, salida } });

export const eliminarJornada = (entradaId) => api(`/registro/jornada/${entradaId}`, { method: "DELETE" });
