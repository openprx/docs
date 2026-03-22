---
title: Cluster-Bereitstellung
description: "Schritt-für-Schritt-Anleitung zur Bereitstellung eines Multi-Knoten-PRX-WAF-Clusters. Zertifikatgenerierung, Knotenkonfiguration, Docker Compose und Verifizierung."
---

# Cluster-Bereitstellung

Diese Anleitung führt durch die Bereitstellung eines Drei-Knoten-PRX-WAF-Clusters mit einem Main-Knoten und zwei Worker-Knoten.

## Voraussetzungen

- Drei Server (oder Docker-Hosts) mit Netzwerkkonnektivität auf UDP-Port `16851`
- PostgreSQL 16+ zugänglich von allen Knoten (geteilt oder repliziert)
- PRX-WAF-Binärdatei auf jedem Knoten installiert (oder Docker-Images verfügbar)

## Schritt 1: Cluster-Zertifikate generieren

CA- und Knotenzertifikate mit dem cert-init-Container oder manuell mit OpenSSL generieren.

**Mit Docker Compose (empfohlen):**

Das Repository enthält eine `docker-compose.cluster.yml`-Datei, die die Zertifikatsgenerierung übernimmt:

```bash
# Zertifikate generieren
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

Dies erstellt Zertifikate in einem gemeinsamen Volume:

```
cluster_certs/
├── cluster-ca.pem      # CA-Zertifikat
├── cluster-ca.key      # CA-Privater-Schlüssel (nur Main-Knoten)
├── node-a.pem          # Main-Knoten-Zertifikat
├── node-a.key          # Main-Knoten-Privater-Schlüssel
├── node-b.pem          # Worker-Knoten-B-Zertifikat
├── node-b.key          # Worker-Knoten-B-Privater-Schlüssel
├── node-c.pem          # Worker-Knoten-C-Zertifikat
└── node-c.key          # Worker-Knoten-C-Privater-Schlüssel
```

**Mit auto_generate:**

Alternativ `auto_generate = true` auf dem Main-Knoten setzen. Worker-Knoten erhalten Zertifikate während des Beitrittsprozesses:

```toml
[cluster.crypto]
auto_generate = true
```

## Schritt 2: Main-Knoten konfigurieren

`configs/cluster-node-a.toml` erstellen:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-a"
role        = "main"
listen_addr = "0.0.0.0:16851"
seeds       = []                # Main hat keine Seeds

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
ca_key    = "/certs/cluster-ca.key"   # Main hält den CA-Schlüssel
node_cert = "/certs/node-a.pem"
node_key  = "/certs/node-a.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5
stats_interval_secs        = 10
events_queue_size          = 10000

[cluster.election]
timeout_min_ms        = 150
timeout_max_ms        = 300
heartbeat_interval_ms = 50

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## Schritt 3: Worker-Knoten konfigurieren

`configs/cluster-node-b.toml` erstellen (und ähnlich für node-c):

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-b"
role        = "worker"
listen_addr = "0.0.0.0:16851"
seeds       = ["node-a:16851"]    # Zeigt auf den Main-Knoten

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
node_cert = "/certs/node-b.pem"
node_key  = "/certs/node-b.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## Schritt 4: Cluster starten

**Mit Docker Compose:**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**Manuell:**

Knoten in der Reihenfolge starten: zuerst Datenbank, dann Main, dann Worker:

```bash
# Auf jedem Knoten
prx-waf -c /etc/prx-waf/config.toml run
```

## Schritt 5: Cluster verifizieren

Cluster-Status von jedem Knoten aus prüfen:

```bash
# Via Admin-UI — zum Cluster-Dashboard navigieren

# Via API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

Erwartete Antwort:

```json
{
  "cluster_enabled": true,
  "node_id": "node-a",
  "role": "main",
  "peers": [
    {"node_id": "node-b", "role": "worker", "status": "healthy"},
    {"node_id": "node-c", "role": "worker", "status": "healthy"}
  ],
  "sync": {
    "last_rule_sync": "2026-03-21T10:00:00Z",
    "last_config_sync": "2026-03-21T10:00:00Z"
  }
}
```

## Load-Balancer-Integration

Einen externen Load-Balancer (z.B. HAProxy, Nginx oder einen Cloud-LB) vor den Cluster schalten, um Client-Traffic auf alle Knoten zu verteilen:

```
                    ┌──── node-a (main)   :80/:443
Client → LB ───────┼──── node-b (worker) :80/:443
                    └──── node-c (worker) :80/:443
```

Jeder Knoten verarbeitet Traffic unabhängig durch die WAF-Pipeline. Der Main-Knoten ist auch ein traffic-verarbeitender Knoten -- er ist nicht auf Koordinationsaufgaben beschränkt.

::: tip
Den `/health`-Endpunkt für Load-Balancer-Health-Checks verwenden:
```
GET http://node-a/health → 200 OK
```
:::

## Cluster skalieren

Einen neuen Worker-Knoten hinzufügen:

1. Zertifikat für den neuen Knoten generieren (oder `auto_generate` verwenden)
2. Neuen Knoten mit `seeds = ["node-a:16851"]` konfigurieren
3. Knoten starten -- er tritt automatisch dem Cluster bei und synchronisiert sich

Einen Knoten entfernen: Einfach stoppen. Der Cluster-Health-Checker erkennt den Abgang und schließt ihn aus der Synchronisierung aus.

## Nächste Schritte

- [Cluster-Modus Übersicht](./index) -- Architektur und Synchronisierungsdetails
- [Konfigurationsreferenz](../configuration/reference) -- Alle Cluster-Konfigurationsschlüssel
- [Fehlerbehebung](../troubleshooting/) -- Häufige Cluster-Bereitstellungsprobleme
