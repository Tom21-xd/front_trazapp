/** Rutas de storageState por rol (las genera auth.setup.ts). Reutilizarlas
 *  evita re-loguear en cada spec y chocar con el rate-limit del login. */
export const ADMIN_STORAGE = 'playwright/.auth/admin.json';
export const SUPERVISOR_STORAGE = 'playwright/.auth/supervisor.json';
export const TRABAJADOR_STORAGE = 'playwright/.auth/trabajador.json';
