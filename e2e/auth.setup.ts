import { test as setup, expect } from '@playwright/test';
import { ADMIN_STORAGE } from './constants';

/**
 * Setup de autenticación: inicia sesión UNA sola vez como admin y guarda el
 * estado (localStorage con el token) para que el resto de specs lo reutilicen
 * sin volver a loguearse. Así evitamos chocar con el rate-limit del login
 * (5 intentos/min) cuando hay muchos tests.
 */

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/correo|email/i).fill('admin@trazapp.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /ingresar/i }).click();
  await page.waitForURL(/\/dashboard/);
  // El token se persiste en localStorage tras el login; capturamos el estado.
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Bienvenido/i);
  await page.context().storageState({ path: ADMIN_STORAGE });
});
