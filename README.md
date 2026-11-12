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

| Comando           | Descripción                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Servidor de desarrollo con recarga automática    |
| `npm run build`   | Genera la versión de producción en `dist/`       |
| `npm run preview` | Previsualiza la versión de producción localmente |

---

## Base de datos de prueba y préstamos

La app puede conectarse a un proyecto Supabase configurado por separado. El esquema base debe estar desplegado en el proyecto; la migración `supabase/email-identity.sql` convierte la identidad a correo y `supabase/account-management.sql` agrega Soporte y la administración de cuentas.

1. Crea `.env.local` en la raíz con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` o `VITE_SUPABASE_ANON_KEY`.
2. Reinicia Vite (`Ctrl+C` y `npm run dev`) para que lea las variables.
3. En Supabase, ejecuta [`supabase/email-identity.sql`](supabase/email-identity.sql) en el SQL Editor. La migración asigna `d1@d.com` a Ana Martínez, `d2@d.com` a Carlos Ruiz y `admin@admin.com` a Administración Académica; conserva las reservas de Ana por correo y retira los tres perfiles sin reservas. El esquema queda usando correo como clave, sin columnas `code`.
4. Ejecuta [`supabase/account-management.sql`](supabase/account-management.sql) para agregar las RPC de gestión y el rol Soporte.

### Configuración en Netlify

En **Site configuration → Environment variables**, agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (o `VITE_SUPABASE_ANON_KEY`) con los valores del proyecto Supabase. Después vuelve a publicar el sitio para que Vite incorpore las variables en la compilación. Usa únicamente la clave pública `publishable`/`anon`, nunca `service_role`.

Si estas variables faltan en producción, el acceso queda bloqueado y la pantalla lo informa; no se permite el acceso local de demostración.

El acceso solicita únicamente el correo, sin contraseña ni verificación de propiedad del correo. Cada cuenta muestra sus propios préstamos, mientras el calendario y el inventario consideran la disponibilidad global, incluidas las reservas de otros docentes. Desde **Tus reservas**, los espacios y los equipos aparecen con su foto, en secciones separadas y ordenados por fecha; se pueden editar o cancelar.

### Reservar equipos sin salón

En la navegación principal abre **Equipos**, elige la fecha y reserva el equipo que necesites. También puedes entrar desde el botón **Reservar equipos** que aparece al final de la selección de laboratorios. Elige la ubicación del inventario para encontrar el equipo: esto registra únicamente el préstamo del equipo y no reserva el salón.

Al reservar las gafas de realidad virtual, indica el uso previsto. Para guardar y consultar ese dato en Supabase, ejecuta una vez [`supabase/usabilidad-gafas.sql`](supabase/usabilidad-gafas.sql) en el SQL Editor del proyecto, después de desplegar el esquema de reservas. Si ya lo aplicaste en tu proyecto, no necesitas ejecutarlo otra vez; conserva el archivo para documentar o configurar otro proyecto.

El inventario se asigna por salón: el 501 tiene LEGO y pantalla inteligente; el 502, gafas, impresora 3D y cortadora láser; el 503, LEGO y pantalla inteligente; el 504, pantalla inteligente; y el Auditorio (ubicación de inventario 505), pantalla, micrófono y proyector. El Auditorio tiene capacidad para 100 personas y Varon del Sol para 30. Para guardar los dos espacios y su inventario en Supabase, ejecuta [`supabase/inventario-por-salon.sql`](supabase/inventario-por-salon.sql) en el SQL Editor. En la vista **Equipos**, selecciona el espacio donde está el equipo que quieres reservar.

### Rol administrador

El administrador de demostración está registrado en Supabase en `admin_codes.email` y se valida mediante la función `lookup_test_admin`. En **Cuentas**, Administración puede crear, editar, cambiar el rol y eliminar cuentas. Un docente con reservas no se puede borrar ni cambiar de rol, para proteger su historial; tampoco se puede eliminar al último administrador ni cambiar la identidad del administrador activo.

El rol **Soporte** puede consultar el dashboard operativo, asignar salones y equipos a docentes, y editar o cancelar sus reservas, pero no puede administrar cuentas ni roles. Administración ve además la pestaña **Cuentas**.

Desde el dashboard, Administración o Soporte puede asignar un salón a un docente indicando su correo, fecha, horario y motivo, o asignarle un equipo indicando correo, fecha y horario. En **Reservas por gestionar** y **Préstamos de equipos** puede editar los datos o cancelar las reservas futuras; también puede consultar las cancelaciones. Para conservar y mostrar el historial de salones cancelados, ejecuta la versión actualizada de [`supabase/usabilidad-gafas.sql`](supabase/usabilidad-gafas.sql) en el SQL Editor de Supabase. Las reservas canceladas dejan de ocupar el horario.

El dashboard se actualiza al recibir cambios en reservas e inventario mediante Supabase Realtime, y sincroniza los datos cada 15 segundos como respaldo. Para habilitar los eventos en las tablas necesarias, ejecuta [`supabase/realtime-admin.sql`](supabase/realtime-admin.sql) en el SQL Editor. Si Realtime no está disponible o aún no se ha habilitado, el dashboard continúa actualizándose automáticamente con el respaldo periódico.

El acceso por correo es solo una identificación de demostración, no verifica la propiedad del correo ni es autenticación segura. Las RPC de cuentas también reciben el correo del administrador como comprobación de rol, por lo que no son seguras contra suplantación. No uses este mecanismo para proteger datos reales. El acceso de Administración y Soporte requiere Supabase. El archivo `src/data/roles.js` no se usa y se eliminó; el rol se obtiene de las RPC de Supabase.

Para ver los nombres de los docentes en la agenda y en las estadísticas, el proyecto Supabase debe tener desplegada la función `get_reservation_availability_details`. Si no está disponible, la app usa `get_reservation_availability` y puede mostrar **Otro docente** en lugar del nombre; ese modo de compatibilidad no incluye el historial de cancelaciones.

La bienvenida avanza automáticamente después de 5 segundos, sin necesidad de presionar un botón.

**Importante:** ingresar un correo sin verificarlo no es autenticación segura. Este flujo de demostración permite llamadas con la clave pública y los datos pueden manipularse desde el navegador; úsalo solo con información ficticia en un proyecto de desarrollo. No uses datos personales o de producción. Para uso real se requiere autenticación Supabase y políticas por usuario.

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
