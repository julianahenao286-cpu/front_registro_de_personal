import { api } from "../../js/api.js";
import { fechaISO } from "../../js/utils.js";

export const TIPOS = Object.freeze({ ENTRADA: "ENTRADA", SALIDA: "SALIDA" });

export const buscarPersonal = (q) => api("/personal", { query: { q } });

export const obtenerEstado = (idPersonal) => api(`/registro/estado/${idPersonal}`);

// Quienes están dentro: jornadas de hoy con entrada y sin salida
export const obtenerPresentes = async () => {
    const hoy = fechaISO();
    const jornadas = await api("/registro/historial", { query: { desde: hoy, hasta: hoy } });
    return jornadas.filter((jornada) => jornada.estado === "EN_CURSO");
};

export const registrarMovimiento = (idPersonal, tipo) =>
    api("/registro", { method: "POST", body: { id_personal: idPersonal, tipo } });
