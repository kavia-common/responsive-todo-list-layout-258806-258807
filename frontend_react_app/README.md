# frontend_react_app — Responsive Todo (React)

A modern, minimal, responsive todo app built with React (Vite). Supports:

- Add todo
- List todos
- Toggle complete / incomplete
- Delete todo
- Filter (All / Active / Completed)
- Clear completed
- Persistence to `localStorage`

## Local development

```bash
npm install
npm run dev
```

The dev server will print the local URL. In this environment, `REACT_APP_PORT` may be set in `.env` but Vite uses `VITE_*`
variables by default; this app does not require any backend configuration.

## Build

```bash
npm run build
npm run preview
```
