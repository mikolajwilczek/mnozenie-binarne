// Wszystkie obliczenia są całkowitoliczbowe. Limit 16 bitów na argument
// utrzymuje sumy sześciu podstawowych metod bezpiecznie w zakresie Number.
// Bonus modulo liczy pełną sumę do 64 bitów dokładnie przez BigInt.
export const MAX_BITS = 16;
export const METHODS = {
  ordinary: {
    name: 'Zwykła', short: 'Zwykła', family: 'Bit po bicie', pages: '7–8',
    intro: 'Dodajemy przesunięte iloczyny częściowe. Dla bitu znaku 1 w U2 dodajemy uzupełnienie mnożnej, czyli −A.',
    formula: 'P = Σ (dᵢ · A) · 2ⁱ',
    explanation: 'Mnożna A ma n bitów, a mnożnik X ma m bitów. W U2 każda z tych długości obejmuje dokładnie jeden bit znaku: liczba pozostałych cyfr + 1. Bit znaku jest już we wpisanym zapisie, więc nie dodajemy go ponownie. Najwyższy iloczyn pary bitów trafia na pozycję (n−1) + (m−1) = n + m − 2. Potrzebna jest jeszcze pozycja n + m − 1 na ewentualne przeniesienie w NB lub bit znaku w U2. Dlatego na pełny iloczyn rezerwujemy n + m kolumn, o pozycjach od 0 do n + m − 1. Taka szerokość mieści pełny wynik, także bity powstające przy przesunięciach i przeniesieniach. Konkretny wynik może mieć krótszy zapis, ale szerokości obliczenia nie zmniejszamy. W U2 rozszerzamy każdy wiersz z lewej jego bitem znaku: nie zmienia to wartości liczby i pozwala dodawać wiersze w tej samej szerokości. Czytamy mnożnik od prawej. Dla każdego bitu poza bitem znaku w U2: 1 oznacza dodanie mnożnej A, a 0 — wiersz zer. W ostatnim wierszu U2 najstarszy bit mnożnika ma wagę ujemną. Jeśli wynosi 1, dodajemy uzupełnienie mnożnej do dwóch, czyli −A, przesunięte o m−1 pozycji. To ten sam składnik co odjęcie A na tej pozycji. Aby obliczyć −A, najpierw rozszerzamy A znakiem do n + m bitów, następnie odwracamy wszystkie bity i dodajemy 1. Jeśli bit znaku wynosi 0, ostatni wiersz to zera. W NB dopełniamy wiersze z lewej zerami. Wszystkie bity mnożnika, także najstarszy, mają dodatnie wagi: dla 1 dodajemy A, bez dodawania uzupełnienia.'
  },
  'no-extension': {
    name: 'Bez rozszerzeń', short: 'Bez rozszerzeń', family: 'Negacja + korekta', pages: '9',
    intro: 'Zamiast powielać bit znaku, odwracamy najstarszy bit każdego wiersza i dodajemy korektę.',
    formula: 'P = Σ wᵢ · 2ⁱ + K  (mod 2ʷ)',
    explanation: 'Najpierw tworzymy iloczyny częściowe jak w metodzie zwykłej. W każdym odwracamy najstarszy bit. Tak zapisanych wierszy nie rozszerzamy znakiem. Zmianę wartości równoważy korekta K = 2ⁿ⁻¹ + 2ⁿ⁺ᵐ⁻¹, gdzie n i m to robocze długości argumentów. Przeniesienie poza szerokość wyniku pomijamy.'
  },
  booth: {
    name: 'Bootha', short: 'Booth', family: 'Baza 2 · cyfry SD', pages: '14–17',
    intro: 'Porównuj sąsiednie bity. Zamiast serii jedynek otrzymasz dodawanie i odejmowanie.',
    formula: 'dᵢ = xᵢ₋₁ − xᵢ',
    explanation: 'Do prawej strony mnożnika dopisujemy pomocnicze x₋₁ = 0. Dla każdej pozycji odejmujemy bieżący bit od jego prawego sąsiada. Cyfra +1 oznacza +A, −1 oznacza −A, a 0 — wiersz zer. Wartość przekodowanego mnożnika się nie zmienia.'
  },
  mcsorley: {
    name: 'Bootha–McSorleya', short: 'Booth–McSorley', family: 'Baza 4 · grupy bitów', pages: '18–19',
    intro: 'Bierz po dwa bity i ich prawego sąsiada. Jeden wiersz zastępuje dwie pozycje.',
    formula: 'dᵢ = −2x₂ᵢ₊₁ + x₂ᵢ + x₂ᵢ₋₁',
    explanation: 'Do prawej dopisujemy x₋₁ = 0. Dla nieparzystej długości mnożnik rozszerzamy z lewej bitem znaku. Analizujemy nakładające się trójki i wybieramy 0, ±A albo ±2A. Kolejne wiersze przesuwamy o dwie pozycje. Cyfry −2 i +2 są cyframi w bazie 4; w binarnym SD odpowiadają parom (−1, 0) i (+1, 0).'
  },
  alternative: {
    name: 'Alternatywna Bootha', short: 'Alt. Booth', family: 'Baza 2 · 2A i korekta', pages: '20–22',
    intro: 'Patrz na lewego sąsiada. Użyj podwojonej mnożnej i osobnej korekty najmłodszego bitu.',
    formula: 'dᵢ = xᵢ − xᵢ₊₁;  X = 2Y − x₀',
    explanation: 'Tym razem odejmujemy lewego sąsiada od bieżącego bitu. Otrzymujemy liczbę Y, dla której X = 2Y − x₀. Dlatego mnożymy jej cyfry przez 2A, a na początku zapisujemy korektę −A·x₀. Gdy najmłodszy bit wynosi 0, korekta też wynosi 0. Używamy konwencji z wykładu; korekta pozostaje osobnym wierszem.'
  },
  'alternative-mcsorley': {
    name: 'Alternatywna Bootha–McSorleya', short: 'Alt. Booth–McSorley', family: 'Baza 4 · 2A i korekta', pages: '23–24',
    intro: 'Wariant alternatywny w bazie 4: trójki bitów, podwojona mnożna i korekta −A·x₀.',
    formula: 'dᵢ = −2x₂ᵢ₊₂ + x₂ᵢ₊₁ + x₂ᵢ',
    explanation: 'Grupy przesuwamy względem zwykłego Bootha–McSorleya o jeden bit. Cyfry przekodowania opisują Y, a X = 2Y − x₀. Wiersze tworzymy z 2A i przesuwamy co dwie pozycje. Korektę −A·x₀ zapisujemy osobno. W tej konwencji nie dopisujemy dwóch zer z prawej.'
  },
  modulo: {
    name: 'Mnożenie modulo 2ᵏ (bonus)', short: 'Modulo 2ᵏ', family: 'Bonus · poza podstawowym materiałem',
    intro: 'Rozszerzamy oba argumenty do k = n + m bitów, mnożymy ich zapisy jak w NB i zachowujemy k najmłodszych bitów.',
    formula: 'k = n + m; P = (Aₖ · Xₖ) mod 2ᵏ',
    explanation: 'To bonus poza podstawowym materiałem: pokazuje, dlaczego mnożenie z przycięciem działa także dla U2. Na tym polega idea U2: dodawanie i odejmowanie odbywają się według zwykłych reguł binarnych, a przy mnożeniu odpowiednio rozszerzamy argumenty i przycinamy wynik. Dla komputerów to wygodne: ta sama arytmetyka bitowa obsługuje liczby dodatnie i ujemne. Przy ręcznym mnożeniu rozszerzenia jedynkami tworzą jednak wiele wierszy — idealne dla komputerów, zmora liczenia na kartce. Mnożna ma n bitów, mnożnik m bitów; w U2 te długości zawierają już po jednym bicie znaku. Przyjmujemy k = n + m, bo pełny iloczyn oryginalnych liczb mieści się na tylu bitach. Oba argumenty rozszerzamy do k bitów: w U2 powielamy bit znaku, w NB dopisujemy zera. Następnie odczytujemy te zapisy jako liczby bez znaku Aₖ i Xₖ i wykonujemy zwykłe mnożenie pisemne w NB, również dla najstarszego bitu. Pełną sumę pokazujemy na 2k bitach. Dopiero potem odrzucamy k najstarszych bitów i zachowujemy k najmłodszych, czyli resztę modulo 2ᵏ. Dla U2 interpretujemy zachowane bity ze znakiem. Metoda działa, ponieważ Aₖ ≡ A i Xₖ ≡ X (mod 2ᵏ), więc także Aₖ · Xₖ ≡ A · X (mod 2ᵏ). Dodatkowe bity znaku, zwłaszcza jedynki liczb ujemnych, tworzą wiele wierszy: tu jest ich k zamiast m. Wiersze zerowe można pominąć, ale przy ręcznym sumowaniu wielu pozostałych wierszy łatwo się pomylić.'
  }
};

