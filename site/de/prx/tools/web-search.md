---
title: Web-Suche
description: Das Web uber DuckDuckGo (kostenlos, kein API-Schlussel) oder Brave Search (API-Schlussel erforderlich) mit konfigurierbaren Ergebnislimits und Timeouts durchsuchen.
---

# Web-Suche

Das `web_search_tool` ermoglicht PRX-Agenten, das Web nach aktuellen Informationen zu durchsuchen. Es unterstutzt zwei Suchanbieter -- DuckDuckGo (kostenlos, kein API-Schlussel erforderlich) und Brave Search (erfordert einen API-Schlussel) -- und gibt strukturierte Suchergebnisse zuruck, die der Agent verwenden kann, um Fragen zu aktuellen Ereignissen zu beantworten, Dokumentation nachzuschlagen oder Themen zu recherchieren.

Web-Suche ist Feature-gesteuert und erfordert `web_search.enabled = true` in der Konfiguration. Wenn aktiviert, registriert PRX optional auch das `web_fetch`-Werkzeug zum Extrahieren vollstandiger Seiteninhalte aus URLs, die in Suchergebnissen gefunden wurden.

Die Kombination aus `web_search_tool` und `web_fetch` gibt Agenten eine vollstandige Web-Recherche-Pipeline: nach relevanten Seiten suchen, dann Inhalte von den vielversprechendsten Ergebnissen abrufen und extrahieren.

## Konfiguration

```toml
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (kostenlos) oder "brave" (API-Schlussel erforderlich)
max_results = 5              # Maximale Ergebnisse pro Suche (1-10)
timeout_secs = 10            # Anfrage-Timeout in Sekunden

# Brave Search (erfordert API-Schlussel)
# provider = "brave"
# brave_api_key = "BSA-xxxxxxxxxxxx"

# Web-Fetch (Seiteninhalt-Extraktion)
fetch_enabled = true         # Das web_fetch-Werkzeug aktivieren
fetch_max_chars = 50000      # Maximale Zeichen, die von web_fetch zuruckgegeben werden
```

### Anbieter-Vergleich

| Funktion | DuckDuckGo | Brave Search |
|----------|-----------|-------------|
| Kosten | Kostenlos | Kostenloses Kontingent (2000 Anfragen/Monat), kostenpflichtige Plane verfugbar |
| API-Schlussel | Nicht erforderlich | Erforderlich (`brave_api_key`) |
| Ergebnisqualitat | Gut fur allgemeine Anfragen | Hohere Qualitat, besser strukturiert |
| Ratenlimits | Implizit (kann drosseln) | Explizit (basierend auf Plan) |
| Datenschutz | Datenschutzorientiert | Datenschutzorientiert |
| Strukturierte Daten | Grundlegend (Titel, URL, Snippet) | Reichhaltig (Titel, URL, Snippet, zusatzliche Beschreibungen) |

### Anbieter wahlen

- **DuckDuckGo** ist der Standard und funktioniert sofort ohne Konfiguration uber `enabled = true` hinaus. Es ist fur die meisten Anwendungsfalle geeignet und erfordert kein Konto oder API-Schlussel.
- **Brave Search** bietet hoherwertige Ergebnisse und reichhaltigere Metadaten. Verwenden Sie es, wenn die Suchqualitat entscheidend ist oder wenn Sie das `web_fetch`-Werkzeug fur zuverlassige Inhaltextraktion benotigen.

## Verwendung

### web_search_tool

Das Suchwerkzeug gibt eine Liste von Ergebnissen mit Titeln, URLs und Snippets zuruck:

```json
{
  "name": "web_search_tool",
  "arguments": {
    "query": "Rust async runtime comparison tokio vs async-std 2026",
    "max_results": 5
  }
}
```

**Beispielantwort:**

```json
{
  "success": true,
  "output": "1. Comparing Tokio and async-std in 2026 - https://blog.example.com/rust-async\n   Snippet: A detailed comparison of the two main Rust async runtimes...\n\n2. Tokio documentation - https://docs.rs/tokio\n   Snippet: Tokio is an asynchronous runtime for Rust...\n\n..."
}
```

### web_fetch

Nach dem Finden relevanter URLs uber die Suche kann der Agent Inhalte abrufen und extrahieren:

```json
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://blog.example.com/rust-async"
  }
}
```

Das `web_fetch`-Werkzeug:

1. Validiert die URL-Domain gegen `browser.allowed_domains`
2. Ruft den Seiteninhalt ab
3. Extrahiert lesbaren Text (entfernt HTML, Skripte, Styles)
4. Kurzt auf `fetch_max_chars`
5. Gibt den extrahierten Inhalt zuruck

::: warning
`web_fetch` erfordert sowohl `web_search.fetch_enabled = true` **als auch** `browser.allowed_domains`. Die abgerufene URL muss einer der erlaubten Domains entsprechen.
:::

