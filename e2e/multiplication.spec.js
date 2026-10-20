import { test as base, expect } from '@playwright/test';
import { examples, goldenCases } from '../test/fixtures/multiplication.js';

// Jedynym współdzielonym wejściem są stałe rozpiski. Test przeglądarki
// nie importuje silnika ani funkcji renderujących aplikacji.
const test = base.extend({
  appErrors: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await use(errors);
    expect(errors, 'Strona nie powinna zgłaszać błędów JavaScript ani ładowania zasobów').toEqual([]);
  }, { auto: true }]
});

const fmt = value => String(value).replace(/-/g, '−');
const encoded = (value, width) => BigInt.asUintN(width, BigInt(value)).toString(2).padStart(width, '0');
const small = examples.find(example => example.id === 'small');
const hasRecoding = method => !['ordinary', 'no-extension'].includes(method);
const displayedBits = locator => locator.locator('.bit').evaluateAll(cells => cells.map(cell => cell.textContent || ' ').join(''));

async function expectAtWorkspace(page) {
  await expect(page.locator('#workspace')).toBeFocused();
  await expect.poll(() => page.locator('#workspace').evaluate(section => {
    const top = section.getBoundingClientRect().top;
    return top >= 0 && top <= 24;
  })).toBe(true);
}

async function openExample(page, example, method) {
  await page.goto('/');
  if (example.id === 'adamski') {
    await page.locator('#operand-a').fill(example.input.a);
    await page.locator('#operand-x').fill(example.input.x);
    await page.getByRole('button', { name: /Rozpisz mnożenie|Przelicz nowe liczby/ }).click();
  } else {
    await page.locator(`[data-example="${example.id}"]`).click();
  }
  await page.getByLabel('Metoda mnożenia').selectOption(method);
}

for (const { example, method, expected } of goldenCases) {
  test(`${example.title}: ${method} — zgodność rozpiski obliczenia`, async ({ page }) => {
    await openExample(page, example, method);
    await page.getByRole('button', { name: 'Całość', exact: true }).click();
    const workWidth = expected.workWidth ?? example.result.length;
    const payloadWidth = (expected.preparedA ?? example.input.a).length;
    const rowBits = expected.rows.map(([, shift, value], index) => {
      const full = encoded(value, workWidth);
      const padding = method === 'no-extension' && index < expected.rows.length - 1 ? workWidth - payloadWidth - shift : 0;
      return ' '.repeat(padding) + full.slice(padding);
    });

    await expect(page.locator('.partial-row')).toHaveCount(expected.rows.length);
    const actualBits = await page.locator('.partial-row').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('.bit')].map(cell => cell.textContent || ' ').join('')));
    expect(actualBits).toEqual(rowBits);
    if (hasRecoding(method)) {
      await expect(page.locator('#recoding-section')).toBeVisible();
      const recoded = (method.startsWith('alternative') ? expected.rows.slice(1) : expected.rows).slice().reverse();
      const actualDigits = await page.locator('.recoded-multiplier-row .recoded-cell:not(.blank)').evaluateAll(cells => cells.map(cell => [Number(cell.dataset.position), cell.textContent]));
      expect(actualDigits).toEqual(recoded.map(([digit, shift]) => [shift, digit > 0 ? `+${digit}` : fmt(digit)]));
      expect(await page.locator('#workspace').evaluate(section => {
        const table = section.querySelector('#recoding-section').getBoundingClientRect();
        const paper = section.querySelector('#paper').getBoundingClientRect();
        const complement = section.querySelector('.complement-a').getBoundingClientRect();
        const recoded = section.querySelector('.recoded-multiplier-row').getBoundingClientRect();
        const multiplicand = section.querySelector('.multiplicand-row').getBoundingClientRect();
        return table.bottom <= paper.top && complement.bottom <= recoded.top && recoded.bottom <= multiplicand.top;
      })).toBe(true);
      await expect(page.locator('#recoding-body tr td:last-child')).toHaveText(expected.rows.map(([, , value]) => fmt(value)));
      await expect(page.locator('#recoding-body tr td:nth-child(3)')).toHaveText(expected.rows.map(([digit]) => digit === null ? 'K' : digit > 0 ? `+${digit}` : fmt(digit)));
      if (expected.calculations) await expect(page.locator('#recoding-body td code')).toHaveText(expected.calculations);
      if (!method.startsWith('alternative')) await expect(page.locator('.recoded-value')).toContainText(`Przekodowanie zachowuje wartość mnożnika X = ${fmt(example.x)}`);
    } else {
      await expect(page.locator('#recoding-section')).toBeHidden();
      await expect(page.locator('.recoded-multiplier-row')).toHaveCount(0);
      await expect(page.locator('#recoding-body tr')).toHaveCount(0);
    }
    await expect(page.locator('.result-row.complete .row-label b')).toHaveText(fmt(example.product));
    expect(await displayedBits(page.locator('.result-row'))).toBe(encoded(example.product, workWidth));
    if (workWidth !== example.result.length) await expect(page.locator('.sum-note code')).toHaveText(example.result);
    await expect(page.getByRole('button', { name: /Dalej|Zsumuj/ })).toBeDisabled();
  });
}

