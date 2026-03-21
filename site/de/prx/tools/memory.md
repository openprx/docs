---
title: Gedachtnis-Werkzeuge
description: Funf Werkzeuge zum Speichern, Abrufen, Suchen und Verwalten des persistenten Langzeitgedachtnisses des Agenten mit Kategorie-Unterstutzung und ACL-Durchsetzung.
---

# Gedachtnis-Werkzeuge

PRX bietet funf Gedachtnis-Werkzeuge, die Agenten die Fahigkeit geben, Wissen uber Konversationen hinweg zu persistieren, relevanten Kontext abzurufen und ihren Langzeitgedachtnis-Speicher zu verwalten. Diese Werkzeuge uberbrucken die Lucke zwischen fluchtigen LLM-Kontextfenstern und persistentem Agentenwissen.

Das Gedachtnissystem unterstutzt drei eingebaute Kategorien -- `core` (permanente Fakten), `daily` (sitzungsbezogene Notizen) und `conversation` (Chat-Kontext) -- plus benutzerdefinierte Kategorien. Jedes Werkzeug ist ACL-bewusst: Wenn die Gedachtnis-Zugriffskontrolle aktiviert ist, werden Operationen basierend auf Per-Prinzipal-Zugriffsregeln eingeschrankt.

Gedachtnis-Werkzeuge sind in der `all_tools()`-Registry registriert und immer verfugbar, wenn der Agent mit dem vollstandigen Werkzeugsatz lauft. Sie funktionieren mit jedem der funf Gedachtnis-Speicher-Backends (Markdown, SQLite, PostgreSQL, Embeddings oder In-Memory).

## Konfiguration

Gedachtnis-Werkzeuge werden uber den Abschnitt `[memory]` konfiguriert:

```toml
[memory]
backend = "sqlite"              # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
auto_save = true                # Konversationseingabe automatisch im Gedachtnis speichern
acl_enabled = false             # Zugriffskontrolllisten aktivieren
max_recall_items = 20           # Maximale Eintrage, die von Recall/Suche zuruckgegeben werden
recall_relevance_threshold = 0.3  # Minimum-Relevanzscore fur Recall

# Optional: Embedding-basierte semantische Suche
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7             # Gewicht fur Vektorahnlichkeit bei hybrider Suche
keyword_weight = 0.3            # Gewicht fur BM25-Schlagwortsuche
min_relevance_score = 0.4       # Minimaler Score fur Einbindung in Ergebnisse

# Gedachtnishygiene (automatische Bereinigung)
hygiene_enabled = true
archive_after_days = 7
purge_after_days = 30
conversation_retention_days = 3
daily_retention_days = 7
```

## Werkzeug-Referenz

### memory_store

Speichert ein Fakt, eine Praferenz, Notiz oder ein Wissenstuck im Langzeitgedachtnis.

