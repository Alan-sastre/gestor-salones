# Gestor de Salones — Documentación del proyecto

## Propósito

Aplicación web para la gestión de reservas de salones universitarios. Dirigida exclusivamente a docentes, permite reservar espacios y equipos mediante un flujo guiado de pasos con animaciones. Es una maqueta de demostración; no tiene autenticación real ni persistencia en base de datos.

## Tecnologías y comandos

- React 18 con JavaScript y JSX.
- Vite 5 para desarrollo y compilación.
- Tailwind CSS 4 mediante `@tailwindcss/vite`.
- Iconos de `react-icons`.
- `npm run dev` — inicia el servidor de desarrollo.
- `npm run build` — genera la compilación de producción en `dist/`.
- `npm run preview` — sirve localmente la compilación de producción.

## Estructura

```
src/
├── App.jsx                          # Estado principal, flujo de pasos y lógica de negocio
├── main.jsx                         # Punto de entrada de React
├── index.css                        # Tailwind + animaciones globales (step-enter, fadeInUp, etc.)
│
├── components/
│   ├── LoginScreen.jsx              # Paso 0: login por código numérico
│   ├── WelcomeScreen.jsx            # Bienvenida con nombre del profesor + animación de salida
│   ├── SpaceSelector.jsx            # Paso 1: grilla de selección de salones
│   ├── SpaceDetailScreen.jsx        # Paso 2: detalle del salón (imagen, features, capacidad)
│   ├── CalendarPanel.jsx            # Paso 3a: calendario mensual con indicadores
│   ├── BookingPanel.jsx             # Paso 3b: formulario de reserva y lista del día
│   ├── EquipmentPanel.jsx           # Paso 4: equipos disponibles con reserva inline
│   ├── BookingSummaryScreen.jsx     # Paso 5: resumen de la reserva con opciones de edición
│   ├── SuccessScreen.jsx            # Paso 6: pantalla de confirmación exitosa
│   ├── AppHeader.jsx                # Encabezado con nombre del docente y cierre de sesión
│   └── NotificationCenter.jsx      # Notificaciones modales de acciones
│
└── data/
    ├── spaces.js                    # Datos estáticos de los 5 salones disponibles
    ├── professors.js                # Datos de profesores (actualmente solo NombrePrueba)
    └── equipment.js                 # Equipos disponibles: proyectores, micrófonos, laptops, cámara
```

## Flujo de la aplicación

```
Login (código numérico) → Bienvenida → [Flujo de 6 pasos]
  Paso 1: Selección de salón
  Paso 2: Detalle del salón
  Paso 3: Calendario + formulario de reserva
  Paso 4: Equipos disponibles
  Paso 5: Resumen de la reserva (con botones "Cambiar" por sección)
  Paso 6: Pantalla de éxito → volver al Paso 1
```

Cada paso tiene animación de entrada/salida (slide izquierda/derecha según dirección). La función `goToStep(step, direction)` en `App.jsx` gestiona todas las transiciones con un timeout de 300ms.

## Comportamiento y limitaciones

- **Login**: acepta cualquier número. El nombre del profesor es `NombrePrueba` (placeholder hasta integrar backend).
- **Reservas**: se guardan en estado de React en memoria. Se pierden al recargar la página.
- **Horarios permitidos**: 07:00 a 21:00. Se valida solapamiento por salón y día.
- **Equipos**: disponibilidad calculada por número de reservas en el día vs. unidades totales.
- **Resumen**: al hacer "Cambiar" desde el paso 5, el usuario regresa al paso específico (1, 3 o 4).
- No hay API ni persistencia de servidor.

## Guía para cambios

- Mantén la interfaz, textos y validaciones en español.
- Estado y reglas de negocio en `App.jsx`; presentación en componentes; datos estáticos en `data/`.
- Las animaciones de transición están en `index.css` (`.step-enter`, `.step-enter-back`, etc.).
- Al añadir un nuevo paso, incrementa el máximo de `step` en `App.jsx` y crea el componente en `components/`.
- Ejecuta `npm run build` al terminar cambios de código.
