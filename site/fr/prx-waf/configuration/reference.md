---
title: Référence de configuration
description: "Référence complète de chaque clé de configuration TOML de PRX-WAF, incluant les types, les valeurs par défaut et les descriptions détaillées."
---

# Référence de configuration

Cette page documente chaque clé de configuration dans le fichier de configuration TOML de PRX-WAF. Le fichier de configuration par défaut est `configs/default.toml`.

## Paramètres du proxy (`[proxy]`)

Paramètres qui contrôlent l'écouteur du proxy inverse.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `listen_addr` | `string` | `"0.0.0.0:80"` | Adresse d'écoute HTTP |
| `listen_addr_tls` | `string` | `"0.0.0.0:443"` | Adresse d'écoute HTTPS |
| `worker_threads` | `integer \| null` | `null` (nombre de CPU) | Nombre de threads worker du proxy. Quand null, utilise le nombre de cœurs CPU logiques. |

## Paramètres de l'API (`[api]`)

Paramètres pour l'API de gestion et l'interface d'administration.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `listen_addr` | `string` | `"127.0.0.1:9527"` | Adresse d'écoute de l'API d'administration + interface. Liez à `127.0.0.1` en production pour restreindre l'accès à localhost. |

## Paramètres de stockage (`[storage]`)

Connexion à la base de données PostgreSQL.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `database_url` | `string` | `"postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"` | URL de connexion PostgreSQL |
| `max_connections` | `integer` | `20` | Nombre maximum de connexions dans le pool de base de données |

## Paramètres du cache (`[cache]`)

Configuration du cache de réponses utilisant un cache LRU moka en mémoire.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `enabled` | `boolean` | `true` | Activer le cache de réponses |
| `max_size_mb` | `integer` | `256` | Taille maximale du cache en mégaoctets |
| `default_ttl_secs` | `integer` | `60` | Durée de vie par défaut pour les réponses mises en cache (secondes) |
| `max_ttl_secs` | `integer` | `3600` | Plafond TTL maximum (secondes). Les réponses ne peuvent pas être mises en cache plus longtemps que cela, quels que soient les en-têtes en amont. |

## Paramètres HTTP/3 (`[http3]`)

HTTP/3 via QUIC (bibliothèque Quinn).

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `enabled` | `boolean` | `false` | Activer le support HTTP/3 |
| `listen_addr` | `string` | `"0.0.0.0:443"` | Adresse d'écoute QUIC (UDP) |
| `cert_pem` | `string` | -- | Chemin vers le certificat TLS (format PEM) |
| `key_pem` | `string` | -- | Chemin vers la clé privée TLS (format PEM) |

::: warning
HTTP/3 nécessite des certificats TLS valides. `cert_pem` et `key_pem` doivent être définis quand `enabled = true`.
:::

## Paramètres de sécurité (`[security]`)

Configuration de sécurité de l'API d'administration et du proxy.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `admin_ip_allowlist` | `string[]` | `[]` | Liste des IPs/CIDRs autorisés à accéder à l'API d'administration. Vide signifie autoriser tout. |
| `max_request_body_bytes` | `integer` | `10485760` (10 Mo) | Taille maximale du corps de requête en octets. Les requêtes dépassant cette limite sont rejetées avec 413. |
| `api_rate_limit_rps` | `integer` | `0` | Limite de débit par IP pour l'API d'administration (requêtes par seconde). `0` signifie désactivé. |
| `cors_origins` | `string[]` | `[]` | Origines CORS autorisées pour l'API d'administration. Vide signifie autoriser toutes les origines. |

## Paramètres des règles (`[rules]`)

Configuration du moteur de règles.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `dir` | `string` | `"rules/"` | Répertoire contenant les fichiers de règles |
| `hot_reload` | `boolean` | `true` | Activer la surveillance du système de fichiers pour le rechargement automatique des règles |
| `reload_debounce_ms` | `integer` | `500` | Fenêtre d'anti-rebond pour les événements de modification de fichier (millisecondes) |
| `enable_builtin_owasp` | `boolean` | `true` | Activer les règles OWASP CRS intégrées |
| `enable_builtin_bot` | `boolean` | `true` | Activer les règles de détection de bots intégrées |
| `enable_builtin_scanner` | `boolean` | `true` | Activer les règles de détection de scanners intégrées |

### Sources de règles (`[[rules.sources]]`)

Configurez plusieurs sources de règles (répertoires locaux ou URLs distantes) :

| Clé | Type | Requis | Description |
|-----|------|--------|-------------|
| `name` | `string` | Oui | Nom de la source (ex. `"custom"`, `"owasp-crs"`) |
| `path` | `string` | Non | Chemin du répertoire local |
| `url` | `string` | Non | URL distante pour la récupération des règles |
| `format` | `string` | Oui | Format des règles : `"yaml"`, `"json"` ou `"modsec"` |
| `update_interval` | `integer` | Non | Intervalle de mise à jour automatique en secondes (sources distantes uniquement) |

```toml
[[rules.sources]]
name   = "custom"
path   = "rules/custom/"
format = "yaml"

[[rules.sources]]
name            = "owasp-crs"
url             = "https://example.com/rules/owasp.yaml"
format          = "yaml"
update_interval = 86400
```

