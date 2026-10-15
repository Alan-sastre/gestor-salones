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

## Cómo ingresar

En la pantalla de login ingresa **cualquier número** (ej: `1234`) y pulsa "Ingresar". El sistema es una maqueta; no requiere credenciales reales.

---

## Tecnologías usadas

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
