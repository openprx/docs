---
title: Déploiement cluster
description: "Guide étape par étape pour déployer un cluster PRX-WAF multi-nœuds. Génération de certificats, configuration des nœuds, Docker Compose et vérification."
---

# Déploiement cluster

Ce guide explique comment déployer un cluster PRX-WAF à trois nœuds avec un nœud principal et deux nœuds worker.

## Prérequis

- Trois serveurs (ou hôtes Docker) avec connectivité réseau sur le port UDP `16851`
- PostgreSQL 16+ accessible depuis tous les nœuds (partagé ou répliqué)
- Binaire PRX-WAF installé sur chaque nœud (ou images Docker disponibles)

## Étape 1 : Générer les certificats de cluster

Générez les certificats CA et de nœuds en utilisant le conteneur cert-init ou manuellement avec OpenSSL.

**Avec Docker Compose (recommandé) :**

Le dépôt inclut un fichier `docker-compose.cluster.yml` qui gère la génération des certificats :

```bash
# Générer les certificats
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

Cela crée des certificats dans un volume partagé :

```
cluster_certs/
├── cluster-ca.pem      # Certificat CA
├── cluster-ca.key      # Clé privée CA (nœud principal uniquement)
├── node-a.pem          # Certificat du nœud principal
├── node-a.key          # Clé privée du nœud principal
├── node-b.pem          # Certificat du nœud worker B
├── node-b.key          # Clé privée du nœud worker B
├── node-c.pem          # Certificat du nœud worker C
└── node-c.key          # Clé privée du nœud worker C
```

**Avec auto_generate :**

Alternativement, définissez `auto_generate = true` sur le nœud principal. Les nœuds worker recevront leurs certificats pendant le processus d'adhésion :

```toml
[cluster.crypto]
auto_generate = true
```

## Étape 2 : Configurer le nœud principal

Créez `configs/cluster-node-a.toml` :

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
seeds       = []                # Le principal n'a pas de seeds

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
ca_key    = "/certs/cluster-ca.key"   # Le principal détient la clé CA
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

## Étape 3 : Configurer les nœuds worker

Créez `configs/cluster-node-b.toml` (et de même pour node-c) :

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
seeds       = ["node-a:16851"]    # Pointe vers le nœud principal

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

## Étape 4 : Démarrer le cluster

**Avec Docker Compose :**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**Manuellement :**

Démarrez les nœuds dans l'ordre : base de données d'abord, puis principal, puis workers :

```bash
# Sur chaque nœud
prx-waf -c /etc/prx-waf/config.toml run
```

## Étape 5 : Vérifier le cluster

Vérifiez l'état du cluster depuis n'importe quel nœud :

```bash
# Via l'interface d'administration — naviguez vers le tableau de bord Cluster

# Via l'API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

Réponse attendue :

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

## Intégration de l'équilibreur de charge

Placez un équilibreur de charge externe (ex. HAProxy, Nginx ou un LB cloud) devant le cluster pour distribuer le trafic client à tous les nœuds :

```
                    ┌──── node-a (principal) :80/:443
Client → LB ───────┼──── node-b (worker) :80/:443
                    └──── node-c (worker) :80/:443
```

Chaque nœud traite indépendamment le trafic à travers le pipeline WAF. Le nœud principal est également un nœud de traitement du trafic -- il n'est pas limité aux tâches de coordination.

::: tip
Utilisez le point de terminaison `/health` pour les vérifications de santé de l'équilibreur de charge :
```
GET http://node-a/health → 200 OK
```
:::

## Mise à l'échelle du cluster

Pour ajouter un nouveau nœud worker :

1. Générez un certificat pour le nouveau nœud (ou utilisez `auto_generate`)
2. Configurez le nouveau nœud avec `seeds = ["node-a:16851"]`
3. Démarrez le nœud -- il rejoindra automatiquement le cluster et se synchronisera

Pour supprimer un nœud, arrêtez-le simplement. Le vérificateur de santé du cluster détectera le départ et l'exclura de la synchronisation.

## Étapes suivantes

- [Présentation du mode cluster](./index) -- Détails d'architecture et de synchronisation
- [Référence de configuration](../configuration/reference) -- Toutes les clés de configuration du cluster
- [Dépannage](../troubleshooting/) -- Problèmes courants de déploiement en cluster
