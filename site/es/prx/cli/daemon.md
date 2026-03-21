---
title: prx daemon
description: Inicia el runtime completo de PRX incluyendo gateway, canales, programador cron y motor de autoevolucion.
---

# prx daemon

Inicia el runtime completo de PRX. El proceso demonio gestiona todos los subsistemas de larga ejecucion: el gateway HTTP/WebSocket, las conexiones de canales de mensajeria, el programador cron y el motor de autoevolucion.

## Uso

```bash
prx daemon [OPTIONS]
```

## Opciones

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Ruta al archivo de configuracion |
| `--port` | `-p` | `3120` | Puerto de escucha del gateway |
| `--host` | `-H` | `127.0.0.1` | Direccion de enlace del gateway |
| `--log-level` | `-l` | `info` | Verbosidad del log: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-evolution` | | `false` | Deshabilitar el motor de autoevolucion |
| `--no-cron` | | `false` | Deshabilitar el programador cron |
| `--no-gateway` | | `false` | Deshabilitar el gateway HTTP/WS |
| `--pid-file` | | | Escribir el PID en el archivo especificado |

## Que inicia el demonio

Al ejecutarse, `prx daemon` inicializa los siguientes subsistemas en orden:

1. **Cargador de configuracion** -- lee y valida el archivo de configuracion
2. **Backend de memoria** -- se conecta al almacen de memoria configurado (markdown, SQLite o PostgreSQL)
3. **Servidor gateway** -- inicia el servidor HTTP/WebSocket en el host y puerto configurados
4. **Gestor de canales** -- conecta todos los canales de mensajeria habilitados (Telegram, Discord, Slack, etc.)
5. **Programador cron** -- carga y activa las tareas programadas
6. **Motor de autoevolucion** -- inicia el pipeline de evolucion L1/L2/L3 (si esta habilitado)

## Ejemplos

```bash
# Iniciar con ajustes por defecto
prx daemon

# Enlazar a todas las interfaces en el puerto 8080
prx daemon --host 0.0.0.0 --port 8080

# Iniciar con logging de depuracion
prx daemon --log-level debug

# Iniciar sin evolucion (util para depuracion)
prx daemon --no-evolution

# Usar un archivo de configuracion personalizado
prx daemon --config /etc/prx/production.toml
```

## Senales

El demonio responde a senales Unix para control en tiempo de ejecucion:

| Senal | Comportamiento |
|-------|----------------|
| `SIGHUP` | Recargar el archivo de configuracion sin reiniciar. Los canales y tareas cron se reconcilian con la nueva configuracion. |
| `SIGTERM` | Apagado ordenado. Finaliza las solicitudes en curso, desconecta los canales de forma limpia y vacia las escrituras de memoria pendientes. |
| `SIGINT` | Igual que `SIGTERM` (Ctrl+C). |

```bash
# Recargar configuracion sin reiniciar
kill -HUP $(cat /var/run/prx.pid)

# Apagado ordenado
kill -TERM $(cat /var/run/prx.pid)
```

## Ejecutar como servicio systemd

La forma recomendada de ejecutar el demonio en produccion es mediante systemd. Usa [`prx service install`](./service) para generar e instalar el archivo de unidad automaticamente, o crea uno manualmente:

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

# Hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# Instalar e iniciar el servicio
prx service install
prx service start

# O manualmente
sudo systemctl enable --now prx
```

## Logging

El demonio registra en stderr por defecto. En un entorno systemd, los logs son capturados por el journal:

```bash
# Seguir los logs del demonio
journalctl -u prx -f

# Mostrar logs de la ultima hora
journalctl -u prx --since "1 hour ago"
```

Configura logging estructurado en JSON agregando `log_format = "json"` al archivo de configuracion para integracion con agregadores de logs.

## Comprobacion de salud

Mientras el demonio esta en ejecucion, usa [`prx doctor`](./doctor) o consulta el endpoint de salud del gateway:

```bash
# Diagnosticos CLI
prx doctor

# Endpoint HTTP de salud
curl http://127.0.0.1:3120/health
```

## Relacionado

- [prx gateway](./gateway) -- gateway independiente sin canales ni cron
- [prx service](./service) -- gestion de servicios systemd/OpenRC
- [prx doctor](./doctor) -- diagnosticos del demonio
- [Vision general de configuracion](/es/prx/config/) -- referencia del archivo de configuracion
- [Vision general de autoevolucion](/es/prx/self-evolution/) -- detalles del motor de evolucion
