---
title: Cron-Werkzeuge
description: Neun Werkzeuge zum Erstellen, Verwalten und Ausfuhren geplanter Aufgaben mit Cron-Ausdrucken und der autonomen Xin-Aufgaben-Engine.
---

# Cron-Werkzeuge

PRX bietet neun Werkzeuge fur zeitbasierte Aufgabenautomatisierung, die von traditioneller Cron-Job-Verwaltung bis zur fortgeschrittenen Xin-Planungsengine reichen. Diese Werkzeuge ermoglichen es dem Agenten, geplante Aufgaben zu erstellen, den Job-Verlauf einzusehen, manuelle Ausfuhrungen auszulosen und Hintergrundoperationen nach wiederkehrenden Zeitplanen zu orchestrieren.

Die Cron-Werkzeuge sind in zwei Systeme unterteilt: das **Cron-Subsystem** fur Standard-geplante Jobs mit Cron-Ausdrucken und die **Xin-Engine** fur fortgeschrittene Aufgabenplanung mit Abhangigkeitsketten, bedingter Ausfuhrung und Integration mit der Selbstevolutions-Pipeline.

Alle Cron- und Planungs-Werkzeuge sind in der `all_tools()`-Registry registriert und verfugbar, wann immer der Daemon lauft.

## Konfiguration

### Cron-System

```toml
[cron]
enabled = true
timezone = "UTC"           # Zeitzone fur Cron-Ausdrucke

# Eingebaute geplante Aufgaben definieren
[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"     # Jeden Tag um 09:00 UTC
action = "agent"
prompt = "Generate a daily summary report and send it to the user."

[[cron.tasks]]
name = "memory-cleanup"
schedule = "0 3 * * *"     # Jeden Tag um 03:00 UTC
action = "agent"
prompt = "Run memory hygiene: archive old daily entries and compact core memories."

[[cron.tasks]]
name = "repo-check"
schedule = "*/30 * * * *"  # Alle 30 Minuten
action = "shell"
command = "cd /home/user/project && git fetch --all"
```

### Xin-Engine

```toml
[xin]
enabled = true
interval_minutes = 5            # Tick-Intervall in Minuten (Minimum 1)
max_concurrent = 4              # Maximale gleichzeitige Aufgabenausfuhrungen pro Tick
max_tasks = 128                 # Maximale Gesamtanzahl von Aufgaben im Speicher
stale_timeout_minutes = 60      # Minuten, bevor eine laufende Aufgabe als veraltet markiert wird
builtin_tasks = true            # System-Aufgaben automatisch registrieren
evolution_integration = false   # Xin die Evolutions-/Fitness-Planung verwalten lassen
```

## Werkzeug-Referenz

### cron_add

Fugt einen neuen Cron-Job mit einem Cron-Ausdruck, Befehl oder Prompt und optionaler Beschreibung hinzu.

