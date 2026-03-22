---
title: Fehlerbehebung
description: "Lösungen für häufige OpenPR-Probleme einschließlich Datenbankverbindungen, Authentifizierungsfehler, Docker-Probleme und MCP-Server-Konfiguration."
---

# Fehlerbehebung

Diese Seite behandelt häufige Probleme und ihre Lösungen beim Betrieb von OpenPR.

## Datenbankverbindung

### API startet nicht mit "connection refused"

Der API-Server startet, bevor PostgreSQL bereit ist.

**Lösung**: Die Docker-Compose-Datei enthält Integritätsprüfungen und `depends_on` mit `condition: service_healthy`. Falls das Problem weiterhin besteht, die `start_period` für PostgreSQL erhöhen:

```yaml
postgres:
  healthcheck:
    start_period: 30s  # Increase from default 10s
```

### "role openpr does not exist"

Der PostgreSQL-Benutzer wurde nicht erstellt.

**Lösung**: Überprüfen, ob `POSTGRES_USER` und `POSTGRES_PASSWORD` in der Docker-Compose-Umgebung gesetzt sind. Bei manuellem Betrieb von PostgreSQL:

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### Migrationen nicht angewendet

Migrationen werden nur beim ersten Start des PostgreSQL-Containers automatisch ausgeführt (über `docker-entrypoint-initdb.d`).

**Lösung**: Wenn die Datenbank bereits existiert, Migrationen manuell anwenden:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# Dann jede Migrations-SQL-Datei der Reihe nach ausführen
```

Oder das Volume neu erstellen:

```bash
docker-compose down -v
docker-compose up -d
```

::: warning Datenverlust
`docker-compose down -v` löscht das Datenbank-Volume. Daten zuerst sichern.
:::

## Authentifizierung

### "Invalid token" nach Serverneustart

JWT-Tokens werden mit `JWT_SECRET` signiert. Wenn sich dieser Wert zwischen Neustarts ändert, werden alle vorhandenen Tokens ungültig.

**Lösung**: Ein festes `JWT_SECRET` in `.env` setzen:

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### Erster Benutzer ist kein Admin

Die Admin-Rolle wird dem ersten Benutzer zugewiesen, der sich registriert. Wenn `role: "user"` anstelle von `role: "admin"` angezeigt wird, wurde zuerst ein anderes Konto registriert.

**Lösung**: Die Datenbank verwenden, um die Rolle zu aktualisieren:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### Podman-Build schlägt mit DNS-Fehler fehl

Das Standard-Netzwerk von Podman hat keinen DNS-Zugriff während des Builds.

**Lösung**: Immer `--network=host` beim Erstellen von Images mit Podman verwenden:

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### Frontend zeigt "502 Bad Gateway"

Der Nginx-Container kann den API-Server nicht erreichen.

**Lösung**: Überprüfen, ob:
1. Der API-Container läuft: `docker-compose ps`
2. Die API-Integritätsprüfung bestanden wird: `docker exec openpr-api curl -f http://localhost:8080/health`
3. Beide Container im selben Netzwerk sind: `docker network inspect openpr_openpr-network`

### Port-Konflikte

Ein anderer Dienst verwendet denselben Port.

**Lösung**: Die externe Port-Zuordnung in `docker-compose.yml` ändern:

```yaml
api:
  ports:
    - "8082:8080"  # Changed from 8081
```

## MCP-Server

### "tools/list returns empty"

Der MCP-Server kann keine Verbindung zur API herstellen.

**Lösung**: Umgebungsvariablen überprüfen:

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

Überprüfen, ob:
- `OPENPR_API_URL` auf den richtigen API-Endpunkt zeigt
- `OPENPR_BOT_TOKEN` ein gültiges Bot-Token ist (beginnt mit `opr_`)
- `OPENPR_WORKSPACE_ID` eine gültige Arbeitsbereichs-UUID ist

### stdio-Transport funktioniert nicht

Das MCP-Binary muss als Befehl im KI-Client konfiguriert sein.

**Lösung**: Sicherstellen, dass der Binary-Pfad korrekt ist und die Umgebungsvariablen gesetzt sind:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/absolute/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_...",
        "OPENPR_WORKSPACE_ID": "..."
      }
    }
  }
}
```

### SSE-Verbindung bricht ab

SSE-Verbindungen können von Proxy-Servern mit kurzen Timeouts geschlossen werden.

**Lösung**: Falls ein Reverse-Proxy verwendet wird, den Timeout für den SSE-Endpunkt erhöhen:

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## Frontend

### Leere Seite nach der Bereitstellung

Das Frontend-Build verwendet möglicherweise die falsche API-URL.

**Lösung**: `VITE_API_URL` vor dem Erstellen setzen:

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### Anmeldung funktioniert, aber Seiten sind leer

API-Anfragen schlagen lautlos fehl. Die Browser-Konsole (F12) auf 401- oder CORS-Fehler prüfen.

**Lösung**: Sicherstellen, dass die API vom Browser aus erreichbar ist und CORS konfiguriert ist. Das Frontend sollte API-Anfragen über Nginx weiterleiten.

## Leistung

### Langsame Suchen

Die PostgreSQL-Volltextsuche kann bei großen Datensätzen ohne geeignete Indizes langsam sein.

**Lösung**: Sicherstellen, dass FTS-Indizes existieren (sie werden durch die Migrationen erstellt):

```sql
-- Check for existing indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### Hohe Speichernutzung

Der API-Server verarbeitet Datei-Uploads im Arbeitsspeicher.

**Lösung**: Upload-Größen begrenzen und das Verzeichnis `uploads/` überwachen. Periodische Bereinigung für alte Uploads in Betracht ziehen.

## Hilfe erhalten

Wenn das Problem hier nicht behandelt wird:

1. Die [GitHub Issues](https://github.com/openprx/openpr/issues) auf bekannte Probleme prüfen.
2. Die API- und MCP-Server-Protokolle auf Fehlermeldungen überprüfen.
3. Ein neues Issue mit Fehlerprotokollen, Umgebungsdetails und Reproduktionsschritten öffnen.
