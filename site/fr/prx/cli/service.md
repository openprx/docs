---
title: prx service
description: Installer et gerer PRX en tant que service systeme (systemd ou OpenRC).
---

# prx service

Installer, demarrer, arreter et verifier l'etat de PRX en tant que service systeme. Prend en charge a la fois systemd (la plupart des distributions Linux) et OpenRC (Alpine, Gentoo).

## Utilisation

```bash
prx service <SOUS-COMMANDE> [OPTIONS]
```

## Sous-commandes

### `prx service install`

Generer et installer un fichier d'unite de service pour le systeme d'init actuel.

```bash
prx service install [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Chemin du fichier de configuration pour le service |
| `--user` | `-u` | utilisateur actuel | Utilisateur sous lequel executer le service |
| `--group` | `-g` | groupe actuel | Groupe sous lequel executer le service |
| `--bin-path` | | auto-detecte | Chemin vers le binaire `prx` |
| `--enable` | | `false` | Activer le service pour demarrer au boot |
| `--user-service` | | `false` | Installer en tant que service systemd utilisateur (pas besoin de sudo) |

```bash
# Installer en tant que service systeme (necessite sudo)
sudo prx service install --user prx --group prx --enable

# Installer en tant que service utilisateur (sans sudo)
prx service install --user-service --enable

# Installer avec un chemin de configuration personnalise
sudo prx service install --config /etc/prx/config.toml --user prx
```

La commande d'installation :

1. Detecte le systeme d'init (systemd ou OpenRC)
2. Genere le fichier de service approprie
3. L'installe au bon emplacement (`/etc/systemd/system/prx.service` ou `/etc/init.d/prx`)
4. Active optionnellement le service pour le boot

### `prx service start`

Demarrer le service PRX.

```bash
prx service start
```

```bash
# Service systeme
sudo prx service start

# Service utilisateur
prx service start
```

### `prx service stop`

Arreter gracieusement le service PRX.

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

Afficher l'etat actuel du service.

```bash
prx service status [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--json` | `-j` | `false` | Sortie au format JSON |

**Exemple de sortie :**

```
 PRX Service Status
 ──────────────────
 State:      running
 PID:        12345
 Uptime:     3d 14h 22m
 Memory:     42 MB
 Init:       systemd
 Unit:       prx.service
 Enabled:    yes (start on boot)
 Config:     /etc/prx/config.toml
 Log:        journalctl -u prx
```

## Fichiers d'unite generes

### systemd

Le fichier d'unite systemd genere inclut des directives de renforcement pour la production :

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
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

### OpenRC

```bash
#!/sbin/openrc-run

name="PRX AI Agent Daemon"
command="/usr/local/bin/prx"
command_args="daemon --config /etc/prx/config.toml"
command_user="prx:prx"
pidfile="/run/prx.pid"
start_stop_daemon_args="--background --make-pidfile"

depend() {
    need net
    after firewall
}
```

## Service au niveau utilisateur

Pour les deploiements mono-utilisateur, installez en tant que service systemd utilisateur. Cela ne necessite pas de privileges root :

```bash
prx service install --user-service --enable

# Gerer avec systemctl --user
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## Voir aussi

- [prx daemon](./daemon) -- configuration du daemon et signaux
- [prx doctor](./doctor) -- verifier la sante du service
- [Apercu de la configuration](/fr/prx/config/) -- reference du fichier de configuration
