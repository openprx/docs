---
title: Audit-Protokollierung
description: Sicherheits-Audit-Protokollierungssystem zur Verfolgung aller sicherheitsrelevanten Operationen in PRX.
---

# Audit-Protokollierung

PRX enthalt ein eingebautes Audit-Protokollierungssystem, das alle sicherheitsrelevanten Operationen aufzeichnet. Der `AuditLogger` verfolgt wer was, wann und ob es erfolgreich war -- und bietet einen manipulationssicheren Trail fur Compliance, Vorfallsreaktion und forensische Analyse.

## Ubersicht

Das Audit-System erfasst strukturierte Events fur jede sicherheitssensible Aktion:

- Authentifizierungsversuche (Erfolg und Misserfolg)
- Autorisierungsentscheidungen (Erlauben und Verweigern)
- Konfigurationsanderungen
- Werkzeugausfuhrungen und Sandbox-Events
- Gedachtniszugriff und -anderung
- Kanalverbindungen und -trennungen
- Evolutionsvorschlage und -anwendungen
- Plugin-Lebenszyklus-Events

Jedes Audit-Event enthalt einen Zeitstempel, Akteursidentitat, Aktionsbeschreibung, Zielressource und Ergebnis.

## Audit-Event-Struktur

Jedes Audit-Event ist ein strukturierter Datensatz mit folgenden Feldern:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `timestamp` | `DateTime<Utc>` | Wann das Event auftrat (UTC, Nanosekunden-Prazision) |
| `event_id` | `String` | Eindeutiger Bezeichner fur das Event (UUIDv7, zeitlich geordnet) |
| `actor` | `Actor` | Wer die Aktion ausgefuhrt hat (Benutzer, Agent, System oder Plugin) |
| `action` | `String` | Was getan wurde (z.B. `auth.login`, `tool.execute`, `config.update`) |
| `target` | `String` | Die Ressource, auf die eingewirkt wurde (z.B. Sitzungs-ID, Konfigurationsschlussel, Dateipfad) |
| `outcome` | `Outcome` | Ergebnis: `success`, `failure` oder `denied` |
| `metadata` | `Map<String, Value>` | Zusatzlicher Kontext (IP-Adresse, Grund fur Verweigerung usw.) |
| `session_id` | `Option<String>` | Zugehorige Agenten-Sitzung, falls vorhanden |
| `severity` | `Severity` | Event-Schweregrad: `info`, `warning`, `critical` |

### Akteurstypen

| Akteurstyp | Beschreibung | Beispiel |
|-----------|-------------|---------|
| `user` | Ein menschlicher Benutzer, identifiziert uber Kanal oder API-Auth | `user:telegram:123456789` |
| `agent` | Der PRX-Agent selbst | `agent:default` |
| `system` | Interne Systemprozesse (Cron, Evolution) | `system:evolution` |
| `plugin` | Ein WASM-Plugin | `plugin:my-plugin:v1.2.0` |

### Aktionskategorien

Aktionen folgen einer punktgetrennten Namensraum-Konvention:

| Kategorie | Aktionen | Schweregrad |
|-----------|---------|------------|
| `auth.*` | `auth.login`, `auth.logout`, `auth.token_refresh`, `auth.pairing` | info / warning |
| `authz.*` | `authz.allow`, `authz.deny`, `authz.policy_check` | info / warning |
| `config.*` | `config.update`, `config.reload`, `config.hot_reload` | warning |
| `tool.*` | `tool.execute`, `tool.sandbox_escape_attempt`, `tool.timeout` | info / critical |
| `memory.*` | `memory.store`, `memory.recall`, `memory.delete`, `memory.compact` | info |
| `channel.*` | `channel.connect`, `channel.disconnect`, `channel.error` | info / warning |
| `evolution.*` | `evolution.propose`, `evolution.apply`, `evolution.rollback` | warning / critical |
| `plugin.*` | `plugin.load`, `plugin.unload`, `plugin.error`, `plugin.permission_denied` | info / warning |
| `session.*` | `session.create`, `session.terminate`, `session.timeout` | info |

## Konfiguration

```toml
[security.audit]
enabled = true
min_severity = "info"           # Minimaler Schweregrad: "info", "warning", "critical"

[security.audit.file]
enabled = true
path = "~/.local/share/openprx/audit.log"
format = "jsonl"                # "jsonl" oder "csv"
max_size_mb = 100               # Rotation wenn Datei diese Grosse uberschreitet
max_files = 10                  # Bis zu 10 rotierte Dateien behalten
compress_rotated = true         # Rotierte Dateien mit gzip komprimieren

[security.audit.database]
enabled = false
backend = "sqlite"              # "sqlite" oder "postgres"
path = "~/.local/share/openprx/audit.db"
retention_days = 90             # Events automatisch loschen, die alter als 90 Tage sind
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Audit-Protokollierung global aktivieren oder deaktivieren |
| `min_severity` | `String` | `"info"` | Minimaler Schweregrad fur die Aufzeichnung |
| `file.enabled` | `bool` | `true` | Audit-Events in eine Protokolldatei schreiben |
| `file.path` | `String` | `"~/.local/share/openprx/audit.log"` | Pfad zur Audit-Protokolldatei |
| `file.format` | `String` | `"jsonl"` | Protokollformat: `"jsonl"` (ein JSON-Objekt pro Zeile) oder `"csv"` |
| `file.max_size_mb` | `u64` | `100` | Maximale Dateigrosse vor Rotation (MB) |
| `file.max_files` | `u32` | `10` | Anzahl der zu behaltenden rotierten Dateien |
| `file.compress_rotated` | `bool` | `true` | Rotierte Protokolldateien mit gzip komprimieren |
| `database.enabled` | `bool` | `false` | Audit-Events in eine Datenbank schreiben |
| `database.backend` | `String` | `"sqlite"` | Datenbank-Backend: `"sqlite"` oder `"postgres"` |
| `database.path` | `String` | `""` | Datenbankpfad (SQLite) oder Verbindungs-URL (PostgreSQL) |
| `database.retention_days` | `u64` | `90` | Events automatisch loschen, die alter als N Tage sind. 0 = dauerhaft behalten |

## Speicher-Backends

### Datei (JSONL)

Das Standard-Backend schreibt ein JSON-Objekt pro Zeile in eine Protokolldatei. Dieses Format ist kompatibel mit Standard-Protokollanalyse-Werkzeugen (jq, grep, Elasticsearch-Ingest).

Beispiel-Protokolleintrag:

```json
{
  "timestamp": "2026-03-21T10:15:30.123456789Z",
  "event_id": "019520a8-1234-7000-8000-000000000001",
  "actor": {"type": "user", "id": "user:telegram:123456789"},
  "action": "tool.execute",
  "target": "shell:ls -la /tmp",
  "outcome": "success",
  "metadata": {"sandbox": "bubblewrap", "duration_ms": 45},
  "session_id": "sess_abc123",
  "severity": "info"
}
```

### Datenbank (SQLite / PostgreSQL)

Das Datenbank-Backend speichert Events in einer strukturierten Tabelle mit Indizes auf `timestamp`, `actor`, `action` und `severity` fur effiziente Abfragen.

## Audit-Trails abfragen

### CLI-Abfragen

```bash
# Letzte Audit-Events anzeigen
prx audit log --tail 50

