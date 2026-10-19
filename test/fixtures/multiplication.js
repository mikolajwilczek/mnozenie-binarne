// Stałe oczekiwania, niezależne od engine.js i danych EXAMPLES interfejsu.
// Wiersze: [cyfra, przesunięcie binarne, wartość po przesunięciu].
// Kolejność: od najmłodszej pozycji; korekta jest osobnym wierszem.
export const examples = [
  {
    id: 'small', title: '−3 × (−5)', source: 'Mały przykład kontrolny, obliczony ręcznie.',
    input: { a: '1101', x: '1011', system: 'u2' },
    a: -3, x: -5, product: 15, result: '00001111',
    methods: {
      ordinary: { indices: [[0],[1],[2],[3]], rows: [[1,0,-3],[1,1,-6],[0,2,0],[-1,3,24]] },
      'no-extension': { indices: [[0],[1],[2],[3],[]], rows: [[1,0,5],[1,1,10],[0,2,32],[-1,3,88],[null,0,136]] },
      booth: { y: -5, indices: [[-1,0],[0,1],[1,2],[2,3]],
        calculations: ['0 − 1 = -1','1 − 1 = 0','1 − 0 = 1','0 − 1 = -1'],
        rows: [[-1,0,3],[0,1,0],[1,2,-12],[-1,3,24]] },
      mcsorley: { y: -5, indices: [[1,0,-1],[3,2,1]],
        calculations: ['−2 · 1 + 1 + 0 = -1','−2 · 1 + 0 + 1 = -1'],
        rows: [[-1,0,3],[-1,2,12]] },
      alternative: { y: -2, indices: [[0],[0,1],[1,2],[2,3],[3,4]], rows: [[-1,0,3],[0,0,0],[1,1,-12],[-1,2,24],[0,3,0]] },
      'alternative-mcsorley': { y: -2, indices: [[0],[2,1,0],[4,3,2]], rows: [[-1,0,3],[2,0,-12],[-1,2,24]] }
    }
  },
  {
    id: 'a', title: 'Lista 3, zadanie 1a', source: '../ak1/lista3.pdf, strona 1. Rozpiski wyliczone niezależnie według wzorów z wykładu 3.',
    input: { a: '1011010101', x: '101101', system: 'u2' },
    a: -299, x: -19, product: 5681, result: '0001011000110001',
    methods: {
      ordinary: { rows: [[1,0,-299],[0,1,0],[1,2,-1196],[1,3,-2392],[0,4,0],[-1,5,9568]] },
      'no-extension': { rows: [[1,0,213],[0,1,1024],[1,2,852],[1,3,1704],[0,4,8192],[-1,5,25952],[null,0,33280]] },
      booth: { y: -19, rows: [[-1,0,299],[1,1,-598],[-1,2,1196],[0,3,0],[1,4,-4784],[-1,5,9568]] },
      mcsorley: { y: -19, rows: [[1,0,-299],[-1,2,1196],[-1,4,4784]] },
      alternative: { y: -9, rows: [[-1,0,299],[1,0,-598],[-1,1,1196],[0,2,0],[1,3,-4784],[-1,4,9568],[0,5,0]] },
      'alternative-mcsorley': { y: -9, rows: [[-1,0,299],[-1,0,598],[2,2,-4784],[-1,4,9568]] }
    }
  },
  {
    id: 'b', title: 'Lista 3, zadanie 1b', source: '../ak1/lista3.pdf, strona 1. Te same bity co w 1a, ale dodatnie wartości NB.',
    input: { a: '1011010101', x: '101101', system: 'nb' },
    a: 725, x: 45, product: 32625, result: '0111111101110001',
    methods: {
      ordinary: { rows: [[1,0,725],[0,1,0],[1,2,2900],[1,3,5800],[0,4,0],[1,5,23200]] },
      'no-extension': { workWidth: 18, preparedA: '01011010101', preparedX: '0101101',
        rows: [[1,0,1749],[0,1,2048],[1,2,6996],[1,3,13992],[0,4,16384],[1,5,55968],[0,6,65536],[null,0,132096]] },
      booth: { preparedX: '0101101', y: 45, rows: [[-1,0,-725],[1,1,1450],[-1,2,-2900],[0,3,0],[1,4,11600],[-1,5,-23200],[1,6,46400]] },
      mcsorley: { preparedX: '00101101', y: 45, rows: [[1,0,725],[-1,2,-2900],[-1,4,-11600],[1,6,46400]] },
      alternative: { preparedX: '0101101', y: 23, rows: [[-1,0,-725],[1,0,1450],[-1,1,-2900],[0,2,0],[1,3,11600],[-1,4,-23200],[1,5,46400],[0,6,0]] },
      'alternative-mcsorley': { preparedX: '00101101', y: 23, rows: [[-1,0,-725],[-1,0,-1450],[2,2,11600],[1,4,23200],[0,6,0]] }
    }
  },
  {
    id: 'c', title: 'Lista 3, zadanie 1c', source: '../ak1/lista3.pdf, strona 1. Różne długości argumentów i ujemny iloczyn.',
    input: { a: '01011010', x: '1011010', system: 'u2' },
    a: 90, x: -38, product: -3420, result: '111001010100100',
    methods: {
      ordinary: { rows: [[0,0,0],[1,1,180],[0,2,0],[1,3,720],[1,4,1440],[0,5,0],[-1,6,-5760]] },
      'no-extension': { rows: [[0,0,128],[1,1,436],[0,2,512],[1,3,1744],[1,4,3488],[0,5,4096],[-1,6,2432],[null,0,16512]] },
      booth: { y: -38, rows: [[0,0,0],[-1,1,-180],[1,2,360],[-1,3,-720],[0,4,0],[1,5,2880],[-1,6,-5760]] },
      mcsorley: { preparedX: '11011010', y: -38, rows: [[-2,0,-180],[-1,2,-360],[2,4,2880],[-1,6,-5760]] },
      alternative: { y: -19, rows: [[0,0,0],[-1,0,-180],[1,1,360],[-1,2,-720],[0,3,0],[1,4,2880],[-1,5,-5760],[0,6,0]] },
      'alternative-mcsorley': { preparedX: '11011010', y: -19, rows: [[0,0,0],[1,0,180],[-1,2,-720],[-1,4,-2880],[0,6,0]] }
    }
  },
  {
    id: 'adamski', title: 'Przykład Adamskiego: −21 × (−58)',
    source: '../ak1/mnozenieUzup_v18.pdf, strony 3–6. Zachowujemy pełne 14 bitów wyniku.',
    input: { a: '1101011', x: '1000110', system: 'u2' },
    a: -21, x: -58, product: 1218, result: '00010011000010',
    methods: {
      ordinary: { rows: [[0,0,0],[1,1,-42],[1,2,-84],[0,3,0],[0,4,0],[0,5,0],[-1,6,1344]] },
      'no-extension': { rows: [[0,0,64],[1,1,86],[1,2,172],[0,3,512],[0,4,1024],[0,5,2048],[-1,6,5440],[null,0,8256]] },
      booth: { y: -58, rows: [[0,0,0],[-1,1,42],[0,2,0],[1,3,-168],[0,4,0],[0,5,0],[-1,6,1344]] },
      mcsorley: { preparedX: '11000110', y: -58, rows: [[-2,0,42],[2,2,-168],[0,4,0],[-1,6,1344]] }
    }
  }
];

export const goldenCases = examples.flatMap(example => Object.entries(example.methods).map(([method, expected]) => ({ example, method, expected })));
