---
title: Dateioperationen
description: Die Werkzeuge file_read und file_write bieten Dateisystemzugriff mit Pfadvalidierung, Gedachtnis-ACL-Durchsetzung und Sicherheitsrichtlinien-Integration.
---

# Dateioperationen

PRX bietet zwei grundlegende Dateioperations-Werkzeuge -- `file_read` und `file_write` -- die Teil des minimalen `default_tools()`-Satzes sind. Diese Werkzeuge sind immer verfugbar, erfordern keine zusatzliche Konfiguration und bilden die Grundlage fur die Fahigkeit des Agenten, mit dem lokalen Dateisystem zu interagieren.

Beide Werkzeuge unterliegen der Sicherheitsrichtlinien-Engine. Die Pfadvalidierung stellt sicher, dass der Agent nur auf Dateien innerhalb erlaubter Verzeichnisse zugreifen kann. Wenn Gedachtnis-ACL aktiviert ist, blockiert `file_read` zusatzlich den Zugriff auf Gedachtnis-Markdown-Dateien, um zu verhindern, dass der Agent die Zugriffskontrolle umgeht, indem er den Gedachtnisspeicher direkt liest.

Im Gegensatz zum `shell`-Werkzeug starten Dateioperationen keine externen Prozesse. Sie sind als direkte Rust-I/O-Operationen innerhalb des PRX-Prozesses implementiert, was sie schneller und einfacher zu auditieren macht als aquivalente Shell-Befehle wie `cat` oder `echo >`.

## Konfiguration

Dateioperationen haben keinen eigenen Konfigurationsabschnitt. Ihr Verhalten wird uber die Sicherheitsrichtlinien-Engine und Gedachtnis-ACL-Einstellungen gesteuert:

```toml
# Gedachtnis-ACL beeinflusst das file_read-Verhalten
[memory]
acl_enabled = false    # Wenn true, blockiert file_read den Zugriff auf Gedachtnisdateien

# Sicherheitsrichtlinie kann Dateizugriffspfade einschranken
[security.tool_policy.tools]
file_read = "allow"    # "allow" | "deny" | "supervised"
file_write = "allow"

# Pfadbasierte Richtlinienregeln
[[security.policy.rules]]
name = "allow-workspace-read"
action = "allow"
tools = ["file_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "allow-workspace-write"
action = "allow"
tools = ["file_write"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-paths"
action = "deny"
tools = ["file_read", "file_write"]
paths = ["/etc/shadow", "/root/**", "**/.ssh/**", "**/.env"]
```

## Verwendung

### file_read

Das `file_read`-Werkzeug liest Dateiinhalte und gibt sie als String zuruck. Es ist der primare Weg, wie der Agent Dateien wahrend seiner Reasoning-Schleife inspiziert.

```json
{
  "name": "file_read",
  "arguments": {
    "path": "/home/user/project/src/main.rs"
  }
}
```

Der Agent verwendet `file_read` typischerweise um:

- Quellcode vor Modifikationen zu inspizieren
- Konfigurationsdateien zu lesen, um den Systemzustand zu verstehen
- Log-Dateien auf Fehlermeldungen zu prufen
- Dokumentation oder README-Dateien zu uberprufen

### file_write

Das `file_write`-Werkzeug schreibt Inhalte in eine Datei, erstellt sie, wenn sie nicht existiert, oder uberschreibt ihren Inhalt, wenn sie existiert.

```json
{
  "name": "file_write",
  "arguments": {
    "path": "/home/user/project/src/config.toml",
    "content": "[server]\nport = 8080\nhost = \"0.0.0.0\"\n"
  }
}
```

Der Agent verwendet `file_write` typischerweise um:

- Neue Quell- oder Konfigurationsdateien zu erstellen
- Bestehende Dateien zu modifizieren (nach dem Lesen mit `file_read`)
- Generierte Berichte oder Zusammenfassungen zu schreiben
- Verarbeitete Daten auf die Festplatte zu speichern

## Parameter

### file_read-Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `path` | `string` | Ja | -- | Absoluter oder relativer Pfad zur zu lesenden Datei |

**Ruckgabe:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | `bool` | `true`, wenn die Datei erfolgreich gelesen wurde |
| `output` | `string` | Der Dateiinhalt als UTF-8-String |
| `error` | `string?` | Fehlermeldung, wenn das Lesen fehlschlug (Datei nicht gefunden, Berechtigung verweigert, ACL blockiert usw.) |

### file_write-Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `path` | `string` | Ja | -- | Absoluter oder relativer Pfad zur zu schreibenden Datei |
| `content` | `string` | Ja | -- | Der in die Datei zu schreibende Inhalt |

**Ruckgabe:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | `bool` | `true`, wenn die Datei erfolgreich geschrieben wurde |
| `output` | `string` | Bestatigungsnachricht (z.B. "File written: /path/to/file") |
| `error` | `string?` | Fehlermeldung, wenn das Schreiben fehlschlug (Berechtigung verweigert, Pfad blockiert usw.) |

## Pfadvalidierung

Beide Werkzeuge fuhren eine Pfadvalidierung vor der I/O-Operation durch:

