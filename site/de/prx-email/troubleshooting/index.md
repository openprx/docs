---
title: Fehlerbehebung
description: "Lösungen für häufige PRX-Email-Probleme einschließlich OAuth-Fehler, IMAP-Synchronisationsfehler, SMTP-Sendeprobleme, SQLite-Fehler und WASM-Plugin-Probleme."
---

# Fehlerbehebung

Diese Seite behandelt die häufigsten Probleme beim Betrieb von PRX-Email, zusammen mit ihren Ursachen und Lösungen.

## OAuth-Token abgelaufen

**Symptome:** Operationen schlagen mit `Provider`-Fehlercode und einer Meldung über abgelaufene Token fehl.

**Mögliche Ursachen:**
- OAuth-Zugriffstoken ist abgelaufen und kein Refresh-Provider ist konfiguriert
- Die `*_OAUTH_EXPIRES_AT`-Umgebungsvariable enthält einen veralteten Zeitstempel
- Der Refresh-Provider gibt Fehler zurück

**Lösungen:**

1. **Token-Ablauf-Zeitstempel verifizieren:**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# Diese sollten Unix-Zeitstempel in der Zukunft sein
```

2. **Token manuell aus Umgebung neu laden:**

```rust
// Neue Token setzen
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// Neu laden
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **Refresh-Provider implementieren** für automatische Token-Erneuerung:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **Outlook-Bootstrap-Skript erneut ausführen**, um neue Token zu erhalten:

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Email versucht, Token 60 Sekunden vor Ablauf zu aktualisieren. Wenn Token schneller als das Synchronisationsintervall ablaufen, sicherstellen, dass der Refresh-Provider verbunden ist.
:::

## IMAP-Synchronisation schlägt fehl

**Symptome:** `sync()` gibt einen `Network`-Fehler zurück, oder der Sync-Runner meldet Fehler.

**Mögliche Ursachen:**
- Falscher IMAP-Server-Hostname oder -Port
- Netzwerkverbindungsprobleme
- Authentifizierungsfehler (falsches Passwort oder abgelaufener OAuth-Token)
- IMAP-Server-Ratenbegrenzung

**Lösungen:**

1. **Verbindung zum IMAP-Server verifizieren:**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **Transport-Konfiguration prüfen:**

```rust
// Sicherstellen, dass Host und Port korrekt sind
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **Authentifizierungsmodus verifizieren:**

```rust
// Genau eines muss gesetzt sein
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **Sync-Runner-Backoff-Status prüfen.** Nach wiederholten Fehlern wendet der Planer exponentiellen Backoff an. Vorübergehend zurücksetzen durch Verwendung eines weit zukünftigen `now_ts`:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **Strukturierte Logs prüfen** für detaillierte Fehlerinformationen:

```bash
# Nach synchronisierungsbezogenen strukturierten Logs suchen
grep "prx_email.*sync" /path/to/logs
```

## SMTP-Senden schlägt fehl

**Symptome:** `send()` gibt eine `ApiResponse` mit `ok: false` und einem `Network`- oder `Provider`-Fehler zurück.

**Mögliche Ursachen:**
- Falscher SMTP-Server-Hostname oder -Port
- Authentifizierungsfehler
- Empfängeradresse vom Provider abgelehnt
- Ratenbegrenzung oder überschrittenes Sendekontingent

**Lösungen:**

1. **Postausgangsstatus prüfen:**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **SMTP-Konfiguration verifizieren:**

```rust
// Auth-Modus prüfen
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **Auf Validierungsfehler prüfen.** Die Sende-API lehnt ab:
   - Leeres `to`, `subject` oder `body_text`
   - Deaktiviertes `email_send`-Feature-Flag
   - Ungültige E-Mail-Adressen

4. **Mit simuliertem Fehler testen**, um die Fehlerbehandlung zu verifizieren:

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... Felder ...
    failure_mode: Some(SendFailureMode::Network), // Fehler simulieren
});
```

## Postausgang im "sending"-Status hängt

**Symptome:** Postausgangs-Datensätze haben `status = 'sending'`, aber der Prozess ist vor der Finalisierung abgestürzt.

**Ursache:** Der Prozess ist abgestürzt, nachdem der Postausgangs-Datensatz geclaimed, aber bevor er als `sent` oder `failed` finalisiert wurde.

**Lösung:** Hängende Datensätze manuell über SQL wiederherstellen:

```sql
-- Hängende Zeilen identifizieren (Schwellenwert: 15 Minuten)
SELECT id, account_id, updated_at
FROM outbox
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;

-- Auf failed zurücksetzen und Wiederholung planen
UPDATE outbox
SET status = 'failed',
    last_error = 'recovered_from_stuck_sending',
    next_attempt_at = strftime('%s','now') + 30,
    updated_at = strftime('%s','now')
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;
```

## Anhang abgelehnt

