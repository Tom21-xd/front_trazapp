# front_trazapp — Web App / PWA (Next.js 16 + React 19 + Tailwind v4)

Interfaz de TrazApp: gestión de proyectos, tablero Kanban arrastrable,
comentarios con adjuntos, solicitudes de cambio de etapa. Instalable como
PWA en Android e iPhone.

## Requisitos

- Node.js 20+
- El backend `back_trazapp` corriendo (por defecto en `http://localhost:3000`)

## Puesta en marcha

```bash
npm install

cp .env.example .env.local
#   NEXT_PUBLIC_API_URL  -> URL del backend con /api  (def. http://localhost:3000/api)
#   NEXT_PUBLIC_APP_URL  -> URL pública del front     (def. http://localhost:3001)

npm run dev      # http://localhost:3001  (el front corre en 3001, el back en 3000)
```

> El backend usa el puerto **3000** y el frontend el **3001** para evitar
> colisión. Los scripts `dev`/`start` ya fijan `-p 3001`.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Desarrollo en `:3001` |
| `npm run build` | Build de producción |
| `npm start` | Servir build en `:3001` |
| `npm run lint` | ESLint |

## PWA (instalable Android + iPhone)

- `manifest.json` con iconos PNG reales (192/512/maskable) + `apple-touch-icon`
  180×180.
- Meta tags iOS (`apple-mobile-web-app-*`), `viewport-fit=cover` y safe-area
  insets para iPhone con notch.
- Service worker resiliente (cache versionado, no cachea respuestas con error
  ni descargas protegidas).
- `PWAInstall` muestra el prompt en Android (Chrome/Edge) e instrucciones
  manuales en iOS/iPadOS (Safari → Compartir → "Añadir a inicio").

Para probar la instalación se requiere HTTPS o `localhost`.

## Notas

- Sesión basada en JWT en `localStorage`; refresh automático ante 401.
- Adjuntos: se suben vía `multipart/form-data` y se descargan como blob
  autenticado (`filesService`).
- El tablero respeta permisos: un administrador mueve tarjetas directo; un
  empleado genera una **solicitud de cambio de etapa** para aprobación.
