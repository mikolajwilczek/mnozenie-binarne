import { binary, signedWidth } from './engine.js';

export function getMultiplicandComplement(model) {
  const number = model.A;
  const value = number.value === 0 ? 0 : -number.value;
  const width = Math.max(number.width + (model.system === 'nb' ? 1 : 0), signedWidth(value));
  return {
    value, width,
    sourceBits: binary(number.value, width),
    bits: binary(value, width),
    extraSignBit: width > number.width
  };
}

export function createRecodedCells(model, view) {
  const digits = new Map(model.recodedRows.map(row => [row.shift, row]));
  return Array.from({ length: model.workWidth }, (_, index) => {
    const position = model.workWidth - index - 1;
    const row = digits.get(position);
    const revealed = Boolean(row && row.id < view.visibleCount);
    return {
      position,
      digitIndex: row?.position ?? null,
      empty: !row,
      revealed,
      considered: Boolean(row && row.id === view.activeRow),
      text: !row ? '' : !revealed ? '·' : row.digit > 0 ? `+${row.digit}` : String(row.digit).replace('-', '−')
    };
  });
}

// Model widoku jest niezależny od DOM-u. Jedna reguła odsłaniania obowiązuje
// siatkę, tabelę i opis kroku.
export function getStepView(model, { mode = 'step', cursor = 0, selected = null } = {}) {
  const total = model.rows.length + (model.method === 'modulo' ? 2 : 1);
  const current = Number.isFinite(cursor) ? Math.max(0, Math.min(Math.floor(cursor), total)) : 0;
  const all = mode === 'all';
  const visibleCount = all ? model.rows.length : Math.min(current, model.rows.length);
  const activeRow = all
    ? Number.isInteger(selected) && selected >= 0 && selected < model.rows.length ? selected : null
    : current > 0 && current <= model.rows.length ? current - 1 : null;
  return {
    cursor: current,
    total,
    visibleCount,
    activeRow,
    summed: all || current > model.rows.length,
    complete: all || current === total,
    partialSum: model.rows.slice(0, visibleCount).reduce((sum, row) => sum + row.value, typeof model.rawSum === 'bigint' ? 0n : 0)
  };
}

export function createBitCells(value, {
  width, payloadWidth = width, shift = 0, blankExtension = false,
  active = [], operand = false, flip = null, masked = false,
  extensionFrom = null, discardAbove = null
}) {
  return [...binary(value, width)].map((digit, index) => {
    const position = width - index - 1;
    const extension = operand ? extensionFrom !== null && position >= extensionFrom && position < payloadWidth : position >= payloadWidth + shift;
    const shifted = !operand && position < shift;
    const empty = operand && position >= payloadWidth || blankExtension && extension;
    return {
      position,
      text: empty ? '' : masked ? '·' : digit,
      extension: extension && !empty,
      shifted,
      considered: !empty && active.includes(position),
      flipped: flip === position,
      discarded: discardAbove !== null && position >= discardAbove && !empty,
      empty
    };
  });
}
