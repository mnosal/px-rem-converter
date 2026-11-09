# PX / REM Converter — rozszerzenie Visual Studio Code

Rozszerzenie dodaje do menu kontekstowego edytora podmenu **Konwersja PX / REM**. Wersja 1.1.0 rozdziela konwersję na trzy tryby.

## Dostępne opcje

| Opcja | PX → REM | REM → PX | Zakres |
|---|---|---|---|
| **1. Tylko `font-size` — miejscowo** | Tak | Tak | Zaznaczenie lub najbliższa wartość `font-size` przy kursorze |
| **2. Tylko `font-size` — cały dokument** | Tak | Tak | Wszystkie deklaracje `font-size` w aktywnym pliku |
| **3. Właściwości z konfiguracji — cały dokument** | Tak | Tak | Wszystkie właściwości wymienione w `pxRem.properties` |

Opcja 1 nie konwertuje np. `margin`, `padding`, `width` ani `line-height` — nawet jeśli znajdują się w zaznaczonym fragmencie. Przy pracy bez zaznaczenia kursor musi znajdować się w wierszu deklaracji `font-size` lub blisko wartości tej deklaracji.

Opcja 2 zmienia wyłącznie wartości we właściwości `font-size` w całym dokumencie. Pozostałe właściwości CSS są pomijane.

Opcja 3 konwertuje wyłącznie deklaracje właściwości wymienionych w ustawieniu `pxRem.properties`. Nazwy są dopasowywane dokładnie, bez uwzględniania wielkości liter. Przykładowo `margin` nie obejmuje `margin-top`; aby konwertować także tę właściwość, dodaj `margin-top` osobno.

## Konfiguracja

W ustawieniach VS Code (`Ctrl+,`) wyszukaj **PX / REM Converter**.

- `pxRem.rootFontSize` — bazowy rozmiar `1rem` w pikselach. Domyślnie `16`.
- `pxRem.precision` — maksymalna liczba miejsc po przecinku wyniku. Domyślnie `6`; zbędne zera są usuwane.
- `pxRem.properties` — lista właściwości CSS konwertowanych w opcji 3. Domyślnie `font-size`, `margin`, `padding`.

Przykład konfiguracji w `settings.json`:

```json
{
  "pxRem.rootFontSize": 16,
  "pxRem.precision": 4,
  "pxRem.properties": [
    "font-size",
    "padding",
    "gap",
    "width"
  ]
}
```

W tym przykładzie `margin` nie będzie konwertowany. Wystarczy usunąć go z tablicy `pxRem.properties`. Możesz dodawać inne nazwy, np. `margin-top`, `border-radius`, `width`, `height`, `gap`, `row-gap` lub `column-gap`.

## Przykład

Przy `pxRem.rootFontSize = 16`:

```css
.card {
  font-size: 16px;
  margin: 32px;
  padding: 8px 16px;
  width: 320px;
}
```

- Opcja 1, na wartości `font-size: 16px` → `font-size: 1rem`.
- Opcja 2 → zmieni tylko `font-size` na `1rem`; `margin`, `padding` i `width` pozostaną bez zmian.
- Opcja 3 przy domyślnej konfiguracji → `font-size: 1rem`, `margin: 2rem`, `padding: 0.5rem 1rem`; `width` pozostanie w px.

## Bezpieczeństwo konwersji

- Konwertowane są wartości jednostek w zakresach deklaracji CSS wskazanych właściwości.
- Komentarze oraz teksty w cudzysłowach są pomijane.
- Obsługiwane są standardowe pliki CSS, SCSS i LESS oraz deklaracje w atrybutach `style` plików HTML/Vue/Svelte.
- Konwersja miejscowa obsługuje wiele zaznaczeń/kursorów.
- Rozszerzenie nie wymaga dodatkowych pakietów npm ani zewnętrznych bibliotek.

## Instalacja z pliku VSIX

1. Otwórz VS Code.
2. Otwórz widok **Extensions** (`Ctrl+Shift+X`).
3. Kliknij menu `...` w prawym górnym rogu widoku Extensions.
4. Wybierz **Install from VSIX...**.
5. Wskaż plik `px-rem-converter-1.1.0.vsix`.
6. Po instalacji przeładuj okno VS Code, jeżeli edytor o to poprosi.

Alternatywnie w PowerShell/CMD:

```powershell
code --install-extension .\px-rem-converter-1.1.0.vsix
```

## Testowanie i rozwój

1. Rozpakuj archiwum źródłowe.
2. Otwórz folder `px-rem-converter` w VS Code.
3. Naciśnij `F5`, aby uruchomić Extension Development Host.
4. Otwórz plik CSS/SCSS, kliknij prawym przyciskiem w edytorze i wybierz **Konwersja PX / REM**.

Testy logiki konwersji uruchomisz poleceniem:

```powershell
node --test
```
