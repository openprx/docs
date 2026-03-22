---
title: Reverse-Proxy-Konfiguration
description: "PRX-WAF als Reverse-Proxy konfigurieren. Host-Routing, Upstream-Backends, Load-Balancing, Anfrage-/Antwort-Header und Health-Checks."
---

# Reverse-Proxy-Konfiguration

PRX-WAF fungiert als Reverse-Proxy und leitet Client-Anfragen nach dem Durchlaufen der WAF-Erkennungspipeline an Upstream-Backend-Server weiter. Diese Seite behandelt Host-Routing, Load-Balancing und Proxy-Konfiguration.

## Host-Konfiguration

Jede geschützte Domain erfordert einen Host-Eintrag, der eingehende Anfragen einem Upstream-Backend zuordnet. Hosts können auf drei Arten konfiguriert werden:

### Via TOML-Konfigurationsdatei

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### Via Admin-UI

1. Im Seitenmenü zu **Hosts** navigieren
2. **Host hinzufügen** klicken
3. Host-Details ausfüllen
4. **Speichern** klicken

### Via REST-API

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## Host-Felder

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|-------------|
| `host` | `string` | Ja | Der zu matchende Domainname (z.B. `example.com`) |
| `port` | `integer` | Ja | Port für den Listener (üblicherweise `80` oder `443`) |
| `remote_host` | `string` | Ja | Upstream-Backend-IP oder Hostname |
| `remote_port` | `integer` | Ja | Upstream-Backend-Port |
| `ssl` | `boolean` | Nein | Ob Upstream HTTPS verwendet (Standard: `false`) |
| `guard_status` | `boolean` | Nein | WAF-Schutz für diesen Host aktivieren (Standard: `true`) |

## Load-Balancing

PRX-WAF verwendet gewichtetes Round-Robin-Load-Balancing auf Upstream-Backends. Wenn mehrere Backends für einen Host konfiguriert sind, wird Traffic proportional zu ihren Gewichtungen verteilt.

::: info
Mehrere Upstream-Backends pro Host können über die Admin-UI oder API konfiguriert werden. Die TOML-Konfigurationsdatei unterstützt einzelne Backend-Host-Einträge.
:::

## Anfrage-Header

PRX-WAF fügt weitergeleiteten Anfragen automatisch Standard-Proxy-Header hinzu:

| Header | Wert |
|--------|------|
| `X-Real-IP` | Ursprüngliche IP-Adresse des Clients |
| `X-Forwarded-For` | Client-IP (an vorhandene Kette angehängt) |
| `X-Forwarded-Proto` | `http` oder `https` |
| `X-Forwarded-Host` | Ursprünglicher Host-Header-Wert |

## Anfrage-Body-Größenlimit

Die maximale Anfrage-Body-Größe wird durch die Sicherheitskonfiguration gesteuert:

```toml
[security]
max_request_body_bytes = 10485760  # 10 MB
```

Anfragen, die dieses Limit überschreiten, werden mit einer 413 Payload Too Large-Antwort abgelehnt, bevor sie die WAF-Pipeline erreichen.

## Hosts verwalten

### Alle Hosts auflisten

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### Einen Host aktualisieren

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### Einen Host löschen

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## IP-basierte Regeln

PRX-WAF unterstützt IP-basierte Allow- und Block-Regeln, die in den Phasen 1-4 der Erkennungspipeline ausgewertet werden:

```bash
# Eine IP-Allowlist-Regel hinzufügen
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# Eine IP-Blocklist-Regel hinzufügen
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## Nächste Schritte

- [SSL/TLS](./ssl-tls) -- HTTPS mit Let's Encrypt aktivieren
- [Gateway-Übersicht](./index) -- Antwort-Caching und Reverse-Tunnel
- [Konfigurationsreferenz](../configuration/reference) -- Alle Proxy-Konfigurationsschlüssel