for (const method of Object.keys(small.methods)) {
  test(`${method} — odsłanianie, cofanie i osobny krok sumowania`, async ({ page }) => {
    const expectedRows = small.methods[method].rows;
    await openExample(page, small, method);
    await page.getByRole('button', { name: 'Wróć do przygotowania' }).click();
    await expect(page.locator('.partial-row')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Wstecz' })).toBeDisabled();
    for (let index = 0; index < expectedRows.length; index++) {
      await page.getByRole('button', { name: 'Dalej', exact: false }).click();
      await expect(page.locator('.partial-row')).toHaveCount(index + 1);
      await expect(page.locator('.current-row')).toHaveAttribute('data-row', String(index));
      if (method === 'ordinary') {
        await expect(page.locator('#explanation code')).toHaveText([
          '1 · (−3) · 2^0 = −3',
          '1 · (−3) · 2^1 = −6',
          '0 · (−3) · 2^2 = 0',
          '−1 · (−3) · 2^3 = 24'
        ][index]);
      }
      const multiplierWidth = (small.methods[method].preparedX ?? small.input.x).length;
      const highlighted = small.methods[method].indices[index].filter(position => position >= 0 && position < multiplierWidth).sort((a, b) => b - a).map(String);
      expect(await page.locator('.multiplier-row .considered').evaluateAll(cells => cells.map(cell => cell.dataset.position))).toEqual(highlighted);
      await expect(page.locator('#recoding-body tr.unrevealed')).toHaveCount(hasRecoding(method) ? expectedRows.length - index - 1 : 0);
      if (hasRecoding(method)) {
        const correctionOffset = method.startsWith('alternative') ? 1 : 0;
        await expect(page.locator('.recoded-cell:not(.blank):not(.pending)')).toHaveCount(Math.max(0, index + 1 - correctionOffset));
        await expect(page.locator('.recoded-cell.considered')).toHaveCount(index < correctionOffset ? 0 : 1);
        await expect(page.locator('#explanation .grid-step-bits')).toHaveText(encoded(expectedRows[index][2], 8));
        await expect(page.locator('#explanation [data-step="grid"]')).toContainText('n + m = 4 + 4 = 8');
        if (expectedRows[index][0] < 0) {
          await expect(page.locator('#explanation [data-step="operand"]')).toContainText('Uzupełnienie −A');
          await expect(page.locator('#explanation [data-step="operand"] code')).toHaveText('A: 11111101\nOdwrócone bity: 00000010\nPo dodaniu 1 (−A): 00000011');
        }
      }
      await expect(page.locator('.result-row.complete')).toHaveCount(0);
      expect(await displayedBits(page.locator('.result-row'))).toBe('········');
    }
    if (method === 'ordinary') {
      await expect(page.locator('#preparation')).toContainText('n = 3 + 1 = 4, m = 3 + 1 = 4');
      await expect(page.locator('#preparation')).toContainText('n + m = 4 + 4 = 8');
      await expect(page.locator('#explanation h3')).toHaveText('Dodajemy uzupełnienie mnożnej (−A)');
      await expect(page.locator('#explanation p')).toContainText('n + m = 4 + 4 = 8');
      await expect(page.locator('#explanation p')).toContainText('−A = 3');
      await expect(page.locator('#explanation p')).toContainText('11111101');
      await expect(page.locator('#explanation p')).toContainText('00000011');
    }
    await page.getByRole('button', { name: 'Zsumuj' }).click();
    expect(await displayedBits(page.locator('.result-row.complete'))).toBe('00001111');
    await page.getByRole('button', { name: 'Wstecz' }).click();
    await expect(page.locator('.result-row.complete')).toHaveCount(0);
    await expect(page.locator('.partial-row')).toHaveCount(expectedRows.length);
    await page.getByLabel('Etap obliczeń').fill('1');
    await expect(page.locator('.partial-row')).toHaveCount(1);
  });
}

test('Booth — uzupełnienie dodatniej A, najmniejszej liczby i zera trafia do siatki', async ({ page }) => {
  for (const { a, source, inverted, complement } of [
    { a: '0101', source: '00000101', inverted: '11111010', complement: '11111011' },
    { a: '1000', source: '11111000', inverted: '00000111', complement: '00001000' },
    { a: '0000', source: '00000000', inverted: '11111111', complement: '00000000' }
  ]) {
    await page.goto(`/?a=${a}&x=1011&s=u2&m=booth&v=step&k=1#workspace`);
    await expect(page.locator('#explanation [data-step="recoding"] code')).toHaveText('0 − 1 = -1');
    await expect(page.locator('#explanation [data-step="operand"] code')).toHaveText(`A: ${source}\nOdwrócone bity: ${inverted}\nPo dodaniu 1 (−A): ${complement}`);
    await expect(page.locator('#explanation .grid-step-bits')).toHaveText(complement);
    expect(await displayedBits(page.locator('.current-row'))).toBe(complement);
  }
});

test('wybór wiersza zachowuje całość i przenosi fokus do odpowiedniego opisu', async ({ page }) => {
  await openExample(page, small, 'booth');
  await page.getByRole('button', { name: 'Całość', exact: true }).click();
  await page.locator('.partial-row[data-row="2"]').click();
  await expect(page.locator('.partial-row[data-row="2"]')).toBeFocused();
  await expect(page.locator('#explanation h3')).toHaveText('Wyznaczamy cyfrę d₂');
  await page.getByRole('button', { name: 'Wyjaśnij wiersz 4', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wyjaśnij wiersz 4', exact: true })).toBeFocused();
  await expect(page.locator('.current-row')).toHaveAttribute('data-row', '3');
  await expect(page.locator('.partial-row')).toHaveCount(4);
  await expect(page.locator('.result-row.complete')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Całość', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const method of ['ordinary', 'no-extension']) {
    await page.getByLabel('Metoda mnożenia').selectOption(method);
    await expect(page.locator('#recoding-section')).toBeHidden();
    await expect(page.locator('#recoding-body tr')).toHaveCount(0);
  }
  await page.getByLabel('Metoda mnożenia').selectOption('booth');
  await expect(page.locator('#recoding-section')).toBeVisible();
  await expect(page.locator('#recoding-body tr')).toHaveCount(4);
});

test('podświetlamy właściwe pozycje; wyłączenie nie zmienia bitów', async ({ page }) => {
  await openExample(page, small, 'booth');
  await expect(page.locator('.multiplier-row .considered')).toHaveAttribute('data-position', '0');
  await expect(page.locator('.auxiliary-bits')).toContainText('x₋₁ = 0');
  const before = await displayedBits(page.locator('.current-row'));
  const highlighted = await page.locator('.multiplier-row .considered').evaluate(cell => getComputedStyle(cell).backgroundColor);
  await page.getByText('Podświetlenia', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Podświetlenia' })).not.toBeChecked();
  const plain = await page.locator('.multiplier-row .considered').evaluate(cell => getComputedStyle(cell).backgroundColor);
  expect(plain).not.toBe(highlighted);
  expect(await displayedBits(page.locator('.current-row'))).toBe(before);
  await page.getByRole('button', { name: 'Dalej', exact: false }).click();
  await expect(page.locator('.multiplier-row .considered')).toHaveCount(2);
  expect(await page.locator('.multiplier-row .considered').evaluateAll(cells => cells.map(cell => cell.dataset.position))).toEqual(['1', '0']);
});

test('ciemny motyw i kontrast ról bitów niezależnie od ustawień systemu i podświetleń', async ({ page }) => {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = ({ color, background }) => {
    const values = [luminance(color), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  const styles = locator => locator.evaluate(element => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor, topBorder: style.borderTopStyle, bottomBorder: style.borderBottomStyle, fontSize: parseFloat(style.fontSize) };
  });

  await openExample(page, small, 'ordinary');
  await page.getByLabel('Etap obliczeń').fill('2');
  const extension = page.locator('.current-row .extended').first();
  const shift = page.locator('.current-row .shifted').first();
  const extensionStyle = await styles(extension);
  const shiftStyle = await styles(shift);
  expect(contrast(extensionStyle), 'Czytelność bitów rozszerzenia').toBeGreaterThanOrEqual(4.5);
  expect(contrast(shiftStyle), 'Czytelność zer przesunięcia').toBeGreaterThanOrEqual(4.5);
  expect(extensionStyle.fontSize).toBeGreaterThanOrEqual(18);
  expect(shiftStyle.fontSize).toBeGreaterThanOrEqual(18);
  expect(extensionStyle.background).not.toBe(shiftStyle.background);
  expect(extensionStyle.topBorder).not.toBe('none');
  expect(shiftStyle.bottomBorder).not.toBe('none');
  expect(extensionStyle.bottomBorder).not.toBe(shiftStyle.bottomBorder);
  expect(contrast(await styles(page.locator('#calculate-button'))), 'Kontrast głównego przycisku').toBeGreaterThanOrEqual(4.5);

  await page.getByText('Podświetlenia', { exact: true }).click();
  expect(await styles(extension)).toEqual(extensionStyle);
  expect(await styles(shift)).toEqual(shiftStyle);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    const panels = await page.locator('body, .settings, .workspace, .paper, #operand-a, #method').evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor));
    for (const background of panels) expect(luminance(background), `${colorScheme}: ${background}`).toBeLessThan(0.04);
    expect(await page.locator('html').evaluate(element => getComputedStyle(element).colorScheme)).toBe('dark');
  }
});

test('błędne dane nie zastępują ostatniego poprawnego działania; przykład usuwa błąd', async ({ page }) => {
  await page.goto('/');
  const before = await displayedBits(page.locator('.current-row'));
  await page.locator('#operand-a').fill('102');
  await page.getByRole('button', { name: /Przelicz nowe liczby/ }).click();
  await expect(page.getByRole('alert')).toContainText('Wpisz tylko cyfry 0 i 1');
  await expect(page.locator('#operand-a')).toHaveAttribute('aria-invalid', 'true');
  expect(new URL(page.url()).hash).toBe('');
  expect(await displayedBits(page.locator('.current-row'))).toBe(before);
  await page.locator('[data-example="c"]').click();
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.locator('#calculate-button')).toHaveText('Rozpisz mnożenie ↗');
  await expect(page.locator('#operand-a')).not.toHaveAttribute('aria-invalid');
});

