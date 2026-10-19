import test from 'node:test';
import assert from 'node:assert/strict';
import { createBitCells, createRecodedCells, getStepView, getMultiplicandComplement } from '../src/worksheet.js';
import { calculate } from '../src/engine.js';

const model = { rows: [{ value: 3 }, { value: 0 }, { value: -12 }, { value: 24 }] };

test('przekodowany mnożnik: cyfry zajmują kolumny zgodne z wagami bazy 2 i 4', () => {
  const cases = [
    ['booth', [[3, '−1'], [2, '+1'], [1, '0'], [0, '−1']]],
    ['mcsorley', [[2, '−1'], [0, '−1']]],
    ['alternative', [[3, '0'], [2, '−1'], [1, '+1'], [0, '0']]],
    ['alternative-mcsorley', [[2, '−1'], [0, '+2']]]
  ];
  for (const [method, expected] of cases) {
    const model = calculate({ a: '1101', x: '1011', system: 'u2', method });
    const cells = createRecodedCells(model, getStepView(model, { mode: 'all' }));
    assert.equal(cells.length, 8);
    assert.deepEqual(cells.filter(cell => !cell.empty).map(cell => [cell.position, cell.text]), expected);
    assert.ok(cells.filter(cell => cell.empty).every(cell => cell.text === ''));
  }
});

test('przekodowany mnożnik: korekta nie odsłania cyfry Y, kolejne kroki odsłaniają właściwe pozycje', () => {
  const model = calculate({ a: '1101', x: '1011', system: 'u2', method: 'alternative-mcsorley' });
  const correction = createRecodedCells(model, getStepView(model, { cursor: 1 }));
  assert.deepEqual(correction.filter(cell => !cell.empty).map(cell => cell.text), ['·', '·']);
  assert.equal(correction.some(cell => cell.considered), false);
  const firstDigit = createRecodedCells(model, getStepView(model, { cursor: 2 }));
  assert.deepEqual(firstDigit.filter(cell => !cell.empty).map(cell => cell.text), ['·', '+2']);
  assert.deepEqual(firstDigit.filter(cell => cell.considered).map(cell => cell.position), [0]);
  const next = createRecodedCells(model, getStepView(model, { cursor: 3 }));
  assert.deepEqual(next.filter(cell => !cell.empty).map(cell => cell.text), ['−1', '+2']);
  assert.deepEqual(next.filter(cell => cell.considered).map(cell => cell.position), [2]);
});

test('uzupełnienie mnożnej: stałe przykłady U2, NB, zera i wartości skrajnych', () => {
  const cases = [
    ['u2', -3, 4, '0011', '1101'],
    ['u2', -8, 4, '01000', '11000'],
    ['u2', 5, 4, '1011', '0101'],
    ['nb', 15, 4, '10001', '01111'],
    ['u2', 0, 1, '0', '0'],
    ['u2', -1, 1, '01', '11'],
    ['u2', -32768, 16, '01000000000000000', '11000000000000000'],
    ['u2', 32767, 16, '1000000000000001', '0111111111111111']
  ];
  for (const [system, a, n, expected, source] of cases) {
    const complement = getMultiplicandComplement({ system, A: { value: a, width: n } });
    assert.equal(complement.bits, expected);
    assert.equal(complement.sourceBits, source);
    assert.equal(complement.width, expected.length);
    assert.equal(complement.value, a === 0 ? 0 : -a);
  }
});

test('kroki: przygotowanie, wiersze i osobne końcowe sumowanie', () => {
  const expected = [
    [0, null, false, 0], [1, 0, false, 3], [2, 1, false, 3],
    [3, 2, false, -9], [4, 3, false, 15], [4, null, true, 15]
  ];
  for (let cursor = 0; cursor <= 5; cursor++) {
    const view = getStepView(model, { cursor });
    assert.equal(view.total, 5);
    assert.deepEqual([view.visibleCount, view.activeRow, view.complete, view.partialSum], expected[cursor]);
  }
});

test('całość: wybór opisu wiersza nie ukrywa pozostałych wierszy ani sumy', () => {
  for (const selected of [null, 0, 3]) {
    const view = getStepView(model, { mode: 'all', cursor: 1, selected });
    assert.equal(view.visibleCount, 4);
    assert.equal(view.complete, true);
    assert.equal(view.activeRow, selected);
    assert.equal(view.partialSum, 15);
  }
});

test('kroki spoza zakresu i błędny wybór nie tworzą nieistniejących wierszy', () => {
  for (const cursor of [NaN, Infinity, -10]) assert.equal(getStepView(model, { cursor }).cursor, 0);
  assert.equal(getStepView(model, { cursor: 100 }).cursor, 5);
  assert.equal(getStepView(model, { cursor: 2.7 }).cursor, 2);
  for (const selected of [-1, 4, 1.5]) assert.equal(getStepView(model, { mode: 'all', selected }).activeRow, null);
});

test('ujemny wiersz: rozszerzenie znaku jest z lewej, zera przesunięcia z prawej', () => {
  // −3 << 2 = −12 = 11110100 na 8 bitach; payload 101 i dwa zera.
  const cells = createBitCells(-12, { width: 8, payloadWidth: 3, shift: 2 });
  assert.equal(cells.map(cell => cell.text).join(''), '11110100');
  assert.deepEqual(cells.filter(cell => cell.extension).map(cell => cell.position), [7, 6, 5]);
  assert.deepEqual(cells.filter(cell => cell.shifted).map(cell => cell.position), [1, 0]);
});

test('bez rozszerzeń: puste kolumny zachowują wyrównanie, odwrócony bit ma własną pozycję', () => {
  const cells = createBitCells(10, { width: 8, payloadWidth: 4, shift: 1, blankExtension: true, flip: 4 });
  assert.equal(cells.map(cell => cell.text || ' ').join(''), '   01010');
  assert.deepEqual(cells.filter(cell => cell.empty).map(cell => cell.position), [7, 6, 5]);
  assert.deepEqual(cells.filter(cell => cell.flipped).map(cell => cell.position), [4]);
  assert.equal(cells.some(cell => cell.extension), false);
});

test('mnożnik: pomocnicze x₋₁ nie zajmuje kolumny x₀', () => {
  const cells = createBitCells(-5, { width: 8, payloadWidth: 4, operand: true, active: [0, -1, 4] });
  assert.equal(cells.map(cell => cell.text || ' ').join(''), '    1011');
  assert.deepEqual(cells.filter(cell => cell.considered).map(cell => cell.position), [0]);
  assert.equal(cells.some(cell => cell.extension || cell.shifted), false);
});

test('przed końcowym krokiem siatka nie zdradza bitów wyniku', () => {
  assert.equal(createBitCells(15, { width: 8, masked: true }).map(cell => cell.text).join(''), '········');
});
