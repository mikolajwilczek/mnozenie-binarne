# Konwencje i poprawność

`src/engine.js` zawiera czystą logikę, niezależną od interfejsu. Wynik
`product` i jego bity `result` pochodzą z sumy iloczynów częściowych;
`referenceProduct` to niezależne zwykłe mnożenie do kontroli.

`src/worksheet.js` przekształca obliczenie i ustawienia kroku w model
widoku: widoczne wiersze, aktywny wiersz, sumę dotychczasową i komórki
siatki z pozycjami oraz rolami. Nie odwołuje się do DOM-u.

`src/app.js` obsługuje zdarzenia i renderuje te modele. Siatka i tabela
korzystają z tej samej reguły odsłaniania. Dodanie metody nie wymaga
nowego mechanizmu kroków ani nowego układu testów.

Podstawy: T. Tomczak, `wyklad_3.pdf`, strony PDF 7–9 i 14–24;
K. Adamski, `ak1/mnozenieUzup_v18.pdf`, strony 3–6;
J. Biernat, `Materiały/2006_-_03_-_mnozenie.pdf`, strony 23–29.
Materiały kursowe pozostają poza stroną i katalogiem publikacji.
Reguły Bootha i radix-4 można również porównać z
[MIT 6.175, Lab 3](https://csg.csail.mit.edu/6.175/labs/lab3-multipliers.html).

Warianty alternatywne stosują `X = 2Y − x₀`: osobny wiersz korekty
`−A·x₀` i mnożna `2A`. Zapis Adamskiego z korektą włączoną w SD jest
równoważny, ale interfejs używa jednej konsekwentnej konwencji.
W bazie 4 cyfry są z zakresu −2…2, nie są pojedynczymi bitami binarnego SD.

Metoda bez rozszerzeń odwraca najstarszy bit n-bitowego iloczynu
częściowego i dodaje `K = 2^(n−1) + 2^(n+m−1)`, modulo `2^(n+m)`.
NB najpierw otrzymuje zera znaku. Dla najmniejszej mnożnej U2 i ujemnego
mnożnika stosowany jest dodatkowy bit znaku, aby dodatnie `−A` mieściło
się w roboczym wierszu. Te przygotowania są wyjaśnione nad siatką.

## Bonus: mnożenie modulo 2ᵏ

Poza podstawowym materiałem. Przyjmujemy automatycznie `k = n + m`,
czyli szerokość pełnego iloczynu oryginalnych argumentów. Rozszerzamy
oba argumenty do `k` bitów znakiem w U2 albo zerami w NB. Dopisane bity
są zaznaczone w siatce. Dalej mnożymy rozszerzone zapisy jak NB: pokazujemy
`k` wierszy i pełną sumę na `2k` bitach. Osobny krok przycina sumę do
`k` najmłodszych bitów; odrzucone pozycje są przekreślone.

Jeśli `Aₖ = A mod 2ᵏ` i `Xₖ = X mod 2ᵏ`, to
`Aₖ·Xₖ ≡ A·X (mod 2ᵏ)`. Zachowane bity interpretujemy w pierwotnym systemie.
Przykład: `−3 × (−5)`, `k = 8`: `253 × 251 = 63503`,
`63503 mod 256 = 15`. Przy `−3 × 5` reszta wynosi `241`,
której zapis `11110001` w U2 oznacza `−15`.

Własność wspólnych najmłodszych bitów mnożenia ze znakiem i bez znaku opisują
Bryant i O’Hallaron w [CS:APP3e, Web Aside ASM:EASM, str. 5](https://csapp.cs.cmu.edu/3e/waside/waside-embedded-asm.pdf).
To demonstracja poprawności, a nie skrót rachunkowy: rozszerzenia jedynkami
mogą tworzyć wiele niezerowych wierszy, przy których łatwo o pomyłkę.

Pełne sumy bonusu mogą mieć 64 bity, więc silnik liczy je przez `BigInt`.
`test/fixtures/modulo.js` zawiera niezależne stałe przykłady dla testów silnika
i E2E, w tym sumę przekraczającą dokładny zakres `Number`. Testy sprawdzają
rozszerzenia, każdy wiersz, oddzielne sumowanie/przycięcie, cofanie i linki.