test('własne argumenty dziesiętne, szerokość i zmiana U2 na NB', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#system-hint')).toContainText('liczba pozostałych cyfr + 1 bit znaku');
  await page.getByRole('button', { name: 'Dziesiętnie', exact: true }).click();
  await page.getByLabel('Szerokość obu liczb').selectOption('8');
  await page.locator('#operand-a').fill('-8');
  await page.locator('#operand-x').fill('7');
  await page.getByRole('button', { name: /Przelicz nowe liczby/ }).click();
  await expect(page.locator('#a-width')).toHaveText('8 bitów');
  await expect(page.locator('#x-width')).toHaveText('8 bitów');
  await page.getByRole('button', { name: 'Całość', exact: true }).click();
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('−56');
  await page.getByRole('button', { name: 'Binarnie', exact: true }).click();
  await expect(page.locator('#operand-a')).toHaveValue('11111000');
  await page.getByRole('button', { name: 'NB', exact: true }).click();
  await expect(page.locator('#system-hint')).toHaveText('Naturalny binarny · liczby bez znaku');
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('1736');
});

test('link odtwarza argumenty, metodę, krok i wyłączone podświetlenia po nowym wejściu', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedLink = value; } } });
  });
  await openExample(page, examples.find(example => example.id === 'a'), 'alternative-mcsorley');
  await page.getByLabel('Etap obliczeń').fill('3');
  await page.getByText('Podświetlenia', { exact: true }).click();
  await page.getByRole('button', { name: 'Kopiuj link do tego obliczenia' }).click();
  await expect(page.getByRole('status')).toHaveText('Link do obliczenia skopiowany.');
  const shared = await page.evaluate(() => window.copiedLink);
  expect(new URL(shared).searchParams.get('m')).toBe('alternative-mcsorley');
  expect(new URL(shared).hash).toBe('#workspace');
  await expectAtWorkspace(page);
  // Pełne przeładowanie, aby nie polegać na dotychczasowym stanie w pamięci.
  await page.goto('/');
  await page.goto(shared);
  await page.reload();
  await expect(page.locator('#operand-a')).toHaveValue('1011010101');
  await expect(page.locator('#operand-x')).toHaveValue('101101');
  await expect(page.getByLabel('Metoda mnożenia')).toHaveValue('alternative-mcsorley');
  await expect(page.locator('.partial-row')).toHaveCount(3);
  await expect(page.locator('.current-row')).toHaveAttribute('data-row', '2');
  await expect(page.getByRole('checkbox', { name: 'Podświetlenia' })).not.toBeChecked();
  await expectAtWorkspace(page);
});

