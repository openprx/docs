---
title: Processus démon
description: Exécuter PRX-SD comme démon en arrière-plan avec des mises à jour automatiques des signatures et une surveillance persistante des fichiers.
---

# Processus démon

La commande `sd daemon` démarre PRX-SD comme processus d'arrière-plan de longue durée qui combine la surveillance des fichiers en temps réel avec les mises à jour automatiques des signatures. C'est la méthode recommandée pour exécuter PRX-SD sur les serveurs et postes de travail nécessitant une protection continue.

## Utilisation

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### Sous-commandes

| Sous-commande | Description |
|---------------|-------------|
| `start` | Démarrer le démon (par défaut si aucune sous-commande n'est donnée) |
| `stop` | Arrêter le démon en cours d'exécution |
| `restart` | Arrêter et redémarrer le démon |
| `status` | Afficher l'état du démon et les statistiques |

## Options (start)

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--watch` | `-w` | `/home,/tmp` | Chemins séparés par des virgules à surveiller |
| `--update-hours` | `-u` | `6` | Intervalle de mise à jour automatique des signatures en heures |
| `--no-update` | | `false` | Désactiver les mises à jour automatiques des signatures |
| `--block` | `-b` | `false` | Activer le mode blocage (fanotify Linux) |
| `--auto-quarantine` | `-q` | `false` | Mettre en quarantaine automatiquement les menaces |
| `--pid-file` | | `~/.prx-sd/sd.pid` | Emplacement du fichier PID |
| `--log-file` | | `~/.prx-sd/daemon.log` | Emplacement du fichier journal |
| `--log-level` | `-l` | `info` | Verbosité des journaux : `trace`, `debug`, `info`, `warn`, `error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | Chemin vers le fichier de configuration |

## Ce que le démon gère

Lorsqu'il est démarré, `sd daemon` lance deux sous-systèmes :

1. **Moniteur de fichiers** -- surveille les chemins configurés pour les événements du système de fichiers et analyse les fichiers nouveaux ou modifiés. Équivalent à exécuter `sd monitor` avec les mêmes chemins.
2. **Planificateur de mises à jour** -- vérifie et télécharge périodiquement les nouvelles signatures de menaces (bases de données de hachages, règles YARA, flux IOC). Équivalent à exécuter `sd update` à l'intervalle configuré.

## Chemins surveillés par défaut

Lorsque `--watch` n'est pas spécifié, le démon surveille :

| Plateforme | Chemins par défaut |
|------------|-------------------|
| Linux | `/home`, `/tmp` |
| macOS | `/Users`, `/tmp`, `/private/tmp` |
| Windows | `C:\Users`, `C:\Windows\Temp` |

Remplacez ces valeurs par défaut dans le fichier de configuration ou via `--watch` :

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## Vérifier l'état

Utilisez `sd daemon status` (ou le raccourci `sd status`) pour afficher l'état du démon :

```bash
sd status
```

```
PRX-SD Daemon Status
  State:          running (PID 48231)
  Uptime:         3 days, 14 hours, 22 minutes
  Watched paths:  /home, /tmp
  Files scanned:  12,847
  Threats found:  3 (2 quarantined, 1 reported)
  Last update:    2026-03-21 08:00:12 UTC (signatures v2026.0321.1)
  Next update:    2026-03-21 14:00:12 UTC
  Memory usage:   42 MB
```

## Intégration systemd (Linux)

Créer un service systemd pour le démarrage automatique :

```ini
[Unit]
Description=PRX-SD Antivirus Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/bin/sd daemon start
ExecStop=/usr/local/bin/sd daemon stop
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/lib/prx-sd/sd.pid
Restart=on-failure
RestartSec=10
User=root

# Durcissement de sécurité
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prx-sd /home /tmp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-sd
sudo systemctl status prx-sd
sudo journalctl -u prx-sd -f
```

::: tip
Le démon nécessite root pour utiliser le mode blocage fanotify. Pour une surveillance non bloquante, vous pouvez l'exécuter comme utilisateur non privilégié avec un accès en lecture aux chemins surveillés.
:::

## Intégration launchd (macOS)

Créer un plist de démon de lancement dans `/Library/LaunchDaemons/com.openprx.sd.plist` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openprx.sd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sd</string>
        <string>daemon</string>
        <string>start</string>
        <string>--watch</string>
        <string>/Users,/tmp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/prx-sd.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/prx-sd.log</string>
</dict>
</plist>
```

```bash
sudo launchctl load /Library/LaunchDaemons/com.openprx.sd.plist
sudo launchctl list | grep openprx
```

## Signaux

| Signal | Comportement |
|--------|-------------|
| `SIGHUP` | Recharger la configuration et redémarrer les surveillances sans redémarrage complet |
| `SIGTERM` | Arrêt gracieux -- terminer l'analyse en cours, vider les journaux |
| `SIGINT` | Identique à `SIGTERM` |
| `SIGUSR1` | Déclencher une mise à jour immédiate des signatures |

```bash
# Forcer une mise à jour immédiate
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## Exemples

```bash
# Démarrer le démon avec les valeurs par défaut
sd daemon start

# Démarrer avec des chemins de surveillance personnalisés et un cycle de mise à jour de 4 heures
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# Démarrer avec le mode blocage et la mise en quarantaine automatique
sudo sd daemon start --block --auto-quarantine

# Vérifier l'état du démon
sd status

# Redémarrer le démon
sd daemon restart

# Arrêter le démon
sd daemon stop
```

::: warning
L'arrêt du démon désactive toute protection en temps réel. Les événements du système de fichiers qui se produisent pendant l'arrêt du démon ne seront pas analysés rétroactivement.
:::

## Étapes suivantes

- [Surveillance de fichiers](./monitor) -- configuration détaillée de la surveillance
- [Protection contre les ransomwares](./ransomware) -- détection comportementale des ransomwares
- [Mise à jour des signatures](/fr/prx-sd/signatures/update) -- mises à jour manuelles des signatures
- [Alertes webhook](/fr/prx-sd/alerts/webhook) -- être notifié lorsque des menaces sont trouvées
