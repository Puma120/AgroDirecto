/**
 * demo-consumer.mjs
 * Graba un video del flujo completo del consumidor:
 *   Login → Catálogo → Detalle → Carrito → Checkout → Éxito
 *
 * Uso: node scripts/demo-consumer.mjs
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

    await page.locator('#email').fill('maria@ejemplo.com');
    await pause(600);
    await page.locator('#password').fill('123456');
    await pause(600);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('**/catalogo', { timeout: 12000 });
    await pause(2000);

    /* ── 2. CATÁLOGO — scroll para mostrar productos ──────────────── */
    await page.mouse.wheel(0, 260);
    await pause(1800);

    /* ── 3. ABRIR PRIMER PRODUCTO ─────────────────────────────────── */
    await page.locator('article').first().click();
    await page.waitForLoadState('networkidle');
    await pause(2000);

    /* ── 4. AGREGAR AL CARRITO ────────────────────────────────────── */
    await page.getByRole('button', { name: /agregar al carrito|agregar más/i }).click();
    await pause(1800);

    /* ── 5. IR AL CARRITO ─────────────────────────────────────────── */
    await page.goto(`${BASE_URL}/carrito`);
    await page.waitForLoadState('networkidle');
    await pause(2000);

    /* ── 6. PROCEDER AL PAGO (con validación de stock) ────────────── */
    await page.getByRole('button', { name: /proceder al pago|verificando/i }).click();
    await page.waitForURL('**/checkout', { timeout: 12000 });
    await pause(1500);

    /* ── 7. PASO 1 — elegir Punto de recolecta (sin llenar dirección) */
    await page.getByRole('button', { name: /punto de recolecta/i }).click();
    await pause(1000);
    // Seleccionar primer punto de recolecta
    await page.getByText('Mercado Municipal El Alto').click();
    await pause(1200);
    // Continuar (ya válido porque pickup seleccionado)
    await page.getByRole('button', { name: /continuar a entrega/i }).click();
    await pause(1800);

    /* ── 8. PASO 2 — slot y pago ya seleccionados por defecto ─────── */
    await pause(2000);
    await page.getByRole('button', { name: /revisar mi pedido/i }).click();
    await pause(1800);

    /* ── 9. PASO 3 — resumen del pedido ───────────────────────────── */
    await pause(2200);
    await page.getByRole('button', { name: /confirmar pedido/i }).click();
    await pause(3500);

  } finally {
    const tmpPath = await page.video().path();
    await context.close();
    await browser.close();
    const outPath = path.join(DEMOS_DIR, 'consumidor.webm');
    await rename(tmpPath, outPath);
    console.log(`✅  Video guardado → demos/consumidor.webm`);
  }
})();
