import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/engine.js';
import { createBitCells, getStepView } from '../src/worksheet.js';
import { moduloCases } from './fixtures/modulo.js';

for (const example of moduloCases) test(`modulo — ${example.title}`, () => {
  const model = calculate({ ...example.input, method: 'modulo' });
  const k = example.input.a.length + example.input.x.length;
  assert.equal(model.preparedA, example.a);
  assert.equal(model.preparedX, example.x);
  assert.equal(model.resultWidth, k);
  assert.equal(model.workWidth, 2 * k);
  assert.equal(model.rawSum.toString(), example.raw);
  assert.equal(model.workResult, example.full);
  assert.equal(model.result, example.result);
  assert.equal(model.product, example.product);
  assert.equal(model.rows.length, k);
  assert.equal(model.recodedRows.length, 0);
  assert.deepEqual(model.rows.map(row => row.digit), [...example.x].reverse().map(Number));
  if (example.rows) assert.deepEqual(model.rows.map(row => row.value.toString()), example.rows);
});

test('modulo — sumowanie i przycinanie są osobnymi etapami', () => {
  const model = calculate({ ...moduloCases[0].input, method: 'modulo' });
  const rows = getStepView(model, { cursor: 8 });
  assert.equal(rows.summed, false);
  assert.equal(rows.complete, false);
  const sum = getStepView(model, { cursor: 9 });
  assert.equal(sum.summed, true);
  assert.equal(sum.complete, false);
  assert.equal(sum.partialSum, 63503n);
  assert.equal(sum.activeRow, null);
  const trim = getStepView(model, { cursor: 10 });
  assert.equal(trim.summed, true);
  assert.equal(trim.complete, true);
  assert.equal(trim.total, 10);
  assert.equal(getStepView(model, { mode: 'all' }).complete, true);
});

test('modulo — rozszerzenie argumentu i odrzucane bity mają osobne role', () => {
  const cells = createBitCells(-3, { width: 16, payloadWidth: 8, operand: true, extensionFrom: 4 });
  assert.equal(cells.map(cell => cell.text || ' ').join(''), '        11111101');
  assert.deepEqual(cells.filter(cell => cell.extension).map(cell => cell.position), [7, 6, 5, 4]);
  const sum = createBitCells(63503n, { width: 16, discardAbove: 8 });
  assert.equal(sum.filter(cell => cell.discarded).map(cell => cell.text).join(''), '11111000');
  assert.equal(sum.filter(cell => !cell.discarded).map(cell => cell.text).join(''), '00001111');
  const result = createBitCells(-15, { width: 64, payloadWidth: 32, operand: true });
  assert.equal(result.filter(cell => !cell.empty).map(cell => cell.text).join(''), '11111111111111111111111111110001');
});
