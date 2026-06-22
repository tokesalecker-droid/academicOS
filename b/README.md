# AcademicOS

AcademicOS ist eine vollständig clientseitige Webanwendung für Notenverwaltung, Termine, Lerntracking und akademische Analyse.

Die App läuft ohne Server, ohne Datenbank und ohne kostenpflichtige Dienste. Daten werden lokal im Browser per `localStorage` gespeichert und können als JSON exportiert oder importiert werden.

## GitHub Pages Deployment

### 1. Repository vorbereiten

Lege ein neues GitHub-Repository an, zum Beispiel:

```text
academicos
```

### 2. Dateien hochladen

Für die veröffentlichte App werden mindestens diese Dateien und Ordner gebraucht:

```text
index.html
src/
.nojekyll
README.md
```

Empfohlen ist, das ganze Projekt hochzuladen:

```text
index.html
package.json
README.md
.nojekyll
src/
tests/
tools/
```

`tests/` und `tools/` sind nicht für GitHub Pages nötig, aber nützlich für Entwicklung und lokale Prüfung.

### 3. GitHub Pages aktivieren

1. Öffne dein Repository auf GitHub.
2. Gehe zu `Settings`.
3. Öffne `Pages`.
4. Wähle bei `Build and deployment`:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Speichern.

Nach kurzer Zeit ist die App erreichbar unter:

```text
https://DEIN-NAME.github.io/REPOSITORY-NAME/
```

## Brauchen wir Module?

Ja. Die App verwendet native JavaScript ES Modules:

```html
<script type="module" src="./src/ui/app.js"></script>
```

Das ist gut so und funktioniert direkt auf GitHub Pages. Es wird kein Bundler wie Vite, Webpack oder Parcel benötigt.

Wichtig:

- Die App sollte über `https://...` oder lokal über einen kleinen Server geöffnet werden.
- Direktes Öffnen per Doppelklick als `file://...` kann wegen Browser-Sicherheitsregeln Probleme mit Modulen machen.
- Alle Importpfade müssen relativ bleiben, zum Beispiel `../index.js`.

## Lokale Vorschau

Wenn Node.js verfügbar ist:

```bash
npm start
```

Dann öffnen:

```text
http://127.0.0.1:4173
```

## Tests

```bash
npm test
```

Die Tests prüfen vor allem:

- Fachtrennung bei Notenberechnungen
- Gewichtungssummen
- Prozent- und Punkteumrechnung
- lokale Countdown-Berechnung
- Analysefunktionen
- JSON Import und Export

## Datenspeicherung

AcademicOS speichert Daten im Browser-LocalStorage.

Das bedeutet:

- Daten bleiben auf dem jeweiligen Gerät und Browser.
- GitHub bekommt keine Noten oder Termine.
- Beim Browserwechsel müssen Daten per JSON exportiert und importiert werden.
- Regelmäßige Backups über Export sind empfohlen.

## Projektstruktur

```text
src/core/       Datenmodell, Validierung, Berechnungen, Analyse
src/state/      Zustandsänderungen
src/storage/    LocalStorage und JSON Import/Export
src/ui/         Oberfläche, Design und Interaktion
tests/          automatisierte Kernlogik-Tests
tools/          lokaler statischer Server
```

