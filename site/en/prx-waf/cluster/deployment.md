---
title: Cluster Deployment
description: Step-by-step guide to deploying a multi-node PRX-WAF cluster. Certificate generation, node configuration, Docker Compose, and verification.
---

# Cluster Deployment

This guide walks through deploying a three-node PRX-WAF cluster with one main node and two worker nodes.

## Prerequisites

- Three servers (or Docker hosts) with network connectivity on UDP port `16851`
- PostgreSQL 16+ accessible from all nodes (shared or replicated)
- PRX-WAF binary installed on each node (or Docker images available)

## Step 1: Generate Cluster Certificates

Generate the CA and node certificates using the cert-init container or manually with OpenSSL.

**Using Docker Compose (recommended):**

The repository includes a `docker-compose.cluster.yml` file that handles certificate generation:

```bash
# Generate certificates
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

This creates certificates in a shared volume:

```
cluster_certs/
├── cluster-ca.pem      # CA certificate
├── cluster-ca.key      # CA private key (main node only)
├── node-a.pem          # Main node certificate
├── node-a.key          # Main node private key
├── node-b.pem          # Worker node B certificate
├── node-b.key          # Worker node B private key
├── node-c.pem          # Worker node C certificate
└── node-c.key          # Worker node C private key
```

**Using auto_generate:**

Alternatively, set `auto_generate = true` on the main node. Worker nodes will receive certificates during the join process:

```toml
[cluster.crypto]
auto_generate = true
```

## Step 2: Configure the Main Node

Create `configs/cluster-node-a.toml`:

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
seeds       = []                # Main has no seeds

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
ca_key    = "/certs/cluster-ca.key"   # Main holds the CA key
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

## Step 3: Configure Worker Nodes

Create `configs/cluster-node-b.toml` (and similarly for node-c):

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
seeds       = ["node-a:16851"]    # Points to the main node

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

## Step 4: Start the Cluster

**With Docker Compose:**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**Manually:**

Start nodes in order: database first, then main, then workers:

```bash
# On each node
prx-waf -c /etc/prx-waf/config.toml run
```

## Step 5: Verify the Cluster

Check cluster status from any node:

```bash
# Via the admin UI — navigate to the Cluster dashboard

# Via the API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

Expected response:

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

## Load Balancer Integration

Place an external load balancer (e.g., HAProxy, Nginx, or a cloud LB) in front of the cluster to distribute client traffic across all nodes:

```
                    ┌──── node-a (main)   :80/:443
Client → LB ───────┼──── node-b (worker) :80/:443
                    └──── node-c (worker) :80/:443
```

Each node independently processes traffic through the WAF pipeline. The main node is also a traffic-processing node -- it is not limited to coordination duties.

::: tip
Use the `/health` endpoint for load balancer health checks:
```
GET http://node-a/health → 200 OK
```
:::

## Scaling the Cluster

To add a new worker node:

1. Generate a certificate for the new node (or use `auto_generate`)
2. Configure the new node with `seeds = ["node-a:16851"]`
3. Start the node -- it will automatically join the cluster and synchronize

To remove a node, simply stop it. The cluster health checker will detect the departure and exclude it from synchronization.

## Next Steps

- [Cluster Mode Overview](./index) -- Architecture and synchronization details
- [Configuration Reference](../configuration/reference) -- All cluster configuration keys
- [Troubleshooting](../troubleshooting/) -- Common cluster deployment issues