## Paramètres CrowdSec (`[crowdsec]`)

Intégration de l'intelligence sur les menaces CrowdSec.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `enabled` | `boolean` | `false` | Activer l'intégration CrowdSec |
| `mode` | `string` | `"bouncer"` | Mode d'intégration : `"bouncer"`, `"appsec"` ou `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | URL du LAPI CrowdSec |
| `api_key` | `string` | `""` | Clé API du bouncer |
| `update_frequency_secs` | `integer` | `10` | Intervalle de rafraîchissement du cache de décisions (secondes) |
| `fallback_action` | `string` | `"allow"` | Action quand le LAPI est inaccessible : `"allow"`, `"block"` ou `"log"` |
| `appsec_endpoint` | `string` | -- | URL du point de terminaison d'inspection AppSec HTTP (optionnel) |
| `appsec_key` | `string` | -- | Clé API AppSec (optionnel) |

## Configuration des hôtes (`[[hosts]]`)

Entrées d'hôte statiques (peuvent aussi être gérées via l'interface d'administration/API) :

| Clé | Type | Requis | Description |
|-----|------|--------|-------------|
| `host` | `string` | Oui | Nom de domaine à faire correspondre |
| `port` | `integer` | Oui | Port d'écoute (généralement 80 ou 443) |
| `remote_host` | `string` | Oui | IP ou nom d'hôte du backend en amont |
| `remote_port` | `integer` | Oui | Port du backend en amont |
| `ssl` | `boolean` | Non | Utiliser HTTPS vers le backend en amont (défaut : false) |
| `guard_status` | `boolean` | Non | Activer la protection WAF (défaut : true) |

## Paramètres du cluster (`[cluster]`)

Configuration du cluster multi-nœuds. Voir [Mode cluster](../cluster/) pour les détails.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `enabled` | `boolean` | `false` | Activer le mode cluster |
| `node_id` | `string` | `""` (auto) | Identifiant unique du nœud. Auto-généré si vide. |
| `role` | `string` | `"auto"` | Rôle du nœud : `"auto"`, `"main"` ou `"worker"` |
| `listen_addr` | `string` | `"0.0.0.0:16851"` | Adresse d'écoute QUIC pour la communication inter-nœuds |
| `seeds` | `string[]` | `[]` | Adresses des nœuds seeds pour rejoindre le cluster |

### Crypto du cluster (`[cluster.crypto]`)

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `ca_cert` | `string` | -- | Chemin vers le certificat CA (PEM) |
| `ca_key` | `string` | -- | Chemin vers la clé privée CA (nœud principal uniquement) |
| `node_cert` | `string` | -- | Chemin vers le certificat du nœud (PEM) |
| `node_key` | `string` | -- | Chemin vers la clé privée du nœud (PEM) |
| `auto_generate` | `boolean` | `true` | Auto-générer les certificats au premier démarrage |
| `ca_validity_days` | `integer` | `3650` | Validité du certificat CA (jours) |
| `node_validity_days` | `integer` | `365` | Validité du certificat de nœud (jours) |
| `renewal_before_days` | `integer` | `7` | Renouveler automatiquement ce nombre de jours avant expiration |

### Synchronisation du cluster (`[cluster.sync]`)

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `rules_interval_secs` | `integer` | `10` | Intervalle de vérification de version des règles |
| `config_interval_secs` | `integer` | `30` | Intervalle de synchronisation de configuration |
| `events_batch_size` | `integer` | `100` | Vider le lot d'événements à ce nombre |
| `events_flush_interval_secs` | `integer` | `5` | Vider les événements même si le lot n'est pas plein |
| `stats_interval_secs` | `integer` | `10` | Intervalle de rapport des statistiques |
| `events_queue_size` | `integer` | `10000` | Taille de la file d'événements (supprime les plus anciens si pleine) |

### Élection du cluster (`[cluster.election]`)

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `timeout_min_ms` | `integer` | `150` | Délai d'élection minimum (ms) |
| `timeout_max_ms` | `integer` | `300` | Délai d'élection maximum (ms) |
| `heartbeat_interval_ms` | `integer` | `50` | Intervalle de heartbeat principal vers worker (ms) |
| `phi_suspect` | `float` | `8.0` | Seuil de suspicion du détecteur de défaillances phi accrual |
| `phi_dead` | `float` | `12.0` | Seuil mort du détecteur de défaillances phi accrual |

### Santé du cluster (`[cluster.health]`)

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `check_interval_secs` | `integer` | `5` | Fréquence de vérification de santé |
| `max_missed_heartbeats` | `integer` | `3` | Marquer le pair comme non sain après N manques |

## Configuration par défaut complète

Pour référence, consultez le fichier [default.toml](https://github.com/openprx/prx-waf/blob/main/configs/default.toml) dans le dépôt.

## Étapes suivantes

- [Présentation de la configuration](./index) -- Comment les couches de configuration fonctionnent ensemble
- [Déploiement cluster](../cluster/deployment) -- Configuration spécifique au cluster
- [Moteur de règles](../rules/) -- Paramètres du moteur de règles en détail
