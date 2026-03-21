---
title: Identitätsverwaltung
description: Workspace- und Benutzer-Scoping, Mandantenfähigkeit und Identitätskontext-Propagierung in PRX.
---

# Identitätsverwaltung

PRXs Identitätssystem bietet Workspace- und Benutzerebenen-Scoping für alle Agentenoperationen. In mandantenfähigen Bereitstellungen bestimmt der Identitätskontext, auf welche Erinnerungen, Konfigurationen, Werkzeuge und Ressourcen eine bestimmte Sitzung zugreifen kann. Das Identitätsmodul ist die Grundlage für Zugriffskontrolle, Audit-Protokollierung und Personalisierung.

## Überblick

Jede PRX-Sitzung arbeitet innerhalb eines Identitätskontexts, der Folgendes umfasst:

| Komponente | Beschreibung |
|-----------|-------------|
| **Benutzer** | Der Mensch oder Bot, der mit dem Agenten interagiert |
| **Workspace** | Eine logische Grenze, die Benutzer, Konfigurationen und Daten gruppiert |
| **Sitzung** | Ein einzelnes Gespräch zwischen einem Benutzer und dem Agenten |
| **Principal** | Die effektive Identität für Zugriffskontrollentscheidungen |

```
┌─────────────────────────────────────────┐
│              Workspace: "acme"          │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ User: A  │  │ User: B  │  ...       │
│  │          │  │          │            │
│  │ Sessions │  │ Sessions │            │
│  │ Memories │  │ Memories │            │
│  │ Config   │  │ Config   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  Shared: workspace config, tools, keys │
└─────────────────────────────────────────┘
```

## Konfiguration

### Workspace-Einrichtung

```toml
[identity]
# Enable multi-tenant identity scoping.
enabled = true

# Default workspace for sessions that do not specify one.
default_workspace = "default"

# Allow users to create new workspaces.
allow_workspace_creation = true

# Maximum workspaces per deployment.
max_workspaces = 100
```

### Benutzerprofile

Benutzerprofile speichern benutzerspezifische Präferenzen und Metadaten:

```toml
[identity.profiles]
# Storage backend for user profiles: "memory" | "sqlite" | "postgres"
backend = "sqlite"
path = "~/.local/share/openprx/identities.db"
```

### Workspace-Konfiguration

Jeder Workspace kann seine eigene Konfigurations-Overlay haben:

```toml
# Workspace-specific overrides in config.toml
[workspaces.acme]
display_name = "ACME Corp"
default_provider = "openai"
default_model = "gpt-4o"

[workspaces.acme.memory]
backend = "postgres"

[workspaces.acme.security.tool_policy]
default = "supervised"
```

## Identitätskontext

Das `IdentityContext`-Struct wird durch die gesamte Anfrage-Pipeline gereicht. Es enthält: `user_id`, `display_name`, `workspace_id`, `session_id`, `role` (Owner/Admin/Member/Guest), `channel` und beliebige `metadata`.

Der Identitätskontext propagiert durch jede Schicht: das Gateway extrahiert ihn aus eingehenden Anfragen, die Agenten-Schleife verwendet ihn zum Scoping von Gedächtnis und Werkzeugzugriff, das Gedächtnissystem namensräumt Daten nach Workspace und Benutzer, Kostenverfolgung ordnet Nutzung zu, und das Audit-Log protokolliert den Akteur.

## Mandantenfähigkeit

PRX unterstützt mandantenfähige Bereitstellungen, bei denen mehrere Organisationen eine einzelne PRX-Instanz teilen. Mandantengrenzen werden auf Workspace-Ebene erzwungen:

### Datenisolierung

| Ressource | Isolierungsebene |
|----------|----------------|
| Erinnerungen | Pro Workspace + pro Benutzer |
| Konfiguration | Pro-Workspace-Overlay auf globalen Standards |
| Werkzeugrichtlinien | Pro-Workspace-Überschreibungen |
| Geheimnisse | Pro-Workspace-Tresor |
| Kostenbudgets | Pro-Workspace-Limits |
| Audit-Logs | Pro-Workspace-Filterung |

### Workspace-übergreifender Zugriff

Standardmäßig können Benutzer nur auf Ressourcen innerhalb ihres Workspaces zugreifen. Workspace-übergreifender Zugriff erfordert explizite Konfiguration:

```toml
[identity.cross_workspace]
# Allow workspace admins to access other workspaces.
admin_cross_access = false

# Allow specific users to access multiple workspaces.
[[identity.cross_workspace.grants]]
user_id = "shared-bot"
workspaces = ["acme", "beta-corp"]
role = "member"
```

## Benutzerauflösung

PRX löst die Benutzeridentität je nach Kommunikationskanal unterschiedlich auf:

| Kanal | Identitätsquelle | Benutzer-ID-Format |
|-------|----------------|----------------|
| Telegram | Telegram-Benutzer-ID | `telegram:<user_id>` |
| Discord | Discord-Benutzer-ID | `discord:<user_id>` |
| Slack | Slack-Benutzer-ID | `slack:<workspace_id>:<user_id>` |
| CLI | System-Benutzername | `cli:<username>` |
| API/Gateway | Bearer-Token / API-Schlüssel | `api:<key_hash>` |
| WeChat | WeChat-OpenID | `wechat:<open_id>` |
| QQ | QQ-Nummer | `qq:<qq_number>` |

