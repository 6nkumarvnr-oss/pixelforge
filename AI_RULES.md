# PixelForge AI Rules

> See `APP_OVERVIEW.md` for the full PixelForge app documentation, including features, frontend/backend structure, database schema, API workflow, and security model.

## Project Type

PixelForge is a React + TypeScript application with a Nitro backend API layer.

The frontend is built with:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Radix UI
- lucide-react

The backend API layer is built with:

- Nitro
- Server routes inside `server/routes/api/`
- Runtime config through `useRuntimeConfig()`
- Server-only environment variables prefixed with `NITRO_`

## Frontend Rules

- Always build the frontend as a React application.
- Use TypeScript for all frontend files.
- Use React Router.
- Keep route definitions inside:

```text
src/App.tsx