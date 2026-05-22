import { test, expect, type Page } from '@playwright/test';
import { SUPERVISOR_STORAGE, TRABAJADOR_STORAGE } from './constants';

/**
 * E2E por rol — verifica que el RBAC granular se refleja en la navegación.
 *
 * Reutiliza el storageState generado por auth.setup.ts (sin re-loguear) para
 * no agotar el rate-limit del login. El login en sí se cubre en golden-path.
 *
 * El Trabajador NO debe ver la sección "Administración"; el Supervisor ve
 * Etapas/Etiquetas pero NO Usuarios/Roles/Auditoría.
 */

// Hay dos <aside> en el DOM (móvil oculto + escritorio); nos quedamos con el visible.
const sidebar = (page: Page) =>
  page.locator('aside:visible').filter({ has: page.locator('[data-tour="sidebar-nav"]') });

test.describe('RBAC · Trabajador', () => {
  test.use({ storageState: TRABAJADOR_STORAGE });

  test('ve sus tareas y NO la sección de Administración', async ({ page }) => {
    await page.goto('/dashboard');
    const nav = sidebar(page);

    await expect(nav.getByRole('link', { name: 'Mis Tareas', exact: true })).toBeVisible();

    await expect(nav.getByText('Administración', { exact: true })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
    await expect(
      nav.getByRole('link', { name: 'Roles y permisos', exact: true }),
    ).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Reportes', exact: true })).toHaveCount(0);

    await nav.getByRole('link', { name: 'Mis Tareas', exact: true }).click();
    await expect(page).toHaveURL(/\/my-tasks/);
  });
});

test.describe('RBAC · Supervisor', () => {
  test.use({ storageState: SUPERVISOR_STORAGE });

  test('ve Administración (sin Usuarios/Roles) y la cola de Solicitudes', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    const nav = sidebar(page);

    await expect(nav.getByText('Administración', { exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Etapas', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Reportes', exact: true })).toBeVisible();

    await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
    await expect(
      nav.getByRole('link', { name: 'Roles y permisos', exact: true }),
    ).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Auditoría', exact: true })).toHaveCount(0);

    await nav.getByRole('link', { name: 'Solicitudes', exact: true }).click();
    await expect(page).toHaveURL(/\/stage-changes/);
    await expect(page.getByRole('heading', { name: /Solicitudes/i })).toBeVisible();
  });
});