### Erstkontakt-Registrierung

Wenn ein neuer Benutzer zum ersten Mal mit PRX interagiert, wird automatisch ein Identitätsdatensatz erstellt: der Kanaladapter extrahiert die Benutzerkennung, erstellt ein Profil mit Standardeinstellungen und weist den Benutzer dem `default_workspace` mit der Rolle `Member` zu.

### Manuelle Benutzerverwaltung

```bash
# List all known users
prx identity list

# Show user details
prx identity info telegram:123456

# Assign a user to a workspace
prx identity assign telegram:123456 --workspace acme --role admin

# Remove a user from a workspace
prx identity remove telegram:123456 --workspace acme

# Set user metadata
prx identity set telegram:123456 --key language --value en
```

## Workspace-Verwaltung

```bash
# List all workspaces
prx workspace list

# Create a new workspace
prx workspace create acme --display-name "ACME Corp"

# Show workspace details
prx workspace info acme

# Set workspace configuration
prx workspace config acme --set default_provider=anthropic

# Delete a workspace (requires confirmation)
prx workspace delete acme --confirm
```

## Benutzerprofile

Benutzerprofile speichern Präferenzen, die das Verhalten des Agenten personalisieren:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `user_id` | String | Eindeutiger Identifikator |
| `display_name` | String | Für Menschen lesbarer Name |
| `language` | String | Bevorzugte Sprache (ISO 639-1) |
| `timezone` | String | Bevorzugte Zeitzone (IANA-Format) |
| `role` | Enum | Workspace-Rolle (Owner, Admin, Member, Guest) |
| `preferences` | Map | Schlüssel-Wert-Präferenzen (Modell, Ausführlichkeit usw.) |
| `created_at` | Datetime | Zeitstempel der ersten Interaktion |
| `last_seen_at` | Datetime | Zeitstempel der letzten Interaktion |

### Profilzugriff in System-Prompts

Der System-Prompt des Agenten kann Benutzerprofilinformationen über Template-Variablen einbinden (z.B. <code v-pre>{{identity.display_name}}</code>, <code v-pre>{{identity.language}}</code>), die aus dem Identitätskontext aufgelöst werden, bevor der Prompt an das LLM gesendet wird.

## Rollenbasierte Zugriffskontrolle

Workspace-Rollen bestimmen, welche Aktionen ein Benutzer durchführen kann:

| Berechtigung | Owner | Admin | Member | Guest |
|------------|-------|-------|--------|-------|
| Agent nutzen (Chat) | Ja | Ja | Ja | Ja |
| Erinnerungen speichern | Ja | Ja | Ja | Nein |
| Werkzeuge konfigurieren | Ja | Ja | Nein | Nein |
| Benutzer verwalten | Ja | Ja | Nein | Nein |
| Workspace verwalten | Ja | Nein | Nein | Nein |
| Audit-Logs einsehen | Ja | Ja | Nein | Nein |

## Integrationspunkte

Wenn `identity.enabled = true`, werden alle Gedächtnisoperationen nach `workspace:{workspace_id}:user:{user_id}:{key}` gescopted, was Datenisolierung gewährleistet. Werkzeugrichtlinien können pro Workspace überschrieben werden, und Token-Verbrauch wird dem Identitätskontext für benutzerspezifische Kostenberichte zugeordnet.

## Sicherheitshinweise

- **Identitäts-Spoofing** -- das Identitätssystem vertraut dem Kanaladapter bei der korrekten Benutzeridentifikation. Stellen Sie sicher, dass die Kanalauthentifizierung korrekt konfiguriert ist (Bot-Tokens, OAuth usw.).
- **Workspace-Isolierung** -- Workspace-Grenzen werden in der Anwendungslogik erzwungen. Der zugrunde liegende Speicher (SQLite, Postgres) bietet keine Datenbank-Level-Isolierung. Ein Fehler in der Scoping-Logik könnte Daten preisgeben.
- **Gastzugriff** -- Gäste haben standardmäßig minimale Berechtigungen. Überprüfen Sie die Gastrollenkonfiguration bei der Aktivierung öffentlich zugänglicher Agenten.
- **Profildaten** -- Benutzerprofile können personenbezogene Daten enthalten. Behandeln Sie diese gemäß Ihrer Datenschutzrichtlinie und geltenden Vorschriften.
- **Workspace-übergreifende Berechtigungen** -- gewähren Sie workspace-übergreifenden Zugriff sparsam. Jede Berechtigung erweitert den Schadensradius eines kompromittierten Kontos.

## Verwandte Seiten

- [Authentifizierungsübersicht](/de/prx/auth/)
- [OAuth2-Flows](/de/prx/auth/oauth2)
- [Anbieterprofile](/de/prx/auth/profiles)
- [Sicherheitsübersicht](/de/prx/security/)
- [Richtlinien-Engine](/de/prx/security/policy-engine)
- [Gedächtnissystem](/de/prx/memory/)