test('zatwierdzenie formularza prowadzi do kotwicy obliczeń, także ponownie i po Enterze', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Rozpisz mnożenie/ }).click();
  expect(new URL(page.url()).hash).toBe('#workspace');
  await expectAtWorkspace(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('#operand-a').fill('0101');
  await page.locator('#operand-x').fill('0010');
  await page.locator('#operand-x').press('Enter');
  expect(new URL(page.url()).searchParams.get('a')).toBe('0101');
  await expectAtWorkspace(page);
  await page.reload();
  await expect(page.locator('#operand-a')).toHaveValue('0101');
  await expect(page.locator('#operand-x')).toHaveValue('0010');
  await expectAtWorkspace(page);
  await page.getByRole('button', { name: 'Całość', exact: true }).click();
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('10');
});

test('dotychczasowy permalink odtwarza obliczenie i przechodzi na prawdziwą kotwicę', async ({ page }) => {
  await page.goto('/#a=01011010&x=1011010&s=u2&m=mcsorley&v=all&k=0&h=0');
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('−3420');
  expect(new URL(page.url()).hash).toBe('#workspace');
  expect(new URL(page.url()).searchParams.get('m')).toBe('mcsorley');
  await expect(page.getByRole('checkbox', { name: 'Podświetlenia' })).not.toBeChecked();
  await expectAtWorkspace(page);
});

