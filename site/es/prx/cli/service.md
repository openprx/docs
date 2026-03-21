---
title: prx service
description: Instalar y gestionar PRX como un servicio del sistema (systemd u OpenRC).
---

# prx service

Instala, inicia, detiene y verifica el estado de PRX como un servicio del sistema. Soporta tanto systemd (la mayoria de distribuciones Linux) como OpenRC (Alpine, Gentoo).

## Uso

```bash
prx service <SUBCOMANDO> [OPTIONS]
```

## Subcomandos

### `prx service install`

Genera e instala un archivo de unidad de servicio para el sistema init actual.

```bash
prx service install [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Ruta del archivo de configuracion para el servicio |
| `--user` | `-u` | usuario actual | Usuario con el que ejecutar el servicio |
| `--group` | `-g` | grupo actual | Grupo con el que ejecutar el servicio |
| `--bin-path` | | auto-detectado | Ruta al binario `prx` |
| `--enable` | | `false` | Habilitar el servicio para iniciar al arrancar |
| `--user-service` | | `false` | Instalar como servicio systemd de nivel de usuario (no requiere sudo) |

```bash
# Instalar como servicio del sistema (requiere sudo)
sudo prx service install --user prx --group prx --enable

# Instalar como servicio de usuario (sin sudo)
prx service install --user-service --enable

# Instalar con una ruta de configuracion personalizada
sudo prx service install --config /etc/prx/config.toml --user prx
```

El comando install:

1. Detecta el sistema init (systemd u OpenRC)
2. Genera el archivo de servicio apropiado
3. Lo instala en la ubicacion correcta (`/etc/systemd/system/prx.service` o `/etc/init.d/prx`)
4. Opcionalmente habilita el servicio para el arranque

### `prx service start`

Inicia el servicio PRX.

```bash
prx service start
```

```bash
# Servicio del sistema
sudo prx service start

# Servicio de usuario
prx service start
```

### `prx service stop`

Detiene el servicio PRX de forma ordenada.

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

Muestra el estado actual del servicio.

```bash
prx service status [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--json` | `-j` | `false` | Salida en formato JSON |

**Ejemplo de salida:**

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

## Archivos de unidad generados

### systemd

El archivo de unidad systemd generado incluye directivas de endurecimiento para produccion:

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

## Servicio de nivel de usuario

Para despliegues de un solo usuario, instala como servicio systemd de usuario. Esto no requiere privilegios de root:

```bash
prx service install --user-service --enable

# Gestionar con systemctl --user
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## Relacionado

- [prx daemon](./daemon) -- configuracion del demonio y senales
- [prx doctor](./doctor) -- verificar la salud del servicio
- [Vision general de configuracion](/es/prx/config/) -- referencia del archivo de configuracion
