# Wdrożenie

## Hosting statyczny

```sh
npm run build
```

Opublikuj zawartość `dist/` na hostingu statycznym. Node.js jest potrzebny
tylko lokalnie do budowania; na serwerze wystarczą gotowe pliki. Nie trzeba
instalować zależności npm, konfigurować backendu ani przekierowań routingu.
Zasoby używają względnych ścieżek, więc aplikacja działa też w podkatalogu.

Podgląd gotowej wersji:

```sh
node server.mjs dist
```

Otwórz `http://localhost:4173`. Serwer słucha na `127.0.0.1` i służy do
lokalnego podglądu. Nie uruchamiaj aplikacji przez `file://` — moduły
JavaScript wymagają HTTP(S).

## Opcjonalny skrypt SSH / rsync

Własne wdrożenie na serwer można skonfigurować lokalnie:

```sh
cp .env.deploy.example .env.deploy.local
```

Wpisz w `.env.deploy.local` alias SSH lub `user@host` jako `DEPLOY_HOST`,
bezwzględną ścieżkę katalogu aplikacji jako `DEPLOY_DIR` i jej publiczny
adres HTTP(S) jako `DEPLOY_URL`. Ten plik jest ignorowany przez Git.
Możesz też ustawić te zmienne w środowisku, jeśli nie używasz pliku lokalnego.
Plik jest wczytywany jako kod Bash; używaj wyłącznie własnej konfiguracji.

```sh
npm run deploy
```

Skrypt wymaga Node.js 20+, npm, SSH, rsync i curl. Korzysta z
`sudo -n install` oraz `sudo -n rsync` na serwerze, więc konto wdrażające
musi mieć odpowiednie uprawnienia bez interaktywnego podawania hasła.
Uwierzytelnianie SSH skonfiguruj poza repozytorium.

Skrypt buduje aplikację, synchronizuje `dist/` i sprawdza odpowiedź pod
`DEPLOY_URL`. **`rsync --delete` usuwa pliki w `DEPLOY_DIR`, których nie ma
w `dist/`.** Wskaż katalog przeznaczony wyłącznie dla tej aplikacji.
