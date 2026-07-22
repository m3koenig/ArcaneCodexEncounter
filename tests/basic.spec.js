const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
});

test('page loads with title and empty-state message', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('Codex Initiative');
  await expect(page.locator('#emptyState')).toBeVisible();
});

test('quick-add a fighter and see it in the encounter list', async ({ page }) => {
  await page.click('#addToggle');
  await page.click('[data-addmode="manual"]');
  await page.fill('#quickName', 'Test-Goblin');
  await page.fill('#quickLp', '20');
  await page.fill('#quickBonus', '2');
  await page.fill('#quickKo', '5');
  await page.click('#quickAdd');

  await expect(page.locator('#emptyState')).toBeHidden();
  // Namen stehen als Input-Value, nicht als Text -> toHaveValue statt toContainText
  await expect(page.locator('#encBody [data-field="name"]').first()).toHaveValue('Test-Goblin');
});

test('rolling initiative fills in a value', async ({ page }) => {
  await page.click('#addToggle');
  await page.click('[data-addmode="manual"]');
  await page.fill('#quickName', 'Wurf-Test');
  await page.fill('#quickLp', '10');
  await page.fill('#quickBonus', '3');
  await page.click('#quickAdd');

  const row = page.locator('tr.main-row').first();
  await row.locator('[data-action="rollInit"]').click();
  const initValue = await row.locator('[data-field="initValue"]').inputValue();
  expect(Number(initValue)).toBeGreaterThanOrEqual(2 + 3); // 2W10 min (2) + Bonus (3)
  expect(Number(initValue)).toBeLessThanOrEqual(20 + 3); // 2W10 max (20) + Bonus (3)
});

test('phase button advances from Initiative to Sortieren', async ({ page }) => {
  await page.click('#addToggle');
  await page.click('[data-addmode="manual"]');
  await page.fill('#quickName', 'Phasen-Test');
  await page.fill('#quickLp', '10');
  await page.click('#quickAdd');

  await expect(page.locator('#phaseMainBtn')).toContainText('Initiative!');
  await page.click('#phaseMainBtn');
  await expect(page.locator('#phaseMainBtn')).toContainText('Sortieren!');
  await page.click('#phaseMainBtn');
  await expect(page.locator('#phaseMainBtn')).toContainText('Nächste Figur');
});

test('database modal opens via burger menu and shows seeded fighters', async ({ page }) => {
  await page.click('#burgerBtn');
  await page.click('#openDb');
  await expect(page.locator('#dbModal')).toHaveClass(/open/);
  // Seed-Daten kommen async aus default-database.json -> Assertion wartet automatisch (Playwright Auto-Retry)
  await expect(page.locator('#dbBody input[data-f="name"][value="Goblin"]')).toBeVisible();
});

test('adding a weapon in the Waffen tab shows it in the list', async ({ page }) => {
  await page.click('#burgerBtn');
  await page.click('#openDb');
  await page.click('[data-tab="waffen"]');
  await page.click('#wpAddToggle');
  await page.fill('#newWpName', 'Testklinge');
  await page.fill('#newWpDesc', '99, 1W4');
  await page.click('#addWp');
  await expect(page.locator('#weaponBody input[data-f="name"][value="Testklinge"]')).toBeVisible();
});

test('round counter increases when the "Neue Runde"-phase is run directly via the submenu', async ({ page }) => {
  await page.click('#addToggle');
  await page.click('[data-addmode="manual"]');
  await page.fill('#quickName', 'Rundentest');
  await page.fill('#quickLp', '10');
  await page.click('#quickAdd');

  await expect(page.locator('#roundNum')).toHaveText('1');

  // Direkt ueber das Untermenue die "Neue Runde"-Phase ausloesen, unabhaengig
  // von der aktuellen Phase -> robuster als die Klick-Kette nachzuzaehlen.
  await page.click('#phaseCaretBtn');
  await page.click('#phaseMenu [data-phase="round"]');

  await expect(page.locator('#roundNum')).toHaveText('2');
});
