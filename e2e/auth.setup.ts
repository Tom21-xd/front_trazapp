import { test as setup, expect, type Page } from '@playwright/test';
import {
  ADMIN_STORAGE,
  SUPERVISOR_STORAGE,
  TRABAJADOR_STORAGE,
} from './constants';

/**
 * Setup de autenticación: inicia sesión UNA sola vez por rol y guarda el
 * estado (localStorage con el token) para que el resto de specs lo reutilicen
 * sin volver a loguearse. Así evitamos chocar con el rate-limit del login
 * (5 intentos/min) cuando hay muchos tests.
 */
async function login(page: Page, email: string, password: string, path: string) {
  await page.goto('/login');
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await page.waitForURL(/\/(dashboard|board|activities|my-tasks)/);
  await page.context().storageState({ path });
}

setup('authenticate as admin', async ({ page }) => {
  await login(page, 'admin@trazapp.com', 'admin123', ADMIN_STORAGE);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    /Bienvenido/i,
  );
});

setup('authenticate as supervisor', async ({ page }) => {
  await login(
    page,
    'supervisor@trazapp.com',
    'supervisor123',
    SUPERVISOR_STORAGE,
  );
});

setup('authenticate as trabajador', async ({ page }) => {
  await login(
    page,
    'trabajador@trazapp.com',
    'trabajador123',
    TRABAJADOR_STORAGE,
  );
});
