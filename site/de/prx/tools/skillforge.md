---
title: Skillforge
description: Automatisierte Pipeline zur Skill-Entdeckung, -Bewertung und -Integration zur Erweiterung der PRX-Agenten-Fahigkeiten.
---

# Skillforge

Skillforge ist PRXs automatisierte Pipeline zur Entdeckung, Bewertung und Integration neuer Skills (Werkzeuge) aus externen Quellen. Anstatt jedes Werkzeug manuell zu konfigurieren, kann Skillforge GitHub-Repositories und die Clawhub-Registry durchsuchen, bewerten, ob ein entdeckter Skill den Bedurfnissen Ihres Agenten entspricht, und das Integrationsmanifest generieren -- alles ohne menschliches Eingreifen.

## Ubersicht

Die Skillforge-Pipeline besteht aus drei Stufen:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Scout      │────▶│   Evaluate   │────▶│  Integrate   │
│              │     │              │     │              │
│ Discover     │     │ Fitness      │     │ Manifest     │
│ skills from  │     │ scoring,     │     │ generation,  │
│ GitHub,      │     │ security     │     │ config       │
│ Clawhub      │     │ review       │     │ injection    │
└─────────────┘     └──────────────┘     └──────────────┘
```

| Stufe | Trait | Verantwortlichkeit |
|-------|-------|-------------------|
| **Scout** | `Scout` | Kandidaten-Skills aus konfigurierten Quellen entdecken |
| **Evaluate** | `Evaluator` | Jeden Kandidaten nach Eignung, Sicherheit und Kompatibilitat bewerten |
| **Integrate** | `Integrator` | Manifeste generieren und Skills in die Werkzeug-Registry registrieren |

## Architektur

Skillforge basiert auf drei asynchronen Kern-Traits: `Scout` (entdeckt Kandidaten, die `SearchCriteria` entsprechen), `Evaluator` (bewertet Kandidaten nach Eignung und Sicherheit) und `Integrator` (generiert Manifeste und registriert Skills). Jeder Trait kann mehrere Implementierungen haben, und der Pipeline-Orchestrator fuhrt sie sequenziell aus und filtert Kandidaten bei jeder Stufe.

## Konfiguration

```toml
[skillforge]
enabled = true

# Automatische Entdeckung: periodisch nach neuen Skills suchen.
auto_discover = false
discover_interval_hours = 24

# Minimaler Bewertungsscore (0.0-1.0) fur die Integration eines Skills.
min_fitness_score = 0.7

# Manuelle Genehmigung vor der Integration entdeckter Skills erfordern.
require_approval = true

# Maximale Anzahl zu bewertender Skills pro Entdeckungslauf.
max_candidates = 20
```

### Scout-Quellen

Konfigurieren Sie, wo Skillforge nach Skills sucht:

```toml
[skillforge.sources.github]
enabled = true

# Zu durchsuchende GitHub-Repositories.
# Unterstutzt Org/Benutzer-Muster und themenbasierte Entdeckung.
search_topics = ["prx-skill", "mcp-server", "ai-tool"]
search_orgs = ["openprx", "modelcontextprotocol"]

# Ratenbegrenzung fur GitHub-API-Aufrufe.
max_requests_per_hour = 30

# GitHub-Token fur hohere Ratenlimits (optional).
# token = "${GITHUB_TOKEN}"

[skillforge.sources.clawhub]
enabled = true

# Clawhub-Registry-Endpunkt.
registry_url = "https://registry.clawhub.dev"

# Zu durchsuchende Kategorien.
categories = ["tools", "integrations", "automation"]
```

## Scout-Stufe

Der Scout entdeckt Kandidaten-Skills aus konfigurierten Quellen. Jede Quelle implementiert den `Scout`-Trait unterschiedlich:

### GitHub-Scout

Durchsucht GitHub nach Repositories, die konfigurierten Themen, Organisationen oder Suchanfragen entsprechen. Fur jedes ubereinstimmende Repository extrahiert der Scout:

- Repository-Metadaten (Name, Beschreibung, Sterne, letztes Update)
- README-Inhalt (fur Fahigkeitsanalyse)
- Manifestdateien (`prx-skill.toml`, `mcp.json`, `package.json`)
- Lizenzinformationen

### Clawhub-Scout

Fragt die Clawhub-Registry-API nach veroffentlichten Skills ab. Clawhub bietet strukturierte Metadaten einschliesslich:

- Skill-Name, Version und Beschreibung
- Ein-/Ausgabe-Schemas
- Abhangigkeitsanforderungen
- Kompatibilitats-Tags (PRX-Version, OS, Laufzeit)

### Suchkriterien

```rust
pub struct SearchCriteria {
    /// Keywords describing the desired capability.
    pub keywords: Vec<String>,

    /// Required runtime: "native", "docker", "wasm", or "any".
    pub runtime: String,

    /// Minimum repository stars (GitHub only).
    pub min_stars: u32,

    /// Maximum age of last commit in days.
    pub max_age_days: u32,

