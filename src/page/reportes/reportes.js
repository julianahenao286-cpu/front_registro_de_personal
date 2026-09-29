import { iniciarVentanaPrivada } from "../../js/layout.js";
import { $, fechaISO } from "../../js/utils.js";
import { mostrarError } from "../../js/notificaciones.js";
import { obtenerResumen } from "./reportes.api.js";

// id del elemento en el HTML → campo del resumen de la API
const TARJETAS = {
    totalPersonal: "totalPersonal",
    totalEntradas: "entradas",
    totalSalidas: "salidas",
    presentes: "presentes",
    ausentes: "ausentes",
};

// Textos de las tarjetas según si el reporte es de hoy o de un día anterior
const ETIQUETAS = {
    hoy: { etiquetaEntradas: "Entradas Hoy", etiquetaSalidas: "Salidas Hoy", etiquetaPresentes: "Presentes" },
    otroDia: { etiquetaEntradas: "Entradas", etiquetaSalidas: "Salidas", etiquetaPresentes: "Sin marcar salida" },
};

const selectorFecha = $("#fechaReporte");

// "YYYY-MM-DD" → "martes, 29 de septiembre de 2026" (sin pasar por UTC)
const fechaLarga = (dia) => {
    const [anio, mes, d] = dia.split("-").map(Number);
    return new Date(anio, mes - 1, d).toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const cargarResumen = async () => {
    const dia = selectorFecha.value || fechaISO();
    const esHoy = dia === fechaISO();

    $("#fechaActual").textContent = fechaLarga(dia);
    Object.entries(ETIQUETAS[esHoy ? "hoy" : "otroDia"]).forEach(([id, texto]) => {
        $(`#${id}`).textContent = texto;
    });

    try {
        const resumen = await obtenerResumen(dia);
        Object.entries(TARJETAS).forEach(([id, campo]) => {
            $(`#${id}`).textContent = resumen[campo];
        });
    } catch (error) {
        mostrarError(error);
    }
};

selectorFecha.addEventListener("change", cargarResumen);

// ---------- Inicio ----------

await iniciarVentanaPrivada();
selectorFecha.value = fechaISO();
selectorFecha.max = fechaISO();
await cargarResumen();
