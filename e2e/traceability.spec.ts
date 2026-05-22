import { test, expect, request as pwRequest } from '@playwright/test';
import { readFileSync } from 'fs';
import { ADMIN_STORAGE } from './constants';

/** Extrae el accessToken guardado en el storageState del admin (sin re-loguear,
 *  para no consumir el rate-limit del login). */
function adminTokenFromStorage(): string {
  const state = JSON.parse(readFileSync(ADMIN_STORAGE, 'utf-8')) as {
    origins?: { localStorage?: { name: string; value: string }[] }[];
  };
  for (const origin of state.origins ?? []) {
    const tok = origin.localStorage?.find((e) => e.name === 'accessToken');
    if (tok?.value) return tok.value;
  }
  throw new Error('No se encontró accessToken en el storageState del admin');
}

/**
 * E2E de trazabilidad de punta a punta: solicitar un cambio de etapa,
 * aprobarlo y comprobar que ambos eventos quedan registrados en la línea
 * de tiempo de la actividad.
 *
 * El admin tiene todos los permisos (solicitar, revisar), así que ejecuta
 * el ciclo completo sin depender de asignaciones concretas. La actividad
 * se crea vía API en el setup para no depender de datos previos.
 */

const API = process.env.E2E_API_URL || 'http://localhost:3000/api';

test.describe('Trazabilidad · solicitar → aprobar → timeline', () => {
  test.use({ storageState: ADMIN_STORAGE });

  let activityId: string;

  test.beforeAll(async () => {
    const ctx = await pwRequest.newContext();
    const headers = { Authorization: `Bearer ${adminTokenFromStorage()}` };

    const toList = (r: unknown) =>
      Array.isArray(r) ? r : ((r as { data?: unknown[] })?.data ?? []);

    const stages = toList(
      await (await ctx.get(`${API}/stages?all=true`, { headers })).json(),
    ) as { id: string; order: number }[];
    const pendiente = stages.find((s) => s.order === 0) ?? stages[0];

    const projects = toList(
      await (await ctx.get(`${API}/projects`, { headers })).json(),
    ) as { id: string }[];

    const created = await ctx.post(`${API}/activities`, {
      headers,
      data: {
        title: `E2E Trazabilidad ${Date.now()}`,
        description: 'Actividad creada por el test E2E de trazabilidad.',
        projectId: projects[0].id,
        currentStageId: pendiente.id,
        priority: 'MEDIA',
      },
    });
    expect(created.ok()).toBeTruthy();
    activityId = (await created.json()).id;
    await ctx.dispose();
  });

  test('el ciclo de cambio de etapa queda en la línea de tiempo', async ({
    page,
  }) => {
    await page.goto(`/activities/${activityId}`);

    // 1) Solicitar cambio de etapa (botón del stepper, siempre visible;
    //    el de la barra sticky superior está oculto hasta hacer scroll)
    await page
      .locator('[data-tour="detail-stepper"]')
      .getByRole('button', { name: 'Solicitar cambio' })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Nueva etapa').click();
    await page.getByRole('option').first().click();
    await dialog
      .getByLabel('Motivo del cambio')
      .fill('Avance E2E completado, listo para revisión.');
    await dialog.getByRole('button', { name: 'Enviar solicitud' }).click();

    // 2) Aprobar la solicitud recién creada
    await expect(page.getByText(/Solicitudes de cambio/)).toBeVisible();
    await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
    await page
      .getByRole('button', { name: 'Confirmar aprobación' })
      .click();

    // 3) La trazabilidad refleja ambos eventos
    await expect(
      page.getByText(/solicitó cambio de etapa/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/aprobó el cambio de etapa/i).first(),
    ).toBeVisible();
  });
});
