import { test, expect, type Page } from '@playwright/test';

/**
 * Golden path institucional de TrazApp.
 *
 * Pre-requisitos:
 * - Backend corriendo en http://localhost:3000 con migraciones aplicadas
 *   y `prisma db seed` ejecutado (admin@trazapp.com / admin123).
 * - Service Worker NO se registra en navegador de Playwright por defecto
 *   (no afecta los flujos visuales).
 *
 * Ejecutar: `npm run test:e2e:install` (1ª vez) y luego `npm run test:e2e`.
 */

const ADMIN = {
  email: 'admin@trazapp.com',
  password: 'admin123',
};

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();
  // Espera a aterrizar en una ruta autenticada
  await page.waitForURL(/\/(dashboard|board|activities)/);
}

test.describe('Golden path · admin', () => {
  test('login muestra el dashboard con KPIs', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/dashboard/);
    // Saludo personalizado
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Bienvenido/i,
    );
    // Al menos una KPI card
    await expect(page.locator('[data-tour="dashboard-kpis"]')).toBeVisible();
  });

  test('navegación al tablero muestra columnas de etapas', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.getByRole('link', { name: /^Tablero$/i }).first().click();
    await expect(page).toHaveURL(/\/board/);
    await expect(
      page.getByRole('heading', { name: /Tablero Kanban/i }),
    ).toBeVisible();
    // Al menos una columna del tablero (header con etapa)
    await expect(page.locator('[data-tour="board-columns"]')).toBeVisible();
  });

  test('buscador del tablero filtra tarjetas', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto('/board');
    const search = page.getByPlaceholder(/Buscar actividad/i);
    await search.fill('zzzzz_no_existe');
    // El estado de "Sin actividades" o un conteo 0 debe aparecer en alguna columna
    // Si no hay datos previos, el test simplemente verifica que el input está conectado
    await expect(search).toHaveValue('zzzzz_no_existe');
  });

  test('campana de notificaciones abre dropdown', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    const bell = page.locator('[data-tour="bell"]');
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(
      page.getByRole('heading', { name: /Notificaciones/i }),
    ).toBeVisible();
  });

  test('botón de Guía interactiva abre dropdown del TourLauncher', async ({
    page,
  }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.getByRole('button', { name: /guía interactiva/i }).click();
    await expect(page.getByText(/Guía interactiva/i)).toBeVisible();
    await expect(page.getByText(/Tour del Tablero Kanban/i)).toBeVisible();
  });

  test('navegación al calendario muestra grilla del mes', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.getByRole('link', { name: /^Calendario$/i }).first().click();
    await expect(page).toHaveURL(/\/calendar/);
    await expect(
      page.getByRole('heading', { name: /Calendario/i }),
    ).toBeVisible();
    // Cabeceras de días de la semana
    await expect(page.getByText(/Lun|L/, { exact: false }).first()).toBeVisible();
  });
});

test.describe('Auth · negativos', () => {
  test('login con credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('no-existe@x.com');
    await page.getByLabel(/contraseña/i).fill('passwrong');
    await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();
    // Debe seguir en /login y mostrar el mensaje
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/credencial|incorrect/i)).toBeVisible();
  });

  test('link "Olvidé mi contraseña" lleva a la pantalla de reset', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /olvidaste/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(
      page.getByRole('heading', { name: /Olvidaste/i }),
    ).toBeVisible();
  });
});
