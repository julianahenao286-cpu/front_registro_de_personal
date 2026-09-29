import { api } from "./api.js";
import { irA } from "./rutas.js";

export const ROLES = Object.freeze({ ADMIN: "ADMIN", VIGILANTE: "VIGILANTE" });

export const login = (email, password) =>
    api("/auth/login", { method: "POST", body: { email, password }, redirigirSiNoAutenticado: false });

export const logout = () => api("/auth/logout", { method: "POST", redirigirSiNoAutenticado: false });

// Devuelve el usuario en sesión o null, sin redirigir
export const obtenerSesion = async () => {
    try {
        const { usuario } = await api("/auth/me", { redirigirSiNoAutenticado: false });
        return usuario;
    } catch {
        return null;
    }
};

// Protege una ventana: si no hay sesión, redirige al login
export const requerirSesion = async () => {
    const usuario = await obtenerSesion();
    if (!usuario) {
        irA("login");
        // La navegación ya empezó: la promesa nunca se resuelve y la ventana no sigue inicializándose
        return new Promise(() => {});
    }
    return usuario;
};

export const esAdmin = (usuario) => usuario?.rol?.name === ROLES.ADMIN;

// Crear, editar y eliminar personal (el backend aplica la misma regla)
export const puedeGestionarPersonal = (usuario) =>
    [ROLES.ADMIN, ROLES.VIGILANTE].includes(usuario?.rol?.name);
