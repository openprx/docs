---
title: Genehmigungs-Workflow
description: Wie PRX uberwachte Werkzeugaufrufe handhabt, die eine menschliche Genehmigung vor der Ausfuhrung erfordern.
---

# Genehmigungs-Workflow

Wenn die Sicherheitsrichtlinie eines Werkzeugs auf `"supervised"` gesetzt ist, pausiert PRX die Ausfuhrung und wartet auf menschliche Genehmigung, bevor der Werkzeugaufruf ausgefuhrt wird. Dies bietet eine kritische Sicherheitsschicht fur risikoreiche Operationen -- Shell-Befehle, Dateischreibvorgange, Netzwerkanfragen oder jede Aktion, die irreversible Folgen haben konnte.

## Ubersicht

Der Genehmigungs-Workflow befindet sich zwischen der Agentenschleife und der Werkzeugausfuhrung:

```
Agent Loop
    │
    ├── LLM gibt Werkzeugaufruf aus: shell("rm -rf /tmp/data")
    │
    ▼
┌───────────────────────────────────┐
│        Richtlinien-Engine         │
│                                   │
│  Werkzeug: "shell"               │
│  Richtlinie: "supervised"        │
│  Aktion: GENEHMIGUNG ERFORDERN   │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│      Genehmigungsanfrage          │
│                                   │
│  Ausstehend...                   │
│  ├── Supervisor benachrichtigen   │
│  ├── Auf Antwort warten          │
│  └── Timeout nach N Sekunden     │
└───────────────┬───────────────────┘
                │
         ┌──────┴──────┐
         │             │
    ┌────▼────┐   ┌────▼────┐
    │Genehmigt│   │Abgelehnt│
    │         │   │         │
    │Werkzeug │   │ Fehler  │
    │ausfuhren│   │zuruckgeb│
    └─────────┘   └─────────┘
```

## Konfiguration

### Werkzeugrichtlinien festlegen

Konfigurieren Sie, welche Werkzeuge eine Genehmigung erfordern, in `config.toml`:

```toml
[security.tool_policy]
# Standardrichtlinie fur alle Werkzeuge.
# "allow" -- sofort ausfuhren
# "deny" -- Ausfuhrung vollstandig blockieren
# "supervised" -- Genehmigung vor Ausfuhrung erfordern
default = "allow"

# Pro-Werkzeug-Richtlinienuberschreibungen.
[security.tool_policy.tools]
shell = "supervised"
file_write = "supervised"
http_request = "supervised"
git_operations = "allow"
memory_store = "allow"
browser = "deny"

# Gruppenebene-Richtlinien.
[security.tool_policy.groups]
sessions = "allow"
automation = "supervised"
```

### Genehmigungseinstellungen

```toml
[security.approval]
# Wie lange auf eine Antwort gewartet wird, bevor ein Timeout eintritt (Sekunden).
timeout_secs = 300

# Aktion bei Timeout der Genehmigung: "deny" oder "allow".
# "deny" ist der sichere Standard -- unbeantwortete Anfragen werden abgelehnt.
on_timeout = "deny"

# Benachrichtigungskanal fur Genehmigungsanfragen.
# Der Supervisor wird uber diesen Kanal benachrichtigt.
notify_channel = "telegram"

# Supervisor-Benutzer-ID oder -Bezeichner.
# Nur dieser Benutzer kann Anfragen genehmigen oder ablehnen.
supervisor_id = "admin"

# Auto-Genehmigungs-Muster: Werkzeugaufrufe, die diesen Mustern entsprechen,
# werden automatisch ohne menschliches Eingreifen genehmigt.
# Mit Vorsicht verwenden.
[[security.approval.auto_approve]]
tool = "shell"
command_pattern = "^(ls|cat|head|tail|wc|grep|find|echo) "

[[security.approval.auto_approve]]
tool = "file_write"
path_pattern = "^/tmp/"
```

## Genehmigungsablauf

### Schritt 1: Richtlinienuberprufung

Wenn der Agent einen Werkzeugaufruf ausgibt, evaluiert die Richtlinien-Engine diesen:

1. Pro-Werkzeug-Richtlinie prufen (`security.tool_policy.tools.<name>`)
2. Wenn keine Pro-Werkzeug-Richtlinie vorhanden, Gruppenrichtlinie prufen (`security.tool_policy.groups.<group>`)
3. Wenn keine Gruppenrichtlinie vorhanden, Standardrichtlinie verwenden (`security.tool_policy.default`)

Wenn die aufgeloste Richtlinie `"supervised"` ist, wird der Genehmigungsablauf ausgelost.

### Schritt 2: Auto-Genehmigungs-Prufung

Bevor der Supervisor benachrichtigt wird, pruft PRX, ob die Anfrage einem `auto_approve`-Muster entspricht. Auto-Genehmigungs-Regeln verwenden Regex-Muster zum Abgleich von Werkzeugargumenten:

| Feld | Beschreibung |
|------|-------------|
| `tool` | Werkzeugname, fur den die Regel gilt |
| `command_pattern` | Regex-Muster, das gegen den Shell-Befehl abgeglichen wird (fur `shell`-Werkzeug) |
| `path_pattern` | Regex-Muster, das gegen Dateipfade abgeglichen wird (fur `file_write`, `file_read`) |
| `url_pattern` | Regex-Muster, das gegen URLs abgeglichen wird (fur `http_request`) |
| `args_pattern` | Regex-Muster, das gegen die vollstandigen JSON-Argumente abgeglichen wird |

Wenn eine Ubereinstimmung gefunden wird, wird die Anfrage automatisch genehmigt und die Ausfuhrung fahrt sofort fort. Dies ist nutzlich fur sichere, nur-lesende Befehle, die ubermassige Genehmigungs-Ermudung verursachen wurden.

