---
title: SSL/TLS-Konfiguration
description: "HTTPS in PRX-WAF konfigurieren mit automatischen Let's Encrypt-Zertifikaten, manueller Zertifikatsverwaltung, HTTP/3 QUIC-Unterstützung und TLS-Best-Practices."
---

# SSL/TLS-Konfiguration

PRX-WAF unterstützt automatische TLS-Zertifikatsverwaltung via Let's Encrypt (ACME v2), manuelle Zertifikatskonfiguration und HTTP/3 via QUIC. Diese Seite behandelt alle HTTPS-bezogenen Konfigurationen.

## Automatische Zertifikate (Let's Encrypt)

PRX-WAF verwendet die `instant-acme`-Bibliothek, um TLS-Zertifikate automatisch von Let's Encrypt zu beziehen und zu erneuern. Wenn ein Host mit aktiviertem SSL konfiguriert ist, wird PRX-WAF:

1. ACME HTTP-01-Challenges auf Port 80 beantworten
2. Ein Zertifikat von Let's Encrypt beziehen
3. Das Zertifikat in der Datenbank speichern
4. Vor Ablauf automatisch erneuern

::: tip
Damit automatische Zertifikate funktionieren, muss Port 80 vom Internet aus erreichbar sein, um ACME HTTP-01-Challenge-Validierung durchzuführen.
:::

## Manuelle Zertifikate

Für Umgebungen, in denen automatisches ACME nicht geeignet ist, Zertifikate manuell konfigurieren:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

Zertifikate können auch über die Admin-UI hochgeladen werden:

1. Im Seitenmenü zu **SSL-Zertifikate** navigieren
2. **Zertifikat hochladen** klicken
3. Zertifikatskette (PEM) und privaten Schlüssel (PEM) angeben
4. Zertifikat einem Host zuordnen

Oder via API:

```bash
curl -X POST http://localhost:9527/api/certificates \
  -H "Authorization: Bearer $TOKEN" \
  -F "cert=@/path/to/cert.pem" \
  -F "key=@/path/to/key.pem" \
  -F "host=example.com"
```

## TLS-Listener

PRX-WAF lauscht auf HTTPS-Traffic auf der konfigurierten TLS-Adresse:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"      # HTTP
listen_addr_tls = "0.0.0.0:443"     # HTTPS
```

## HTTP/3 (QUIC)

PRX-WAF unterstützt HTTP/3 via der Quinn QUIC-Bibliothek. In der Konfiguration aktivieren:

```toml
[http3]
enabled     = true
listen_addr = "0.0.0.0:443"
cert_pem    = "/etc/prx-waf/tls/cert.pem"
key_pem     = "/etc/prx-waf/tls/key.pem"
```

::: warning
HTTP/3 erfordert ein gültiges TLS-Zertifikat. Die Zertifikats- und Schlüsselpfade müssen angegeben werden, wenn HTTP/3 aktiviert ist. Automatische Let's Encrypt-Zertifikate werden auch für HTTP/3 unterstützt.
:::

HTTP/3 läuft über UDP auf demselben Port wie HTTPS (443). Clients, die QUIC unterstützen, werden automatisch aktualisiert, während andere auf HTTP/2 oder HTTP/1.1 über TCP zurückfallen.

## HTTPS-Weiterleitung

Um den gesamten HTTP-Traffic auf HTTPS umzuleiten, Hosts mit Port 80 (HTTP) und Port 443 (HTTPS) konfigurieren. PRX-WAF leitet HTTP-Anfragen automatisch zu ihren HTTPS-Äquivalenten um, wenn SSL für einen Host konfiguriert ist.

## Zertifikatsspeicherung

Alle Zertifikate (automatisch und manuell) werden in der PostgreSQL-Datenbank gespeichert. Die Tabelle `certificates` (Migration `0003`) enthält:

- Zertifikatskette (PEM)
- Privater Schlüssel (verschlüsselt mit AES-256-GCM)
- Domainname
- Ablaufdatum
- ACME-Kontoinformationen (für automatische Erneuerung)

::: info
Private Schlüssel werden im Ruhezustand mit AES-256-GCM verschlüsselt. Der Verschlüsselungsschlüssel wird aus der Konfiguration abgeleitet. Unverschlüsselte private Schlüssel niemals in der Datenbank speichern.
:::

## Docker mit HTTPS

Beim Betrieb in Docker Port 443 für TLS-Traffic mappen:

```yaml
# docker-compose.yml
services:
  prx-waf:
    ports:
      - "80:80"
      - "443:443"
      - "9527:9527"
```

Für HTTP/3 auch den UDP-Port mappen:

```yaml
    ports:
      - "80:80"
      - "443:443/tcp"
      - "443:443/udp"  # HTTP/3 QUIC
      - "9527:9527"
```

## Best Practices

1. **In der Produktion immer HTTPS verwenden.** HTTP sollte nur ACME-Challenges bereitstellen und auf HTTPS umleiten.

2. **HTTP/3 aktivieren** für Clients, die es unterstützen. QUIC bietet schnelleren Verbindungsaufbau und bessere Performance in verlustbehafteten Netzwerken.

3. **Automatische Zertifikate verwenden**, wenn möglich. Let's Encrypt-Zertifikate sind kostenlos, von allen Browsern vertrauenswürdig und werden von PRX-WAF automatisch erneuert.

4. **Admin-API-Zugriff einschränken.** Die Admin-API sollte nur von vertrauenswürdigen Netzwerken zugänglich sein:

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12"]
```

## Nächste Schritte

- [Reverse-Proxy](./reverse-proxy) -- Backend-Routing und Host-Konfiguration
- [Gateway-Übersicht](./index) -- Antwort-Caching und Tunnel
- [Cluster-Modus](../cluster/) -- Multi-Knoten-TLS mit mTLS-Zertifikaten
