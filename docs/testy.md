# Testy

Szybkie testy nie wymagają instalacji zależności:

```sh
npm test
```

Pełne testy przeglądarkowe (jednorazowo zainstaluj zależności i Chromium):

```sh
npm ci
npx playwright install chromium
npm run test:e2e
```

`npm run test:all` uruchamia oba zestawy. `npm run test:e2e:ui` otwiera
interaktywny runner. Raport po wykonaniu: `npx playwright show-report`.
Na CI instalacja przeglądarki z bibliotekami systemowymi:
`npx playwright install --with-deps chromium`.

Testy mają trzy warstwy:

1. **Obliczenia:** `test/examples.test.js` porównuje każdą cyfrę,
   przesunięcie i wartość wiersza ze stałymi rozpiskami w
   `test/fixtures/multiplication.js`. Są tam wszystkie sześć metod dla
   1a–1c i małego przykładu oraz cztery metody z opracowania Adamskiego.
   Oczekiwania są zapisane niezależnie od kodu aplikacji, z podanym źródłem.
   Nie regenerujemy ich silnikiem. Dla nowych przykładów dopisz dane
   i sprawdź je ręcznie z materiałem; oba zestawy testów użyją ich automatycznie.
2. **Własności i widok:** `test/engine.test.js` sprawdza wszystkie pary
   zapisów 1–5 bitów NB/U2 oraz skrajne wartości 16-bitowe. Oracle ma własne
   dekodowanie i używa `BigInt`, bez pomocniczych funkcji silnika.
   `test/worksheet.test.js` weryfikuje etapy, maskowanie wyniku, rozszerzenia,
   przesunięcia i pozycje podświetleń bez uruchamiania przeglądarki.
3. **E2E:** `e2e/multiplication.spec.js` porównuje rzeczywiste bity siatki
   i wartości tabeli z tymi samymi stałymi rozpiskami. Sprawdza także każdy
   krok wszystkich metod, cofanie, wybór wiersza, fokus, podświetlenia,
   walidację, własne liczby, linki i przewijanie dużej siatki.

Playwright sam buduje `dist/`, uruchamia serwer na porcie 4174 i zatrzymuje
go po testach. Dzięki temu brak pliku w buildzie również psuje test.
Nie trzeba uruchamiać `npm run dev`. Projekty: Chromium desktop oraz
Chromium z emulacją mobilnego viewportu i dotyku. To nie jest test prawdziwego
Safari/iPhone'a. Testy nie opierają się na zrzutach całej strony ani opóźnieniach
`sleep`; awaria zachowuje zrzut i trace do diagnozy.

Opcjonalne `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` wskazuje własny plik
wykonywalny Chromium. Standardowo używana jest przeglądarka zainstalowana
przez Playwright.
