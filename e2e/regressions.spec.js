import { test, expect } from '@playwright/test';

const bits = value => BigInt.asUintN(8, BigInt(value)).toString(2).padStart(8, '0');

test('odrzucona zmiana NB na U2 zachowuje wpisane liczby i ostatni wynik', async ({ page }) => {
  await page.goto('/?a=1101&x=1011&s=nb&m=booth&v=all#workspace');
  await page.getByRole('button', { name: 'Dziesiętnie', exact: true }).click();
  await page.locator('#operand-a').fill('15');
  await page.locator('#operand-x').fill('3');
  await page.getByRole('button', { name: 'U2', exact: true }).click();
  await expect(page.locator('#form-error')).toContainText('Zmiana na U2');
  await expect(page.locator('#operand-a')).toHaveValue('15');
  await expect(page.locator('#operand-x')).toHaveValue('3');
  await expect(page.getByRole('button', { name: 'NB', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('143');
  await page.locator('#operand-a').fill('7');
  await page.getByRole('button', { name: 'U2', exact: true }).click();
  await expect(page.locator('#form-error')).toBeHidden();
  await expect(page.locator('#operand-a')).toHaveValue('7');
  await expect(page.locator('#operand-x')).toHaveValue('3');
  await expect(page.getByRole('button', { name: 'U2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('21');
});

test('format dziesiętny od razu uzgadnia wspólną szerokość z siatką', async ({ page }) => {
  await page.goto('/?a=1011010101&x=101101&s=u2&m=booth&v=all#workspace');
  await expect(page.locator('#paper-code')).toHaveText('U2 / 16 bitów');
  await page.getByRole('button', { name: 'Dziesiętnie', exact: true }).click();
  await expect(page.getByLabel('Szerokość obu liczb')).toHaveValue('10');
  await expect(page.locator('#a-width')).toHaveText('10 bitów');
  await expect(page.locator('#x-width')).toHaveText('10 bitów');
  await expect(page.locator('#paper-code')).toHaveText('U2 / 20 bitów');
  await expect(page.locator('.partial-row')).toHaveCount(10);
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('5681');
  await page.getByRole('button', { name: 'Binarnie', exact: true }).click();
  await expect(page.locator('#operand-a')).toHaveValue('1011010101');
  await expect(page.locator('#operand-x')).toHaveValue('1111101101');
});

test('Wstecz z całości modulo przechodzi do sumy przed przycięciem', async ({ page }) => {
  await page.goto('/?a=1101&x=1011&s=u2&m=modulo&v=all#workspace');
  await page.getByRole('button', { name: 'Wstecz', exact: false }).click();
  await expect(page.getByLabel('Etap obliczeń')).toHaveValue('9');
  await expect(page.locator('.full-sum-row')).toHaveCount(1);
  await expect(page.locator('.full-sum-row .discarded')).toHaveCount(0);
  await expect(page.locator('.result-row.complete')).toHaveCount(0);
  await expect(page.locator('#explanation h3')).toHaveText('Suma przed przycięciem');
  await page.getByRole('button', { name: 'Przytnij do 8 bitów' }).click();
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('15');
});

test('historia przeglądarki odtwarza początkowy formularz i późniejsze obliczenie', async ({ page }) => {
  await page.goto('/');
  await page.locator('#operand-a').fill('0101');
  await page.locator('#operand-x').fill('0010');
  await page.locator('#calculate-button').click();
  await expect(page.locator('#paper-equation')).toHaveText('5 × 2');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#operand-a')).toHaveValue('1101');
  await expect(page.locator('#operand-x')).toHaveValue('1011');
  await expect(page.locator('#paper-equation')).toHaveText('(−3) × (−5)');
  await page.goForward();
  await expect(page.locator('#operand-a')).toHaveValue('0101');
  await expect(page.locator('#operand-x')).toHaveValue('0010');
  await expect(page.locator('#paper-equation')).toHaveText('5 × 2');
});

test('mobilny pasek kroków pozostaje dostępny podczas dodawania wierszy i czytania opisu', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Pasek jest przyklejony tylko w widoku mobilnym.');
  await page.goto('/?a=1111111111111111&x=1111111111111111&s=u2&m=modulo&v=step&k=0#workspace');
  const toolbar = page.locator('.step-controls');
  const visible = async () => toolbar.evaluate(element => {
    const box = element.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight + 1;
  });
  await expect.poll(visible).toBe(true);
  for (let step = 1; step <= 3; step++) {
    const before = await toolbar.boundingBox();
    await page.getByRole('button', { name: 'Dalej', exact: false }).click();
    await expect(page.getByLabel('Etap obliczeń')).toHaveValue(String(step));
    await expect.poll(visible).toBe(true);
    const after = await toolbar.boundingBox();
    expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await expect.poll(visible).toBe(true);
  const narrowPosition = await toolbar.boundingBox();
  await page.getByRole('button', { name: 'Dalej', exact: false }).click();
  await expect(page.getByLabel('Etap obliczeń')).toHaveValue('4');
  expect(Math.abs((await toolbar.boundingBox()).y - narrowPosition.y)).toBeLessThan(2);
  await page.locator('#explanation').scrollIntoViewIfNeeded();
  await expect.poll(visible).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Booth NB: uzupełnienie dodatniej mnożnej ma zerowy bit znaku i właściwy wiersz', async ({ page }) => {
  await page.goto('/?a=101&x=11&s=nb&m=booth&v=step&k=1#workspace');
  await expect(page.locator('#explanation [data-step="operand"]')).toContainText('A z NB zapisujemy jako dodatnie U2, z bitem znaku 0');
  await expect(page.locator('#explanation [data-step="operand"] code')).toHaveText('A: 00101\nOdwrócone bity: 11010\nPo dodaniu 1 (−A): 11011');
  await expect(page.locator('#explanation .grid-step-bits')).toHaveText('11011');
  await expect(page.locator('.current-row .row-label small')).toHaveText('−5 dziesiętnie');
});

test('cyfra −2 używa uzupełnienia i właściwej wielokrotności A w obu wariantach bazy 4', async ({ page }) => {
  for (const example of [
    { method: 'mcsorley', a: '0011', x: '0110', step: 1, multiple: 2, value: -6 },
    { method: 'alternative-mcsorley', a: '0011', x: '0100', step: 2, multiple: 4, value: -12 }
  ]) {
    await page.goto(`/?a=${example.a}&x=${example.x}&s=u2&m=${example.method}&v=step&k=${example.step}#workspace`);
    await expect(page.locator('#explanation [data-step="recoding"]')).toContainText('= -2');
    await expect(page.locator('#explanation [data-step="operand"]')).toContainText(`mnożymy −A przez ${example.multiple}`);
    await expect(page.locator('#explanation [data-step="operand"] code')).toHaveText('A: 00000011\nOdwrócone bity: 11111100\nPo dodaniu 1 (−A): 11111101');
    await expect(page.locator('#explanation .grid-step-bits')).toHaveText(bits(example.value));
    await expect(page.locator('.current-row .row-label small')).toHaveText(`−${-example.value} dziesiętnie`);
  }
});
