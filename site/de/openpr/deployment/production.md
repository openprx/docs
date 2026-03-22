---
title: Produktionsbereitstellung
description: "OpenPR in der Produktion mit Caddy-Reverse-Proxy, automatischem HTTPS, PostgreSQL-Härtung und Sicherheits-Best-Practices bereitstellen."
---

# Produktionsbereitstellung

Dieser Leitfaden behandelt die Bereitstellung von OpenPR in einer Produktionsumgebung mit HTTPS, einem Reverse-Proxy, Datenbankhärtung und Sicherheits-Best-Practices.

## Architektur

```mermaid
graph LR
    INTERNET["Internet<br/>:443"] --> CADDY["Caddy<br/>Auto HTTPS"]
    CADDY --> FE["Frontend<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## Voraussetzungen

- Ein Server mit mindestens 2 CPU-Kernen und 2 GB RAM
- Ein Domainname, der auf die IP-Adresse Ihres Servers zeigt
- Docker und Docker Compose (oder Podman)

## Schritt 1: Umgebung konfigurieren

Eine Produktions-`.env`-Datei erstellen:

```bash
# Database (use strong passwords)
DATABASE_URL=postgres://openpr:STRONG_PASSWORD_HERE@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# JWT (generate a random secret)
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# Logging
RUST_LOG=info
```

::: danger Geheimnisse
Niemals `.env`-Dateien in die Versionskontrolle einbeziehen. `chmod 600 .env` verwenden, um die Dateiberechtigungen einzuschränken.
:::

## Schritt 2: Caddy einrichten

Caddy auf dem Host-System installieren:

```bash
sudo apt install -y caddy
```

Die Caddyfile konfigurieren:

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

Caddy erhält und erneuert automatisch Let's Encrypt-TLS-Zertifikate.

Caddy starten:

```bash
sudo systemctl enable --now caddy
```

::: tip Alternative: Nginx
Falls Nginx bevorzugt wird, diesen mit einem Proxy-Pass zu Port 3000 konfigurieren und certbot für TLS-Zertifikate verwenden.
:::

## Schritt 3: Mit Docker Compose bereitstellen

```bash
cd /opt/openpr
docker-compose up -d
```

Überprüfen, ob alle Dienste gesund sind:

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## Schritt 4: Admin-Konto erstellen

`https://your-domain.example.com` im Browser öffnen und das Admin-Konto registrieren.

::: warning Erster Benutzer
Der erste registrierte Benutzer wird Admin. Das Admin-Konto registrieren, bevor die URL geteilt wird.
:::

## Sicherheits-Checkliste

### Authentifizierung

- [ ] `JWT_SECRET` auf einen zufälligen Wert mit 32+ Zeichen ändern
- [ ] Angemessene Token-TTL-Werte setzen (kürzer für Zugriff, länger für Aktualisierung)
- [ ] Das Admin-Konto sofort nach der Bereitstellung erstellen

### Datenbank

- [ ] Ein starkes Passwort für PostgreSQL verwenden
- [ ] PostgreSQL-Port (5432) nicht ins Internet exponieren
- [ ] PostgreSQL-SSL für Verbindungen aktivieren (wenn die Datenbank remote ist)
- [ ] Regelmäßige Datenbank-Backups einrichten

### Netzwerk

- [ ] Caddy oder Nginx mit HTTPS (TLS 1.3) verwenden
- [ ] Nur Port 443 (HTTPS) und optional 8090 (MCP) ins Internet exponieren
- [ ] Eine Firewall (ufw, iptables) verwenden, um den Zugriff einzuschränken
- [ ] MCP-Server-Zugriff auf bekannte IP-Bereiche beschränken

### Anwendung

- [ ] `RUST_LOG=info` setzen (kein debug oder trace in der Produktion)
- [ ] Festplattennutzung für das Uploads-Verzeichnis überwachen
- [ ] Protokollrotation für Container-Protokolle einrichten

## Datenbank-Backups

Automatisierte PostgreSQL-Backups einrichten:

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

Zu cron hinzufügen:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/openpr/backup.sh
```

## Überwachung

### Integritätsprüfungen

Dienst-Integritäts-Endpunkte überwachen:

```bash
# API
curl -f http://localhost:8080/health

# MCP-Server
curl -f http://localhost:8090/health
```

### Protokollüberwachung

```bash
# Alle Protokolle verfolgen
docker-compose logs -f

# Bestimmten Dienst verfolgen
docker-compose logs -f api --tail=100
```

## Skalierungsüberlegungen

- **API-Server**: Kann mehrere Replikas hinter einem Load Balancer betreiben. Alle Instanzen verbinden sich mit derselben PostgreSQL-Datenbank.
- **Worker**: Eine einzelne Instanz betreiben, um doppelte Job-Verarbeitung zu vermeiden.
- **MCP-Server**: Kann mehrere Replikas betreiben. Jede Instanz ist zustandslos.
- **PostgreSQL**: Für hohe Verfügbarkeit PostgreSQL-Replikation oder einen verwalteten Datenbankdienst in Betracht ziehen.

## Aktualisieren

Um OpenPR zu aktualisieren:

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

Datenbankmigrationen werden beim Start des API-Servers automatisch angewendet.

## Nächste Schritte

- [Docker-Bereitstellung](./docker) -- Docker-Compose-Referenz
- [Konfiguration](../configuration/) -- Umgebungsvariablen-Referenz
- [Fehlerbehebung](../troubleshooting/) -- Häufige Produktionsprobleme
