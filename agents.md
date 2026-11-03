# Gestor de Salones — Documentación del proyecto

## Propósito

Aplicación web para que docentes consulten disponibilidad y reserven salones y equipos universitarios. El acceso es una demostración por código de profesor, no autenticación de producción. Las reservas se guardan en Supabase cuando está configurado; sin configuración, se mantienen solo durante la sesión.

## Tecnologías y comandos

- React 18 con JavaScript y JSX.
- Vite 5 para desarrollo y compilación.
- Tailwind CSS 4 mediante `@tailwindcss/vite`.
- Supabase para datos y reservas de prueba.
- Iconos de `react-icons`.
- `npm run dev` — inicia el servidor de desarrollo.
- `npm run build` — genera la compilación de producción en `dist/`.
- `npm run preview` — sirve localmente la compilación de producción.

## Estructura

```
src/
├── App.jsx                          # Estado principal, vistas y reglas de reservas
├── main.jsx                         # Punto de entrada de React
├── index.css                        # Tailwind y animaciones globales
├── lib/
│   └── supabase.js                  # Cliente y configuración de Supabase
├── components/
│   ├── LoginScreen.jsx              # Acceso de demostración por código
│   ├── WelcomeScreen.jsx            # Bienvenida al docente
│   ├── SpaceSelector.jsx            # Selección de salones
│   ├── SpaceDetailScreen.jsx        # Detalle del salón seleccionado
│   ├── CalendarPanel.jsx            # Calendario mensual y disponibilidad
│   ├── BookingPanel.jsx             # Formulario de reserva de salón
│   ├── EquipmentPanel.jsx           # Disponibilidad y reserva de equipos
│   ├── BookingSummaryScreen.jsx     # Resumen previo a la confirmación
│   ├── ReservationsPanel.jsx        # Edición y cancelación de reservas
│   ├── AdminDashboard.jsx           # Estadísticas para el rol administrador
│   ├── SuccessScreen.jsx            # Confirmación de reserva
│   ├── AppHeader.jsx                # Navegación fija y cierre de sesión
│   ├── NotificationCenter.jsx       # Notificaciones de acciones
│   └── AnimatedGridPattern.jsx      # Fondo decorativo
└── data/
    ├── spaces.js                    # Datos iniciales de los salones
    └── equipment.js                 # Datos iniciales de los equipos
```

## Flujo de la aplicación

```
Acceso → Bienvenida (5 s) → Agenda
  Paso 1: Selección de salón
  Paso 2: Detalle del salón
  Paso 3: Calendario y reserva del salón
  Paso 4: Reserva opcional de equipos
  Paso 5: Resumen y confirmación
  Paso 6: Confirmación exitosa
```

La bienvenida avanza automáticamente después de 5 segundos o al presionar **Continuar ahora**.

La navegación principal permite cambiar entre **Agenda**, **Equipos** y **Tus reservas**. La vista **Equipos** permite reservar equipos sin seleccionar un laboratorio. **Tus reservas** separa los espacios de los equipos, muestra la foto de cada recurso y agrupa las reservas por fecha.

El código registrado en `admin_codes` abre el rol **administrador**, que muestra un dashboard con reservas del mes, ocupación de salones, equipos prestados, reservas por escuela, docentes activos y próximas reservas. La función `goToStep(step, direction)` en `App.jsx` gestiona las transiciones del flujo.

## Comportamiento y limitaciones

- **Acceso**: con Supabase configurado, valida los códigos de demostración en la base. Sin configuración, acepta códigos numéricos solo para la demo local; el administrador debe existir en `admin_codes` y no se habilita localmente.
- **Reservas**: con Supabase configurado, se consultan y guardan mediante funciones RPC. Sin Supabase, se guardan temporalmente en memoria.
- **Disponibilidad**: el calendario y el inventario de equipos muestran la disponibilidad global, incluidas las reservas de otros docentes; la vista **Tus reservas** muestra las del docente activo.
- **Equipos**: se pueden reservar desde la agenda (paso 4) o directamente en la vista **Equipos**, sin reservar un laboratorio.
- **Administrador**: dashboard con estadísticas del mes (reservas, horas, ocupación, equipos prestados, escuelas y docentes). Requiere que el código exista en la tabla `admin_codes` y que esté disponible la función RPC `lookup_test_admin`.
- **Horarios**: de 07:00 a 21:00; las reservas se validan contra la disponibilidad del recurso y el horario.
- **Seguridad**: el acceso de demostración no es autenticación segura. Usa exclusivamente claves públicas de Supabase en el frontend y datos ficticios.
- Consulta `README.md` para configurar la conexión con Supabase y usar los docentes disponibles en la base configurada.

## Guía para cambios

- Mantén la interfaz, textos y validaciones en español.
- Estado y reglas de negocio en `App.jsx`; presentación en componentes; datos iniciales en `data/`.
- Las animaciones de transición están en `index.css`.
- Al añadir un paso, actualiza el flujo en `App.jsx` y crea el componente correspondiente.
- Ejecuta `npm run build` al terminar cambios de código.
