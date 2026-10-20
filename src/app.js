import { METHODS, EXAMPLES, MAX_BITS, parseBits, decimalToBits, calculate, sub } from './engine.js';
import { createBitCells, createRecodedCells, getStepView, getMultiplicandComplement } from './worksheet.js';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const variablePattern = /(?<![\p{L}_])(?:[AXYPKnmk](?:[₀-₉ᵢₙₘₖ₊₋]+|′)?|[xdw][₀-₉ᵢₙₘₖ₊₋]+)(?![\p{L}_])|2[ⁱⁿᵐᵏʷ][ⁱⁿᵐᵏʷ⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹]*/gu;
const fmt = value => String(value).replace(/-/g, '−');
const signed = value => value > 0 ? `+${value}` : fmt(value);
const times = value => value < 0 ? `(${fmt(value)})` : fmt(value);
const power = p => `2<sup>${p}</sup>`;
const initialState = { ...EXAMPLES.small, method:'booth', mode:'step', cursor:1, selected:null, highlights:true, base:'binary', dirty:false };
const state = { ...initialState };
let model, view, toastTimer;

function highlightVariables(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => node.parentElement.closest('.operand-symbol, .variable-symbol, input, textarea, select, script, style, svg')
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const matches = [...node.textContent.matchAll(variablePattern)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let start = 0;
    for (const match of matches) {
      fragment.append(node.textContent.slice(start, match.index));
      const symbol = document.createElement('span');
      symbol.className = 'variable-symbol';
      symbol.textContent = match[0];
      fragment.append(symbol);
      start = match.index + match[0].length;
    }
    fragment.append(node.textContent.slice(start));
    node.replaceWith(fragment);
  }
}

$('method').innerHTML = Object.entries(METHODS).map(([id, item]) => `<option value="${id}">${item.name}</option>`).join('');
$('bit-width').innerHTML = Array.from({length:MAX_BITS}, (_, i) => `<option value="${i + 1}" ${i === 7 ? 'selected' : ''}>${i + 1} bit${i === 0 ? '' : i < 4 ? 'y' : 'ów'}</option>`).join('');

function readLocation() {
  const query = new URLSearchParams(location.search);
  const legacy = location.hash.startsWith('#a=');
  if (!legacy && !query.has('a') && !query.has('x')) return false;
  const params = legacy ? new URLSearchParams(location.hash.slice(1)) : query;
  const config = { a:params.get('a'), x:params.get('x'), system:params.get('s') || 'u2', method:params.get('m') || 'booth' };
  try {
    calculate(config);
    Object.assign(state, config, {mode:params.get('v') === 'all' ? 'all' : 'step', cursor:Math.max(0, Math.floor(Number(params.get('k'))) || 0), highlights:params.get('h') !== '0', base:'binary', dirty:false, selected:null});
    return true;
  } catch { toast('Link zawiera niepoprawne dane. Wczytano przykład.'); return false; }
}

function computationURL() {
  const url = new URL(location.href);
  url.search = new URLSearchParams({a:state.a,x:state.x,s:state.system,m:state.method,v:state.mode,k:String(state.cursor),h:state.highlights?'1':'0'}).toString();
  url.hash = 'workspace';
  return url;
}

function goToWorkspace() {
  $('workspace').focus({preventScroll:true});
  $('workspace').scrollIntoView({block:'start', behavior:'instant'});
}

