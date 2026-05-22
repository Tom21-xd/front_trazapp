import { test, expect, type Page } from '@playwright/test';

/**
 * E2E por rol — verifica que el RBAC granular se refleja en la navegación.
 *
 * Pre-requisitos (además del backend en :3000 con migraciones):
 *   npm run db:seed            → roles + admin
 *   npm run seed:demo-data     → supervisor@trazapp.com / supervisor123
 *                                trabajador@trazapp.com / trabajador123
 *
 * El Trabajador NO debe ver la sección "Administración"; el Supervisor ve
 * Etapas/Etiquetas/Tipos pero NO Usuarios/Roles/Auditoría.
 *
 * Nota: el endpoint de login está limitado a 5 intentos/min (anti fuerza
 * bruta), por eso cada rol hace UN solo login y agrupa sus aserciones.
 */

const SUPERVISOR = { email: 'supervisor@trazapp.com', password: 'supervisor123' };
const TRABAJADOR = { email: 'trabajador@trazapp.com', password: 'trabajador123' };

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await page.waitForURL(/\/(dashboard|board|activities|my-tasks)/);
}

// Hay dos <aside> en el DOM (móvil oculto + escritorio); nos quedamos con el visible.
const sidebar = (page: Page) =>
  page.locator('aside:visible').filter({ has: page.locator('[data-tour="sidebar-nav"]') });

test('RBAC · Trabajador: ve sus tareas y NO la sección de Administración', async ({
  page,
}) => {
  await loginAs(page, TRABAJADOR.email, TRABAJADOR.password);
  const nav = sidebar(page);

  // Ve "Mis Tareas"
  await expect(nav.getByRole('link', { name: 'Mis Tareas', exact: true })).toBeVisible();

  // No ve Administración ni sus enlaces sensibles
  await expect(nav.getByText('Administración', { exact: true })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
  await expect(
    nav.getByRole('link', { name: 'Roles y permisos', exact: true }),
  ).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Auditoría', exact: true })).toHaveCount(0);

  // Puede abrir Mis Tareas
  await nav.getByRole('link', { name: 'Mis Tareas', exact: true }).click();
  await expect(page).toHaveURL(/\/my-tasks/);
});

test('RBAC · Supervisor: ve Administración (sin Usuarios/Roles) y la cola de Solicitudes', async ({
  page,
}) => {
  await loginAs(page, SUPERVISOR.email, SUPERVISOR.password);
  const nav = sidebar(page);

  // Ve Administración con gestión operativa
  await expect(nav.getByText('Administración', { exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Etapas', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Etiquetas', exact: true })).toBeVisible();

  // Pero NO gestión de usuarios/roles/auditoría
  await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
  await expect(
    nav.getByRole('link', { name: 'Roles y permisos', exact: true }),
  ).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Auditoría', exact: true })).toHaveCount(0);

  // Accede a la cola de solicitudes pendientes
  await nav.getByRole('link', { name: 'Solicitudes', exact: true }).click();
  await expect(page).toHaveURL(/\/stage-changes/);
  await expect(page.getByRole('heading', { name: /Solicitudes/i })).toBeVisible();
});