1. **Pfadnormalisierung** -- relative Pfade werden gegen das aktuelle Arbeitsverzeichnis aufgelost. Symbolische Links werden aufgelost, um Pfaddurchquerung zu erkennen.
2. **Richtlinienprafung** -- der aufgeloste Pfad wird gegen die Sicherheitsrichtlinienregeln gepruft. Wenn keine Regel den Pfad explizit erlaubt und die Standardaktion `deny` ist, wird die Operation blockiert.
3. **Spezielle Pfadblockierung** -- bestimmte Pfade werden unabhangig von der Richtlinie immer blockiert:
   - `/proc/`, `/sys/` (Linux-Kernel-Schnittstellen)
   - Geratedateien in `/dev/` (ausser `/dev/null`, `/dev/urandom`)
   - Gedachtnisspeicher-Dateien, wenn `memory.acl_enabled = true`

### Pfaddurchquerungs-Pravention

Die Werkzeuge losen symbolische Links auf und normalisieren `..`-Komponenten, bevor sie Richtlinien prufen. Dies verhindert, dass ein Angreifer symbolische Links oder relative Pfadtricks verwendet, um erlaubte Verzeichnisse zu verlassen:

```
# Diese werden alle aufgelost und gepruft:
/home/user/workspace/../../../etc/passwd  →  /etc/passwd  →  VERWEIGERT
/home/user/workspace/link-to-etc          →  /etc/        →  VERWEIGERT (wenn Symlink)
```

## Gedachtnis-ACL-Durchsetzung

Wenn `memory.acl_enabled = true` in der Konfiguration, erzwingt das `file_read`-Werkzeug zusatzliche Einschrankungen:

- **Gedachtnisdateien blockiert**: `file_read` verweigert das Lesen von Markdown-Dateien im Gedachtnisverzeichnis (typischerweise `~/.local/share/openprx/memory/`). Dies verhindert, dass der Agent die Gedachtnis-Zugriffskontrolle umgeht, indem er die Rohdateien direkt liest.
- **Memory Recall deaktiviert**: Das `memory_recall`-Werkzeug wird vollstandig aus der Werkzeug-Registry entfernt, wenn ACL aktiviert ist.
- **Nur gezielter Zugriff**: Der Agent muss `memory_get` oder `memory_search` mit ordnungsgemassen ACL-Prufungen verwenden, um auf Gedachtnisinhalte zuzugreifen.

```toml
[memory]
acl_enabled = true    # Aktiviert file_read-Einschrankungen fur Gedachtnispfade
```

Diese Trennung stellt sicher, dass der Agent, selbst wenn er den physischen Speicherort der Gedachtnisdateien kennt, diese nicht ausserhalb der kontrollierten Gedachtnis-API lesen kann.

## Sicherheit

### Richtlinien-Engine-Integration

Jeder `file_read`- und `file_write`-Aufruf durchlauft die Sicherheitsrichtlinien-Engine vor der Ausfuhrung. Die Richtlinien-Engine wertet Regeln in der Reihenfolge aus:

1. Per-Werkzeug-Richtlinie (`security.tool_policy.tools.file_read`)
2. Pfadbasierte Regeln (`security.policy.rules` mit ubereinstimmenden `paths`-Mustern)
3. Standardaktion (`security.policy.default_action`)

### Audit-Protokollierung

Wenn Audit-Protokollierung aktiviert ist, wird jede Dateioperation aufgezeichnet mit:

- Zeitstempel
- Werkzeugname (`file_read` oder `file_write`)
- Aufgeloester Dateipfad
- Erfolgs-/Fehlerstatus
- Fehlergrund (wenn verweigert oder fehlgeschlagen)

```toml
[security.audit]
enabled = true
log_path = "audit.log"
```

### Schutz sensibler Dateien

Die Standard-Sicherheitsrichtlinie blockiert den Zugriff auf haufige sensible Pfade:

- SSH-Schlussel (`~/.ssh/`)
- Umgebungsdateien (`.env`, `.env.local`)
- Git-Anmeldedaten (`.git-credentials`)
- Shell-Verlauf (`.bash_history`, `.zsh_history`)
- System-Passwortdateien (`/etc/shadow`)

Diese Standardeinstellungen konnen mit expliziten Erlaubnisregeln uberschrieben werden, dies wird jedoch in der Produktion dringend abgeraten.

### Binardatei-Behandlung

Das `file_read`-Werkzeug liest Dateien als UTF-8-Strings. Binardateien erzeugen verstummelte Ausgabe oder Codierungsfehler. Der Agent sollte das `shell`-Werkzeug mit geeigneten Befehlen (z.B. `xxd`, `file`, `hexdump`) fur die Inspektion von Binardateien verwenden.

## Verwandte Seiten

- [Shell-Ausfuhrung](/de/prx/tools/shell) -- Befehlsausfuhrungs-Werkzeug (Alternative fur Binardateien)
- [Gedachtnis-Werkzeuge](/de/prx/tools/memory) -- kontrollierter Gedachtniszugriff mit ACL
- [Richtlinien-Engine](/de/prx/security/policy-engine) -- pfadbasierte Zugriffskontrollregeln
- [Konfigurationsreferenz](/de/prx/config/reference) -- Gedachtnis- und Sicherheitseinstellungen
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
