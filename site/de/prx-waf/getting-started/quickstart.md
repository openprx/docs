---
title: Schnellstart
description: "PRX-WAF in 5 Minuten zum Schutz Ihrer Webanwendung bringen. Proxy starten, Backend-Host hinzufügen, Schutz verifizieren und Sicherheitsereignisse überwachen."
---

# Schnellstart

Diese Anleitung führt Sie in unter 5 Minuten von null zu einer vollständig geschützten Webanwendung. Am Ende wird PRX-WAF Traffic zu Ihrem Backend proxyen, häufige Angriffe blockieren und Sicherheitsereignisse protokollieren.

::: tip Voraussetzungen
Docker und Docker Compose müssen installiert sein. Weitere Methoden finden Sie im [Installationsleitfaden](./installation).
:::

## Schritt 1: PRX-WAF starten

Repository klonen und alle Dienste starten:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

Verifizieren, dass alle Container laufen:

```bash
docker compose ps
```

Erwartete Ausgabe:

```
NAME         SERVICE     STATUS
prx-waf      prx-waf     running
postgres     postgres    running
```

## Schritt 2: In der Admin-UI anmelden

Browser öffnen und zu `http://localhost:9527` navigieren. Mit den Standard-Anmeldedaten anmelden:

- **Benutzername:** `admin`
- **Passwort:** `admin`

::: warning
Das Standard-Passwort sofort nach der ersten Anmeldung ändern.
:::

## Schritt 3: Backend-Host hinzufügen

Ersten geschützten Host über die Admin-UI oder via API hinzufügen:

**Via Admin-UI:**
1. Im Seitenmenü zu **Hosts** navigieren
2. **Host hinzufügen** klicken
3. Ausfüllen:
   - **Host:** `example.com` (die zu schützende Domain)
   - **Remote-Host:** `192.168.1.100` (IP Ihres Backend-Servers)
   - **Remote-Port:** `8080` (Port Ihres Backend-Servers)
   - **Guard-Status:** Aktiviert
4. **Speichern** klicken

**Via API:**

```bash
# JWT-Token abrufen
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Host hinzufügen
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "192.168.1.100",
    "remote_port": 8080,
    "guard_status": true
  }'
```

## Schritt 4: Schutz testen

Legitime Anfrage durch den Proxy senden:

```bash
curl -H "Host: example.com" http://localhost/
```

Sie sollten die normale Antwort Ihres Backends erhalten. Jetzt testen, ob die WAF einen SQL-Injection-Versuch blockiert:

```bash
curl -H "Host: example.com" "http://localhost/?id=1%20OR%201=1--"
```

Erwartete Antwort: **403 Forbidden**

XSS-Versuch testen:

```bash
curl -H "Host: example.com" "http://localhost/?q=<script>alert(1)</script>"
```

Erwartete Antwort: **403 Forbidden**

Pfad-Traversal-Versuch testen:

```bash
curl -H "Host: example.com" "http://localhost/../../etc/passwd"
```

Erwartete Antwort: **403 Forbidden**

## Schritt 5: Sicherheitsereignisse überwachen

Blockierte Angriffe in der Admin-UI anzeigen:

1. Im Seitenmenü zu **Sicherheitsereignisse** navigieren
2. Sie sollten die blockierten Anfragen aus Schritt 4 sehen
3. Jedes Ereignis zeigt Angriffstyp, Quell-IP, übereinstimmende Regel und Zeitstempel

Oder Ereignisse via API abfragen:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/security-events
```

```json
{
  "events": [
    {
      "id": 1,
      "host": "example.com",
      "source_ip": "172.18.0.1",
      "attack_type": "sqli",
      "rule_id": "CRS-942100",
      "action": "block",
      "timestamp": "2026-03-21T10:05:32Z"
    }
  ]
}
```

## Schritt 6: Echtzeit-Überwachung aktivieren (Optional)

Mit dem WebSocket-Endpunkt für Live-Sicherheitsereignisse verbinden:

```bash
# Mit websocat oder ähnlichem WebSocket-Client
websocat ws://localhost:9527/ws/events
```

Ereignisse werden in Echtzeit gestreamt, wenn Angriffe erkannt und blockiert werden.

## Was Sie jetzt haben

Nach Abschluss dieser Schritte umfasst Ihr Setup:

| Komponente | Status |
|------------|--------|
| Reverse-Proxy | Lauscht auf Port 80/443 |
| WAF-Engine | 16-Phasen-Erkennungspipeline aktiv |
| Eingebaute Regeln | OWASP CRS (310+ Regeln) aktiviert |
| Admin-UI | Läuft auf Port 9527 |
| PostgreSQL | Speichert Konfiguration, Regeln und Ereignisse |
| Echtzeit-Überwachung | WebSocket-Ereignisstrom verfügbar |

## Nächste Schritte

- [Regel-Engine](../rules/) -- Funktionsweise der YAML-Regel-Engine verstehen
- [YAML-Syntax](../rules/yaml-syntax) -- Regelschema für benutzerdefinierte Regeln lernen
- [Reverse-Proxy](../gateway/reverse-proxy) -- Load-Balancing und Upstream-Routing konfigurieren
- [SSL/TLS](../gateway/ssl-tls) -- HTTPS mit automatischen Let's Encrypt-Zertifikaten aktivieren
- [Konfigurationsreferenz](../configuration/reference) -- Jeden Aspekt von PRX-WAF feinabstimmen