export const EXAMPLES = {
  small: { a: '1101', x: '1011', system: 'u2', label: 'Na rozgrzewkę' },
  a: { a: '1011010101', x: '101101', system: 'u2', label: 'Zadanie 1a' },
  b: { a: '1011010101', x: '101101', system: 'nb', label: 'Zadanie 1b' },
  c: { a: '01011010', x: '1011010', system: 'u2', label: 'Zadanie 1c' }
};

export const mod = (value, width) => ((value % 2 ** width) + 2 ** width) % 2 ** width;
export const binary = (value, width) => (typeof value === 'bigint' || width > 52 ? BigInt.asUintN(width, BigInt(value)) : mod(value, width)).toString(2).padStart(width, '0');
export const signedWidth = value => {
  let n = 1;
  while (value < -(2 ** (n - 1)) || value >= 2 ** (n - 1)) n++;
  return n;
};
export function parseBits(text, system) {
  if (!['u2', 'nb'].includes(system)) throw new Error('Wybierz zapis U2 albo NB.');
  const bits = String(text).replace(/\s/g, '').replace(/^0b/i, '');
  if (!/^[01]+$/.test(bits)) throw new Error('Wpisz tylko cyfry 0 i 1.');
  if (bits.length > MAX_BITS) throw new Error(`Maksymalnie ${MAX_BITS} bitów na liczbę.`);
  const unsigned = Number.parseInt(bits, 2);
  return { bits, width: bits.length, value: unsigned - (system === 'u2' && bits[0] === '1' ? 2 ** bits.length : 0) };
}
export function decimalToBits(text, width, system) {
  if (!['u2', 'nb'].includes(system)) throw new Error('Wybierz zapis U2 albo NB.');
  if (!/^-?\d+$/.test(String(text).trim())) throw new Error('Wpisz liczbę całkowitą.');
  if (!Number.isInteger(width) || width < 1 || width > MAX_BITS) throw new Error('Szerokość musi wynosić od 1 do 16 bitów.');
  const value = Number(text);
  const min = system === 'u2' ? -(2 ** (width - 1)) : 0;
  const max = 2 ** (width - (system === 'u2' ? 1 : 0)) - 1;
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Dla ${width} bitów zakres to ${min}…${max}.`);
  return binary(value, width);
}

export function calculate({ a, x, system = 'u2', method = 'booth' }) {
  if (!Object.hasOwn(METHODS, method)) throw new Error('Nieznana metoda.');
  const A = parseBits(a, system), X = parseBits(x, system);
  if (method === 'modulo') return calculateModulo(A, X, system);
  const signed = system === 'u2';
  const resultWidth = A.width + X.width;
  const referenceProduct = A.value * X.value;
  const rows = [], notes = [];
  let workWidth = resultWidth;
  let preparedA = A.bits;
  let preparedX = X.bits;
  const bit = i => i < 0 ? 0 : i >= X.width ? (signed ? Number(X.bits[0]) : 0) : Number(X.bits[X.width - 1 - i]);
  const push = row => {
    row.id = rows.length;
    row.value ??= row.base * 2 ** row.shift;
    if (row.digit === 0) row.digit = 0;
    if (row.value === 0) row.value = 0;
    row.payloadWidth ??= signedWidth(row.base);
    rows.push(row);
  };
  const standardRow = (i, m = X.width) => {
    const d = signed && i === m - 1 ? -bit(i) : bit(i);
    return { kind: 'partial', position: i, digit: d, shift: i, base: d * A.value, indices: [i],
      calculation: `${d} · (${A.value}) · 2^${i} = ${d * A.value * 2 ** i}`,
      title: signed && i === m - 1 ? bit(i) ? 'Dodajemy uzupełnienie mnożnej (−A)' : 'Bit znaku mnożnika wynosi 0' : `Czytamy bit x${sub(i)}`,
      detail: signed && i === m - 1
        ? bit(i)
          ? `Najstarszy bit mnożnika wynosi 1 i ma wagę −2^${i}. Dodajemy uzupełnienie mnożnej do dwóch, czyli −A = ${-A.value}. Najpierw rozszerzamy A znakiem do n + m = ${A.width} + ${X.width} = ${resultWidth} bitów, czyli szerokości pełnego wyniku: ${binary(A.value, resultWidth)}. Powielenie bitu znaku zachowuje wartość A. Odwracamy bity i dodajemy 1: ${binary(-A.value, resultWidth)}. Otrzymane uzupełnienie przesuwamy o ${i} pozycji w lewo i dodajemy jako ostatni iloczyn częściowy.`
          : `Najstarszy bit mnożnika w U2 wynosi 0. Nie dodajemy uzupełnienia mnożnej; ostatni iloczyn częściowy jest równy 0, z przesunięciem o ${i} pozycji.`
        : `Bit x${sub(i)} = ${bit(i)}. ${bit(i) ? 'Bierzemy mnożną A' : 'Zapisujemy wiersz zer'} i przesuwamy o ${i} ${i === 1 ? 'pozycję' : 'pozycji'} w lewo.` };
  };

  if (method === 'ordinary') {
    notes.push(`Mnożna ma n = ${A.width} bitów, a mnożnik m = ${X.width} bitów. ${signed ? `W U2 każda długość zawiera jeden bit znaku: n = ${A.width - 1} + 1 = ${A.width}, m = ${X.width - 1} + 1 = ${X.width}. Do n + m nie doliczamy kolejnego bitu znaku. ` : ''}Dla pełnego iloczynu rezerwujemy n + m = ${A.width} + ${X.width} = ${resultWidth} bitów (pozycje 0–${resultWidth - 1}). Najwyższy iloczyn pary bitów trafia na pozycję ${A.width - 1} + ${X.width - 1} = ${resultWidth - 2}. Pozycja ${resultWidth - 1} jest potrzebna na ${signed ? 'bit znaku w U2' : 'ewentualne przeniesienie w NB'}. ${signed ? 'Wiersze rozszerzamy z lewej bitem znaku — ich wartości się nie zmieniają.' : 'Wiersze dopełniamy z lewej zerami — ich wartości się nie zmieniają.'}`);
    for (let i = 0; i < X.width; i++) push(standardRow(i));
  } else if (method === 'no-extension') {
    let n = A.width + (signed ? 0 : 1);
    const m = X.width + (signed ? 0 : 1);
    if (signed && A.value === -(2 ** (n - 1)) && X.value < 0) {
      n++;
      notes.push('Mnożna jest najmniejszą liczbą U2 tej szerokości. Dodajemy jej jeden bit znaku, aby −A mieściło się przed odwróceniem najstarszego bitu.');
    }
    if (!signed) notes.push('Argumentom NB dopisujemy z lewej 0, aby użyć algorytmu U2 bez zmiany ich dodatnich wartości.');
    preparedA = binary(A.value, n);
    preparedX = binary(X.value, m);
    workWidth = n + m;
    for (let i = 0; i < m; i++) {
      const d = i === m - 1 ? -bit(i) : bit(i);
      const q = d * A.value;
      const flipped = q + 2 ** (n - 1);
      push({kind: 'flipped', position: i, digit: d, shift: i, base: flipped, originalBase: q,
        payloadWidth: n, flippedPosition: n - 1 + i, indices: [i],
        calculation: `${d} · A = ${q}; negacja bitu ${n - 1}`,
        title: 'Odwracamy najstarszy bit wiersza',
        detail: `Iloczyn ${d} · A = ${q} zapisujemy na ${n} bitach: ${binary(q, n)}. Po odwróceniu najstarszego bitu otrzymujemy ${binary(flipped, n)}. Przesuwamy o ${i} pozycji; z lewej nie dopisujemy bitów znaku.`});
    }
    const correction = 2 ** (n - 1) + 2 ** (n + m - 1);
    const additions = Array.from({ length: m }, (_, i) => 2 ** (n - 1 + i));
    const excess = additions.reduce((sum, value) => sum + value, 0);
    const additionPowers = additions.map((_, i) => `2^${n - 1 + i}`);
    const additionSum = m <= 4 ? additionPowers.join(' + ') : `${additionPowers[0]} + ${additionPowers[1]} + … + ${additionPowers.at(-1)}`;
    push({kind:'correction', position:null, digit:null, shift:0, base:correction, payloadWidth:workWidth, indices:[],
      calculation:`K = ${binary(correction, workWidth)}₂ = 2^${n - 1} + 2^${n + m - 1} = ${correction}`,
      title:'Dodajemy korektę', detail:[
        `Korekta to ${binary(correction, workWidth)}₂: dwie jedynki, a na pozostałych pozycjach zera. Pozycje liczymy od prawej, od 0. Pierwszą jedynkę wpisujemy na pozycji ${n - 1}, gdzie odwracaliśmy bit pierwszego wiersza. Drugą na pozycji ${n + m - 1}, o jedną kolumnę w lewo od odwróconego bitu ostatniego wiersza (pozycja ${n + m - 2}).`,
        `Dlaczego? Po odwróceniu bitu znaku i odczytaniu krótkiego wiersza jako NB jego wartość rośnie zawsze o 2^${n - 1}. Dotyczy to także wierszy zerowych. Po przesunięciach ${m === 1 ? `dodany nadmiar wynosi ${additionSum}` : `te dodatki sumują się do ${additionSum} = ${excess}`}.`,
        `Korekta K = 2^${n - 1} + 2^${n + m - 1} dopełnia ten nadmiar do 2^${workWidth}: ${m === 1 ? additionSum : excess} + (2^${n - 1} + 2^${n + m - 1}) = 2^${workWidth}, czyli 1 i ${workWidth} zer w zapisie binarnym. Przeniesienie poza ${workWidth} bitów odrzucamy, więc z tej sumy zostają same zera. W ten sposób usuwamy dokładnie to, co dodaliśmy przez odwrócenia bitów, i otrzymujemy właściwy iloczyn.`
      ].join('\n\n')});
  } else {
    const alt = method.startsWith('alternative');
    const radix4 = method.includes('mcsorley');
    let m = X.width + (signed ? 0 : 1);
    if (!signed) notes.push('Mnożnik NB rozszerzamy z lewej zerem: w przekodowaniu traktujemy go jak dodatnią liczbę U2.');
    if (radix4 && m % 2) m++;
    preparedX = binary(X.value, m);
    if (alt) push({kind:'correction', position:null, digit:-bit(0), shift:0, base:-A.value * bit(0), indices:[0],
      calculation:`−A · x₀ = −(${A.value}) · ${bit(0)} = ${-A.value * bit(0)}`,
      title:'Najpierw korekta −A·x₀', detail:`Najmłodszy bit mnożnika x₀ = ${bit(0)}. Ponieważ X = 2Y − x₀, zapisujemy osobny składnik −A·x₀ = ${-A.value * bit(0)}. Kolejne wiersze będą używać podwojonej mnożnej 2A = ${2 * A.value}.`});
    for (let i = 0; i < (radix4 ? m / 2 : m); i++) {
      const p = radix4 ? 2 * i : i;
      const indices = radix4 ? [p + (alt ? 2 : 1), p + (alt ? 1 : 0), p + (alt ? 0 : -1)] : alt ? [p, p + 1] : [p - 1, p];
      const values = indices.map(bit);
      const d = radix4 ? -2 * values[0] + values[1] + values[2] : values[0] - values[1];
      const calculation = radix4 ? `−2 · ${values[0]} + ${values[1]} + ${values[2]} = ${d}` : `${values[0]} − ${values[1]} = ${d}`;
      push({kind:'recoded', position:i, digit:d, shift:p, base:d * A.value * (alt ? 2 : 1), indices, calculation,
        title:radix4 ? `Grupa ${i}: ${values.join('')}` : `Wyznaczamy cyfrę d${sub(i)}`,
        detail:`Bierzemy ${indices.map(j => `x${sub(j)} = ${bit(j)}${j < 0 ? ' (dopisane zero)' : j >= X.width ? ' (rozszerzenie)' : ''}`).join(', ')}. Obliczamy ${calculation}. Cyfra ${d > 0 ? '+' : ''}${d} oznacza ${d === 0 ? 'wiersz zer' : `${d} · ${alt ? '2A' : 'A'}`}. Wiersz przesuwamy o ${p} pozycji w lewo.`});
    }
  }
  const rawSum = rows.reduce((sum, row) => sum + row.value, 0);
  const result = binary(rawSum, resultWidth);
  const unsignedProduct = Number.parseInt(result, 2);
  const product = unsignedProduct - (signed && result[0] === '1' ? 2 ** resultWidth : 0);
  const recodedRows = rows.filter(row => row.kind === 'recoded');
  const radix = method.includes('mcsorley') ? 4 : 2;
  const recodedValue = recodedRows.reduce((sum, row) => sum + row.digit * radix ** row.position, 0);
  return {A, X, system, method, rows, notes, preparedA, preparedX, workWidth, resultWidth, product, referenceProduct, rawSum,
    result, workResult:binary(rawSum, workWidth), recodedValue,
    recodedRows, radix, operations:rows.filter(row => row.value !== 0).length};
}

function calculateModulo(A, X, system) {
  const resultWidth = A.width + X.width;
  const workWidth = 2 * resultWidth;
  const preparedA = binary(A.value, resultWidth), preparedX = binary(X.value, resultWidth);
  const unsignedA = BigInt(`0b${preparedA}`), unsignedX = BigInt(`0b${preparedX}`);
  const rows = Array.from({ length: resultWidth }, (_, i) => {
    const digit = Number(preparedX[resultWidth - i - 1]);
    const base = digit ? unsignedA : 0n;
    const value = base << BigInt(i);
    return {
      id: i, kind: 'unsigned', position: i, digit, shift: i, base, value,
      payloadWidth: resultWidth, indices: [i],
      calculation: `${digit} · ${unsignedA} · 2^${i} = ${value}`,
      title: `Czytamy bit x${sub(i)}${i >= X.width ? ' z rozszerzenia' : ''}`,
      detail: `Bit x${sub(i)} = ${digit}${i >= X.width ? ' pochodzi z rozszerzenia mnożnika' : ''}. Rozszerzoną mnożną ${preparedA} odczytujemy teraz jako NB: Aₖ = ${unsignedA}. ${digit ? `Dodajemy ${unsignedA}` : 'Zapisujemy wiersz zer'}, z przesunięciem o ${i} pozycji. Ten bit ma dodatnią wagę 2^${i}, także gdy jest kopią bitu znaku. Wartość wiersza przed przycięciem: ${value}.`
    };
  });
  const rawSum = rows.reduce((sum, row) => sum + row.value, 0n);
  const result = binary(rawSum, resultWidth);
  const residue = Number(BigInt.asUintN(resultWidth, rawSum));
  const product = residue - (system === 'u2' && result[0] === '1' ? 2 ** resultWidth : 0);
  const notes = [
    `Bonus poza podstawowym materiałem. Przyjmujemy k = n + m = ${A.width} + ${X.width} = ${resultWidth} bitów, ponieważ pełny iloczyn oryginalnych liczb mieści się w tej szerokości. ${system === 'u2' ? 'Długości n i m zawierają już bity znaku. Oba argumenty rozszerzamy znakiem' : 'Oba argumenty rozszerzamy zerami'} do k bitów; dopisane pozycje są oznaczone na niebiesko.`,
    `Mnożymy rozszerzone zapisy jak liczby NB: Aₖ = ${unsignedA}, Xₖ = ${unsignedX}. Pełną sumę liczymy na 2k = ${workWidth} bitach, po czym zachowujemy k = ${resultWidth} najmłodszych bitów (modulo 2^${resultWidth}). ${system === 'u2' ? 'Zachowane bity odczytujemy ponownie jako U2.' : 'Zachowane bity odczytujemy jako NB.'}`,
    `Powstaje ${resultWidth} wierszy zamiast ${X.width} w metodzie zwykłej, w tym ${rows.filter(row => row.value !== 0n).length} niezerowych. To idea U2 w praktyce: po odpowiednim rozszerzeniu liczymy zwykłymi regułami binarnymi i przycinamy wynik. Idealne dla komputerów, ale zmora liczenia ręcznego: wiele wierszy to dużo pracy i okazji do pomyłki.`
  ];
  return {
    A, X, system, method: 'modulo', rows, notes, preparedA, preparedX, workWidth, resultWidth,
    unsignedA, unsignedX, residue, product, referenceProduct: A.value * X.value,
    rawSum, result, workResult: binary(rawSum, workWidth), recodedValue: 0, recodedRows: [], radix: 2,
    operations: rows.filter(row => row.value !== 0n).length
  };
}

export function sub(value) { return String(value).replace(/[-0-9]/g, c => '₋₀₁₂₃₄₅₆₇₈₉'['-0123456789'.indexOf(c)]); }
