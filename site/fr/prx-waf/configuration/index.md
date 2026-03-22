---
title: Présentation de la configuration
description: "Comment fonctionne la configuration de PRX-WAF. Structure du fichier de configuration TOML, substitutions par variables d'environnement, et relation entre la configuration basée sur fichier et celle stockée en base de données."
---

# Configuration

PRX-WAF est configuré via un fichier TOML passé avec le flag `-c` / `--config`. Le chemin par défaut est `configs/default.toml`.

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## Sources de configuration

PRX-WAF utilise deux couches de configuration :

| Source | Portée | Description |
|--------|--------|-------------|
| Fichier TOML | Démarrage du serveur | Ports du proxy, URL de base de données, cache, HTTP/3, sécurité, cluster |
| Base de données | Exécution | Hôtes, règles, certificats, plugins, tunnels, notifications |

Le fichier TOML contient les paramètres nécessaires au démarrage (ports, connexion à la base de données, configuration du cluster). Les paramètres d'exécution comme les hôtes et les règles sont stockés dans PostgreSQL et gérés via l'interface d'administration ou l'API REST.

## Structure du fichier de configuration

Le fichier de configuration TOML comprend les sections suivantes :

```toml
[proxy]          # Adresses d'écoute du proxy inverse
[api]            # Adresse d'écoute de l'API d'administration
[storage]        # Connexion PostgreSQL
[cache]          # Paramètres du cache de réponses
[http3]          # Paramètres HTTP/3 QUIC
[security]       # Sécurité de l'API d'administration (liste blanche IP, limite de débit, CORS)
[rules]          # Paramètres du moteur de règles (répertoire, rechargement à chaud, sources)
[crowdsec]       # Intégration CrowdSec
[cluster]        # Mode cluster (optionnel)
```

### Configuration minimale

Une configuration minimale pour le développement :

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### Configuration de production

Une configuration de production avec toutes les fonctionnalités de sécurité :

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Configuration des hôtes

Les hôtes peuvent être définis dans le fichier TOML pour les déploiements statiques :

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
Pour les environnements dynamiques, gérez les hôtes via l'interface d'administration ou l'API REST plutôt que dans le fichier TOML. Les hôtes stockés en base de données ont la priorité sur les hôtes définis dans le TOML.
:::

## Migrations de base de données

PRX-WAF inclut 8 fichiers de migration qui créent le schéma de base de données requis :

```bash
# Exécuter les migrations
prx-waf -c configs/default.toml migrate

# Créer l'utilisateur admin par défaut
prx-waf -c configs/default.toml seed-admin
```

Les migrations sont idempotentes et peuvent être exécutées plusieurs fois sans risque.

## Environnement Docker

Dans les déploiements Docker, les valeurs de configuration sont généralement définies dans `docker-compose.yml` :

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## Étapes suivantes

- [Référence de configuration](./reference) -- Chaque clé TOML documentée avec types et valeurs par défaut
- [Installation](../getting-started/installation) -- Configuration initiale et migrations de base de données
- [Mode cluster](../cluster/) -- Configuration spécifique au cluster