**Symptome:** Senden schlägt fehl mit "attachment exceeds size limit" oder "attachment content type is not allowed".

**Lösungen:**

1. **Anhang-Richtlinie prüfen:**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **Dateigröße verifizieren**, dass sie innerhalb des Limits liegt (Standard: 25 MiB).

3. **MIME-Typ zur erlaubten Liste hinzufügen**, wenn er sicher ist:

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **Bei pfadbasierten Anhängen** sicherstellen, dass der Dateipfad unter dem konfigurierten Anhang-Speicher-Wurzelverzeichnis liegt. Pfade mit `../` oder Symlinks, die außerhalb des Wurzelverzeichnisses aufgelöst werden, werden abgelehnt.

## Feature-Disabled-Fehler

**Symptome:** Operationen geben `FeatureDisabled`-Fehlercode zurück.

**Ursache:** Das Feature-Flag für die angeforderte Operation ist für das Konto nicht aktiviert.

**Lösung:**

```rust
// Aktuellen Status prüfen
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// Feature aktivieren
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Oder globalen Standard setzen
plugin.set_feature_default("email_send", true, now)?;
```

## SQLite-Datenbankfehler

**Symptome:** Operationen schlagen mit `Storage`-Fehlercode fehl.

**Mögliche Ursachen:**
- Datenbankdatei von einem anderen Prozess gesperrt
- Datenträger voll
- Datenbankdatei beschädigt
- Migrationen wurden nicht ausgeführt

**Lösungen:**

1. **Migrationen ausführen:**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **Auf gesperrte Datenbank prüfen.** Nur eine Schreibverbindung kann gleichzeitig aktiv sein. Busy-Timeout erhöhen:

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 Sekunden
    ..StoreConfig::default()
};
```

3. **Speicherplatz prüfen:**

```bash
df -h .
```

4. **Reparieren oder neu erstellen**, wenn die Datenbank beschädigt ist:

```bash
# Bestehende Datenbank sichern
cp email.db email.db.bak

# Integrität prüfen
sqlite3 email.db "PRAGMA integrity_check;"

# Bei Beschädigung exportieren und reimportieren
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## WASM-Plugin-Probleme

### Netzwerk-Guard-Fehler

**Symptome:** WASM-gehostete E-Mail-Operationen geben `EMAIL_NETWORK_GUARD`-Fehler zurück.

**Ursache:** Der Netzwerk-Sicherheitsschalter ist nicht aktiviert.

**Lösung:**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Host-Fähigkeit nicht verfügbar

**Symptome:** Operationen geben `EMAIL_HOST_CAPABILITY_UNAVAILABLE` zurück.

**Ursache:** Die Host-Laufzeit stellt die E-Mail-Fähigkeit nicht bereit. Dies tritt auf, wenn außerhalb des WASM-Kontexts ausgeführt wird.

**Lösung:** Sicherstellen, dass die PRX-Laufzeit so konfiguriert ist, dass sie E-Mail-Host-Calls dem Plugin bereitstellt.

## Sync-Runner überspringt Jobs kontinuierlich

**Symptome:** Der Sync-Runner meldet `attempted: 0`, obwohl Jobs konfiguriert sind.

**Ursache:** Alle Jobs befinden sich aufgrund vorheriger Fehler im Backoff.

**Lösungen:**

1. **Fehler-Backoff-Status prüfen** durch Untersuchung strukturierter Logs.

2. **Netzwerkerreichbarkeit und IMAP-Authentifizierung verifizieren**, bevor erneut gestartet wird.

3. **Backoff zurücksetzen** durch Verwendung eines weit zukünftigen Zeitstempels:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## Hohe Sendefehlerrate

**Symptome:** Metriken zeigen eine hohe `send_failures`-Anzahl.

**Lösungen:**

1. **Strukturierte Logs inspizieren**, gefiltert nach `run_id` und `error_code`:

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **SMTP-Auth-Modus prüfen.** Sicherstellen, dass genau eines von Passwort oder oauth_token gesetzt ist.

3. **Provider-Verfügbarkeit validieren**, bevor ein breiter Rollout aktiviert wird.

4. **Metriken prüfen:**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## Hilfe erhalten

Wenn keine der obigen Lösungen das Problem behebt:

1. **Bestehende Issues prüfen:** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **Neues Issue einreichen** mit:
   - PRX-Email-Version (in `Cargo.toml` prüfen)
   - Rust-Toolchain-Version (`rustc --version`)
   - Relevante strukturierte Log-Ausgabe
   - Reproduktionsschritte

## Nächste Schritte

- [Konfigurationsreferenz](../configuration/) -- Alle Einstellungen überprüfen
- [OAuth-Authentifizierung](../accounts/oauth) -- OAuth-spezifische Probleme lösen
- [SQLite-Speicher](../storage/) -- Datenbankwartung und -wiederherstellung
