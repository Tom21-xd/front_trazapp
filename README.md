# front_trazapp — Web App / PWA

Interfaz de **TrazApp**: gestión de proyectos, tablero Kanban arrastrable,
comentarios con adjuntos, solicitudes de cambio de etapa, notificaciones y
administración de roles/permisos. Construida con **Next.js 16 (App Router) ·
React 19 · TypeScript · Tailwind v4**. Instalable como **PWA** en Android e
iPhone.

> Parte del monorepo TrazApp. Visión general y modelo de permisos en el
> [README raíz](../README.md).

## Requisitos

- Node.js 20+
- El backend `back_trazapp` corriendo (por defecto en `http://localhost:3000`)

## Puesta en marcha

```bash
npm install

cp .env.example .env.local
#   NEXT_PUBLIC_API_URL  -> URL del backend con /api  (def. http://localhost:3000/api)
#   NEXT_PUBLIC_APP_URL  -> URL pública del front     (def. http://localhost:3001)

npm run dev      # http://localhost:3001
```

> El backend usa el puerto **3000** y el frontend el **3001** (los scripts
> `dev`/`start` ya fijan `-p 3001`).

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo en `:3001` |
| `npm run build` | Build de producción |
| `npm start` | Servir build en `:3001` |
| `npm run lint` | ESLint (0 problemas) |

## Estructura

```
src/
├── app/(auth)/            login, register
├── app/(dashboard)/       dashboard, projects, activities, board, my-tasks,
│                          stage-changes, stages, tags, users, project-types,
│                          roles, audit
├── components/ui/         Button, Input, Select, ColorPicker, Modal,
│                          Pagination, Toast/ConfirmModal, Badge, Avatar…
├── components/layout/     DashboardLayout, Sidebar, Header, NotificationBell
├── services/              cliente por dominio (auth, projects, roles, files…)
├── store/AuthContext.tsx  sesión + permisos + can()
├── lib/api.ts             fetch + Bearer + refresh + multipart/blob
└── lib/pagination.ts      helpers toArray / toPage (tolerantes de formato)
```

## Autorización en la UI

La sesión y los permisos viven en `AuthContext`:

```tsx
const { user, can, permissions, isAuthenticated } = useAuthContext();

{can('project:create') && <Button>Nuevo proyecto</Button>}
```

- `can('clave')` → `true` si el rol del usuario incluye ese permiso (o `*`).
- El **Sidebar** muestra cada ítem de administración según su permiso
  (`user:manage`, `role:manage`, `audit:read`, …).
- No existe `isAdmin` ni roles fijos: todo es por permiso. El backend
  reafirma la autorización (un botón oculto no es seguridad; la API
  responde 403 igualmente).
- Catálogo de permisos y roles del sistema: ver
  [README raíz](../README.md#modelo-de-autorización-rbac-granular).

## Componentes propios (sin nativos)

Reemplazan elementos nativos del navegador para una UX consistente:

- **`Select`** — dropdown accesible (teclado, click-fuera, ESC).
- **`ColorPicker`** — paleta + HEX, popover anclado a la derecha.
- **`Pagination`** — controles propios; consume `meta` del envelope.
- **`Modal` / `ConfirmModal` / `Toast`** — sin `alert`/`confirm`/`prompt`.
- **`NotificationBell`** — no leídas (poll 60 s) + panel.
- Banner propio de actualización del Service Worker.

## Paginación

Todos los listados del backend devuelven `{ data, meta }`. Cada servicio
expone `getAll()` (lista completa, `?all=true`, para selects/Kanban) y
`getPage()` (tabla paginada). `lib/pagination.ts` normaliza ambas formas, así
que un desfase temporal back/front no rompe la UI.

## PWA (instalable Android + iPhone)

- `manifest.json` con iconos PNG reales (192/512/maskable) + `apple-touch-icon`
  180×180.
- Meta tags iOS, `viewport-fit=cover` y safe-area insets (notch/Dynamic Island).
- Service worker resiliente: cache versionado, no cachea respuestas con error
  ni descargas protegidas, flujo de actualización con banner propio.
- `PWAInstall`: prompt en Android (Chrome/Edge) e instrucciones manuales en
  iOS/iPadOS (Safari → Compartir → "Añadir a inicio").
- **En desarrollo el SW no se registra** y se auto-limpia cualquier registro
  previo (evita servir bundles cacheados). En producción la PWA queda activa.

Requiere HTTPS o `localhost` para instalar.

## Notas

- Sesión JWT en `localStorage`; refresh automático ante 401.
- Adjuntos: subida `multipart/form-data`, descarga como blob autenticado.
- El tablero respeta permisos: quien tiene `activity:update` mueve tarjetas
  directo; el resto genera una **solicitud de cambio de etapa**.
- Build: 17 páginas, lint sin warnings.
