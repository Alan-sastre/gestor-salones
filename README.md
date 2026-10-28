# Gestor de Salones Universitarios

Sistema web para que los docentes reserven salones y equipos de la institución.

## Requisitos previos

Antes de ejecutar el proyecto necesitas tener instalado:

- [Node.js](https://nodejs.org/) versión 18 o superior
- npm (viene incluido con Node.js)

Para verificar que los tienes instalados, abre una terminal y corre:

```bash
node --version
npm --version
```

## Cómo ejecutarlo en tu máquina

### 1. Clona el repositorio

```bash
git clone https://github.com/Alan-sastre/gestor-salones.git
cd gestor-salones
```

### 2. Instala las dependencias

```bash
npm install
```

Este paso descarga todos los paquetes necesarios. Solo hay que hacerlo la primera vez.

### 3. Inicia el servidor de desarrollo

```bash
npm run dev
```

Abre tu navegador en **http://localhost:5173** y ya puedes usar la aplicación.

---

## Otros comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Previsualiza la versión de producción localmente |

---

## Base de datos de prueba y préstamos

La app puede conectarse a un proyecto Supabase configurado por separado. El esquema SQL no se distribuye en este repositorio; las tablas y funciones RPC requeridas deben estar desplegadas en el proyecto antes de configurar la conexión.

1. Crea `.env.local` en la raíz con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` o `VITE_SUPABASE_ANON_KEY`.
2. Reinicia Vite (`Ctrl+C` y `npm run dev`) para que lea las variables.
3. En la base de datos configurada, inicia sesión con un ID de profesor válido:

| ID | Docente |
|---|---|
| 1001 | Ana Martínez |
| 1002 | Carlos Ruiz |
| 1003 | María López |
| 1004 | José Hernández |
| 1005 | Laura Gómez |

Cada ID muestra sus propios préstamos, mientras el calendario y el inventario consideran la disponibilidad global, incluidas las reservas de otros docentes. Desde **Tus reservas**, los espacios y los equipos aparecen con su foto, en secciones separadas y ordenados por fecha; se pueden editar o cancelar.

### Reservar equipos sin salón

En la navegación principal abre **Equipos**, elige la fecha y reserva el equipo que necesites. También puedes entrar desde el botón **Reservar equipos** que aparece al final de la selección de laboratorios. No es necesario reservar un salón.

Al reservar las gafas de realidad virtual, indica el uso previsto. Para guardar y consultar ese dato en Supabase, ejecuta una vez [`supabase/usabilidad-gafas.sql`](supabase/usabilidad-gafas.sql) en el SQL Editor del proyecto, después de desplegar el esquema de reservas. Si ya lo aplicaste en tu proyecto, no necesitas ejecutarlo otra vez; conserva el archivo para documentar o configurar otro proyecto.

El inventario se asigna por salón: el 501 tiene LEGO y pantalla inteligente; el 502, gafas, impresora 3D y cortadora láser; el 503, LEGO y pantalla inteligente; y el 504, pantalla inteligente. Para guardar esa distribución en Supabase y añadir las unidades nuevas, ejecuta [`supabase/inventario-por-salon.sql`](supabase/inventario-por-salon.sql) en el SQL Editor. En la vista **Equipos**, selecciona el salón donde está el equipo que quieres reservar.

### Rol administrador

El administrador de demostración está registrado en Supabase en la tabla `admin_codes` y se valida mediante la función `lookup_test_admin`. Inicia sesión con el código que registraste en esa tabla. Para cambiarlo, actualiza el registro directamente en Supabase.

Desde el dashboard, el administrador puede asignar un salón a un docente indicando su código, fecha, horario y motivo; también puede cancelar reservas futuras y consultar las cancelaciones. Para conservar y mostrar el historial de salones cancelados, ejecuta la versión actualizada de [`supabase/usabilidad-gafas.sql`](supabase/usabilidad-gafas.sql) en el SQL Editor de Supabase. Las reservas canceladas dejan de ocupar el horario.

El dashboard se actualiza al recibir cambios en reservas e inventario mediante Supabase Realtime, y sincroniza los datos cada 15 segundos como respaldo. Para habilitar los eventos en las tablas necesarias, ejecuta [`supabase/realtime-admin.sql`](supabase/realtime-admin.sql) en el SQL Editor. Si Realtime no está disponible o aún no se ha habilitado, el dashboard continúa actualizándose automáticamente con el respaldo periódico.

El acceso administrador es un código de demostración almacenado en la base de datos, no un usuario de Supabase Auth ni autenticación segura. No uses este mecanismo para proteger datos reales. Sin Supabase configurado, el código **9001** no abre el dashboard. El archivo `src/data/roles.js` no se usa y se eliminó; el rol administrador se obtiene de Supabase.

Para ver los nombres de los docentes en la agenda y en las estadísticas, el proyecto Supabase debe tener desplegada la función `get_reservation_availability_details`. Si no está disponible, la app usa `get_reservation_availability` y puede mostrar **Otro docente** en lugar del nombre; ese modo de compatibilidad no incluye el historial de cancelaciones.

La bienvenida avanza automáticamente después de 5 segundos, sin necesidad de presionar un botón.

**Importante:** el ID numérico no es autenticación segura. Este flujo de demostración permite llamadas con la clave pública y los datos pueden manipularse desde el navegador; úsalo solo con información ficticia en un proyecto de desarrollo. No uses datos personales o de producción. Para uso real se requiere autenticación Supabase y políticas por usuario.

Las variables del frontend deben usar únicamente la clave pública `publishable`/`anon`. **Nunca uses la clave `service_role` en el navegador ni la compartas.**

Para los modelos 3D, consulta `modelUrl` en `src/data/equipment.js`; los enlaces también se guardan en `equipment.model_url`.

Las URLs de los modelos 3D se configuran en `src/data/equipment.js`, en el campo `modelUrl` de cada equipo. Los campos vacíos (`''`) están reservados para pegar futuras URLs de Sketchfab; al añadir una, el visor se muestra automáticamente en la tarjeta.

---

## Tecnologías usadas

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Supabase](https://supabase.com/)
