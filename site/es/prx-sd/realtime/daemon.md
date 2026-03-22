---
title: Proceso Demonio
description: "Ejecuta PRX-SD como un demonio en segundo plano con actualizaciones automáticas de firmas y monitoreo persistente de archivos."
---

# Proceso Demonio

El comando `sd daemon` inicia PRX-SD como un proceso en segundo plano de larga duración que combina el monitoreo de archivos en tiempo real con actualizaciones automáticas de firmas. Esta es la forma recomendada de ejecutar PRX-SD en servidores y estaciones de trabajo que necesitan protección continua.

## Uso

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### Subcomandos

| Subcomando | Descripción |
|------------|-------------|
| `start` | Iniciar el demonio (predeterminado si no se da ningún subcomando) |
| `stop` | Detener el demonio en ejecución |
| `restart` | Detener y reiniciar el demonio |
| `status` | Mostrar estado y estadísticas del demonio |

## Opciones (start)

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--watch` | `-w` | `/home,/tmp` | Rutas separadas por comas para monitorear |
| `--update-hours` | `-u` | `6` | Intervalo de actualización automática de firmas en horas |
| `--no-update` | | `false` | Deshabilitar actualizaciones automáticas de firmas |
| `--block` | `-b` | `false` | Habilitar modo de bloqueo (fanotify de Linux) |
| `--auto-quarantine` | `-q` | `false` | Poner en cuarentena las amenazas automáticamente |
| `--pid-file` | | `~/.prx-sd/sd.pid` | Ubicación del archivo PID |
| `--log-file` | | `~/.prx-sd/daemon.log` | Ubicación del archivo de log |
| `--log-level` | `-l` | `info` | Verbosidad del log: `trace`, `debug`, `info`, `warn`, `error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | Ruta al archivo de configuración |

## Qué Gestiona el Demonio

Cuando se inicia, `sd daemon` lanza dos subsistemas:

1. **Monitor de Archivos** -- vigila las rutas configuradas en busca de eventos del sistema de archivos y escanea los archivos nuevos o modificados. Equivalente a ejecutar `sd monitor` con las mismas rutas.
2. **Planificador de Actualizaciones** -- verifica periódicamente y descarga nuevas firmas de amenazas (bases de datos de hashes, reglas YARA, feeds de IOC). Equivalente a ejecutar `sd update` en el intervalo configurado.

## Rutas Monitoreadas Predeterminadas

Cuando no se especifica `--watch`, el demonio monitorea:

| Plataforma | Rutas Predeterminadas |
|------------|----------------------|
| Linux | `/home`, `/tmp` |
| macOS | `/Users`, `/tmp`, `/private/tmp` |
| Windows | `C:\Users`, `C:\Windows\Temp` |

Anula estos valores predeterminados en el archivo de configuración o vía `--watch`:

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## Verificar el Estado

Usa `sd daemon status` (o el atajo `sd status`) para ver el estado del demonio:

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

## Integración con systemd (Linux)

Crea un servicio systemd para el inicio automático:

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

# Security hardening
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
El demonio requiere root para usar el modo de bloqueo fanotify. Para el monitoreo sin bloqueo, puedes ejecutarlo como un usuario sin privilegios con acceso de lectura a las rutas vigiladas.
:::

## Integración con launchd (macOS)

Crea un plist de demonio de lanzamiento en `/Library/LaunchDaemons/com.openprx.sd.plist`:

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

## Señales

| Señal | Comportamiento |
|-------|---------------|
| `SIGHUP` | Recargar configuración y reiniciar vigilantes sin reinicio completo |
| `SIGTERM` | Apagado ordenado -- terminar el escaneo actual, vaciar los logs |
| `SIGINT` | Igual que `SIGTERM` |
| `SIGUSR1` | Activar una actualización inmediata de firmas |

```bash
# Force an immediate update
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## Ejemplos

```bash
# Start daemon with defaults
sd daemon start

# Start with custom watch paths and 4-hour update cycle
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# Start with blocking mode and auto-quarantine
sudo sd daemon start --block --auto-quarantine

# Check daemon status
sd status

# Restart the daemon
sd daemon restart

# Stop the daemon
sd daemon stop
```

::: warning
Detener el demonio deshabilita toda la protección en tiempo real. Los eventos del sistema de archivos que ocurran mientras el demonio está detenido no se escanearán retroactivamente.
:::

## Próximos Pasos

- [Monitoreo de Archivos](./monitor) -- configuración detallada del monitoreo
- [Protección contra Ransomware](./ransomware) -- detección conductual de ransomware
- [Actualización de Firmas](../signatures/update) -- actualizaciones manuales de firmas
- [Alertas por Webhook](../alerts/webhook) -- recibe notificaciones cuando se encuentran amenazas