test('bez dostępu do schowka permalink w pasku adresu nadal prowadzi do obliczeń', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Brak dostępu'); } } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Kopiuj link do tego obliczenia' }).click();
  await expect(page.getByRole('status')).toContainText('Link jest w pasku adresu');
  expect(new URL(page.url()).hash).toBe('#workspace');
  expect(new URL(page.url()).searchParams.get('a')).toBe('1101');
  await expectAtWorkspace(page);
});

test('uzupełnienie nad argumentami: tylko mnożna, U2, dodatkowy bit i NB', async ({ page }) => {
  await page.goto('/');
  const complement = page.getByRole('group', { name: 'Uzupełnienie mnożnej', exact: true });
  await expect(complement).toBeVisible();
  await expect(page.locator('.complement-row')).toHaveCount(1);
  await expect(page.locator('.complement-x')).toHaveCount(0);
  await expect(page.locator('.operand-row .row-label b')).toHaveText(['Mnożna A', 'Mnożnik X']);
  await expect(page.locator('.operand-row .operand-symbol')).toHaveText(['A', 'X']);
  expect((await displayedBits(page.locator('.complement-a'))).trim()).toBe('0011');
  await expect(page.locator('.complement-a .row-label small')).toHaveText('3 dziesiętnie');
  await page.getByRole('button', { name: 'Wróć do przygotowania' }).click();
  await expect(page.locator('.partial-row')).toHaveCount(0);
  await expect(complement).toBeVisible();
  const positions = await page.locator('#multiplication-grid').evaluate(grid => {
    const complement = grid.querySelector('.complement-a');
    const operand = grid.querySelector('.operand-row');
    return {
      above: complement.getBoundingClientRect().bottom <= operand.getBoundingClientRect().top,
      aligned: Math.abs(complement.querySelector('[data-position="0"]').getBoundingClientRect().x - operand.querySelector('[data-position="0"]').getBoundingClientRect().x) < 1
    };
  });
  expect(positions).toEqual({ above: true, aligned: true });
  await page.locator('#operand-a').fill('1000');
  await page.locator('#operand-x').fill('0101');
  await page.getByRole('button', { name: /Przelicz nowe liczby/ }).click();
  expect((await displayedBits(page.locator('.complement-a'))).trim()).toBe('01000');
  await expect(page.locator('.complement-note')).toContainText('11000 → 01000');
  await page.getByRole('button', { name: 'Całość', exact: true }).click();
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('−40');
  await page.getByRole('button', { name: 'NB', exact: true }).click();
  expect((await displayedBits(page.locator('.complement-a'))).trim()).toBe('11000');
  await expect(page.locator('.complement-note')).toContainText('NB najpierw poprzedzamy zerowym bitem znaku');
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('40');
});

