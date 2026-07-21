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
  await expect(page.locator('#encBody')).toContainText('Test-Goblin');
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
  await expect(page.locator('#dbBody')).toContainText('Goblin');
});

test('adding a weapon in the Waffen tab shows it in the list', async ({ page }) => {
  await page.click('#burgerBtn');
  await page.click('#openDb');
  await page.click('[data-tab="waffen"]');
  await page.click('#wpAddToggle');
  await page.fill('#newWpName', 'Testklinge');
  await page.fill('#newWpDesc', '99, 1W4');
  await page.click('#addWp');
  await expect(page.locator('#weaponBody')).toContainText('Testklinge');
});

test('round counter increases via the phase system after a full cycle', async ({ page }) => {
  await page.click('#addToggle');
  await page.click('[data-addmode="manual"]');
  await page.fill('#quickName', 'Rundentest');
  await page.fill('#quickLp', '10');
  await page.click('#quickAdd');

  await expect(page.locator('#roundNum')).toHaveText('1');
  await page.click('#phaseMainBtn'); // Initiative -> Sortieren
  await page.click('#phaseMainBtn'); // Sortieren -> Nächste Figur (turn 1)
  await page.click('#phaseMainBtn'); // only 1 fighter -> Neue Runde
  await page.click('#phaseMainBtn'); // Neue Runde -> Initiative, round++
  await expect(page.locator('#roundNum')).toHaveText('2');
});
