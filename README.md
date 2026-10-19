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

Cada ID muestra sus propios préstamos, mientras el calendario y el inventario consideran la disponibilidad global. Desde **Tus reservas**, los espacios y los equipos aparecen en secciones separadas y ordenados por fecha; se pueden editar o cancelar.

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
