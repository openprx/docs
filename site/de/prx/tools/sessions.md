---
title: Sitzungen & Agenten
description: Multi-Agenten-Orchestrierungs-Werkzeuge zum Starten von Sub-Agenten, Delegieren von Aufgaben und Verwalten gleichzeitiger Sitzungen in PRX.
---

# Sitzungen & Agenten

PRX bietet acht Werkzeuge fur Multi-Agenten-Orchestrierung, die es einem ubergeordneten Agenten ermoglichen, Kind-Agenten zu starten, Aufgaben an spezialisierte Agenten zu delegieren und gleichzeitige Sitzungen zu verwalten. Dies ist die Grundlage von PRXs paralleler Aufgabenzerlegungs-Architektur, bei der komplexe Aufgaben in Teilaufgaben zerlegt werden, die von unabhangigen Agenteninstanzen bearbeitet werden.

Die Sitzungs-Werkzeuge (`sessions_spawn`, `sessions_send`, `sessions_list`, `sessions_history`, `session_status`, `subagents`) verwalten den Lebenszyklus von Sub-Agenten-Sitzungen. Die Agenten-Delegations-Werkzeuge (`delegate`, `agents_list`) ermoglichen die Aufgabenweiterleitung an benannte Agenten mit eigenem Anbieter, Modell und Werkzeugkonfiguration.

Sitzungs-Werkzeuge sind in der `all_tools()`-Registry registriert und immer verfugbar. Die `delegate`- und `agents_list`-Werkzeuge werden bedingt nur registriert, wenn Agentendefinitionen in der Konfiguration existieren.

## Konfiguration

### Sub-Agenten-Parallelitat

```toml
[agent.subagents]
max_concurrent = 4          # Maximale gleichzeitige Sub-Agenten
max_depth = 3               # Maximale Verschachtelungstiefe (Sub-Agenten, die Sub-Agenten starten)
max_total_spawns = 20       # Gesamtes Spawn-Budget pro Wurzelsitzung
child_timeout_secs = 300    # Timeout fur individuelle Kind-Ausfuhrung
```

### Delegationsagenten-Definitionen

Benannte Agenten werden unter `[agents.*]`-Abschnitten definiert:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant. Find accurate, up-to-date information."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]

[agents.coder]
provider = "openai"
model = "gpt-4o"
system_prompt = "You are a code generation specialist. Write clean, well-tested code."
agentic = true
max_iterations = 15
allowed_tools = ["shell", "file_read", "file_write", "git_operations"]

