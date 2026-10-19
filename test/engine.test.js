import test from 'node:test';
import assert from 'node:assert/strict';
import { METHODS, calculate, parseBits, decimalToBits } from '../src/engine.js';

// Oracle używa BigInt i własnego dekodowania. Nie współdzieli parseBits,
// binary ani mod z kodem, którego poprawność ma sprawdzać.
const bits = (value, width) => value.toString(2).padStart(width, '0');
const decode = (text, system) => BigInt(`0b${text}`) - (system === 'u2' && text[0] === '1' ? 1n << BigInt(text.length) : 0n);

function verify(config) {
  const model = calculate(config);
  const expected = decode(config.a, config.system) * decode(config.x, config.system);
  const congruenceWidth = config.method === 'modulo' ? model.resultWidth : model.workWidth;
  assert.equal(BigInt.asUintN(congruenceWidth, BigInt(model.rawSum)), BigInt.asUintN(congruenceWidth, expected), JSON.stringify(config));
  assert.equal(model.result, BigInt.asUintN(model.resultWidth, expected).toString(2).padStart(model.resultWidth, '0'));
  assert.equal(BigInt(model.product), expected);
  let sum = typeof model.rawSum === 'bigint' ? 0n : 0;
  for(const row of model.rows) {
    assert.ok(typeof row.value === 'bigint' || Number.isSafeInteger(row.value));
    sum += row.value;
    assert.ok(typeof sum === 'bigint' || Number.isSafeInteger(sum));
    if(row.kind === 'flipped') assert.ok(row.base >= 0 && row.base < 2 ** row.payloadWidth);
  }
  if (config.method === 'modulo') {
    const a = BigInt.asUintN(model.resultWidth, decode(config.a, config.system));
    const x = BigInt.asUintN(model.resultWidth, decode(config.x, config.system));
    assert.equal(model.rawSum, a * x);
    assert.equal(model.rows.length, config.a.length + config.x.length);
    assert.equal(model.workWidth, 2 * model.resultWidth);
  }
  if(model.recodedRows.length) {
    const reconstructed = config.method.startsWith('alternative') ? 2 * model.recodedValue - Number(model.X.bits.at(-1)) : model.recodedValue;
    assert.equal(BigInt(reconstructed), decode(config.x, config.system));
    assert.ok(model.recodedRows.every(row=>Math.abs(row.digit) <= (model.radix === 4 ? 2 : 1)));
  }
}

test('wszystkie pary zapisów 1–5 bitów, NB i U2, także różne długości',()=>{
  for(let n=1;n<=5;n++) for(let m=1;m<=5;m++) {
    for(let a=0;a<2 ** n;a++) for(let x=0;x<2 ** m;x++) {
      for(const system of ['u2','nb']) for(const method of Object.keys(METHODS)) {
        verify({a:bits(a,n),x:bits(x,m),system,method});
      }
    }
  }
});

test('skrajne 16-bitowe argumenty i naprzemienne bity',()=>{
  const operands=[0,1,32767,32768,65535,43690,21845];
  for(const a of operands) for(const x of operands) for(const system of ['u2','nb']) for(const method of Object.keys(METHODS)) verify({a:bits(a,16),x:bits(x,16),system,method});
});

test('korekta alternatywna nie znika dla nieparzystego X',()=>{
  for(const method of ['alternative','alternative-mcsorley']) {
    const model=calculate({a:'1101',x:'1011',system:'u2',method});
    assert.equal(model.rows[0].value,3);
    assert.equal(model.product,15);
    assert.equal(model.recodedValue,-2);
  }
});

test('najmniejsza mnożna U2 dostaje bit ochronny w metodzie bez rozszerzeń',()=>{
  const model=calculate({a:'1000',x:'11',system:'u2',method:'no-extension'});
  assert.equal(model.preparedA,'11000');
  assert.equal(model.product,8);
  verify({a:'1000',x:'11',system:'u2',method:'no-extension'});
});

test('walidacja wejść i konwersja dziesiętna zachowują szerokość',()=>{
  assert.equal(parseBits(' 0b11 01 ','u2').value,-3);
  assert.equal(parseBits('1101','nb').value,13);
  assert.equal(decimalToBits('5',4,'u2'),'0101');
  assert.equal(parseBits('101','u2').value,-3);
  assert.equal(decimalToBits('-3',4,'u2'),'1101');
  assert.equal(decimalToBits('15',4,'nb'),'1111');
  for(const bad of ['', '102', '-01', '1'.repeat(17), '<script>']) assert.throws(()=>parseBits(bad,'u2'));
  assert.throws(()=>decimalToBits('8',4,'u2'));
  assert.throws(()=>decimalToBits('-1',4,'nb'));
  assert.throws(()=>decimalToBits('1.5',4,'u2'));
  assert.throws(()=>decimalToBits('1',17,'u2'));
  assert.throws(()=>decimalToBits('1',4,'unknown'));
  assert.throws(()=>calculate({a:'1',x:'1',method:'bad'}));
  for(const method of ['constructor','toString','__proto__']) assert.throws(()=>calculate({a:'1',x:'1',method}));
});
