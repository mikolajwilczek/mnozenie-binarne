# Obsługa

- Argumenty można wpisać binarnie (1–16 bitów, długości mogą być różne)
  albo dziesiętnie z jawną szerokością obu argumentów.
- U2 interpretuje najstarszy bit jako znak, NB jako dodatnią wagę.
  Szerokość U2 to liczba pozostałych cyfr + jeden bit znaku, który jest
  już zawarty we wpisywanym zapisie. Np. 5 to `101` w NB i `0101` w U2.
  Długości `n` i `m` uwzględniają znak; wynik ma `n + m` bitów.
- „Rozpisz mnożenie” stosuje wpisane liczby i przenosi do sekcji obliczeń
  (`#workspace`), również po zatwierdzeniu klawiszem Enter.
  Wybór przykładu oblicza go od razu.
- Kroki odsłaniają kolejne wiersze, ostatni krok pokazuje sumę.
- Nad argumentami siatki jest zawsze widoczne uzupełnienie mnożnej `−A`,
  wyrównane do kolumn. Dla NB poprzedzamy mnożną zerem znaku;
  gdy przeciwna wartość U2 wymaga dodatkowego bitu, opis pokazuje rozszerzenie.
  W bonusie modulo nie pokazujemy uzupełnienia: wszystkie wiersze są liczone w NB.
- Dla Bootha i wariantów przekodowanie jest przed siatką. W samej siatce,
  pod uzupełnieniem i nad mnożną, jest dodatkowy wiersz cyfr przekodowania.
  Baza 4 zajmuje co drugą kolumnę; warianty alternatywne pokazują `Y`
  z przypomnieniem `X = 2Y − x₀`. Cyfry odsłaniają się zgodnie z krokami.
- „Całość” pokazuje całe działanie. Kliknięcie wiersza wyjaśnia jego powstanie.
- Podświetlenia można wyłączyć. Suwak pozwala przejść do dowolnego kroku.
- Na dole strony sekcja „Mnożenie mieszane” opisuje U2 × NB i NB × U2
  tylko dla aktualnie wybranej metody, także bonusu modulo, z konwersją
  argumentu NB do dodatniego U2, regułami rozszerzania i korektami.
  W kalkulatorze nadal wybieramy
  wspólny system; przygotowany argument NB wprowadzamy przy wybranym U2.
- Ikona linku kopiuje adres z argumentami, metodą i bieżącym krokiem.
  Adres nie zawiera danych innych niż ustawienia ćwiczenia.
  Parametry są w query string, a `#workspace` kieruje bezpośrednio do obliczeń.
  Dotychczasowe adresy z parametrami w hashu są nadal obsługiwane.
- Siatkę dużych liczb można przewijać poziomo. Kolumny zachowują stałą
  minimalną szerokość, zamiast zmniejszać cyfry do nieczytelnych rozmiarów.
- Strona ma stały ciemny motyw. Rozszerzenie znaku ma niebieskie tło
  i przerywaną ramkę, a zera przesunięcia złote tło i podwójne podkreślenie.
  Te oznaczenia ról pozostają widoczne po wyłączeniu podświetleń bieżącego kroku.