    /// Required license types (e.g., "MIT", "Apache-2.0").
    pub licenses: Vec<String>,
}
```

## Bewertungsstufe

Jeder Kandidat durchlauft den Evaluator, der einen Eignungsscore und eine Sicherheitsbewertung erstellt:

### Bewertungskriterien

| Kriterium | Gewicht | Beschreibung |
|-----------|---------|-------------|
| **Relevanz** | 30% | Wie gut der Skill den Suchkriterien entspricht |
| **Qualitat** | 25% | Codequalitats-Signale: Tests, CI, Dokumentation |
| **Sicherheit** | 25% | Lizenzkompatibilitat, Abhangigkeits-Audit, keine unsicheren Muster |
| **Wartung** | 10% | Aktuelle Commits, aktive Maintainer, Issue-Antwortzeit |
| **Kompatibilitat** | 10% | PRX-Versionskompatibilitat, erfullt Laufzeitanforderungen |

### Sicherheitsprufungen

Der Evaluator fuhrt automatisierte Sicherheitsanalysen durch: Lizenzkompatibilitats-Scanning, Abhangigkeits-Schwachstellenaudit, Erkennung gefahrlicher Code-Muster (Netzwerkaufrufe, Dateisystemzugriff, Eval) und Sandbox-Kompatibilitatsuberprufung.

Die `Evaluation`-Struktur enthalt den Gesamt-`fitness_score` (0.0-1.0), Per-Kriterium-Scores, einen `security_status` (`safe`/`caution`/`blocked`), eine menschenlesbare Zusammenfassung und eine Liste von Bedenken.

## Integrationsstufe

Skills, die die Bewertungsschwelle bestehen, treten in die Integrationsstufe ein:

### Manifest-Generierung

Der Integrator generiert ein `Manifest`, das beschreibt, wie der Skill installiert und registriert wird:

```toml
# Generiertes Manifest: ~/.local/share/openprx/skills/web-scraper/manifest.toml
[skill]
name = "web-scraper"
version = "1.2.0"
source = "github:example/web-scraper"
runtime = "docker"
fitness_score = 0.85
integrated_at = "2026-03-21T10:30:00Z"

[skill.tool]
name = "web_scrape"
description = "Scrape and extract structured data from web pages."

[skill.tool.parameters]
url = { type = "string", required = true, description = "URL to scrape" }
selector = { type = "string", required = false, description = "CSS selector" }
format = { type = "string", required = false, default = "text", description = "Output format" }

[skill.runtime]
image = "example/web-scraper:1.2.0"
network = "restricted"
timeout_secs = 30
```

### Registrierung

Sobald das Manifest generiert ist, wird der Skill in der PRX-Werkzeug-Registry registriert. Wenn `require_approval = true`, wird das Manifest zur Uberprufung vorgemerkt:

```bash
# Ausstehende Skill-Integrationen auflisten
prx skillforge pending

# Einen ausstehenden Skill uberprufen
prx skillforge review web-scraper

# Integration genehmigen
prx skillforge approve web-scraper

# Integration ablehnen
prx skillforge reject web-scraper --reason "Security concerns"
```

## CLI-Befehle

```bash
# Manuell einen Entdeckungslauf auslosen
prx skillforge discover

# Mit bestimmten Schlagwortern entdecken
prx skillforge discover --keywords "web scraping" "data extraction"

# Ein bestimmtes Repository bewerten
prx skillforge evaluate github:example/web-scraper

# Alle integrierten Skills auflisten
prx skillforge list

# Skill-Details anzeigen
prx skillforge info web-scraper

# Einen integrierten Skill entfernen
prx skillforge remove web-scraper

# Alle integrierten Skills neu bewerten (auf Updates, Sicherheitsprobleme prufen)
prx skillforge audit
```

## Integration mit Selbstevolution

Skillforge integriert sich mit PRXs [Selbstevolutions-Pipeline](/de/prx/self-evolution/). Wenn der Agent eine Fahigkeitslucke identifiziert, kann er automatisch einen Entdeckungslauf auslosen -- Scouting, Bewertung und (wenn genehmigt) Integration eines passenden Skills fur den nachsten Turn.

## Sicherheitshinweise

- **Genehmigungs-Gates** -- setzen Sie `require_approval = true` immer in der Produktion. Automatische Integration von nicht vertrauenswurdigem Code ist ein Sicherheitsrisiko.
- **Sandbox-Durchsetzung** -- integrierte Skills laufen innerhalb derselben Sandbox-Einschrankungen wie eingebaute Werkzeuge. Das Sandbox-Backend muss konfiguriert sein.
- **Quellenvertrauen** -- aktivieren Sie nur Scout-Quellen, denen Sie vertrauen. Offentliche GitHub-Suche kann bosartige Repositories zuruckgeben.
- **Manifest-Uberprufung** -- uberprufen Sie generierte Manifeste vor der Genehmigung. Prufen Sie die Einstellungen `runtime`, `network` und `timeout_secs`.
- **Audit-Trail** -- alle Skillforge-Operationen werden im Aktivitatsprotokoll fur Compliance-Uberprufung aufgezeichnet.

## Verwandte Seiten

- [Werkzeuge-Ubersicht](/de/prx/tools/)
- [Selbstevolutions-Pipeline](/de/prx/self-evolution/pipeline)
- [Sicherheitsrichtlinien-Engine](/de/prx/security/policy-engine)
- [Laufzeit-Backends](/de/prx/agent/runtime-backends)
- [MCP-Integration](/de/prx/tools/mcp)
