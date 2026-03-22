---
title: OAuth-Authentifizierung
description: "OAuth 2.0 XOAUTH2-Authentifizierung für PRX-Email mit Gmail und Outlook einrichten. Token-Lebenszyklus-Management, Refresh-Provider und Hot-Reload."
---

# OAuth-Authentifizierung

PRX-Email unterstützt OAuth 2.0-Authentifizierung über den XOAUTH2-Mechanismus für IMAP und SMTP. Dies ist für Outlook/Office 365 erforderlich und für Gmail empfohlen. Das Plugin bietet Token-Ablauf-Tracking, austauschbare Refresh-Provider und umgebungsbasiertes Hot-Reload.

## Wie XOAUTH2 funktioniert

XOAUTH2 ersetzt herkömmliche Passwort-Authentifizierung durch einen OAuth-Zugriffstoken. Der Client sendet während IMAP AUTHENTICATE oder SMTP AUTH einen speziell formatierten String:

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

PRX-Email verarbeitet dies automatisch, wenn `auth.oauth_token` gesetzt ist.

## Gmail OAuth-Setup

### 1. Google Cloud-Anmeldedaten erstellen

1. [Google Cloud Console](https://console.cloud.google.com/) aufrufen
2. Ein Projekt erstellen oder ein vorhandenes auswählen
3. Gmail API aktivieren
4. OAuth 2.0-Anmeldedaten erstellen (Desktop-Anwendungstyp)
5. **Client-ID** und **Client-Secret** notieren

### 2. Zugriffstoken abrufen

Google's OAuth-Playground oder einen eigenen OAuth-Flow verwenden, um einen Zugriffstoken mit folgenden Scopes zu erhalten:

- `https://mail.google.com/` (vollständiger IMAP/SMTP-Zugriff)

### 3. PRX-Email konfigurieren

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Outlook OAuth-Setup

PRX-Email enthält ein Bootstrap-Skript für Outlook/Office 365 OAuth, das den gesamten Autorisierungscode-Flow übernimmt.

### 1. Azure-App registrieren

1. [Azure-Portal App-Registrierungen](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) aufrufen
2. Eine neue Anwendung registrieren
3. Eine Redirect-URI festlegen (z.B. `http://localhost:53682/callback`)
4. **Anwendungs-(Client-)ID** und **Verzeichnis-(Tenant-)ID** notieren
5. Unter API-Berechtigungen hinzufügen:
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. Bootstrap-Skript ausführen

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

Das Skript:
1. Gibt eine Autorisierungs-URL aus -- diese im Browser öffnen
2. Wartet, bis die Callback-URL oder der Autorisierungscode eingefügt wird
3. Tauscht den Code gegen Zugriffs- und Refresh-Token aus
4. Speichert Token in `./outlook_oauth.local.env` mit `chmod 600`

### Skript-Optionen

| Flag | Beschreibung |
|------|-------------|
| `--output <file>` | Benutzerdefinierter Ausgabepfad (Standard: `./outlook_oauth.local.env`) |
| `--dry-run` | Autorisierungs-URL ausgeben und beenden |
| `-h`, `--help` | Nutzungsinformationen anzeigen |

### Umgebungsvariablen

| Variable | Erforderlich | Beschreibung |
|----------|-------------|-------------|
| `CLIENT_ID` | Ja | Azure-Anwendungs-Client-ID |
| `TENANT` | Ja | Tenant-ID oder `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | Ja | In der Azure-App registrierte Redirect-URI |
| `SCOPE` | Nein | Benutzerdefinierte Scopes (Standard: IMAP + SMTP + offline_access) |

::: warning Sicherheit
Die generierte Token-Datei niemals committen. `*.local.env` zur `.gitignore` hinzufügen.
:::

### 3. Token laden

Nachdem das Bootstrap-Skript Token generiert hat, die env-Datei sourcen und PRX-Email konfigurieren:

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## Token-Lebenszyklus-Management

### Ablauf-Tracking

PRX-Email verfolgt OAuth-Token-Ablauf-Zeitstempel pro Protokoll (IMAP/SMTP):

```rust
// Ablauf über Umgebung setzen
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

Vor jeder Operation prüft das Plugin, ob der Token innerhalb von 60 Sekunden abläuft. Falls ja, wird eine Aktualisierung versucht.

### Austauschbarer Refresh-Provider

Den `OAuthRefreshProvider`-Trait implementieren, um automatische Token-Aktualisierung zu handhaben:

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // Token-Endpunkt des OAuth-Providers aufrufen
        // Neuen Zugriffstoken und optionalen Ablauf zurückgeben
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

Provider beim Erstellen des Plugins anhängen:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### Hot-Reload aus Umgebung

OAuth-Token zur Laufzeit ohne Neustart neu laden:

```rust
// Neue Token in Umgebung setzen
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// Neu laden auslösen
plugin.reload_auth_from_env("PRX_EMAIL");
```

Die `reload_auth_from_env`-Methode liest Umgebungsvariablen mit dem angegebenen Präfix und aktualisiert die IMAP/SMTP-OAuth-Token und Ablauf-Zeitstempel. Wenn ein OAuth-Token geladen wird, wird das entsprechende Passwort gelöscht, um die Ein-von-zwei-Auth-Invariante aufrechtzuerhalten.

### Vollständiges Konfigurations-Reload

Für eine vollständige Transport-Neukonfiguration:

```rust
plugin.reload_config(new_transport_config)?;
```

Damit wird die neue Konfiguration validiert und die gesamte Transport-Konfiguration atomar ersetzt.

## OAuth-Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP-OAuth-Zugriffstoken |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP-OAuth-Zugriffstoken |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP-Token-Ablauf (Unix-Sekunden) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP-Token-Ablauf (Unix-Sekunden) |

Das Präfix wird an `reload_auth_from_env()` übergeben. Für die Standard-PRX-Email-Konfiguration `PRX_EMAIL` als Präfix verwenden.

## Sicherheits-Best-Practices

1. **Token niemals protokollieren.** PRX-Email bereinigt Debug-Nachrichten und schwärzt autorisierungsbezogene Inhalte.
2. **Refresh-Token verwenden.** Zugriffs-Token laufen ab; immer einen Refresh-Provider für den Produktionseinsatz implementieren.
3. **Token sicher speichern.** Dateiberechtigungen (`chmod 600`) verwenden und Token-Dateien niemals in die Versionskontrolle committen.
4. **Token regelmäßig rotieren.** Auch bei automatischer Aktualisierung regelmäßig verifizieren, dass Token rotiert werden.

## Nächste Schritte

- [Kontoverwaltung](./index) -- Konten und Feature-Flags verwalten
- [Konfigurationsreferenz](../configuration/) -- Alle Umgebungsvariablen und Einstellungen
- [Fehlerbehebung](../troubleshooting/) -- OAuth-bezogene Fehlerbehebung