```json
{
  "name": "cron_add",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 2 * * *",
    "action": "shell",
    "command": "tar czf /tmp/workspace-$(date +%Y%m%d).tar.gz /home/user/workspace",
    "description": "Daily workspace backup at 2 AM"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `name` | `string` | Ja | -- | Eindeutiger Name fur den Cron-Job |
| `schedule` | `string` | Ja | -- | Cron-Ausdruck (5-Felder: Minute Stunde Tag Monat Wochentag) |
| `action` | `string` | Ja | -- | Aktionstyp: `"shell"` (Befehl ausfuhren) oder `"agent"` (Agenten-Prompt ausfuhren) |
| `command` | `string` | Bedingt | -- | Shell-Befehl (erforderlich wenn `action = "shell"`) |
| `prompt` | `string` | Bedingt | -- | Agenten-Prompt (erforderlich wenn `action = "agent"`) |
| `description` | `string` | Nein | -- | Menschenlesbare Beschreibung |

### cron_list

Listet alle registrierten Cron-Jobs mit ihren Zeitplanen, Status und nachster Ausfuhrungszeit auf.

```json
{
  "name": "cron_list",
  "arguments": {}
}
```

Keine Parameter erforderlich. Gibt eine Tabelle aller Cron-Jobs zuruck.

### cron_remove

Entfernt einen Cron-Job anhand seines Namens oder seiner ID.

```json
{
  "name": "cron_remove",
  "arguments": {
    "name": "backup-workspace"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `name` | `string` | Ja | -- | Name oder ID des zu entfernenden Cron-Jobs |

### cron_update

Aktualisiert den Zeitplan, Befehl oder die Einstellungen eines bestehenden Cron-Jobs.

```json
{
  "name": "cron_update",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 4 * * *",
    "description": "Daily workspace backup at 4 AM (shifted)"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `name` | `string` | Ja | -- | Name des zu aktualisierenden Cron-Jobs |
| `schedule` | `string` | Nein | -- | Neuer Cron-Ausdruck |
| `command` | `string` | Nein | -- | Neuer Shell-Befehl |
| `prompt` | `string` | Nein | -- | Neuer Agenten-Prompt |
| `description` | `string` | Nein | -- | Neue Beschreibung |

### cron_run

Lost einen Cron-Job sofort manuell aus, ausserhalb seines normalen Zeitplans.

```json
{
  "name": "cron_run",
  "arguments": {
    "name": "daily-report"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `name` | `string` | Ja | -- | Name des auszulosenden Cron-Jobs |

### cron_runs

Zeigt den Ausfuhrungsverlauf und Protokolle von Cron-Job-Laufen an. Zeigt vergangene Ausfuhrungen mit Zeitstempeln, Status und Ausgabe.

```json
{
  "name": "cron_runs",
  "arguments": {
    "name": "daily-report",
    "limit": 10
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `name` | `string` | Nein | -- | Nach Job-Name filtern. Wenn weggelassen, werden alle letzten Laufe angezeigt. |
| `limit` | `integer` | Nein | `20` | Maximale Anzahl zuruckzugebender Verlaufseinträge |

### schedule

Plant eine einmalige oder wiederkehrende Aufgabe mit naturlichsprachlichen Zeitausdrucken. Dies ist eine hoherwertige Schnittstelle als rohe Cron-Ausdrucke.

```json
{
  "name": "schedule",
  "arguments": {
    "when": "in 30 minutes",
    "action": "agent",
    "prompt": "Check if the deployment completed and report the status."
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `when` | `string` | Ja | -- | Naturlichsprachlicher Zeitausdruck (z.B. `"in 30 minutes"`, `"tomorrow at 9am"`, `"every Monday at 10:00"`) |
| `action` | `string` | Ja | -- | Aktionstyp: `"shell"` oder `"agent"` |
| `command` | `string` | Bedingt | -- | Shell-Befehl (fur `"shell"`-Aktion) |
| `prompt` | `string` | Bedingt | -- | Agenten-Prompt (fur `"agent"`-Aktion) |

### cron (Legacy)

Legacy-Cron-Einstiegspunkt fur Ruckwartskompatibilitat. Leitet basierend auf dem Aktionsargument zum entsprechenden Cron-Werkzeug weiter.

```json
{
  "name": "cron",
  "arguments": {
    "action": "list"
  }
}
```

### xin

Die Xin-Planungsengine fur fortgeschrittene Aufgabenautomatisierung mit Abhangigkeitsketten und bedingter Ausfuhrung.

```json
{
  "name": "xin",
  "arguments": {
    "action": "status"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `action` | `string` | Ja | -- | Aktion: `"status"`, `"tasks"`, `"run"`, `"pause"`, `"resume"` |

## Cron-Ausdruck-Format

PRX verwendet standardmassige 5-Felder-Cron-Ausdrucke:

```
┌───────────── Minute (0-59)
│ ┌───────────── Stunde (0-23)
│ │ ┌───────────── Tag des Monats (1-31)
│ │ │ ┌───────────── Monat (1-12)
│ │ │ │ ┌───────────── Wochentag (0-7, 0 und 7 = Sonntag)
│ │ │ │ │
* * * * *
```

**Beispiele:**

| Ausdruck | Beschreibung |
|----------|-------------|
| `0 9 * * *` | Jeden Tag um 9:00 Uhr |
| `*/15 * * * *` | Alle 15 Minuten |
| `0 9 * * 1-5` | Werktags um 9:00 Uhr |
| `0 0 1 * *` | Erster Tag jedes Monats um Mitternacht |
| `30 8,12,18 * * *` | Um 8:30, 12:30 und 18:30 taglich |

## Xin-Engine

Die Xin-Engine ist ein fortgeschrittener Aufgabenplaner, der uber einfaches Cron-Timing hinausgeht:

- **Abhangigkeitsketten**: Aufgaben konnen von der erfolgreichen Fertigstellung anderer Aufgaben abhangen
- **Bedingte Ausfuhrung**: Aufgaben werden nur ausgefuhrt, wenn bestimmte Bedingungen erfullt sind
- **Eingebaute Aufgaben**: Systemwartungsaufgaben (Heartbeat, Gedachtnishygiene, Log-Rotation) werden automatisch registriert, wenn `builtin_tasks = true`
- **Evolutions-Integration**: Wenn `evolution_integration = true`, verwaltet Xin den Selbstevolutions- und Fitness-Check-Zeitplan
- **Veraltungserkennung**: Aufgaben, die langer als `stale_timeout_minutes` laufen, werden als veraltet markiert und konnen bereinigt werden
- **Gleichzeitige Ausfuhrung**: Mehrere Aufgaben konnen parallel laufen, begrenzt durch `max_concurrent`

## Verwendung

### CLI-Cron-Verwaltung

```bash
# Alle Cron-Jobs auflisten
prx cron list

# Einen neuen Cron-Job hinzufugen
prx cron add --name "check-updates" --schedule "0 */6 * * *" --action agent --prompt "Check for package updates"

# Einen Job manuell auslosen
prx cron run daily-report

# Ausfuhrungsverlauf anzeigen
prx cron runs --name daily-report --limit 5

# Einen Job entfernen
prx cron remove check-updates
```

### Xin-Status

```bash
# Xin-Engine-Status prufen
prx xin status

# Alle Xin-Aufgaben auflisten
prx xin tasks
```

## Sicherheit

### Shell-Befehl-Sandboxing

Cron-Jobs mit `action = "shell"` werden uber dieselbe Sandbox wie das `shell`-Werkzeug ausgefuhrt. Das konfigurierte Sandbox-Backend (Landlock, Firejail, Bubblewrap, Docker) gilt fur geplante Befehle.

### Agenten-Prompt-Sicherheit

Cron-Jobs mit `action = "agent"` starten eine neue Agenten-Sitzung mit dem konfigurierten Prompt. Die Agenten-Sitzung erbt die Sicherheitsrichtlinien, Werkzeugbeschrankungen und Ressourcenlimits des Daemons.

### Richtlinien-Engine

Cron-Werkzeuge unterliegen der Sicherheitsrichtlinien-Engine:

```toml
[security.tool_policy.groups]
automation = "allow"

[security.tool_policy.tools]
cron_add = "supervised"    # Genehmigung zum Hinzufugen neuer Jobs erforderlich
cron_remove = "supervised" # Genehmigung zum Entfernen von Jobs erforderlich
cron_run = "allow"         # Manuelle Auslosungen erlauben
```

### Audit-Protokollierung

Alle Cron-Operationen werden im Audit-Protokoll aufgezeichnet: Job-Erstellung, Modifikation, Loschung, manuelle Auslosungen und Ausfuhrungsergebnisse.

### Ressourcenlimits

Geplante Aufgaben teilen sich die Ressourcenlimits des Daemons. Die Einstellung `max_concurrent` in der Xin-Engine verhindert Ressourcenerschopfung durch zu viele gleichzeitige Aufgaben.

## Verwandte Seiten

- [Cron-System](/de/prx/cron/) -- Architektur und eingebaute Aufgaben
- [Cron-Heartbeat](/de/prx/cron/heartbeat) -- Gesundheitsuberwachung
- [Cron-Aufgaben](/de/prx/cron/tasks) -- eingebaute Wartungsaufgaben
- [Selbstevolution](/de/prx/self-evolution/) -- Xin-Evolutions-Integration
- [Shell-Ausfuhrung](/de/prx/tools/shell) -- Sandbox fur Shell-basierte Cron-Jobs
- [Konfigurationsreferenz](/de/prx/config/reference) -- `[cron]`- und `[xin]`-Einstellungen
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
