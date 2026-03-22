---
title: Fehlerbehebung
description: "Häufige Probleme und Lösungen beim Betrieb von Fenfa, einschließlich iOS-Installationsfehler, Upload-Fehler und Docker-Probleme."
---

# Fehlerbehebung

Diese Seite behandelt häufige Probleme beim Betrieb von Fenfa und ihre Lösungen.

## iOS-Installation

### "Unable to Install" / Installation schlägt fehl

**Symptome:** Tippen auf den Installations-Button auf iOS zeigt "Unable to Install" oder es passiert nichts.

**Ursachen und Lösungen:**

1. **HTTPS nicht konfiguriert.** iOS erfordert HTTPS mit einem gültigen TLS-Zertifikat für OTA-Installation. Selbstsignierte Zertifikate funktionieren nicht.
   - **Lösung:** Reverse Proxy mit einem gültigen TLS-Zertifikat einrichten. Siehe [Produktions-Deployment](../deployment/production).
   - **Zum Testen:** `ngrok` verwenden, um einen HTTPS-Tunnel zu erstellen: `ngrok http 8000`

2. **Falsche primary_domain.** Das Manifest-Plist enthält Download-URLs basierend auf `primary_domain`. Bei falschem Wert kann iOS die IPA nicht abrufen.
   - **Lösung:** `FENFA_PRIMARY_DOMAIN` auf die genaue HTTPS-URL setzen, auf die Benutzer zugreifen (z.B. `https://dist.example.com`).

3. **Zertifikatsprobleme.** Das TLS-Zertifikat muss die Domain abdecken und von iOS vertrauenswürdig sein.
   - **Lösung:** Let's Encrypt für kostenlose, vertrauenswürdige Zertifikate verwenden.

4. **IPA-Signierung abgelaufen.** Das Bereitstellungsprofil oder Signierungszertifikat ist möglicherweise abgelaufen.
   - **Lösung:** Die IPA mit einem gültigen Zertifikat neu signieren und erneut hochladen.

### UDID-Bindung funktioniert nicht

**Symptome:** Das Mobileconfig-Profil wird installiert, aber das Gerät ist nicht registriert.

**Ursachen und Lösungen:**

1. **Callback-URL nicht erreichbar.** Die UDID-Callback-URL muss vom Gerät erreichbar sein.
   - **Lösung:** Sicherstellen, dass `primary_domain` korrekt ist und vom Netzwerk des Geräts zugänglich ist.

2. **Nonce abgelaufen.** Profil-Nonces laufen nach einem Timeout ab.
   - **Lösung:** Das Mobileconfig-Profil erneut herunterladen und es erneut versuchen.

## Upload-Probleme

### Upload schlägt mit 401 fehl

**Symptom:** `{"ok": false, "error": {"code": "UNAUTHORIZED", ...}}`

**Lösung:** Prüfen, dass der `X-Auth-Token`-Header einen gültigen Token enthält. Upload-Endpunkte akzeptieren sowohl Upload- als auch Admin-Token.

```bash
# Token-Funktion verifizieren
curl -H "X-Auth-Token: YOUR_TOKEN" http://localhost:8000/admin/api/products
```

### Upload schlägt mit 413 fehl (Request Entity Too Large)

**Symptom:** Große Datei-Uploads schlagen mit einem 413-Fehler fehl.

**Lösung:** Dies ist typischerweise ein Reverse-Proxy-Limit, nicht Fenfa selbst. Das Limit erhöhen:

**Nginx:**
```nginx
client_max_body_size 2G;
```

**Caddy:**
Caddy hat kein Standard-Body-Size-Limit, aber wenn eines gesetzt wurde:
```
dist.example.com {
    request_body {
        max_size 2GB
    }
    reverse_proxy localhost:8000
}
```

### Intelligenter Upload erkennt keine Metadaten

**Symptom:** Version und Build-Nummer sind nach dem intelligenten Upload leer.

**Lösung:** Die automatische Erkennung des intelligenten Uploads funktioniert nur für IPA- und APK-Dateien. Für Desktop-Formate (DMG, EXE, DEB, etc.) `version` und `build` explizit in der Upload-Anfrage angeben.

## Docker-Probleme

### Container startet, aber Admin-Panel ist leer

**Symptom:** Das Admin-Panel lädt, zeigt aber keine Daten oder eine leere Seite.

**Lösung:** Prüfen, dass der Container läuft und die Port-Zuordnung korrekt ist:

```bash
docker ps
docker logs fenfa
```

### Daten nach Container-Neustart verloren

**Symptom:** Alle Produkte, Varianten und Releases verschwinden nach dem Neustart des Containers.

**Lösung:** Persistente Volumes einbinden:

```bash
docker run -d --name fenfa -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Berechtigung verweigert bei eingebundenen Volumes

**Symptom:** Fenfa kann nicht in `/data` oder `/app/uploads` schreiben.

**Lösung:** Sicherstellen, dass die Host-Verzeichnisse existieren und korrekte Berechtigungen haben:

```bash
mkdir -p data uploads
chmod 777 data uploads  # Oder passende UID/GID setzen
```

## Datenbankprobleme

### "database is locked"-Fehler

**Symptom:** SQLite gibt "database is locked" bei hoher Parallelität zurück.

**Lösung:** SQLite verarbeitet gleichzeitige Lesevorgänge gut, serialisiert aber Schreibvorgänge. Dieser Fehler tritt typischerweise bei sehr hoher Schreiblast auf. Lösungen:
- Sicherstellen, dass nur eine Fenfa-Instanz in dieselbe Datenbankdatei schreibt.
- Bei mehreren Instanzen S3-Speicher und eine gemeinsame Datenbank verwenden.

### Beschädigte Datenbank

**Symptom:** Fenfa startet nicht mit SQLite-Fehlern.

**Lösung:** Aus Backup wiederherstellen:

```bash
# Fenfa stoppen
docker stop fenfa

# Backup wiederherstellen
cp /backups/fenfa-latest.db /path/to/data/fenfa.db

# Neu starten
docker start fenfa
```

::: tip Prävention
Automatische tägliche Backups einrichten. Backup-Skript finden sich im [Produktions-Deployment](../deployment/production).
:::

## Netzwerkprobleme

### iOS-Manifest gibt falsche URLs zurück

**Symptom:** iOS-Manifest-Plist enthält `http://localhost:8000` anstatt der öffentlichen Domain.

**Lösung:** `FENFA_PRIMARY_DOMAIN` auf die öffentliche HTTPS-URL setzen:

```bash
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

### Downloads langsam oder Timeout

**Symptom:** Große Datei-Downloads sind langsam oder schlagen fehl.

**Mögliche Lösungen:**
- Reverse-Proxy-Timeout erhöhen: `proxy_read_timeout 600s;` (Nginx)
- Anfrage-Pufferung deaktivieren: `proxy_request_buffering off;` (Nginx)
- S3-kompatiblen Speicher mit CDN für große Dateien in Betracht ziehen

## Hilfe erhalten

Wenn das Problem hier nicht behandelt wird:

1. [GitHub Issues](https://github.com/openprx/fenfa/issues) auf bekannte Probleme prüfen.
2. Container-Protokolle anzeigen: `docker logs fenfa`
3. Ein neues Issue mit folgenden Informationen öffnen:
   - Fenfa-Version (`docker inspect fenfa | grep Image`)
   - Relevante Log-Ausgabe
   - Schritte zur Reproduktion des Problems
