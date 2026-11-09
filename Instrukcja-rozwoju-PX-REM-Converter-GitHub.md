# Rozwijanie PX / REM Converter w VS Code i publikowanie na GitHub

Najwygodniej będzie potraktować **PX / REM Converter jako normalny projekt programistyczny**, który rozwijasz lokalnie w VS Code, a GitHub wykorzystujesz do przechowywania kodu, historii zmian i publikowania kolejnych wersji.

Nie musisz za każdym razem tworzyć wtyczki od początku. Wprowadzasz zmiany w kodzie, uruchamiasz testy, zwiększasz numer wersji i budujesz nowy plik `.vsix`.

Poniżej opisano cały proces na przykładzie wersji **1.1.0**, w systemie Windows i z użyciem PowerShell.

---

# 1. Przygotowanie projektu do pracy

Pobierz archiwum źródłowe:

- `px-rem-converter-source-1.1.0.zip`

Rozpakuj je np. do:

```text
C:\PROJEKTY\px-rem-converter
```

Otwórz folder w VS Code:

```powershell
code C:\PROJEKTY\px-rem-converter
```

## Struktura projektu

```text
px-rem-converter/
│
├── .vscodeignore
├── LICENSE
├── README.md
├── package.json
├── extension.js
├── converter.js
│
└── test/
    └── converter.test.js
```

Najważniejsze pliki:

| Plik | Za co odpowiada |
|---|---|
| `package.json` | Menu kontekstowe, komendy, ustawienia, numer wersji i metadane rozszerzenia |
| `extension.js` | Obsługa VS Code i wykonywanie poleceń |
| `converter.js` | Właściwa logika przeliczania PX/REM |
| `test/converter.test.js` | Testy automatyczne |
| `README.md` | Dokumentacja projektu |
| `.vscodeignore` | Określa, których plików nie umieszczać w paczce VSIX |
| `LICENSE` | Licencja projektu, w tym przypadku MIT |

Nie trzeba modyfikować wszystkich plików przy każdej zmianie. Przykładowo:

- poprawa sposobu przeliczania wartości — `converter.js`;
- zmiana menu kontekstowego — `package.json`;
- dodanie nowej funkcji i jej polecenia — zwykle `extension.js` oraz `package.json`;
- zmiana dokumentacji — `README.md`;
- dodanie testów — `test/converter.test.js`.

# 2. Jak wprowadzać zmiany w kodzie?

Przykład: chcesz rozszerzyć domyślną listę właściwości obsługiwanych przez opcję 3 o `width`, `height` i `gap`.

Otwórz `package.json` i znajdź ustawienie `pxRem.properties`. Może ono wyglądać tak:

```json
"pxRem.properties": {
    "type": "array",
    "default": [
        "font-size",
        "margin",
        "padding"
    ]
}
```

Zmień listę na:

```json
"pxRem.properties": {
    "type": "array",
    "default": [
        "font-size",
        "margin",
        "padding",
        "width",
        "height",
        "gap"
    ]
}
```

Zapisz plik. Domyślna konfiguracja rozszerzenia będzie teraz obejmować również te właściwości.

Przy większych zmianach warto pamiętać o trzech elementach:

1. Implementacja funkcji w kodzie.
2. Dodanie lub aktualizacja testów.
3. Aktualizacja dokumentacji `README.md`.

# 3. Testowanie wtyczki przed przygotowaniem instalatora

W projekcie znajdują się testy automatyczne. Uruchom terminal w VS Code przez **Terminal → New Terminal** i wykonaj:

```powershell
cd C:\PROJEKTY\px-rem-converter
node --test
```

W przygotowanej wersji 1.1.0 testy logiki konwersji przechodziły pomyślnie — 18/18. Po późniejszych zmianach należy uruchomić je ponownie i sprawdzić aktualny wynik.

## Testowanie bezpośrednio w VS Code

Możesz uruchamiać rozszerzenie w specjalnym oknie testowym bez konieczności każdorazowego budowania instalatora:

1. Otwórz projekt `px-rem-converter` w VS Code.
2. Naciśnij `F5`.
3. Otworzy się drugie okno VS Code — Extension Development Host.
4. W tym oknie otwórz testowy plik CSS.
5. Kliknij prawym przyciskiem myszy i przetestuj menu `Konwersja PX / REM`.

Jeżeli VS Code poprosi o konfigurację debugowania, utwórz w projekcie plik `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run PX REM Converter",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ]
        }
    ]
}
```

Po zmianach w kodzie możesz przeładować okno testowe poleceniem z palety poleceń:

```text
Developer: Reload Window
```

# 4. Przygotowanie pliku instalacyjnego VSIX

Do pakowania rozszerzeń VS Code służy narzędzie `@vscode/vsce`.

## Krok 1. Instalacja narzędzia

W terminalu PowerShell wykonaj:

```powershell
npm install -g @vscode/vsce
```

Sprawdź, czy narzędzie jest dostępne:

```powershell
vsce --version
```

## Krok 2. Zbudowanie wtyczki

Przejdź do folderu projektu:

