# Frontend Registro Montessori

HTML + CSS + JavaScript con ES modules, sin build.

## Ejecutar

1. Levantar el backend (`express-main-grupo_yori`, `npm run dev`) en el puerto 3000.
2. Abrir `src/page/inicio/inicio.html` con **Live Server** (puerto 5500).
   No abrir los archivos con doble clic (`file://`): los módulos y la cookie de sesión no funcionan así.

## Estructura

```
src/
├── js/                  código compartido
│   ├── config.js        URL del backend
│   ├── api.js           cliente fetch (cookie, JSON, errores, 401 → login)
│   ├── auth.js          login, logout, sesión, roles
│   ├── layout.js        valida sesión, menú lateral y cerrar sesión
│   ├── notificaciones.js  diálogos de error/aviso/confirmación y toasts (reemplazan alert/confirm)
│   ├── rutas.js         rutas de las ventanas
│   └── utils.js         DOM seguro, fechas, debounce
├── style/
│   ├── base.css         layout, menú lateral, tablas, formularios, modales y diálogos compartidos
│   └── <ventana>.css    solo lo propio de cada ventana
└── page/<ventana>/
    ├── <ventana>.html
    ├── <ventana>.js      eventos y DOM de esa ventana
    └── <ventana>.api.js  llamadas HTTP de esa ventana
```

Las ventanas privadas empiezan con `<body hidden>` y `layout.js` las muestra tras validar la sesión.
Los roles ADMIN y VIGILANTE ven los botones para crear, editar y eliminar personal. Solo ADMIN ve la ventana
**Usuarios** (`page/usuarios/`), donde se crean las cuentas, se cambia su rol o su contraseña y se eliminan.
