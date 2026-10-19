# Bit po bicie — mnożenie binarne

Interaktywny wizualizator mnożenia binarnego w **NB** (naturalnym binarnym)
i **U2** (uzupełnieniu do dwóch). Pokazuje iloczyny częściowe, przekodowanie
mnożnika i sumowanie, z wyjaśnieniem każdego kroku. Interfejs jest po polsku
i działa na komputerze oraz telefonie.

**[Otwórz aplikację](https://static.kiwicode.dev/mnozenie/)** ·
[Obsługa](docs/obsluga.md) · [Metody i konwencje](docs/metody.md)

## Możliwości

- Sześć metod mnożenia oraz bonus pokazujący arytmetykę modulo 2ᵏ.
- Własne argumenty binarne lub dziesiętne, po 1–16 bitów na liczbę.
- Przechodzenie krok po kroku, cofanie i widok całego działania.
- Podświetlanie odczytywanych bitów, rozszerzeń znaku i zer przesunięcia.
- Tabele przekodowania i objaśnienia wybranego wiersza.
- Linki odtwarzające argumenty, metodę i bieżący krok.
- Omówienie mnożenia mieszanego U2 × NB i NB × U2 dla każdej metody.

| Metoda | Co pokazuje |
| --- | --- |
| Zwykła | Sumowanie przesuniętych iloczynów częściowych |
| Bez rozszerzeń | Odwracanie najstarszych bitów i korektę sumy |
| Bootha | Przekodowanie w bazie 2, cyfry −1, 0, +1 |
| Bootha–McSorleya | Przekodowanie w bazie 4, cyfry od −2 do +2 |
| Alternatywna Bootha | Zapis `X = 2Y − x₀`, podwojoną mnożną i korektę |
| Alternatywna Bootha–McSorleya | Wariant alternatywny w bazie 4 |
| Modulo 2ᵏ — bonus | Rozszerzenie argumentów, mnożenie w NB i przycięcie wyniku |

## Uruchomienie lokalne

Wymagany jest Node.js **20 lub nowszy**. W katalogu projektu uruchom:

```sh
npm run dev
```

Otwórz [localhost:4173](http://localhost:4173).
Inny port: `PORT=4200 npm run dev`. Serwer jest dostępny wyłącznie lokalnie.

Uruchomienie, budowanie i testy jednostkowe nie wymagają `npm install`.
Aplikacja używa zwykłego JavaScriptu, HTML i CSS, bez frameworka i zależności
produkcyjnych. Playwright jest potrzebny wyłącznie do testów przeglądarkowych.

## Testy

```sh
npm test
```

Testy przeglądarkowe w Chromium, w widoku komputerowym i z emulacją telefonu:

```sh
npm ci
npx playwright install chromium
npm run test:e2e
```

`npm run test:all` uruchamia oba zestawy. Testy obejmują stałe rozpiski
iloczynów częściowych, wszystkie pary zapisów 1–5 bitów NB/U2, skrajne
wartości 16-bitowe oraz obsługę interfejsu. Szczegóły i pozostałe komendy
opisuje [dokumentacja testów](docs/testy.md).

## Budowanie i hosting

```sh
npm run build
```

Opublikuj zawartość `dist/` na hostingu statycznym. Aplikacja działa także
w podkatalogu; na hostingu nie wymaga Node.js ani backendu.
[Instrukcja wdrożenia](docs/wdrozenie.md) opisuje też lokalny podgląd buildu
oraz opcjonalny skrypt SSH / rsync.

## Struktura projektu

```text
src/engine.js       obliczenia i przekodowania, bez DOM-u
src/worksheet.js    model kroków i komórek siatki, bez DOM-u
src/app.js          zdarzenia i renderowanie interfejsu
src/style.css       style i układ responsywny
index.html          struktura strony
test/               testy jednostkowe i stałe przykłady
e2e/                testy przeglądarkowe Playwright
docs/               obsługa, konwencje, testy i wdrożenie
```

## Dane i prywatność

Obliczenia odbywają się w przeglądarce. Kod aplikacji nie używa analityki,
ciasteczek, zewnętrznych fontów ani usług API. Link do obliczenia zawiera
argumenty i ustawienia ćwiczenia w parametrach adresu.

## Materiały i rozwój

Projekt powstał jako pomoc do nauki architektury komputerów.
[Dokumentacja metod](docs/metody.md) opisuje przyjęte konwencje i źródła.
Materiały kursowe PDF nie są dołączone i nie są potrzebne do uruchomienia
aplikacji ani testów.

Poprawki i zgłoszenia błędów są mile widziane. Dla błędu obliczeń podaj
argumenty, system, metodę i oczekiwany wynik — najlepiej z linkiem
odtwarzającym ćwiczenie. Zmiany w algorytmach uzupełnij o niezależnie
policzony przypadek testowy.

## Licencja

[MIT](LICENSE).
