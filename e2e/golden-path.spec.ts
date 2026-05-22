import { test, expect } from '@playwright/test';
import { ADMIN_STORAGE } from './constants';

/**
 * Golden path institucional de TrazApp.
 *
 * Pre-requisitos:
 * - Backend en http://localhost:3000 con migraciones y `prisma db seed`
 *   (admin@trazapp.com / admin123).
 * - El proyecto "setup" inicia sesión una vez y deja el storageState; estos
 *   tests lo reutilizan (sin re-loguearse) para no agotar el rate-limit.
 *
 * Ejecutar: `npm run test:e2e:install` (1ª vez) y luego `npm run test:e2e`.
 */

test.describe('Golden path · admin', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('dashboard muestra saludo y KPIs', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Bienvenido/i,
    );
    await expect(page.locator('[data-tour="dashboard-kpis"]')).toBeVisible();
  });

  test('el tablero muestra columnas de etapas', async ({ page }) => {
    await page.goto('/board');
    await expect(
      page.getByRole('heading', { name: /Tablero Kanban/i }),
    ).toBeVisible();
    await expect(page.locator('[data-tour="board-columns"]')).toBeVisible();
  });

  test('el buscador del tablero acepta texto', async ({ page }) => {
    await page.goto('/board');
    const search = page.getByPlaceholder(/Buscar actividad/i);
    await search.fill('zzzzz_no_existe');
    await expect(search).toHaveValue('zzzzz_no_existe');
  });

  test('la campana de notificaciones abre el dropdown', async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.locator('[data-tour="bell"]');
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(
      page.getByRole('heading', { name: /Notificaciones/i }),
    ).toBeVisible();
  });

  test('el botón de Guía interactiva abre el TourLauncher', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /guía interactiva/i }).click();
    await expect(page.getByText(/Tour del Tablero Kanban/i)).toBeVisible();
  });

  test('el calendario muestra la grilla del mes', async ({ page }) => {
    await page.goto('/calendar');
    await expect(
      page.getByRole('heading', { name: /Calendario/i }),
    ).toBeVisible();
  });
});

test.describe('Auth · negativos', () => {
  // Sin sesión: estos tests viven en la pantalla de login.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login con credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('no-existe@x.com');
    await page.getByLabel(/contraseña/i).fill('passwrong');
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/credenciales incorrectas/i)).toBeVisible();
  });

  test('"¿Olvidaste tu contraseña?" lleva a la pantalla de reset', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /olvidaste/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(
      page.getByRole('heading', { name: /Olvidaste|Recuperar/i }),
    ).toBeVisible();
  });
});
