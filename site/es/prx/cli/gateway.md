---
title: prx gateway
description: Iniciar el servidor gateway HTTP/WebSocket independiente sin canales ni cron.
---

# prx gateway

Inicia el servidor gateway HTTP/WebSocket como un proceso independiente. A diferencia de [`prx daemon`](./daemon), este comando solo inicia el gateway -- sin canales, programador cron ni motor de evolucion.

Esto es util para despliegues donde quieres exponer la API de PRX sin el demonio completo, o cuando ejecutas los canales y la programacion como procesos separados.

## Uso

```bash
prx gateway [OPTIONS]
```

## Opciones

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Ruta al archivo de configuracion |
| `--port` | `-p` | `3120` | Puerto de escucha |
| `--host` | `-H` | `127.0.0.1` | Direccion de enlace |
| `--log-level` | `-l` | `info` | Verbosidad del log: `trace`, `debug`, `info`, `warn`, `error` |
| `--cors-origin` | | `*` | Origenes CORS permitidos (separados por comas) |
| `--tls-cert` | | | Ruta al archivo de certificado TLS |
| `--tls-key` | | | Ruta al archivo de clave privada TLS |

## Endpoints

El gateway expone los siguientes grupos de endpoints:

| Ruta | Metodo | Descripcion |
|------|--------|-------------|
| `/health` | GET | Comprobacion de salud (devuelve `200 OK`) |
| `/api/v1/chat` | POST | Enviar un mensaje de chat |
| `/api/v1/chat/stream` | POST | Enviar un mensaje de chat (streaming SSE) |
| `/api/v1/sessions` | GET, POST | Gestion de sesiones |
| `/api/v1/sessions/:id` | GET, DELETE | Operaciones sobre una sesion individual |
| `/api/v1/tools` | GET | Listar herramientas disponibles |
| `/api/v1/memory` | GET, POST | Operaciones de memoria |
| `/ws` | WS | Endpoint WebSocket para comunicacion en tiempo real |
| `/webhooks/:channel` | POST | Receptor de webhooks entrantes para canales |

Consulta [API HTTP del Gateway](/es/prx/gateway/http-api) y [WebSocket del Gateway](/es/prx/gateway/websocket) para la documentacion completa de la API.

## Ejemplos

```bash
# Iniciar en el puerto por defecto
prx gateway

# Enlazar a todas las interfaces en el puerto 8080
prx gateway --host 0.0.0.0 --port 8080

# Con TLS
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# Restringir CORS
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# Logging de depuracion
prx gateway --log-level debug
```

## Detras de un proxy inverso

En produccion, coloca el gateway detras de un proxy inverso (Nginx, Caddy, etc.) para terminacion TLS y balanceo de carga:

```
# Ejemplo con Caddy
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# Ejemplo con Nginx
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

## Senales

| Senal | Comportamiento |
|-------|----------------|
| `SIGHUP` | Recargar configuracion |
| `SIGTERM` | Apagado ordenado (finaliza las solicitudes en curso) |

## Relacionado

- [prx daemon](./daemon) -- runtime completo (gateway + canales + cron + evolucion)
- [Vision general del gateway](/es/prx/gateway/) -- arquitectura del gateway
- [API HTTP del gateway](/es/prx/gateway/http-api) -- referencia de la API REST
- [WebSocket del gateway](/es/prx/gateway/websocket) -- protocolo WebSocket
