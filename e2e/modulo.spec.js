import { test, expect } from '@playwright/test';
import { moduloCases } from '../test/fixtures/modulo.js';

const fmt = value => String(value).replace(/-/g, '−');
const bits = locator => locator.locator('.bit').evaluateAll(cells => cells.map(cell => cell.textContent).join(''));

for (const example of moduloCases) test(`bonus modulo — ${example.title}`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const params = new URLSearchParams({ a: example.input.a, x: example.input.x, s: example.input.system, m: 'modulo', v: 'all' });
  await page.goto(`/?${params}#workspace`);
  const k = example.result.length;
  await expect(page.getByLabel('Metoda mnożenia')).toHaveValue('modulo');
  await expect(page.locator('#preparation')).toContainText(`k = n + m = ${example.input.a.length} + ${example.input.x.length} = ${k}`);
  await expect(page.locator('#preparation')).toContainText('poza podstawowym materiałem');
  expect(await bits(page.locator('.multiplicand-row'))).toBe(example.a);
  expect(await bits(page.locator('.multiplier-row'))).toBe(example.x);
  await expect(page.locator('.multiplicand-row .extended')).toHaveCount(k - example.input.a.length);
  await expect(page.locator('.multiplier-row .extended')).toHaveCount(k - example.input.x.length);
  await expect(page.locator('.complement-row')).toHaveCount(0);
  await expect(page.locator('#recoding-section')).toBeHidden();
  await expect(page.locator('.partial-row')).toHaveCount(k);
  if (example.rows) await expect(page.locator('.partial-row .row-label small')).toHaveText(example.rows.map(value => `${value} dziesiętnie`));
  expect(await bits(page.locator('.full-sum-row'))).toBe(example.full);
  await expect(page.locator('.full-sum-row .discarded')).toHaveCount(k);
  expect(await bits(page.locator('.result-row.complete'))).toBe(example.result);
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText(fmt(example.product));
  await expect(page.locator('.modulo-note')).toContainText('Odrzucamy');
  await expect(page.getByRole('button', { name: `Przytnij do ${k} bitów` })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText(fmt(example.product));
  expect(errors).toEqual([]);
});

test('bonus modulo — każdy wiersz, osobna suma, przycięcie, cofanie i podświetlenia', async ({ page }) => {
  await page.goto('/?a=1101&x=1011&s=u2&m=modulo&k=0#workspace');
  await expect(page.locator('.partial-row')).toHaveCount(0);
  await expect(page.locator('.result-row.complete')).toHaveCount(0);
  for (let i = 0; i < 8; i++) {
    await page.getByRole('button', { name: 'Dalej', exact: false }).click();
    await expect(page.locator('.partial-row')).toHaveCount(i + 1);
    await expect(page.locator('.multiplier-row .considered')).toHaveAttribute('data-position', String(i));
    await expect(page.locator('.full-sum-row')).toHaveCount(0);
  }
  await expect(page.locator('#explanation')).toContainText('z rozszerzenia');
  await page.getByRole('button', { name: 'Zsumuj' }).click();
  expect(await bits(page.locator('.full-sum-row'))).toBe('1111100000001111');
  await expect(page.locator('.discarded')).toHaveCount(0);
  await expect(page.locator('.result-row.complete')).toHaveCount(0);
  await expect(page.locator('#explanation h3')).toHaveText('Suma przed przycięciem');
  await page.getByRole('button', { name: 'Przytnij do 8 bitów' }).click();
  expect(await bits(page.locator('.result-row.complete'))).toBe('00001111');
  await expect(page.locator('.full-sum-row .discarded')).toHaveCount(8);
  await page.getByRole('button', { name: 'Wstecz' }).click();
  await expect(page.locator('.discarded')).toHaveCount(0);
  await expect(page.locator('.result-row.complete')).toHaveCount(0);
  await page.getByRole('button', { name: 'Całość', exact: true }).click();
  await page.getByText('Podświetlenia', { exact: true }).click();
  await expect(page.locator('.multiplicand-row .extended')).toHaveCount(4);
  await expect(page.locator('.full-sum-row .discarded')).toHaveCount(8);
  await page.getByLabel('Metoda mnożenia').selectOption('ordinary');
  await expect(page.locator('.full-sum-row')).toHaveCount(0);
  await expect(page.locator('.complement-a')).toBeVisible();
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('15');
});