```powershell
cd C:\PROJEKTY\px-rem-converter
```

Uruchom pakowanie:

```powershell
vsce package
```

W folderze projektu powinien pojawić się plik instalacyjny, np.:

```text
px-rem-converter-1.1.0.vsix
```

Nazwa zawiera numer wersji odczytany z `package.json`.

## Krok 3. Instalacja i sprawdzenie

Możesz zainstalować nową paczkę bezpośrednio z terminala:

```powershell
code --install-extension .\px-rem-converter-1.1.0.vsix --force
```

Opcja `--force` wymusza instalację paczki, również wtedy, gdy rozszerzenie o tej samej nazwie jest już zainstalowane.

# 5. Przygotowanie projektu do GitHub

Zalecany sposób pracy: przechowuj na GitHubie przede wszystkim kod źródłowy, a gotowe pliki `.vsix` publikuj jako osobne wydania (GitHub Releases). Dzięki temu repozytorium pozostaje uporządkowane.

## Krok 1. Dodaj plik `.gitignore`

W głównym folderze projektu utwórz plik `.gitignore`:

```gitignore
# Pakiety instalacyjne i archiwa
*.vsix
*.zip

# Zależności
node_modules/

# Pliki testowe VS Code
.vscode-test/

# Logi
*.log

# Windows
Thumbs.db
desktop.ini

# macOS
.DS_Store
```

Dzięki temu Git nie będzie dodawał do repozytorium instalatorów, archiwów i plików tymczasowych.

Nie ignoruj całego folderu `.vscode`, ponieważ warto przechowywać w repozytorium konfigurację debugowania, np. `launch.json`.

## Krok 2. Uzupełnij `package.json`

Dodaj informacje o repozytorium GitHub. W poniższym przykładzie zastąp `TWOJ_LOGIN` swoją nazwą użytkownika GitHub:

```json
"license": "MIT",
"repository": {
    "type": "git",
    "url": "https://github.com/TWOJ_LOGIN/px-rem-converter.git"
},
"homepage": "https://github.com/TWOJ_LOGIN/px-rem-converter#readme",
"bugs": {
    "url": "https://github.com/TWOJ_LOGIN/px-rem-converter/issues"
}
```

Wstaw te pola na odpowiednim poziomie głównego obiektu JSON. Jeżeli `license` już istnieje, nie dodawaj drugiej kopii tego pola.

## Krok 3. Utwórz repozytorium na GitHub

Otwórz:

https://github.com/new

Przykładowe ustawienia:

| Pole | Wartość |
|---|---|
| Repository name | `px-rem-converter` |
| Description | `VS Code extension for PX and REM conversion` |
| Visibility | Public lub Private — według własnych potrzeb |
| Add README | Nie, ponieważ README jest już lokalnie |
| Add .gitignore | Nie, ponieważ plik będzie już lokalnie |
| Choose a license | Nie, ponieważ projekt ma już plik `LICENSE` |

Po utworzeniu repozytorium skopiuj jego adres, np.:

```text
https://github.com/TWOJ_LOGIN/px-rem-converter.git
```

## Krok 4. Prześlij lokalny projekt na GitHub

W terminalu PowerShell w VS Code wykonaj kolejno poniższe polecenia.

**1. Przejdź do folderu projektu:**

```powershell
cd C:\PROJEKTY\px-rem-converter
```

**2. Zainicjuj repozytorium Git:**

```powershell
git init -b main
```

**3. Dodaj pliki projektu do poczekalni zmian:**

```powershell
git add .
```

**4. Sprawdź, co zostanie zapisane:**

```powershell
git status
```

Na liście powinny znaleźć się m.in. pliki:

```text
.gitignore
.vscodeignore
LICENSE
README.md
package.json
extension.js
converter.js
test/converter.test.js
```

Nie powinno być tam plików `.vsix` ani `.zip`.

**5. Zapisz pierwszą wersję w historii Git:**

```powershell
git commit -m "Initial commit: PX REM Converter 1.1.0"
```

**6. Połącz lokalny projekt z repozytorium GitHub:**

```powershell
git remote add origin https://github.com/TWOJ_LOGIN/px-rem-converter.git
```

**7. Wyślij projekt na GitHub:**

```powershell
git push -u origin main
```

Zastąp `TWOJ_LOGIN` swoją nazwą użytkownika. Przy pierwszym przesyłaniu może być wymagane uwierzytelnienie konta GitHub.

Po wykonaniu polecenia odśwież stronę repozytorium — powinny być widoczne pliki projektu.

# 6. Jak przygotowywać kolejne wersje?

Od tego momentu możesz rozwijać projekt, zachowując historię zmian. Przykładowy cykl pracy:

1. **Edycja kodu** — modyfikujesz odpowiednie pliki, np. `converter.js`, `extension.js` lub `package.json`.
2. **Testy** — uruchamiasz `node --test`.
3. **Zmiana numeru wersji** — aktualizujesz pole `version` w `package.json`.
4. **Budowanie instalatora** — uruchamiasz `vsce package`.
5. **Instalacja i testowanie** — instalujesz nowy plik VSIX i sprawdzasz działanie w VS Code.
6. **Zapisanie zmian na GitHub** — wykonujesz `git add`, `git commit` i `git push`.
7. **Publikacja wydania** — tworzysz GitHub Release i dodajesz do niego plik VSIX.