### Schritt 3: Benachrichtigung

Wenn keine Auto-Genehmigungs-Regel zutrifft, erstellt PRX eine Genehmigungsanfrage und benachrichtigt den Supervisor:

```
[GENEHMIGUNG ERFORDERLICH]

Werkzeug: shell
Argumente: {"command": "rm -rf /tmp/data"}
Sitzung: abc-123
Agent: default
Zeit: 2026-03-21 14:30:22 UTC

Antworten Sie mit:
  /approve -- den Werkzeugaufruf ausfuhren
  /deny -- den Werkzeugaufruf ablehnen
  /deny reason: <Erklarung> -- mit Begrundung ablehnen
```

Die Benachrichtigung wird uber den konfigurierten `notify_channel` gesendet. Unterstutzte Kanale:

| Kanal | Benachrichtigungsmethode |
|-------|------------------------|
| Telegram | Nachricht an den Chat des Supervisors |
| Discord | DM an den Supervisor |
| Slack | DM an den Supervisor |
| CLI | Terminal-Eingabeaufforderung (stdin) |
| E-Mail | E-Mail an konfigurierte Adresse |
| Webhook | HTTP POST an konfigurierte URL |

### Schritt 4: Warten

Die Agentenschleife pausiert, wahrend auf die Antwort des Supervisors gewartet wird. Wahrend dieser Zeit:

- Der Agent kann keine Werkzeuge ausfuhren (der aktuelle Werkzeugaufruf blockiert)
- Andere Sitzungen laufen unabhangig weiter
- Die Genehmigungsanfrage hat eine eindeutige ID zur Nachverfolgung

### Schritt 5: Auflosung

Der Supervisor antwortet mit einer der folgenden Optionen:

| Antwort | Auswirkung |
|---------|-----------|
| **Genehmigen** | Der Werkzeugaufruf wird normal ausgefuhrt und das Ergebnis an den Agenten zuruckgegeben |
| **Ablehnen** | Der Werkzeugaufruf wird abgelehnt und eine Fehlermeldung an den Agenten zuruckgegeben |
| **Ablehnen mit Begrundung** | Wie Ablehnen, aber die Begrundung wird in die Fehlermeldung aufgenommen, damit der Agent sich anpassen kann |
| **Timeout** | Die `on_timeout`-Aktion wird angewendet (Standard: Ablehnen) |

## Anfrage-Lebenszyklus

Jede Genehmigungsanfrage durchlauft diese Zustande:

```
PENDING → APPROVED → EXECUTED
       → DENIED
       → TIMED_OUT
       → CANCELLED (wenn die Sitzung vor der Auflosung endet)
```

| Zustand | Beschreibung |
|---------|-------------|
| `PENDING` | Wartet auf Supervisor-Antwort |
| `APPROVED` | Supervisor hat genehmigt, Werkzeug wird ausgefuhrt |
| `EXECUTED` | Werkzeugausfuhrung nach Genehmigung abgeschlossen |
| `DENIED` | Supervisor hat die Anfrage explizit abgelehnt |
| `TIMED_OUT` | Keine Antwort innerhalb von `timeout_secs` |
| `CANCELLED` | Sitzung wurde vor der Auflosung beendet |

## Genehmigungs-Schnittstellen

Im CLI-Modus erscheinen Genehmigungsanfragen als interaktive Terminal-Eingabeaufforderungen mit Werkzeugname, Argumenten und Risikostufe. Fur programmatischen Zugriff stellt PRX eine REST-API bereit:

```bash
# Ausstehende Anfragen auflisten / genehmigen / ablehnen
curl http://localhost:8080/api/approvals?status=pending
curl -X POST http://localhost:8080/api/approvals/{id}/approve
curl -X POST http://localhost:8080/api/approvals/{id}/deny \
  -d '{"reason": "Not permitted"}'
```

## Audit-Trail

Alle Genehmigungsentscheidungen werden im Aktivitatsprotokoll mit den Feldern aufgezeichnet: `request_id`, `tool`, `arguments`, `session_id`, `decision`, `decided_by`, `decided_at`, `reason` und `execution_result`. Zugriff uber `prx audit approvals --last 50` oder Export mit `--format json`.

## Sicherheitshinweise

- **Standard-Ablehnung bei Timeout** -- setzen Sie in der Produktion immer `on_timeout = "deny"`. Unbeantwortete Anfragen durchzulassen untergrabe den Zweck der Uberwachung.
- **Auto-Genehmigung mit Bedacht** -- zu breite Auto-Genehmigungs-Muster konnen den Genehmigungs-Workflow umgehen. Verwenden Sie spezifische Regex-Muster und uberprufen Sie sie regelmaessig.
- **Supervisor-Authentifizierung** -- stellen Sie sicher, dass der `notify_channel` den Supervisor authentifiziert. Ein kompromittierter Benachrichtigungskanal konnte unautorisierte Genehmigungen ermoglichen.
- **Ratenlimitierung** -- wenn ein Agent wiederholt Genehmigungsanfragen fur dieselbe Operation auslost, erwagen Sie, die Richtlinie fur dieses Werkzeug auf `"deny"` zu aktualisieren oder eine spezifischere Auto-Genehmigungs-Regel hinzuzufugen.
- **Multi-Supervisor** -- in Team-Bereitstellungen erwagen Sie die Konfiguration mehrerer Supervisoren. Jeder einzelne kann genehmigen oder ablehnen.

## Verwandte Seiten

- [Sicherheitsubersicht](/de/prx/security/)
- [Richtlinien-Engine](/de/prx/security/policy-engine)
- [Sandbox](/de/prx/security/sandbox)
- [Audit-Protokollierung](/de/prx/security/audit)
- [Werkzeuge-Ubersicht](/de/prx/tools/)