## Parameter

### web_search_tool-Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `query` | `string` | Ja | -- | Der Suchanfrage-String |
| `max_results` | `integer` | Nein | Konfigurationswert (`5`) | Maximale Anzahl zuruckzugebender Ergebnisse (1-10) |

**Ruckgabe:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | `bool` | `true`, wenn die Suche abgeschlossen wurde |
| `output` | `string` | Formatierte Suchergebnisse mit Titeln, URLs und Snippets |
| `error` | `string?` | Fehlermeldung, wenn die Suche fehlschlug (Timeout, Anbieterfehler usw.) |

### web_fetch-Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `url` | `string` | Ja | -- | Die URL, von der Inhalte abgerufen und extrahiert werden sollen |

**Ruckgabe:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | `bool` | `true`, wenn die Seite abgerufen und geparst wurde |
| `output` | `string` | Extrahierter Textinhalt, gekurzt auf `fetch_max_chars` |
| `error` | `string?` | Fehlermeldung, wenn der Abruf fehlschlug (Domain nicht erlaubt, Timeout usw.) |

## Typischer Recherche-Workflow

Ein vollstandiger Web-Recherche-Workflow folgt typischerweise diesem Muster:

1. **Suchen**: Der Agent verwendet `web_search_tool`, um relevante Seiten zu finden
2. **Bewerten**: Der Agent uberpruft Such-Snippets, um die relevantesten Ergebnisse zu identifizieren
3. **Abrufen**: Der Agent verwendet `web_fetch`, um vollstandige Inhalte von ausgewahlten Seiten zu extrahieren
4. **Synthetisieren**: Der Agent kombiniert Informationen aus mehreren Quellen zu einer Antwort

```
Agent denkt: Der Benutzer hat nach den neuesten Rust-Release-Features gefragt.
  1. [web_search_tool] query="Rust 1.82 release features changelog"
  2. [uberpruft Ergebnisse, wahlt die Top-2-URLs]
  3. [web_fetch] url="https://blog.rust-lang.org/2026/..."
  4. [web_fetch] url="https://releases.rs/docs/1.82.0/"
  5. [synthetisiert Antwort aus abgerufenen Inhalten]
```

## Sicherheit

### Anbieter-Anmeldedaten

- **DuckDuckGo**: Keine Anmeldedaten erforderlich. Anfragen werden an DuckDuckGos API-Endpunkte gesendet.
- **Brave Search**: Der `brave_api_key` wird in der Konfigurationsdatei gespeichert. Verwenden Sie PRXs verschlusselten Geheimnis-Speicher, um ihn zu schutzen:

```toml
[web_search]
brave_api_key = "enc:xxxxxxxxxxxxx"  # Verschlusselt mit ChaCha20-Poly1305
```

### Domain-Beschrankungen fur web_fetch

Das `web_fetch`-Werkzeug respektiert die `browser.allowed_domains`-Liste. Dies verhindert, dass der Agent Inhalte von beliebigen URLs abruft, was:

- Den Agenten bosartigem Inhalt aussetzen konnte (Prompt-Injection uber Webseiten)
- Server-Side Request Forgery (SSRF) auslosen konnte, wenn der Agent interne URLs abruft
- Informationen durch DNS- oder HTTP-Anfragen an angreiferkontrollierte Domains leaken konnte

```toml
[browser]
allowed_domains = ["docs.rs", "crates.io", "github.com", "*.rust-lang.org"]
```

### Timeout-Schutz

Sowohl Such- als auch Abruf-Operationen haben konfigurierbare Timeouts, um Hangen bei langsamen oder nicht reagierenden Servern zu verhindern:

- `web_search.timeout_secs` (Standard: 10 Sekunden) -- Suchanfrage-Timeout
- Netzwerk-Level-Timeouts gelten auch fur `web_fetch`

### Inhaltsgrossen-Limits

Die `fetch_max_chars`-Einstellung (Standard: 50.000 Zeichen) verhindert Speichererschopfung durch extrem grosse Webseiten. Inhalte uber diesem Limit werden gekurzt.

### Richtlinien-Engine

Web-Suche-Werkzeuge durchlaufen die Sicherheitsrichtlinien-Engine:

```toml
[security.tool_policy.tools]
web_search_tool = "allow"
web_fetch = "supervised"     # Genehmigung vor dem Abruf erfordern
```

## Verwandte Seiten

- [HTTP-Anfrage](/de/prx/tools/http-request) -- programmatische HTTP-Anfragen an APIs
- [Browser-Werkzeug](/de/prx/tools/browser) -- vollstandige Browser-Automatisierung fur JavaScript-lastige Seiten
- [Konfigurationsreferenz](/de/prx/config/reference) -- `[web_search]`- und `[browser]`-Felder
- [Geheimnis-Verwaltung](/de/prx/security/secrets) -- verschlusselte Speicherung fur API-Schlussel
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
