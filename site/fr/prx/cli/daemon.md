---
title: prx daemon
description: Demarrer le runtime complet PRX incluant la passerelle, les canaux, le planificateur cron et le moteur d'auto-evolution.
---

# prx daemon

Demarrer le runtime complet PRX. Le processus daemon gere tous les sous-systemes persistants : la passerelle HTTP/WebSocket, les connexions aux canaux de messagerie, le planificateur cron et le moteur d'auto-evolution.

## Utilisation

```bash
prx daemon [OPTIONS]
```

## Options

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Chemin vers le fichier de configuration |
| `--port` | `-p` | `3120` | Port d'ecoute de la passerelle |
| `--host` | `-H` | `127.0.0.1` | Adresse de liaison de la passerelle |
| `--log-level` | `-l` | `info` | Niveau de verbosity des logs : `trace`, `debug`, `info`, `warn`, `error` |
| `--no-evolution` | | `false` | Desactiver le moteur d'auto-evolution |
| `--no-cron` | | `false` | Desactiver le planificateur cron |
| `--no-gateway` | | `false` | Desactiver la passerelle HTTP/WS |
| `--pid-file` | | | Ecrire le PID dans le fichier specifie |

## Ce que le daemon demarre

Au lancement, `prx daemon` initialise les sous-systemes suivants dans l'ordre :

1. **Chargeur de configuration** -- lit et valide le fichier de configuration
2. **Backend memoire** -- se connecte au stockage memoire configure (markdown, SQLite ou PostgreSQL)
3. **Serveur de passerelle** -- demarre le serveur HTTP/WebSocket sur l'hote et le port configures
4. **Gestionnaire de canaux** -- connecte tous les canaux de messagerie actives (Telegram, Discord, Slack, etc.)
5. **Planificateur cron** -- charge et active les taches planifiees
6. **Moteur d'auto-evolution** -- demarre le pipeline d'evolution L1/L2/L3 (si active)

## Exemples

```bash
# Demarrer avec les parametres par defaut
prx daemon

# Lier a toutes les interfaces sur le port 8080
prx daemon --host 0.0.0.0 --port 8080

# Demarrer avec la journalisation debug
prx daemon --log-level debug

# Demarrer sans evolution (utile pour le debogage)
prx daemon --no-evolution

# Utiliser un fichier de configuration personnalise
prx daemon --config /etc/prx/production.toml
```

## Signaux

Le daemon repond aux signaux Unix pour le controle en cours d'execution :

| Signal | Comportement |
|--------|--------------|
| `SIGHUP` | Recharger le fichier de configuration sans redemarrer. Les canaux et les taches cron sont reconcilies avec la nouvelle configuration. |
| `SIGTERM` | Arret gracieux. Termine les requetes en cours, deconnecte proprement les canaux et vide les ecritures memoire en attente. |
| `SIGINT` | Identique a `SIGTERM` (Ctrl+C). |

```bash
# Recharger la configuration sans redemarrage
kill -HUP $(cat /var/run/prx.pid)

# Arret gracieux
kill -TERM $(cat /var/run/prx.pid)
```

## Execution en tant que service systemd

La methode recommandee pour executer le daemon en production est via systemd. Utilisez [`prx service install`](./service) pour generer et installer le fichier d'unite automatiquement, ou creez-en un manuellement :

```ini
[Unit]
Description=PRX AI Agent Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/prx daemon --config /etc/prx/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
User=prx
Group=prx
RuntimeDirectory=prx
StateDirectory=prx

# Renforcement
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# Installer et demarrer le service
prx service install
prx service start

# Ou manuellement
sudo systemctl enable --now prx
```

## Journalisation

Le daemon ecrit ses logs sur stderr par defaut. Dans un environnement systemd, les logs sont captures par le journal :

```bash
# Suivre les logs du daemon
journalctl -u prx -f

# Afficher les logs de la derniere heure
journalctl -u prx --since "1 hour ago"
```

Activez la journalisation structuree JSON en ajoutant `log_format = "json"` au fichier de configuration pour l'integration avec les agregateurs de logs.

## Verification de sante

Pendant que le daemon est en cours d'execution, utilisez [`prx doctor`](./doctor) ou interrogez le point de terminaison de sante de la passerelle :

```bash
# Diagnostics CLI
prx doctor

# Point de terminaison de sante HTTP
curl http://127.0.0.1:3120/health
```

## Voir aussi

- [prx gateway](./gateway) -- passerelle autonome sans canaux ni cron
- [prx service](./service) -- gestion des services systemd/OpenRC
- [prx doctor](./doctor) -- diagnostics du daemon
- [Apercu de la configuration](/fr/prx/config/) -- reference du fichier de configuration
- [Apercu de l'auto-evolution](/fr/prx/self-evolution/) -- details du moteur d'evolution