function syncForm() {
  if (!state.dirty) $('calculate-button').innerHTML = 'Rozpisz mnożenie <span aria-hidden="true">↗</span>';
  $('operand-a').value = state.base === 'binary' ? state.a : parseBits(state.a, state.system).value;
  $('operand-x').value = state.base === 'binary' ? state.x : parseBits(state.x, state.system).value;
  $('method').value = state.method;
  $('width-field').hidden = state.base !== 'decimal';
  document.querySelectorAll('[data-system]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.system === state.system)));
  document.querySelectorAll('[data-base]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.base === state.base)));
  document.querySelectorAll('.input-base').forEach(el => el.textContent = state.base === 'binary' ? '₂' : '₁₀');
  $('operand-a').inputMode = $('operand-x').inputMode = state.base === 'decimal' && state.system === 'u2' ? 'text' : 'numeric';
  $('system-hint').textContent = state.system === 'u2' ? 'U2: liczba pozostałych cyfr + 1 bit znaku. Wpisany zapis i podana szerokość już go obejmują.' : 'Naturalny binarny · liczby bez znaku';
  $('highlights').checked = state.highlights;
  updateHints();
}

function inputBits(id, system = state.system) {
  return state.base === 'binary' ? parseBits($(id).value, system).bits : decimalToBits($(id).value, Number($('bit-width').value), system);
}
function updateHints() {
  for (const [input, hint, width] of [['operand-a','a-value','a-width'], ['operand-x','x-value','x-width']]) {
    try {
      const number = parseBits(inputBits(input), state.system);
      $(hint).innerHTML = state.base === 'binary' ? `<span>= ${fmt(number.value)}</span> dziesiętnie` : `<span>= ${number.bits}</span> ${state.system.toUpperCase()}`;
      $(width).textContent = `${number.width} ${number.width === 1 ? 'bit' : number.width < 5 ? 'bity' : 'bitów'}`;
    } catch { $(hint).textContent = state.base === 'binary' ? 'Wpisz od 1 do 16 bitów.' : 'Sprawdź liczbę i zakres bitów.'; $(width).textContent = ''; }
  }
}
function applyForm(reset = true, system = state.system) {
  $('form-error').hidden = true;
  for (const id of ['operand-a','operand-x']) $(id).removeAttribute('aria-invalid');
  let a, x;
  const context = system === state.system ? '' : `Zmiana na ${system.toUpperCase()}: `;
  try { a = inputBits('operand-a', system); } catch (error) { return showError('operand-a', `${context}Mnożna: ${error.message}`); }
  try { x = inputBits('operand-x', system); } catch (error) { return showError('operand-x', `${context}Mnożnik: ${error.message}`); }
  Object.assign(state, {a, x, system, dirty:false, selected:null});
  $('calculate-button').innerHTML = 'Rozpisz mnożenie <span aria-hidden="true">↗</span>';
  if (reset) state.cursor = 1;
  render();
  return true;
}
function showError(id, message) { $(id).setAttribute('aria-invalid','true'); $('form-error').textContent = message; $('form-error').hidden = false; $(id).focus(); return false; }

function bitCells(value, options = {}) {
  return createBitCells(value, {width:model.workWidth, ...options}).map(cell => {
    const classes = ['bit', cell.extension ? 'extended' : '', cell.shifted ? 'shifted' : '', cell.considered ? 'considered' : '', cell.flipped ? 'flipped' : '', cell.discarded ? 'discarded' : '', cell.empty ? 'blank' : ''].filter(Boolean).join(' ');
    const title = options.masked || cell.empty ? '' : `Pozycja ${cell.position}, waga 2^${cell.position}${cell.discarded ? ' — odrzucamy przy przycięciu modulo' : cell.extension ? ' — rozszerzenie znaku lub dopełnienie zerami' : cell.shifted ? ' — zero przesunięcia' : ''}`;
    return `<span class="${classes}" data-position="${cell.position}" title="${title}">${cell.text}</span>`;
  }).join('');
}
function gridLine({mark='', value=0, label='', classes='', options={}, row=null, aria=''}) {
  const tag = row === null ? 'div' : 'button';
  return `<${tag} class="grid-line ${classes}" ${row === null ? '' : `type="button" data-row="${row}" aria-label="${escape(aria)}" aria-pressed="${activeRow() === row}"`}><span class="row-mark">${mark}</span>${bitCells(value, options)}<span class="row-label">${label}</span></${tag}>`;
}
function activeRow() {
  return view.activeRow;
}
function rowTerm(row) {
  if (row.kind === 'unsigned') return `${row.digit ? '' : '0 · '}Aₖ · ${power(row.shift)}`;
  if (row.kind === 'correction') return model.method === 'no-extension' ? 'Korekta K' : '−A · x₀';
  if (row.kind === 'flipped') return `w${sub(row.position)} · ${power(row.shift)}`;
  return `${row.digit < 0 ? '−' : row.digit > 0 ? '+' : ''}${Math.abs(row.digit) === 2 ? '2' : row.digit === 0 ? '0 · ' : ''}${model.method.startsWith('alternative') ? '(2A)' : 'A'} · ${power(row.shift)}`;
}
function recodedMultiplier() {
  if (!model.recodedRows.length) return '';
  const alternative = model.method.startsWith('alternative');
  const symbol = alternative ? 'Y' : 'X′';
  const ready = model.recodedRows.every(row => row.id < view.visibleCount);
  const cells = createRecodedCells(model, view).map(cell => {
    const classes = ['recoded-cell', cell.empty ? 'blank' : '', !cell.empty && !cell.revealed ? 'pending' : '', cell.considered ? 'considered' : ''].filter(Boolean).join(' ');
    const title = cell.empty ? '' : cell.revealed ? `Cyfra d${sub(cell.digitIndex)} = ${cell.text}, waga ${model.radix}^${cell.digitIndex}` : 'Jeszcze nieodkryta cyfra przekodowania';
    return `<span class="${classes}" data-position="${cell.position}" ${cell.empty ? '' : `data-digit-index="${cell.digitIndex}"`} title="${escape(title)}">${cell.text}</span>`;
  }).join('');
  const note = `${model.radix === 4 ? 'Cyfry bazy 4 stoją co dwie kolumny.' : 'Cyfry mają te same wagi co kolumny.'}${alternative ? ' To zapis Y: X = 2Y − x₀. Używamy 2A i osobnej korekty −A·x₀.' : ''}`;
  return `<div class="recoded-multiplier" role="group" aria-label="Przekodowany mnożnik"><div class="grid-line recoded-multiplier-row"><span class="row-mark">${symbol}</span>${cells}<span class="row-label"><b>Przekodowany <span class="operand-symbol">${symbol}</span></b><small>baza ${model.radix}${ready ? ` · ${alternative ? 'Y' : 'X'} = ${fmt(model.recodedValue)}` : ' · cyfry dᵢ'}</small></span></div><p class="recoded-multiplier-note">${note}</p></div>`;
}
function renderGrid() {
  const modulo = model.method === 'modulo';
  const visible = view.visibleCount;
  const complete = view.complete;
  const current = activeRow(), row = model.rows[current];
  const activeBits = row?.indices || [];
  const aPayload = model.preparedA.length;
  let grid = `<div class="grid-line weight-row"><span></span>${Array.from({length:model.workWidth}, (_,i) => `<span>${model.workWidth - i - 1}</span>`).join('')}<span class="row-label">pozycja bitu</span></div>`;
  if (!modulo) {
    const complement = getMultiplicandComplement(model);
    grid += '<div class="complement-rows" role="group" aria-label="Uzupełnienie mnożnej"><p class="complement-heading">Uzupełnienie do dwóch · U2</p>';
    grid += gridLine({mark:'−A', value:complement.value, options:{payloadWidth:complement.width, operand:true},
      label:`<b>Uzupełnienie mnożnej <span class="operand-symbol">−A</span></b><small>${fmt(complement.value)} dziesiętnie</small>`, classes:'complement-row complement-a'});
    grid += '<p class="complement-note">Odwracamy bity i dodajemy 1.';
    if (model.system === 'nb') grid += ' Mnożną NB najpierw poprzedzamy zerowym bitem znaku.';
    else if (complement.extraSignBit) grid += ` Dla −A potrzebny jest dodatkowy bit znaku: <code>${complement.sourceBits} → ${complement.bits}</code>.`;
    grid += '</p></div>';
  }
  grid += recodedMultiplier();
  grid += gridLine({mark:'A', value:model.A.value, options:{payloadWidth:aPayload, operand:true, extensionFrom:modulo ? model.A.width : null, active:row && row.kind !== 'correction' ? Array.from({length:aPayload}, (_,i)=>i) : []}, label:`<b>Mnożna <span class="operand-symbol">A</span></b><small>${fmt(model.A.value)} dziesiętnie</small>${modulo ? `<small>Aₖ = ${model.unsignedA} w NB</small>` : ''}`, classes:'operand-row multiplicand-row'});
  grid += gridLine({mark:'×', value:model.X.value, options:{payloadWidth:model.preparedX.length, operand:true, extensionFrom:modulo ? model.X.width : null, active:activeBits}, label:`<b>Mnożnik <span class="operand-symbol">X</span></b><small>${fmt(model.X.value)} dziesiętnie</small>${modulo ? `<small>Xₖ = ${model.unsignedX} w NB</small>` : ''}`, classes:'operand-row multiplier-row'});
  const extra = [...new Set(activeBits.filter(i => i < 0 || i >= model.preparedX.length))];
  if (extra.length) grid += `<div class="auxiliary-bits">Bity pomocnicze: ${extra.map(i => `x${sub(i)} = ${i < 0 ? '0' : model.preparedX[0]}${i < 0 ? ' (dopisane zero)' : ' (znak)'}`).join(' · ')}</div>`;
  for (const item of model.rows.slice(0, visible)) {
    grid += gridLine({mark:item.kind === 'correction' ? 'K' : `${item.id + 1}`, value:item.value,
      classes:`partial-row ${item.kind === 'correction' ? 'correction-row' : ''} ${item.id === current ? 'current-row' : ''} ${item.value === 0 || item.value === 0n ? 'zero-row' : ''}`,
      options:{payloadWidth:item.payloadWidth, shift:item.shift, blankExtension:item.kind === 'flipped' || model.method === 'no-extension', flip:item.flippedPosition},
      label:`<b>${rowTerm(item)}</b><small>${fmt(item.value)}${item.kind === 'flipped' ? ' po odwróceniu' : ' dziesiętnie'}</small>`,
      row:item.id, aria:`Wiersz ${item.id + 1}. ${item.title}. ${item.calculation}. Wartość ${item.value}`});
  }
  if (visible < model.rows.length) grid += `<div class="remaining-rows"><span>···</span> Pozostałe wiersze: ${model.rows.length - visible}</div>`;
  if (modulo && view.summed) grid += gridLine({mark:'Σ', value:model.rawSum, classes:'full-sum-row', options:{discardAbove:complete ? model.resultWidth : null}, label:`<b>Suma NB</b><small>${model.rawSum} przed przycięciem</small>`});
  grid += gridLine({mark:'=', value:complete ? model.product : 0, classes:`result-row ${complete ? 'complete' : ''}`, options:{masked:!complete, operand:modulo, payloadWidth:modulo ? model.resultWidth : model.workWidth}, label:complete ? `<b>${fmt(model.product)}</b><small>wynik dziesiętnie${modulo ? ` · ${model.resultWidth} bitów` : ''}</small>` : `<small>Wynik po ${modulo ? 'przycięciu' : 'zsumowaniu'}.</small>`});
  const partialSum = view.partialSum;
  $('multiplication-grid').style.setProperty('--cols',model.workWidth);
  $('multiplication-grid').innerHTML = grid;
  $('modulo-summary').hidden = true;
  $('modulo-summary').replaceChildren();
  const moduloSummary = html => {
    $('modulo-summary').hidden = false;
    $('modulo-summary').innerHTML = html;
  };
  $('paper').dataset.highlights = state.highlights;
  $('flipped-legend').hidden = model.method !== 'no-extension';
  $('discarded-legend').hidden = !modulo || !complete;
  $('extension-legend-label').textContent = modulo ? 'rozszerzenie / zera NB' : state.system === 'nb' ? 'dopełnienie zerami' : 'rozszerzenie znaku';
  $('paper-equation').textContent = `${times(model.A.value)} × ${times(model.X.value)}`;
  $('paper-code').textContent = modulo ? `NB: ${model.workWidth} → ${model.resultWidth} bitów` : `${state.system.toUpperCase()} / ${model.workWidth} bitów`;
  if (modulo && complete) {
    moduloSummary(`Odrzucamy ${model.resultWidth} najstarszych bitów sumy, zachowujemy <code>${model.result}</code>. Reszta modulo 2<sup>${model.resultWidth}</sup>: <b>${model.residue}</b>. Interpretacja ${state.system.toUpperCase()}: <b>${fmt(model.product)}</b>. Sprawdzenie: ${times(model.A.value)} × ${times(model.X.value)} = ${fmt(model.referenceProduct)}.`);
  } else if (complete) {
    const carries = Math.floor(model.rawSum / 2 ** model.workWidth);
    $('multiplication-grid').insertAdjacentHTML('beforeend', `<div class="sum-note">${model.workWidth !== model.resultWidth ? `Wynik na ${model.resultWidth} bitach: <code>${model.result}</code>. ` : ''}${model.method === 'no-extension' && carries ? `Przeniesienie poza ${model.workWidth} bitów pomijamy (modulo 2<sup>${model.workWidth}</sup>).` : `Sprawdzenie: ${times(model.A.value)} × ${times(model.X.value)} = ${fmt(model.referenceProduct)}.`}</div>`);
  } else if (modulo && view.summed) {
    moduloSummary(`Suma w NB przed przycięciem: <b>${model.rawSum}</b> na ${model.workWidth} bitach. Następny krok zachowa ${model.resultWidth} najmłodszych bitów.`);
  } else if (modulo && visible > 0) {
    moduloSummary(`Suma dotychczasowych wierszy w NB: <b>${partialSum}</b>. Sumujemy bez przycinania.`);
  } else if (visible > 0) {
    $('multiplication-grid').insertAdjacentHTML('beforeend',`<div class="sum-note">Suma dotychczasowych wierszy: <b>${fmt(partialSum)}</b>${model.method === 'no-extension' ? ' (przed końcową korektą / redukcją modulo)' : ''}</div>`);
  }
  const layoutKey = `${model.method}:${model.preparedA}:${model.preparedX}`;
  if (modulo && $('paper').dataset.layoutKey !== layoutKey) $('paper').querySelector('.paper-scroll').scrollLeft = $('multiplication-grid').scrollWidth;
  $('paper').dataset.layoutKey = layoutKey;
}

function renderExplanation() {
  const row = model.rows[activeRow()];
  let number, title, detail, math;
  if (row) {
    number = String(row.id + 1).padStart(2,'0'); title = row.title; detail = row.detail;
    math = row.kind === 'partial' ? fmt(row.calculation) : ['flipped', 'correction', 'unsigned'].includes(row.kind) ? row.calculation : `${row.calculation}   →   ${row.digit} · ${model.method.startsWith('alternative') ? `(2 · ${model.A.value})` : `(${model.A.value})`} · 2^${row.shift} = ${row.value}`;
  } else if (model.method === 'modulo' && view.complete) {
    number = 'mod'; title = `Przycinamy sumę do ${model.resultWidth} bitów`;
    detail = `Suma NB wynosi ${model.rawSum}. Odrzucamy ${model.resultWidth} najstarszych bitów: ${model.workResult.slice(0, model.resultWidth)}. Pozostaje ${model.result}, czyli reszta ${model.residue} modulo 2^${model.resultWidth}. Po interpretacji ${state.system.toUpperCase()} otrzymujemy ${fmt(model.product)}, pełny iloczyn oryginalnych liczb.`;
    math = `${model.rawSum} mod 2^${model.resultWidth} = ${model.residue}; ${model.result} (${state.system.toUpperCase()}) = ${fmt(model.product)}`;
  } else if (model.method === 'modulo' && view.summed) {
    number = 'Σ'; title = 'Suma przed przycięciem';
    detail = `Dodajemy wszystkie ${model.rows.length} wierszy jak liczby NB. Suma ${model.workResult} to ${model.rawSum} na 2k = ${model.workWidth} bitach. To iloczyn rozszerzonych zapisów odczytanych bez znaku. Kolejny krok odrzuci ${model.resultWidth} najstarszych bitów.`;
    math = `${model.unsignedA} × ${model.unsignedX} = ${model.rawSum}`;
  } else if (view.complete) {
    number = 'Σ'; title = 'Suma iloczynów częściowych';
    detail = `Dodajemy wyrównane kolumnami wiersze${model.method === 'no-extension' ? ` i zachowujemy ${model.workWidth} najmłodszych bitów` : ''}. Wynik ${model.result} w ${state.system.toUpperCase()} to ${fmt(model.product)} dziesiętnie. Kliknij dowolny wiersz, żeby wrócić do jego wyjaśnienia.`;
    math = `${times(model.A.value)} × ${times(model.X.value)} = ${fmt(model.product)}`;
  } else {
    number = '00'; title = 'Zaczynamy od zapisu argumentów'; detail = `${model.A.bits} to ${fmt(model.A.value)}, a ${model.X.bits} to ${fmt(model.X.value)} w zapisie ${state.system.toUpperCase()}. Czytamy mnożnik od prawej do lewej. ${METHODS[state.method].intro}`; math = METHODS[state.method].formula;
  }
  const content = row?.steps
    ? row.steps.map(step => `<section class="explanation-part" data-step="${step.key}"><h4>${escape(step.title)}</h4><p>${escape(step.detail)}</p>${step.bits ? `<code class="grid-step-bits">${step.bits}</code>` : ''}${step.math ? `<code>${escape(step.math)}</code>` : ''}</section>`).join('')
    : `${detail.split('\n\n').map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}<code>${escape(math)}</code>`;
  $('explanation').innerHTML = `<span class="explanation-number">${number}</span><div><h3>${title}</h3>${content}</div>`;
}

function renderTable() {
  const recoded = model.recodedRows.length > 0;
  $('recoding-section').hidden = !recoded;
  if (!recoded) {
    $('recoding-head').replaceChildren();
    $('recoding-body').replaceChildren();
    $('recoded-summary').replaceChildren();
    return;
  }
  $('recoding-title').textContent = 'Przekodowanie mnożnika';
  $('table-tag').textContent = `BAZA ${model.radix}`;
  $('table-hint').textContent = 'Od najmłodszej pozycji. Kliknij numer wiersza, aby zobaczyć wyjaśnienie.';
  const visible = view.visibleCount;
  $('recoding-head').innerHTML = '<tr><th scope="col">Wiersz</th><th scope="col">Bity / działanie</th><th scope="col">Cyfra</th><th scope="col">Przesunięcie</th><th scope="col">Wartość</th></tr>';
  $('recoding-body').innerHTML = model.rows.map(row => {
    const revealed = row.id < visible;
    const active = row.id === activeRow();
    const bitNames = row.indices.map(i=>`x${sub(i)}`).join(', ');
    return `<tr class="${active ? 'active-table-row' : ''} ${revealed ? '' : 'unrevealed'}"><th scope="row"><button type="button" data-row="${row.id}" ${revealed ? '' : 'disabled'} aria-label="Wyjaśnij wiersz ${row.id + 1}" aria-pressed="${active}">${String(row.id + 1).padStart(2,'0')}</button></th><td>${revealed ? `<span class="table-bitnames">${bitNames || 'Korekta'}</span><code>${escape(row.calculation)}</code>` : '<span aria-label="Jeszcze nieodkryte">—</span>'}</td><td>${revealed ? row.digit === null ? 'K' : signed(row.digit) : '—'}</td><td>${revealed ? `${row.shift} ${row.shift === 1 ? 'bit' : 'bitów'}` : '—'}</td><td>${revealed ? fmt(row.value) : '—'}</td></tr>`;
  }).join('');
  const ready = visible === model.rows.length;
  $('recoded-summary').innerHTML = `<div class="recoded-digits"><span>Cyfry dᵢ od lewej</span><div>${[...model.recodedRows].reverse().map(row=>`<span class="sd-digit ${row.id === activeRow() ? 'sd-active' : ''}"><b>${row.id < visible ? signed(row.digit) : '·'}</b><small>${model.radix}<sup>${row.position}</sup></small></span>`).join('')}</div></div>${ready ? `<p class="recoded-value">${state.method.startsWith('alternative') ? `Y = ${fmt(model.recodedValue)}; X = 2 · (${fmt(model.recodedValue)}) − ${Number(model.X.bits.at(-1))} = ${fmt(model.X.value)}` : `Przekodowanie zachowuje wartość mnożnika X = ${fmt(model.X.value)}. Cyfry dᵢ mogą być ujemne.`}</p>` : ''}`;
}

function render() {
  model = calculate(state);
  view = getStepView(model, state);
  $('workspace').dataset.highlights = state.highlights;
  const total = view.total;
  state.cursor = view.cursor;
  const method = METHODS[state.method];
  $('workspace-title').textContent = state.method === 'ordinary' ? 'Mnożenie zwykłe' : state.method === 'no-extension' ? 'Mnożenie bez rozszerzeń' : state.method === 'modulo' ? method.name : `Metoda ${method.name}`;
  $('method-intro').textContent = method.intro;
  $('method-family').textContent = method.family;
  $('method-explanation').innerHTML = method.explanation.map(section => `<article class="method-section"><h3>${escape(section.title)}</h3>${section.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}</article>`).join('');
  $('method-formula').textContent = method.formula;
  document.querySelectorAll('[data-mixed-method]').forEach(article => {
    article.hidden = article.dataset.mixedMethod !== state.method;
  });
  $('preparation').hidden = !model.notes.length && model.preparedX === model.X.bits && model.preparedA === model.A.bits;
  $('preparation').innerHTML = `${model.notes.map(note=>`<p>${note}</p>`).join('')}${model.preparedX !== model.X.bits ? `<p>Mnożnik po rozszerzeniu: <code>${model.preparedX}</code>. Dodatkowe bity zachowują wartość X.</p>` : ''}${model.preparedA !== model.A.bits ? `<p>Robocza mnożna: <code>${model.preparedA}</code>.</p>` : ''}`;
  $('step-mode').setAttribute('aria-pressed',String(state.mode === 'step'));
  $('all-mode').setAttribute('aria-pressed',String(state.mode === 'all'));
  $('step-count').innerHTML = state.mode === 'all' ? 'Wszystkie kroki' : state.cursor === 0 ? `Przygotowanie <span>/ ${total}</span>` : `Krok <b>${String(state.cursor).padStart(2,'0')}</b> <span>/ ${String(total).padStart(2,'0')}</span>`;
  $('previous').disabled = state.mode === 'step' && state.cursor === 0;
  $('next').disabled = state.mode === 'all' || state.cursor === total;
  $('next').innerHTML = `${state.method === 'modulo' && (view.complete || state.cursor === model.rows.length + 1) ? `Przytnij do ${model.resultWidth} bitów` : state.cursor === model.rows.length ? 'Zsumuj' : 'Dalej'} <span aria-hidden="true">→</span>`;
  $('step-range').max = total;
  $('step-range').value = state.mode === 'all' ? total : state.cursor;
  $('step-range').style.setProperty('--progress',`${100 * Number($('step-range').value) / total}%`);
  $('step-range').setAttribute('aria-valuetext',state.mode === 'all' ? 'Wszystkie kroki' : `Krok ${state.cursor} z ${total}`);
  document.querySelectorAll('[data-example]').forEach(button => {
    const example = EXAMPLES[button.dataset.example];
    const active = state.a === example.a && state.x === example.x && state.system === example.system;
    button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active));
  });
  renderGrid(); renderExplanation(); renderTable();
  highlightVariables(document.querySelector('main'));
}

