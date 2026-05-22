import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E del golden path institucional.
 *
 * Pre-requisito: el backend debe estar arriba en http://localhost:3000 con la
 * BD seeded (admin@trazapp.com / admin123). Playwright se encarga sólo del
 * frontend: levanta `npm run dev` antes de los tests si no detecta nada en
 * el puerto 3001.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // los tests comparten BD; serializar para evitar drift
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  },

  projects: [
    // Autentica una vez como admin y deja el storageState listo.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependsOn: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