```json
{
  "name": "memory_store",
  "arguments": {
    "key": "user_timezone",
    "value": "The user is located in UTC+8 (Asia/Shanghai)",
    "category": "core"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `key` | `string` | Ja | -- | Eindeutiger Bezeichner fur diesen Gedachtniseintrag |
| `value` | `string` | Ja | -- | Der zu speichernde Inhalt |
| `category` | `string` | Nein | `"core"` | Kategorie: `"core"`, `"daily"`, `"conversation"` oder benutzerdefiniert |

**Kategorien:**

| Kategorie | Aufbewahrung | Zweck |
|-----------|-------------|-------|
| `core` | Permanent (bis explizit vergessen) | Grundlegende Fakten, Benutzerpraferenzen, Systemkonfiguration |
| `daily` | Sitzungsbezogen, archiviert nach `archive_after_days` | Heutige Aufgaben, Kontext, Sitzungsnotizen |
| `conversation` | Kurzlebig, entfernt nach `conversation_retention_days` | Aktueller Chat-Kontext, Referenzen |
| Benutzerdefiniert | Folgt `daily`-Aufbewahrungsregeln | Benutzerdefinierte Kategorien fur domainspezifisches Wissen |

### memory_forget

Entfernt einen bestimmten Eintrag aus dem Langzeitgedachtnis nach Schlussel.

```json
{
  "name": "memory_forget",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `key` | `string` | Ja | -- | Der Schlussel des zu entfernenden Gedachtniseintrags |

### memory_get

Ruft einen bestimmten Gedachtniseintrag nach seinem exakten Schlussel ab. ACL-bewusst, wenn aktiviert.

```json
{
  "name": "memory_get",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `key` | `string` | Ja | -- | Der exakte Schlussel zum Nachschlagen |

Gibt den gespeicherten Wert zuruck, wenn gefunden, oder einen Fehler, wenn der Schlussel nicht existiert oder der Zugriff durch ACL verweigert wird.

### memory_recall

Ruft Erinnerungen nach Schlagwort oder semantischer Ahnlichkeit ab. Gibt die relevantesten Eintrage zuruck, die der Abfrage entsprechen. Dieses Werkzeug wird **vollstandig deaktiviert**, wenn `memory.acl_enabled = true` -- es wird aus der Werkzeug-Registry entfernt.

```json
{
  "name": "memory_recall",
  "arguments": {
    "query": "user preferences about coding style"
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `query` | `string` | Ja | -- | Die Suchanfrage (Schlagworter oder naturliche Sprache) |
| `max_results` | `integer` | Nein | `20` | Maximale Anzahl zuruckzugebender Eintrage |

### memory_search

Volltext- und Vektorsuche uber alle Gedachtniseintrage. Im Gegensatz zu `memory_recall` bleibt dieses Werkzeug verfugbar, wenn ACL aktiviert ist, erzwingt aber Per-Prinzipal-Zugriffsbeschrankungen fur die Ergebnisse.

```json
{
  "name": "memory_search",
  "arguments": {
    "query": "project deadlines",
    "category": "daily",
    "max_results": 10
  }
}
```

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `query` | `string` | Ja | -- | Die Suchanfrage |
| `category` | `string` | Nein | -- | Ergebnisse auf eine bestimmte Kategorie filtern |
| `max_results` | `integer` | Nein | `20` | Maximale Anzahl zuruckzugebender Eintrage |

Wenn Embedding-Suche konfiguriert ist, fuhrt `memory_search` eine hybride Suche durch, die kombiniert:

- **Vektorahnlichkeit** (gewichtet mit `vector_weight`) -- semantisches Matching uber Embeddings
- **BM25-Schlagwortsuche** (gewichtet mit `keyword_weight`) -- traditionelles Volltext-Matching

Ergebnisse unter `min_relevance_score` werden herausgefiltert.

## Verwendung

### Typischer Gedachtnis-Workflow

Wahrend einer Konversation verwendet der Agent Gedachtnis-Werkzeuge in einem naturlichen Zyklus:

1. **Abruf beim Start**: Vor dem Antworten ruft das System relevante Erinnerungen ab, um Kontext einzufugen
2. **Speichern wahrend der Konversation**: Wenn der Benutzer wichtige Informationen teilt, speichert der Agent sie
3. **Suche auf Anfrage**: Wenn der Agent bestimmtes vergangenes Wissen benotigt, durchsucht er das Gedachtnis
4. **Vergessen auf Anfrage**: Wenn der Benutzer darum bittet, Informationen zu entfernen, vergisst der Agent sie

### CLI-Interaktion

Der Gedachtniszustand kann von der Befehlszeile aus inspiziert werden:

```bash
# Gedachtnisstatistiken anzeigen
prx memory stats

# Alle Gedachtniseintrage in einer Kategorie auflisten
prx memory list --category core

# Gedachtnis von der CLI durchsuchen
prx memory search "project deadlines"

# Gedachtnis in eine Datei exportieren
prx memory export --format json > memories.json
```

### Agenten-Verwendungsbeispiel

In einer Multi-Turn-Konversation:

```
Benutzer: Ich bevorzuge 4-Leerzeichen-Einruckung in meinem gesamten Code.
Agent: [ruft memory_store mit key="code_style_indent", value="User prefers 4-space indentation", category="core" auf]
       Verstanden, ich werde mir merken, dass Sie 4-Leerzeichen-Einruckung bevorzugen.

Benutzer: Was sind meine Programmierpraferenzen?
Agent: [ruft memory_search mit query="coding preferences" auf]
       Basierend auf meinen Erinnerungen bevorzugen Sie 4-Leerzeichen-Einruckung in Ihrem gesamten Code.
```

## Sicherheit

### ACL-Durchsetzung

Wenn `memory.acl_enabled = true`, erzwingt das Gedachtnissystem Zugriffskontrolle:

| Werkzeug | ACL-Verhalten |
|----------|-------------|
| `memory_store` | Speichert Eintrage mit dem Eigentum des aktuellen Prinzipals |
| `memory_forget` | Erlaubt nur das Vergessen von Eintragen, die dem aktuellen Prinzipal gehoren |
| `memory_get` | Gibt nur Eintrage zuruck, auf die der aktuelle Prinzipal Zugriff hat |
| `memory_recall` | **Vollstandig deaktiviert** (aus der Werkzeug-Registry entfernt) |
| `memory_search` | Gibt nur Eintrage zuruck, auf die der aktuelle Prinzipal Zugriff hat |

Das `memory_recall`-Werkzeug wird unter ACL deaktiviert, weil sein breites Schlagwort-Matching Informationen uber Prinzipal-Grenzen hinweg leaken konnte. Die zielgerichteteren `memory_get`- und `memory_search`-Werkzeuge erzwingen Per-Eintrag-Zugriffsprufungen.

### file_read-Interaktion

Wenn ACL aktiviert ist, blockiert auch das `file_read`-Werkzeug den Zugriff auf Gedachtnisspeicher-Dateien (Markdown-Dateien im Gedachtnisverzeichnis). Dies verhindert, dass der Agent ACL umgeht, indem er Roh-Gedachtnisdateien von der Festplatte liest.

### Umgang mit sensiblen Daten

Gedachtniseintrage konnen sensible Benutzerinformationen enthalten. Beachten Sie diese Praktiken:

- Verwenden Sie die `core`-Kategorie sparsam fur wirklich permanentes Wissen
- Aktivieren Sie `hygiene_enabled`, um alte Eintrage automatisch zu entfernen
- Aktivieren Sie `acl_enabled` bei Mehr-Benutzer-Bereitstellungen
- Uberprufen Sie Gedachtnisinhalte regelmasig uber `prx memory list`
- Verwenden Sie `memory_forget`, um sensible Eintrage zu entfernen, wenn sie nicht mehr benotigt werden

### Audit-Trail

Alle Gedachtnisoperationen werden im Audit-Protokoll aufgezeichnet, wenn `security.audit.enabled = true`, einschliesslich Werkzeugname, Schlussel, Kategorie und Erfolgs-/Fehlerstatus.

## Verwandte Seiten

- [Gedachtnissystem](/de/prx/memory/) -- Architektur und Speicher-Backends
- [Markdown-Backend](/de/prx/memory/markdown) -- dateibasierter Gedachtnisspeicher
- [SQLite-Backend](/de/prx/memory/sqlite) -- lokaler Datenbankspeicher
- [PostgreSQL-Backend](/de/prx/memory/postgres) -- Remote-Datenbankspeicher
- [Embeddings](/de/prx/memory/embeddings) -- Vektorsuche-Konfiguration
- [Gedachtnishygiene](/de/prx/memory/hygiene) -- automatische Bereinigung und Archivierung
- [Dateioperationen](/de/prx/tools/file-operations) -- ACL-Interaktion mit file_read
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