# Nach Aktionskategorie filtern
prx audit log --action "auth.*" --last 24h

# Nach Schweregrad filtern
prx audit log --severity critical --last 7d

# Nach Akteur filtern
prx audit log --actor "user:telegram:123456789"

# Nach JSON exportieren
prx audit log --last 30d --format json > audit_export.json
```

### Datenbankabfragen

Bei Verwendung des Datenbank-Backends konnen Sie direkt mit SQL abfragen:

```sql
-- Fehlgeschlagene Authentifizierungsversuche in den letzten 24 Stunden
SELECT * FROM audit_events
WHERE action LIKE 'auth.%'
  AND outcome = 'failure'
  AND timestamp > datetime('now', '-24 hours')
ORDER BY timestamp DESC;

-- Werkzeugausfuhrung durch einen bestimmten Benutzer
SELECT action, target, outcome, timestamp
FROM audit_events
WHERE actor_id = 'user:telegram:123456789'
  AND action LIKE 'tool.%'
ORDER BY timestamp DESC
LIMIT 100;

-- Zusammenfassung kritischer Events
SELECT action, COUNT(*) as count
FROM audit_events
WHERE severity = 'critical'
  AND timestamp > datetime('now', '-7 days')
GROUP BY action
ORDER BY count DESC;
```

## Compliance

Das Audit-Protokollierungssystem ist darauf ausgelegt, Compliance-Anforderungen zu unterstutzen:

- **Unveranderlichkeit** -- Protokolldateien sind nur zum Anhangen; rotierte Dateien konnen mit Prufsummen auf Integritat gepruft werden
- **Vollstandigkeit** -- alle sicherheitsrelevanten Operationen werden standardmassig auf `info`-Ebene protokolliert
- **Aufbewahrung** -- konfigurierbare Aufbewahrungsfristen mit automatischer Rotation und Loschung
- **Nichtabstreitbarkeit** -- jedes Event enthalt eine Akteursidentitat und einen Zeitstempel
- **Verfugbarkeit** -- doppelte Ausgabe (Datei + Datenbank) stellt sicher, dass keine Events verloren gehen, wenn ein Backend ausfallt

### Empfohlene Einstellungen fur Compliance

```toml
[security.audit]
enabled = true
min_severity = "info"

[security.audit.file]
enabled = true
format = "jsonl"
max_size_mb = 500
max_files = 50
compress_rotated = true

[security.audit.database]
enabled = true
backend = "postgres"
path = "postgresql://audit_user:password@localhost/prx_audit"
retention_days = 365
```

## Leistung

Der Audit-Logger ist fur minimalen Overhead konzipiert:

- Events werden asynchron uber einen begrenzten Kanal geschrieben (Standardkapazitat: 10.000 Events)
- Dateischreibvorgange werden gepuffert und periodisch geleert (jede 1 Sekunde oder alle 100 Events)
- Datenbankschreibvorgange werden gebundelt (Standard-Batchgrosse: 50 Events)
- Wenn der Event-Kanal voll ist, werden Events mit einem Warnungszahler verworfen (blockiert niemals die Haupt-Agentenschleife)

## Einschrankungen

- Das Datei-Backend bietet keine eingebaute Manipulationserkennung (erwagen Sie externes Integritatsuberwachung fur Hochsicherheitsbereitstellungen)
- Audit-Events von Plugin-Code werden vom Host protokolliert; Plugins konnen das Audit-System nicht umgehen
- Das CSV-Format unterstutzt keine verschachtelten Metadatenfelder (verwenden Sie JSONL fur volle Wiedergabetreue)
- Datenbank-Aufbewahrungsbereinigung lauft einmal pro Stunde; Events konnen geringfugig uber den konfigurierten Aufbewahrungszeitraum hinaus bestehen bleiben

## Verwandte Seiten

- [Sicherheitsubersicht](./)
- [Richtlinien-Engine](./policy-engine) -- Autorisierungsentscheidungen, die Audit-Events erzeugen
- [Sandbox](./sandbox) -- Werkzeugausfuhrungs-Isolation
- [Bedrohungsmodell](./threat-model) -- Sicherheitsarchitektur und Vertrauensgrenzen
