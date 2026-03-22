---
title: Fehlerbehebung
description: "Lösungen für häufige PRX-WAF-Probleme, einschließlich Datenbankverbindung, Regelladung, Falsch-Positive, Cluster-Synchronisierung, SSL-Zertifikate und Performance-Optimierung."
---

# Fehlerbehebung

Diese Seite behandelt die häufigsten Probleme beim Betrieb von PRX-WAF, zusammen mit deren Ursachen und Lösungen.

## Datenbankverbindung schlägt fehl

**Symptome:** PRX-WAF startet nicht mit "connection refused"- oder "authentication failed"-Fehlern.

**Lösungen:**

1. **Verifizieren, dass PostgreSQL läuft:**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **Konnektivität testen:**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. **Den Verbindungsstring** in der TOML-Konfiguration prüfen:

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. **Migrationen ausführen**, wenn die Datenbank existiert, aber Tabellen fehlen:

```bash
prx-waf -c configs/default.toml migrate
```

## Regeln werden nicht geladen

**Symptome:** PRX-WAF startet, aber keine Regeln sind aktiv. Angriffe werden nicht erkannt.

**Lösungen:**

1. **Regelstatistiken prüfen:**

```bash
prx-waf rules stats
```

Wenn die Ausgabe 0 Regeln zeigt, ist das Regelverzeichnis möglicherweise leer oder falsch konfiguriert.

2. **Den Regelverzeichnispfad** in der Konfiguration verifizieren:

```toml
[rules]
dir = "rules/"
```

3. **Regeldateien validieren:**

```bash
python rules/tools/validate.py rules/
```

4. **Auf YAML-Syntaxfehler prüfen** -- eine einzige fehlerhafte Datei kann verhindern, dass alle Regeln geladen werden:

```bash
# Eine Datei nach der anderen validieren, um das Problem zu finden
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **Sicherstellen, dass eingebaute Regeln aktiviert sind:**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Hot-Reload funktioniert nicht

**Symptome:** Regeldateien werden geändert, aber Änderungen werden nicht wirksam.

**Lösungen:**

1. **Verifizieren, dass Hot-Reload aktiviert ist:**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **Manuellen Reload auslösen:**

```bash
prx-waf rules reload
```

3. **SIGHUP senden:**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **Dateisystem-Watch-Limits prüfen** (Linux):

```bash
cat /proc/sys/fs/inotify/max_user_watches
# Wenn zu niedrig, erhöhen:
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Falsch-Positive

**Symptome:** Legitime Anfragen werden blockiert (403 Forbidden).

**Lösungen:**

1. **Die blockierende Regel** aus den Sicherheitsereignissen identifizieren:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

Das `rule_id`-Feld im Ereignis suchen.

2. **Die spezifische Regel deaktivieren:**

```bash
prx-waf rules disable CRS-942100
```

3. **Paranoia-Stufe senken.** Wenn bei Paranoia 2+, auf 1 reduzieren.

4. **Die Regel in den Log-Modus umschalten** zur Überwachung anstatt Blockierung:

Regeldatei bearbeiten und `action: "block"` zu `action: "log"` ändern, dann neu laden:

```bash
prx-waf rules reload
```

5. **Eine IP-Allowlist hinzufügen** für vertrauenswürdige Quellen:

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
Bei der Bereitstellung neuer Regeln mit `action: log` beginnen, um auf Falsch-Positive zu überwachen, bevor auf `action: block` gewechselt wird.
:::

## SSL-Zertifikatsprobleme

**Symptome:** HTTPS-Verbindungen schlagen fehl, Zertifikatsfehler oder Let's Encrypt-Erneuerung schlägt fehl.

**Lösungen:**

1. **Zertifikatsstatus prüfen** in der Admin-UI unter **SSL-Zertifikate**.

2. **Verifizieren, dass Port 80 vom Internet erreichbar ist** für ACME HTTP-01-Challenges.