test('najmniejsza mnożna U2: bit ochronny i poprawne kolumny wyniku', async ({ page }) => {
  await page.goto('/');
  await page.locator('#operand-a').fill('1000');
  await page.locator('#operand-x').fill('11');
  await page.getByRole('button', { name: /Przelicz nowe liczby/ }).click();
  await page.getByLabel('Metoda mnożenia').selectOption('no-extension');
  await expect(page.locator('#preparation')).toContainText('11000');
  await page.getByRole('button', { name: 'Całość', exact: true }).click();
  expect(await displayedBits(page.locator('.result-row.complete'))).toBe('0001000');
  await expect(page.locator('.sum-note code')).toHaveText('001000');
});

test('16-bitowe NB: przewija się siatka, a nie cała strona', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'NB', exact: true }).click();
  await page.locator('#operand-a').fill('1111111111111111');
  await page.locator('#operand-x').fill('1111111111111111');
  await page.getByRole('button', { name: /Przelicz nowe liczby/ }).click();
  await page.getByLabel('Metoda mnożenia').selectOption('no-extension');
  await page.getByRole('button', { name: 'Całość', exact: true }).click();
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('4294836225');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.paper-scroll').evaluate(region => region.scrollWidth > region.clientWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.explanation').evaluate(region => region.scrollWidth <= region.clientWidth)).toBe(true);
});

for (const url of ['/#a=1101&x=1011&m=toString', '/?a=1101&x=1011&m=toString#workspace']) test(`uszkodzony link wraca do poprawnego przykładu: ${url}`, async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole('status')).toContainText('niepoprawne dane');
  await expect(page.getByLabel('Metoda mnożenia')).toHaveValue('booth');
  await page.getByRole('button', { name: 'Całość', exact: true }).click();
  await expect(page.locator('.result-row.complete .row-label b')).toHaveText('15');
});
