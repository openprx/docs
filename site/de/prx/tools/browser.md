---
title: Browser-Werkzeug
description: Vollstandige Browser-Automatisierung mit austauschbaren Backends fur Web-Navigation, Formular-Interaktion, Screenshots und domainbeschrankte Navigation.
---

# Browser-Werkzeug

Das Browser-Werkzeug bietet PRX-Agenten vollstandige Web-Automatisierungsfahigkeiten -- Navigation auf Seiten, Ausfullen von Formularen, Klicken auf Elemente, Extrahieren von Inhalten und Aufnehmen von Screenshots. Es verwendet eine austauschbare Backend-Architektur mit drei Automatisierungs-Engines und erzwingt Domain-Beschrankungen, um uneingeschrankten Web-Zugriff zu verhindern.

Browser-Werkzeuge sind Feature-gesteuert und erfordern `browser.enabled = true` in der Konfiguration. Wenn aktiviert, registriert PRX `browser` und `browser_open` in der Werkzeug-Registry. Das Browser-Werkzeug unterstutzt komplexe mehrstufige Web-Workflows, wahrend `browser_open` eine einfachere Schnittstelle zum Offnen einer URL und Extrahieren ihres Inhalts bietet.

PRX enthalt auch visionsbezogene Werkzeuge (`screenshot`, `image`, `image_info`), die das Browser-Werkzeug fur visuelle Aufgaben erganzen. Screenshots, die vom Browser-Werkzeug aufgenommen werden, konnen an visionfahige LLMs fur visuelles Reasoning weitergegeben werden.

## Konfiguration

```toml
[browser]
enabled = true
backend = "agent_browser"       # "agent_browser" | "rust_native" | "computer_use"
allowed_domains = ["github.com", "docs.rs", "*.openprx.dev", "stackoverflow.com"]
session_name = "default"        # Benannte Browser-Sitzung fur persistenten Zustand
```

### Backend-Optionen

| Backend | Beschreibung | Abhangigkeiten | Am besten fur |
|---------|-------------|----------------|---------------|
| `agent_browser` | Ruft die externe `agent-browser`-CLI auf, ein externes Headless-Browser-Werkzeug | `agent-browser`-Binary im PATH | Allgemeine Web-Automatisierung, JavaScript-lastige Seiten |
| `rust_native` | Eingebaute Rust-Browser-Implementierung mit Headless Chrome/Chromium | Chromium installiert | Leichtgewichtige Automatisierung, keine externen Abhangigkeiten |
| `computer_use` | Computer-Use-Sidecar fur vollstandige Desktop-Interaktion | Anthropic Computer-Use-Sidecar | OS-Level-Interaktionen, komplexe GUI-Workflows |

### Domain-Beschrankungen

Die `allowed_domains`-Liste steuert, auf welche Domains der Browser zugreifen kann. Domain-Matching unterstutzt:

- **Exakte Ubereinstimmung**: `"github.com"` stimmt nur mit `github.com` uberein
- **Subdomain-Platzhalter**: `"*.openprx.dev"` stimmt mit `docs.openprx.dev`, `api.openprx.dev` usw. uberein
- **Kein Platzhalter**: Eine leere Liste blockiert jegliche Browser-Navigation

```toml
[browser]
allowed_domains = [
  "github.com",
  "*.github.com",
  "docs.rs",
  "crates.io",
  "stackoverflow.com",
  "*.openprx.dev"
]
```

## Verwendung

### browser-Werkzeug

Das Haupt-`browser`-Werkzeug unterstutzt mehrere Aktionen fur komplexe Web-Workflows:

**Zu einer URL navigieren:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "navigate",
    "url": "https://github.com/openprx/prx"
  }
}
```

**Ein Formularfeld ausfullen:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "fill",
    "selector": "#search-input",
    "value": "PRX documentation"
  }
}
```

**Ein Element anklicken:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "click",
    "selector": "button[type='submit']"
  }
}
```

**Einen Screenshot aufnehmen:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "screenshot"
  }
}
```