[agents.reviewer]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a code reviewer. Focus on correctness, security, and style."
agentic = true
max_iterations = 5
allowed_tools = ["file_read", "shell"]
```

## Werkzeug-Referenz

### sessions_spawn

Startet einen asynchronen Sub-Agenten, der im Hintergrund lauft. Gibt sofort eine Run-ID zuruck. Der ubergeordnete Agent wird automatisch benachrichtigt, wenn der Kind-Agent fertig ist.

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Research the latest Rust async runtime benchmarks and summarize the findings.",
    "action": "spawn"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `task` | `string` | Ja | -- | Aufgabenbeschreibung / System-Prompt fur den Sub-Agenten |
| `action` | `string` | Nein | `"spawn"` | Aktion: `"spawn"`, `"history"` (Protokoll anzeigen) oder `"steer"` (umlenken) |
| `allowed_tools` | `array` | Nein | Werkzeuge des Elternteils | Teilmenge der Werkzeuge, auf die der Sub-Agent zugreifen kann |

### sessions_send

Sendet eine Nachricht an eine laufende Sub-Agenten-Sitzung und ermoglicht interaktive Kommunikation zwischen Eltern- und Kind-Agent.

```json
{
  "name": "sessions_send",
  "arguments": {
    "session_id": "run_abc123",
    "message": "Focus on performance comparisons, not API differences."
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `session_id` | `string` | Ja | -- | Die Run-ID des Ziel-Sub-Agenten |
| `message` | `string` | Ja | -- | Nachricht, die an den Sub-Agenten gesendet werden soll |

### sessions_list

Listet alle aktiven Sub-Agenten-Sitzungen mit ihrem Status, ihrer Aufgabenbeschreibung und der verstrichenen Zeit auf.

```json
{
  "name": "sessions_list",
  "arguments": {}
}
```

Keine Parameter erforderlich. Gibt eine Liste aktiver Sitzungen zuruck.

### sessions_history

Zeigt das Gesprächsprotokoll eines Sub-Agenten-Laufs an, einschliesslich aller Werkzeugaufrufe und LLM-Antworten.

```json
{
  "name": "sessions_history",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `session_id` | `string` | Ja | -- | Die Run-ID, deren Verlauf abgerufen werden soll |

### session_status

Pruft den Status einer bestimmten Sitzung (laufend, abgeschlossen, fehlgeschlagen, Timeout).

```json
{
  "name": "session_status",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `session_id` | `string` | Ja | -- | Die zu prufende Run-ID |

### subagents

Verwaltet den Sub-Agenten-Pool -- laufende Sub-Agenten auflisten, stoppen oder inspizieren.

```json
{
  "name": "subagents",
  "arguments": {
    "action": "list"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `action` | `string` | Ja | -- | Aktion: `"list"`, `"stop"`, `"inspect"` |
| `session_id` | `string` | Bedingt | -- | Erforderlich fur `"stop"`- und `"inspect"`-Aktionen |

### agents_list

Listet alle konfigurierten Delegationsagenten mit ihren Modellen, Fahigkeiten und erlaubten Werkzeugen auf. Nur registriert, wenn `[agents.*]`-Abschnitte definiert sind.

```json
{
  "name": "agents_list",
  "arguments": {}
}
```

Keine Parameter erforderlich. Gibt Agentendefinitionen aus der Konfiguration zuruck.

### delegate

Delegiert eine Aufgabe an einen benannten Agenten mit eigenem Anbieter, Modell und Werkzeugsatz. Der Delegationsagent fuhrt eine isolierte agentische Schleife aus und gibt das Ergebnis zuruck.

```json
{
  "name": "delegate",
  "arguments": {
    "agent": "researcher",
    "task": "Find the top 5 Rust web frameworks by GitHub stars in 2026."
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `agent` | `string` | Ja | -- | Name des konfigurierten Agenten (aus `[agents.*]`) |
| `task` | `string` | Ja | -- | Aufgabenbeschreibung fur den Delegationsagenten |

## Verwendungsmuster

### Parallele Recherche

Mehrere Sub-Agenten starten, um verschiedene Themen gleichzeitig zu recherchieren:

```
Eltern-Agent: Ich brauche einen Vergleich von 3 Datenbank-Engines fur unser Projekt.

  [sessions_spawn] task="Research PostgreSQL strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research SQLite strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research DuckDB strengths, weaknesses, and use cases"

  [wartet, bis alle drei abgeschlossen sind]
  [synthetisiert Ergebnisse in eine Vergleichstabelle]
```

### Delegierte Code-Uberprufung

Spezialisierte Delegationsagenten fur bestimmte Aufgaben verwenden:

```
Eltern-Agent: Uberprufe diesen Pull-Request auf Sicherheitsprobleme.

  [delegate] agent="reviewer", task="Review the diff in /tmp/pr-42.patch for security vulnerabilities"

  [Reviewer-Agent lauft mit file_read- und shell-Werkzeugen]
  [gibt detaillierte Sicherheitsuberprufung zuruck]
```

### Hierarchische Aufgabenzerlegung

Sub-Agenten konnen ihre eigenen Sub-Agenten starten (bis zu `max_depth`):

```
Eltern-Agent
  ├── Recherche-Agent
  │     ├── Web-Suche-Sub-Agent
  │     └── Dokumentenanalyse-Sub-Agent
  ├── Code-Generierungs-Agent
  └── Test-Agent
```

## Sicherheit

### Tiefen- und Parallelitats-Limits

PRX erzwingt harte Limits beim Sub-Agenten-Spawning, um Ressourcenerschopfung zu verhindern:

- **max_concurrent**: Begrenzt gleichzeitig laufende Sub-Agenten (Standard: 4)
- **max_depth**: Begrenzt die Verschachtelungstiefe (Standard: 3). Bei maximaler Tiefe wird das `sessions_spawn`-Werkzeug aus den verfugbaren Werkzeugen des Kind-Agenten entfernt.
- **max_total_spawns**: Begrenzt die Gesamtzahl der Spawns pro Wurzelsitzung (Standard: 20)
- **child_timeout_secs**: Beendet Sub-Agenten, die den Timeout uberschreiten (Standard: 300 Sekunden)

### Werkzeugbeschrankungen

Sub-Agenten erben die Sandbox-Richtlinie des Elternteils, konnen aber einen eingeschrankten Werkzeugsatz haben:

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Search the web for information",
    "allowed_tools": ["web_search_tool", "web_fetch"]
  }
}
```

Delegationsagenten haben ihre Werkzeuge explizit in der Konfiguration definiert. Sie konnen nicht auf Werkzeuge ausserhalb ihrer `allowed_tools`-Liste zugreifen.

### Anmeldedaten-Isolation

Delegationsagenten konnen andere Anbieter und API-Schlussel als der Eltern-Agent verwenden:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
# Verwendet den konfigurierten API-Schlussel des Anbieters
```

Dies ermoglicht das Routing von Aufgaben an verschiedene LLM-Anbieter basierend auf den Aufgabenanforderungen, wobei die Anmeldedaten jedes Anbieters isoliert bleiben.

### Richtlinien-Engine

Sitzungs- und Agenten-Werkzeuge unterliegen der Richtlinien-Engine:

```toml
[security.tool_policy.groups]
sessions = "allow"

[security.tool_policy.tools]
delegate = "supervised"    # Genehmigung fur Delegation erfordern
```

## Verwandte Seiten

- [Sub-Agenten](/de/prx/agent/subagents) -- Sub-Agenten-Architektur und Spawning-Modell
- [Agenten-Laufzeit](/de/prx/agent/runtime) -- Agenten-Ausfuhrungsarchitektur
- [Agentenschleife](/de/prx/agent/loop) -- Kern-Ausfuhrungszyklus
- [Sitzungs-Worker](/de/prx/agent/session-worker) -- Prozessisolation fur Sitzungen
- [Konfigurationsreferenz](/de/prx/config/reference) -- Agenten- und Sub-Agenten-Einstellungen
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
