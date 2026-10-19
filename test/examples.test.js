import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/engine.js';
import { goldenCases } from './fixtures/multiplication.js';

for (const { example, method, expected } of goldenCases) {
  test(`${example.title}: ${method} — każda cyfra, przesunięcie i wartość wiersza`, () => {
    const model = calculate({ ...example.input, method });
    assert.equal(model.A.value, example.a);
    assert.equal(model.X.value, example.x);
    assert.equal(model.product, example.product);
    assert.equal(model.result, example.result);
    assert.equal(model.resultWidth, example.result.length);
    assert.equal(model.workWidth, expected.workWidth ?? example.result.length);
    assert.equal(model.preparedA, expected.preparedA ?? example.input.a);
    assert.equal(model.preparedX, expected.preparedX ?? example.input.x);
    assert.deepEqual(model.rows.map(row => [row.digit, row.shift, row.value]), expected.rows);
    if (expected.indices) assert.deepEqual(model.rows.map(row => row.indices), expected.indices);
    if (expected.calculations) assert.deepEqual(model.rows.map(row => row.calculation), expected.calculations);
    if (expected.y !== undefined) assert.equal(model.recodedValue, expected.y);
  });
}