**Seiteninhalt extrahieren:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "content"
  }
}
```

### browser_open-Werkzeug

Ein vereinfachtes Werkzeug zum Offnen einer URL und Zuruckgeben ihres Inhalts:

```json
{
  "name": "browser_open",
  "arguments": {
    "url": "https://docs.rs/tokio/latest/tokio/"
  }
}
```

### Mehrstufiger Workflow-Beispiel

Ein typischer Recherche-Workflow konnte mehrere Browser-Aktionen verketten:

1. Zu einer Suchmaschine navigieren
2. Das Suchfeld mit einer Anfrage fullen
3. Den Such-Button klicken
4. Ergebnisse von der Seite extrahieren
5. Zu einem relevanten Ergebnis navigieren
6. Den detaillierten Inhalt extrahieren
7. Einen Screenshot fur visuelle Referenz aufnehmen

## Parameter

### browser-Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `action` | `string` | Ja | -- | Auszufuhrende Aktion: `"navigate"`, `"fill"`, `"click"`, `"screenshot"`, `"content"`, `"scroll"`, `"wait"`, `"back"`, `"forward"` |
| `url` | `string` | Bedingt | -- | URL zum Navigieren (erforderlich fur `"navigate"`-Aktion) |
| `selector` | `string` | Bedingt | -- | CSS-Selektor fur das Zielelement (erforderlich fur `"fill"`, `"click"`) |
| `value` | `string` | Bedingt | -- | Auszufullender Wert (erforderlich fur `"fill"`-Aktion) |
| `timeout_ms` | `integer` | Nein | `30000` | Maximale Wartezeit fur den Abschluss der Aktion |

### browser_open-Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `url` | `string` | Ja | -- | URL zum Offnen und Extrahieren von Inhalten |

### Vision-Werkzeug-Parameter

**screenshot:**

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `target` | `string` | Nein | `"screen"` | Was aufgenommen werden soll: `"screen"` oder ein Fenster-Bezeichner |

**image:**

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `action` | `string` | Ja | -- | Bildoperation: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Ja | -- | Pfad zur Bilddatei |

**image_info:**

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `path` | `string` | Ja | -- | Pfad zur zu inspizierenden Bilddatei |

## Backend-Details

### agent-browser

Das `agent_browser`-Backend delegiert an das externe `agent-browser`-CLI-Werkzeug, das eine Headless-Chrome-basierte Automatisierungsumgebung bereitstellt. Die Kommunikation erfolgt uber Stdio mit JSON-RPC-Nachrichten.

Vorteile:
- Vollstandige JavaScript-Ausfuhrung
- Cookie- und Sitzungspersistenz
- Erweiterungsunterstutzung

### rust_native

Das `rust_native`-Backend verwendet Rust-Bindings zur direkten Steuerung einer lokalen Chromium/Chrome-Installation. Es kommuniziert uber das Chrome DevTools Protocol (CDP).

Vorteile:
- Keine externe Binary-Abhangigkeit (ausser Chromium)
- Geringere Latenz als das Starten eines Subprozesses
- Engere Integration mit PRX-Interna

### computer_use

Das `computer_use`-Backend nutzt Anthropics Computer-Use-Sidecar fur OS-Level-Interaktionen einschliesslich Mausbewegung, Tastatureingabe und Bildschirmaufnahme. Dies geht uber Browser-Automatisierung hinaus zur vollstandigen Desktop-Steuerung.

Vorteile:
- Kann mit nativen Anwendungen interagieren, nicht nur mit Browsern
- Unterstutzt komplexe GUI-Workflows
- Verarbeitet Popups, Dateidialoge und Systemeingabeaufforderungen

## Sicherheit

### Domain-Whitelist

Das Browser-Werkzeug erzwingt eine strikte Domain-Whitelist. Vor der Navigation zu einer URL:

1. Die URL wird geparst und der Hostname wird extrahiert
2. Der Hostname wird gegen `allowed_domains` gepruft
3. Wenn keine Ubereinstimmung gefunden wird, wird die Navigation blockiert und ein Fehler zuruckgegeben

Dies verhindert, dass der Agent auf beliebige Websites zugreift, was ihn bosartigem Inhalt aussetzen oder unbeabsichtigte Aktionen auf authentifizierten Sitzungen auslosen konnte.

### Sitzungsisolation

Browser-Sitzungen werden nach Namen isoliert. Verschiedene Agenten-Sitzungen oder Sub-Agenten konnen separate Browser-Kontexte verwenden, um Zustandsleckagen zu verhindern (Cookies, localStorage, Sitzungsdaten).

### Inhaltsextraktionslimits

Die Seiteninhalt-Extraktion unterliegt dem `web_search.fetch_max_chars`-Limit, um Speichererschopfung durch ubermassig grosse Seiten zu verhindern.

### Richtlinien-Engine

Browser-Werkzeugaufrufe durchlaufen die Sicherheitsrichtlinien-Engine. Das Werkzeug kann vollstandig verweigert oder uberwacht werden, um eine Genehmigung fur jede Navigation zu erfordern:

```toml
[security.tool_policy.tools]
browser = "supervised"
browser_open = "allow"
```

### Anmeldedaten-Sicherheit

Das Browser-Werkzeug injiziert keine Anmeldedaten oder Authentifizierungstoken in Browser-Sitzungen. Wenn der Agent sich auf einer Website authentifizieren muss, muss er das Browser-Werkzeug verwenden, um Login-Formulare explizit auszufullen, was Uberwachungsrichtlinien unterliegt.

## Verwandte Seiten

- [Web-Suche](/de/prx/tools/web-search) -- das Web durchsuchen ohne Browser-Automatisierung
- [HTTP-Anfrage](/de/prx/tools/http-request) -- programmatische HTTP-Anfragen an APIs
- [Shell-Ausfuhrung](/de/prx/tools/shell) -- Alternative fur CLI-basierte Web-Interaktionen (curl, wget)
- [Sicherheits-Sandbox](/de/prx/security/sandbox) -- Prozessisolation fur Werkzeugausfuhrung
- [Konfigurationsreferenz](/de/prx/config/reference) -- `[browser]`-Konfigurationsfelder
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
