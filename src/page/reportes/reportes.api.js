import { api } from "../../js/api.js";

// fecha opcional "YYYY-MM-DD"; por defecto el backend usa el día actual
export const obtenerResumen = (fecha) => api("/reporte/resumen", { query: { fecha } });