## Jak numerować wersje?

Pole `version` w `package.json` określa numer wydania.

| Przykład zmiany | Kiedy stosować |
|---|---|
| `1.1.0` → `1.1.1` | Poprawki błędów bez dodawania większych funkcji |
| `1.1.0` → `1.2.0` | Nowe funkcjonalności zgodne z dotychczasowym sposobem działania |
| `1.1.0` → `2.0.0` | Duże zmiany lub zmiany niezgodne wstecznie |

Przykład w `package.json`:

```json
{
    "name": "px-rem-converter",
    "version": "1.2.0"
}
```

W istniejącym pliku zmień wyłącznie wartość `version`; nie zastępuj całej zawartości `package.json` powyższym krótkim przykładem.

## Jak utworzyć Release na GitHub?

Po zbudowaniu instalatora i przesłaniu zmian do repozytorium:

1. Otwórz repozytorium na GitHub.
2. Przejdź do sekcji **Releases**.
3. Wybierz **Create a new release**.
4. Wpisz tag, np. `v1.2.0`.
5. Dodaj opis nowości.
6. Załącz wygenerowany plik `px-rem-converter-1.2.0.vsix`.
7. Wybierz **Publish release**.

Możesz też utworzyć i wysłać tag z terminala:

```powershell
git tag -a v1.2.0 -m "PX REM Converter 1.2.0"
git push origin v1.2.0
```

Następnie wybierz ten tag podczas tworzenia Release na GitHub.

# 7. GitHub a VS Code Marketplace — różnica

To dwa niezależne sposoby dystrybucji rozszerzenia.

## GitHub

Na GitHubie przechowujesz:

- kod źródłowy;
- historię zmian;
- dokumentację;
- zgłoszenia błędów i propozycje nowych funkcji;
- pliki instalacyjne VSIX w sekcji Releases.

To dobry sposób na rozpoczęcie pracy i udostępnianie rozszerzenia wybranym osobom.

## VS Code Marketplace

Marketplace to katalog rozszerzeń dostępny bezpośrednio z poziomu VS Code. Użytkownicy mogą wyszukać rozszerzenie i zainstalować je z poziomu panelu Extensions.

W `package.json` znajduje się pole `publisher`, np.:

```json
"publisher": "local-tools"
```

Przed publikacją w Marketplace trzeba zarejestrować własny identyfikator Publisher i wpisać go w tym polu. Samo umieszczenie projektu na GitHubie nie publikuje rozszerzenia w Marketplace.

Przydatne adresy:

- VS Code Extension API: https://code.visualstudio.com/api
- Pakowanie i publikowanie rozszerzeń: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- GitHub — dodawanie lokalnego kodu do GitHub: https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github

# 8. Zalecany sposób organizacji projektu

Dla PX / REM Converter polecany jest następujący podział:

| Narzędzie / plik | Zastosowanie |
|---|---|
| VS Code | Codzienna praca nad kodem |
| Git | Lokalna historia zmian i możliwość cofania błędnych modyfikacji |
| GitHub | Główne repozytorium projektu |
| GitHub Releases | Gotowe pliki instalacyjne VSIX |
| `README.md` | Aktualna dokumentacja projektu i instrukcja użytkowania |
| `CHANGELOG.md` | Historia zmian w kolejnych wersjach |

## Przykładowy `CHANGELOG.md`

W głównym folderze projektu możesz utworzyć plik `CHANGELOG.md`:

```markdown
# Changelog

## [1.1.0] - 2026-11-09

### Added
- Trzy tryby konwersji PX / REM.
- Konwersja miejscowa font-size.
- Konwersja font-size w całym dokumencie.
- Konwersja właściwości według konfiguracji.
- Możliwość definiowania własnych właściwości CSS.

## [1.0.0]

### Added
- Pierwsza wersja rozszerzenia.
- Konwersja PX → REM i REM → PX.
```

Aktualizuj ten plik przy każdym wydaniu, dopisując na górze nową wersję i najważniejsze zmiany.

## Najważniejsza zasada

Zawsze rozwijaj projekt w jednym głównym lokalnym repozytorium Git i synchronizuj je z GitHubem. Nie rozwijaj kolejnych wersji na podstawie pliku VSIX ani przypadkowych kopii folderów.

Zalecana kolejność pracy:

```text
EDYCJA KODU
    ↓
TESTY (node --test)
    ↓
ZMIANA NUMERU WERSJI (package.json)
    ↓
BUDOWANIE (vsce package)
    ↓
INSTALACJA I TESTY W VS CODE
    ↓
GIT COMMIT + GIT PUSH
    ↓
GITHUB RELEASE + PLIK VSIX
```

Ten sam schemat możesz później wykorzystać przy tworzeniu i rozwijaniu kolejnych własnych rozszerzeń VS Code.