3. **Zertifikatspfade prüfen**, wenn manuelle Zertifikate verwendet werden:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **Verifizieren, dass das Zertifikat zur Domain passt:**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## Cluster-Knoten verbinden sich nicht

**Symptome:** Worker-Knoten können dem Cluster nicht beitreten. Status zeigt "disconnected"-Peers.

**Lösungen:**

1. **Netzwerkkonnektivität verifizieren** auf dem Cluster-Port (Standard: UDP 16851):

```bash
# Vom Worker zum Main
nc -zuv node-a 16851
```

2. **Firewall-Regeln prüfen** -- Cluster-Kommunikation verwendet UDP:

```bash
sudo ufw allow 16851/udp
```

3. **Zertifikate verifizieren** -- alle Knoten müssen Zertifikate verwenden, die von derselben CA signiert wurden:

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. **Seed-Konfiguration prüfen** auf Worker-Knoten:

```toml
[cluster]
seeds = ["node-a:16851"]   # Muss zum Main-Knoten auflösen
```

5. **Logs mit Debug-Ausführlichkeit überprüfen:**

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## Hoher Speicherverbrauch

**Symptome:** PRX-WAF-Prozess verbraucht mehr Speicher als erwartet.

**Lösungen:**

1. **Antwort-Cache-Größe reduzieren:**

```toml
[cache]
max_size_mb = 128    # Von Standard 256 reduzieren
```

2. **Datenbankverbindungspool reduzieren:**

```toml
[storage]
max_connections = 10   # Von Standard 20 reduzieren
```

3. **Worker-Threads reduzieren:**

```toml
[proxy]
worker_threads = 2    # Von CPU-Anzahl reduzieren
```

4. **Speichernutzung überwachen:**

```bash
ps aux | grep prx-waf
```

## CrowdSec-Verbindungsprobleme

**Symptome:** CrowdSec-Integration zeigt "disconnected" oder Entscheidungen werden nicht geladen.

**Lösungen:**

1. **LAPI-Konnektivität testen:**

```bash
prx-waf crowdsec test
```

2. **API-Schlüssel verifizieren:**

```bash
# Auf der CrowdSec-Maschine
cscli bouncers list
```

3. **LAPI-URL prüfen:**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. **Eine sichere Fallback-Aktion setzen** für den Fall, dass LAPI nicht erreichbar ist:

```toml
[crowdsec]
fallback_action = "log"    # Nicht blockieren, wenn LAPI nicht verfügbar
```

## Performance-Optimierung

### Langsame Antwortzeiten

1. **Antwort-Caching aktivieren:**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **Worker-Threads erhöhen:**

```toml
[proxy]
worker_threads = 8
```

3. **Datenbankverbindungen erhöhen:**

```toml
[storage]
max_connections = 50
```

### Hohe CPU-Auslastung

1. **Die Anzahl aktiver Regeln reduzieren.** Paranoia-Stufe-3-4-Regeln deaktivieren, wenn nicht benötigt.

2. **Ungenutzte Erkennungsphasen deaktivieren.** Zum Beispiel, wenn CrowdSec nicht verwendet wird:

```toml
[crowdsec]
enabled = false
```

## Hilfe erhalten

Wenn keine der oben genannten Lösungen das Problem behebt:

1. **Vorhandene Issues prüfen:** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. **Neues Issue erstellen** mit:
   - PRX-WAF-Version
   - Betriebssystem und Kernel-Version
   - Konfigurationsdatei (mit redigierten Passwörtern)
   - Relevante Log-Ausgabe
   - Reproduktionsschritte

## Nächste Schritte

- [Konfigurationsreferenz](../configuration/reference) -- Alle Einstellungen feinabstimmen
- [Regel-Engine](../rules/) -- Verstehen, wie Regeln ausgewertet werden
- [Cluster-Modus](../cluster/) -- Clusterspezifische Fehlerbehebung