function move(cursor) { state.mode = 'step'; state.cursor = cursor; state.selected = null; render(); }
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(()=>{$('toast').hidden=true;},3500); }

$('operands-form').addEventListener('submit',event=>{
  event.preventDefault();
  if (!applyForm()) return;
  history.pushState(null,'',computationURL());
  goToWorkspace();
});
for (const id of ['operand-a','operand-x','bit-width']) $(id).addEventListener('input',()=>{state.dirty=true;updateHints();$('calculate-button').innerHTML='Przelicz nowe liczby <span aria-hidden="true">↗</span>';});
$('method').addEventListener('change',()=>{
  if (state.dirty && !applyForm()) { $('method').value=state.method; return; }
  state.method=$('method').value; state.cursor=1;state.selected=null;render();
});
document.querySelectorAll('[data-system]').forEach(button=>button.addEventListener('click',()=>{
  if (!applyForm(true, button.dataset.system)) return;
  syncForm();
}));
document.querySelectorAll('[data-base]').forEach(button=>button.addEventListener('click',()=>{
  if (state.base===button.dataset.base) return;
  if (state.dirty && !applyForm()) return;
  state.base=button.dataset.base;
  if (state.base==='decimal') {
    const width = Math.max(model.A.width,model.X.width);
    $('bit-width').value = width;
    if (model.A.width !== width || model.X.width !== width) Object.assign(state, {
      a:decimalToBits(model.A.value,width,state.system), x:decimalToBits(model.X.value,width,state.system), selected:null
    });
  }
  syncForm();render();
}));
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{
  Object.assign(state,EXAMPLES[button.dataset.example],{cursor:1,selected:null,base:'binary',dirty:false});
  $('form-error').hidden=true; ['operand-a','operand-x'].forEach(id=>$(id).removeAttribute('aria-invalid'));
  syncForm();render();
}));
$('step-mode').addEventListener('click',()=>{ if(state.mode!=='step') move(state.selected===null ? 1 : state.selected+1); });
$('all-mode').addEventListener('click',()=>{state.mode='all';state.selected=null;render();});
$('previous').addEventListener('click',()=>move((state.mode==='all' ? view.total : state.cursor)-1));
$('next').addEventListener('click',()=>move(state.cursor+1));
$('restart').addEventListener('click',()=>move(0));
$('step-range').addEventListener('input',event=>move(Number(event.target.value)));
$('highlights').addEventListener('change',event=>{state.highlights=event.target.checked;render();});
$('workspace').addEventListener('click',event=>{
  const button=event.target.closest('[data-row]');
  if(!button) return;
  // Zapamiętaj źródło przed renderem: zastąpiony wiersz traci rodzica table.
  const target=button.closest('table') ? $('recoding-body') : $('multiplication-grid');
  const row=Number(button.dataset.row);
  if(state.mode==='all') {state.selected=row;render();} else move(row+1);
  target.querySelector(`[data-row="${row}"]`)?.focus({preventScroll:true});
});
$('workspace').addEventListener('keydown',event=>{
  if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(event.target.tagName)) return;
  if(event.key==='ArrowRight' && state.cursor < view.total) {event.preventDefault();move(state.cursor+1);}
  if(event.key==='ArrowLeft' && state.cursor>0) {event.preventDefault();move(state.cursor-1);}
});
$('share').addEventListener('click',async()=>{
  if(state.dirty && !applyForm()) return;
  const url=computationURL();
  try {await navigator.clipboard.writeText(url.href);toast('Link do obliczenia skopiowany.');}
  catch {toast('Link jest w pasku adresu — możesz go skopiować.');}
  history.replaceState(null,'',url);
  goToWorkspace();
});
function restoreLocation() {
  const linked = readLocation();
  if (!linked) Object.assign(state,initialState,history.state?.calculation);
  $('form-error').hidden=true;
  ['operand-a','operand-x'].forEach(id=>$(id).removeAttribute('aria-invalid'));
  syncForm();render();
  if (linked) {
    history.replaceState(null,'',computationURL());
  }
  if (linked || location.hash === '#workspace') requestAnimationFrame(goToWorkspace);
}
window.addEventListener('hashchange',()=>{
  if (location.hash.startsWith('#a=')) restoreLocation();
  else if (location.hash === '#workspace') goToWorkspace();
});
window.addEventListener('popstate',restoreLocation);
const linked = readLocation();
syncForm();render();
if (linked) history.replaceState(null,'',computationURL());
else history.replaceState({calculation:{...state}},'',location.href);
if (linked || location.hash === '#workspace') requestAnimationFrame(goToWorkspace);
