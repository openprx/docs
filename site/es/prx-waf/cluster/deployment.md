---
title: Implementación del Clúster
description: "Guía paso a paso para implementar un clúster PRX-WAF multi-nodo. Generación de certificados, configuración de nodos, Docker Compose y verificación."
---

# Implementación del Clúster

Esta guía explica cómo implementar un clúster de tres nodos PRX-WAF con un nodo principal y dos nodos trabajadores.

## Requisitos Previos

- Tres servidores (o hosts Docker) con conectividad de red en el puerto UDP `16851`
- PostgreSQL 16+ accesible desde todos los nodos (compartido o replicado)
- Binario de PRX-WAF instalado en cada nodo (o imágenes Docker disponibles)

## Paso 1: Generar Certificados del Clúster

Genera los certificados CA y de nodo usando el contenedor cert-init o manualmente con OpenSSL.

**Usando Docker Compose (recomendado):**

El repositorio incluye un archivo `docker-compose.cluster.yml` que maneja la generación de certificados:

```bash
# Generate certificates
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

Esto crea certificados en un volumen compartido:

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

**Usando auto_generate:**

Alternativamente, establece `auto_generate = true` en el nodo principal. Los nodos trabajadores recibirán certificados durante el proceso de unión:

```toml
[cluster.crypto]
auto_generate = true
```

## Paso 2: Configurar el Nodo Principal

Crea `configs/cluster-node-a.toml`:

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

## Paso 3: Configurar los Nodos Trabajadores

Crea `configs/cluster-node-b.toml` (y de forma similar para node-c):

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

## Paso 4: Iniciar el Clúster

**Con Docker Compose:**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**Manualmente:**

Inicia los nodos en orden: base de datos primero, luego el principal, luego los trabajadores:

```bash
# On each node
prx-waf -c /etc/prx-waf/config.toml run
```

## Paso 5: Verificar el Clúster

Verifica el estado del clúster desde cualquier nodo:

```bash
# Via the admin UI — navigate to the Cluster dashboard

# Via the API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

Respuesta esperada:

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

## Integración con Balanceador de Carga

Coloca un balanceador de carga externo (p. ej., HAProxy, Nginx o un LB en la nube) frente al clúster para distribuir el tráfico de los clientes entre todos los nodos:

```
                    ┌──── node-a (main)   :80/:443
Client → LB ───────┼──── node-b (worker) :80/:443
                    └──── node-c (worker) :80/:443
```

Cada nodo procesa el tráfico de forma independiente a través del pipeline WAF. El nodo principal también es un nodo de procesamiento de tráfico -- no está limitado a tareas de coordinación.

::: tip
Usa el endpoint `/health` para las verificaciones de salud del balanceador de carga:
```
GET http://node-a/health → 200 OK
```
:::

## Escalar el Clúster

Para agregar un nuevo nodo trabajador:

1. Genera un certificado para el nuevo nodo (o usa `auto_generate`)
2. Configura el nuevo nodo con `seeds = ["node-a:16851"]`
3. Inicia el nodo -- se unirá automáticamente al clúster y se sincronizará

Para eliminar un nodo, simplemente detenlo. El verificador de salud del clúster detectará la salida y lo excluirá de la sincronización.

## Próximos Pasos

- [Descripción General del Modo Clúster](./index) -- Detalles de arquitectura y sincronización
- [Referencia de Configuración](../configuration/reference) -- Todas las claves de configuración del clúster
- [Resolución de Problemas](../troubleshooting/) -- Problemas comunes de implementación del clúster
