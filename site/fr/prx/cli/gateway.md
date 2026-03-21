---
title: prx gateway
description: Demarrer le serveur de passerelle HTTP/WebSocket autonome sans canaux ni cron.
---

# prx gateway

Demarrer le serveur de passerelle HTTP/WebSocket en tant que processus autonome. Contrairement a [`prx daemon`](./daemon), cette commande ne demarre que la passerelle -- pas de canaux, de planificateur cron ni de moteur d'evolution.

Cela est utile pour les deploiements ou vous souhaitez exposer l'API PRX sans le daemon complet, ou lorsque vous executez les canaux et la planification en tant que processus separes.

## Utilisation

```bash
prx gateway [OPTIONS]
```

## Options

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Chemin vers le fichier de configuration |
| `--port` | `-p` | `3120` | Port d'ecoute |
| `--host` | `-H` | `127.0.0.1` | Adresse de liaison |
| `--log-level` | `-l` | `info` | Niveau de verbosity des logs : `trace`, `debug`, `info`, `warn`, `error` |
| `--cors-origin` | | `*` | Origines CORS autorisees (separees par des virgules) |
| `--tls-cert` | | | Chemin vers le fichier de certificat TLS |
| `--tls-key` | | | Chemin vers la cle privee TLS |

## Points de terminaison

La passerelle expose les groupes de points de terminaison suivants :

| Chemin | Methode | Description |
|--------|---------|-------------|
| `/health` | GET | Verification de sante (retourne `200 OK`) |
| `/api/v1/chat` | POST | Envoyer un message de chat |
| `/api/v1/chat/stream` | POST | Envoyer un message de chat (streaming SSE) |
| `/api/v1/sessions` | GET, POST | Gestion des sessions |
| `/api/v1/sessions/:id` | GET, DELETE | Operations sur une session unique |
| `/api/v1/tools` | GET | Lister les outils disponibles |
| `/api/v1/memory` | GET, POST | Operations memoire |
| `/ws` | WS | Point de terminaison WebSocket pour la communication en temps reel |
| `/webhooks/:channel` | POST | Recepteur de webhooks entrants pour les canaux |

Consultez [API HTTP de la passerelle](/fr/prx/gateway/http-api) et [WebSocket de la passerelle](/fr/prx/gateway/websocket) pour la documentation complete de l'API.

## Exemples

```bash
# Demarrer sur le port par defaut
prx gateway

# Lier a toutes les interfaces sur le port 8080
prx gateway --host 0.0.0.0 --port 8080

# Avec TLS
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# Restreindre CORS
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# Journalisation debug
prx gateway --log-level debug
```

## Derriere un proxy inverse

En production, placez la passerelle derriere un proxy inverse (Nginx, Caddy, etc.) pour la terminaison TLS et l'equilibrage de charge :

```
# Exemple Caddy
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# Exemple Nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Signaux

| Signal | Comportement |
|--------|--------------|
| `SIGHUP` | Recharger la configuration |
| `SIGTERM` | Arret gracieux (termine les requetes en cours) |

## Voir aussi

- [prx daemon](./daemon) -- runtime complet (passerelle + canaux + cron + evolution)
- [Apercu de la passerelle](/fr/prx/gateway/) -- architecture de la passerelle
- [API HTTP de la passerelle](/fr/prx/gateway/http-api) -- reference de l'API REST
- [WebSocket de la passerelle](/fr/prx/gateway/websocket) -- protocole WebSocket
