/**
 * demo-producer.mjs
 * Graba un video del flujo completo del productor:
 *   Login → Dashboard → Pedidos → Productos → Modales (crear/editar/stock)
 *
 * Uso: node scripts/demo-producer.mjs
 * Requiere: npx playwright install chromium
 */
import { chromium } from 'playwright';
import { rename, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const DEMOS_DIR = path.join(ROOT, 'demos');
const BASE_URL  = 'http://localhost:5173';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await mkdir(DEMOS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 700 });
  const context = await browser.newContext({
    viewport:        { width: 390, height: 844 },
    deviceScaleFactor: 2,
    recordVideo: { dir: DEMOS_DIR, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();

  try {
    /* ── 1. LOGIN ─────────────────────────────────────────────────── */
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await pause(1200);

    await page.locator('#email').fill('roberto@productor.com');
    await pause(600);
    await page.locator('#password').fill('productor123');
    await pause(600);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('**/productor**', { timeout: 12000 });
    await pause(2500);

    /* ── 2. STATS — scroll para ver tarjetas de resumen ──────────── */
    await page.mouse.wheel(0, 200);
    await pause(2000);

    /* ── 3. SECCIÓN PEDIDOS — scroll hasta verla ─────────────────── */
    await page.mouse.wheel(0, 400);
    await pause(2500);

    /* ── 4. SECCIÓN PRODUCTOS — scroll hasta verla ───────────────── */
    await page.mouse.wheel(0, 600);
    await pause(2000);

    /* ── 5. ABRIR MODAL "NUEVO PRODUCTO" ─────────────────────────── */
    await page.getByRole('button', { name: /agregar/i }).first().click();
    await pause(2500);   // mostrar el modal abierto

    /* ── 6. CERRAR MODAL ─────────────────────────────────────────── */
    // El modal tiene un botón X (lucide X icon) o cancelar
    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await pause(1200);

    /* ── 7. ABRIR MODAL "EDITAR PRODUCTO" (primer producto) ──────── */
    // Botón de editar (title="Editar producto")
    await page.locator('button[title="Editar producto"]').first().click();
    await pause(2500);   // mostrar modal de edición

    /* ── 8. CERRAR MODAL EDICIÓN ─────────────────────────────────── */
    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await pause(1200);

    /* ── 9. ABRIR MODAL "AJUSTAR STOCK" (primer producto) ────────── */
    // Botón ArrowUpCircle (title="Ajustar stock")
    await page.locator('button[title="Ajustar stock"]').first().click();
    await pause(2500);   // mostrar modal de stock con presets

    /* ── 10. SELECCIONAR PRESET "Cosecha nueva" ──────────────────── */
    await page.getByText(/cosecha nueva/i).first().click();
    await pause(1500);

    /* ── 11. CERRAR MODAL STOCK ──────────────────────────────────── */
    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await pause(1500);

    /* ── 12. SCROLL FINAL — vista general del dashboard ─────────── */
    await page.mouse.wheel(0, -9999);
    await pause(2000);

  } finally {
    const tmpPath = await page.video().path();
    await context.close();
    await browser.close();
    const outPath = path.join(DEMOS_DIR, 'productor.webm');
    await rename(tmpPath, outPath);
    console.log(`✅  Video guardado → demos/productor.webm`);
  }
})();
