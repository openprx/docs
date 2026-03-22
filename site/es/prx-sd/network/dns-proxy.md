---
title: Proxy DNS
description: "Ejecuta un proxy DNS local que combina el filtrado adblock, feeds de dominios IOC y listas de bloqueo personalizadas en un único resolvedor con registro completo de consultas."
---

# Proxy DNS

El comando `sd dns-proxy` inicia un servidor proxy DNS local que intercepta las consultas DNS y las filtra a través de tres motores antes de reenviarlas a un resolvedor ascendente:

1. **Motor adblock** -- bloquea anuncios, rastreadores y dominios maliciosos de las listas de filtros
2. **Feed de dominios IOC** -- bloquea dominios de los indicadores de compromiso de inteligencia de amenazas
3. **Lista de bloqueo DNS personalizada** -- bloquea dominios de listas definidas por el usuario

Las consultas que coinciden con algún filtro reciben respuesta con `0.0.0.0` (NXDOMAIN). El resto de las consultas se reenvían al servidor DNS ascendente configurado. Cada consulta y su estado de resolución se registra en un archivo JSONL.

## Inicio Rápido

```bash
# Start the DNS proxy with defaults (listen 127.0.0.1:53, upstream 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
El proxy escucha en el puerto 53 de forma predeterminada, lo que requiere privilegios de root. Para pruebas sin privilegios, usa un puerto alto como `--listen 127.0.0.1:5353`.
:::

## Opciones del Comando

```bash
sd dns-proxy [OPTIONS]
```

| Opción | Predeterminado | Descripción |
|--------|----------------|-------------|
| `--listen` | `127.0.0.1:53` | Dirección y puerto en los que escuchar |
| `--upstream` | `8.8.8.8:53` | Servidor DNS ascendente al que reenviar las consultas no bloqueadas |
| `--log-path` | `/tmp/prx-sd-dns.log` | Ruta para el archivo de registro JSONL de consultas |

## Ejemplos de Uso

### Uso Básico

Inicia el proxy en la dirección predeterminada con Google DNS como ascendente:

```bash
sudo sd dns-proxy
```

Salida:

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### Dirección de Escucha y Ascendente Personalizados

Usa Cloudflare DNS como ascendente y escucha en un puerto personalizado:

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### Ruta de Registro Personalizada

Escribe los registros de consultas en una ubicación específica:

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### Combinación con Adblock

El proxy DNS carga automáticamente las listas de filtros adblock desde `~/.prx-sd/adblock/`. Para obtener la mejor cobertura:

```bash
# Step 1: Enable and sync adblock lists
sudo sd adblock enable
sd adblock sync

# Step 2: Start the DNS proxy (it picks up adblock rules automatically)
sudo sd dns-proxy
```

El proxy lee las mismas listas de filtros en caché que usa `sd adblock`. Cualquier lista agregada mediante `sd adblock add` está automáticamente disponible para el proxy después de reiniciarlo.

## Configurar tu Sistema para Usar el Proxy

### Linux (systemd-resolved)

Edita `/etc/systemd/resolved.conf`:

```ini
[Resolve]
DNS=127.0.0.1
```

Luego reinicia:

```bash
sudo systemctl restart systemd-resolved
```

### Linux (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

Para revertir:

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
Redirigir todo el tráfico DNS al proxy local significa que si el proxy se detiene, la resolución DNS fallará hasta que restaures la configuración original o reinicies el proxy.
:::

## Formato del Registro

El proxy DNS escribe JSONL (un objeto JSON por línea) en la ruta de registro configurada. Cada entrada contiene:

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| Campo | Descripción |
|-------|-------------|
| `timestamp` | Marca de tiempo ISO 8601 de la consulta |
| `query` | El nombre de dominio consultado |
| `type` | Tipo de registro DNS (A, AAAA, CNAME, etc.) |
| `action` | `blocked` o `forwarded` |
| `filter` | Qué filtro coincidió: `adblock`, `ioc`, `blocklist`, o `null` |
| `upstream_ms` | Tiempo de ida y vuelta al DNS ascendente (null si está bloqueado) |

## Arquitectura

```
Client DNS Query (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> blocked? --> respond 0.0.0.0
  |  2. IOC domains  |---> blocked? --> respond 0.0.0.0
  |  3. DNS blocklist |---> blocked? --> respond 0.0.0.0
  |                  |
  |  Not blocked:    |
  |  Forward to      |---> upstream DNS (e.g. 8.8.8.8)
  |  upstream         |<--- response
  |                  |
  |  Log to JSONL    |
  +------------------+
        |
        v
  Client receives response
```

## Ejecutar como Servicio

Para ejecutar el proxy DNS como un servicio systemd persistente:

```bash
# Create a systemd unit file
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
Para una experiencia en segundo plano completamente gestionada, considera usar `sd daemon` en su lugar, que combina el monitoreo de archivos en tiempo real, actualizaciones automáticas de firmas y puede extenderse para incluir la funcionalidad del proxy DNS.
:::

## Próximos Pasos

- Configura las [listas de filtros Adblock](./adblock) para un bloqueo de dominios completo
- Configura el [Monitoreo en Tiempo Real](../realtime/) para protección del sistema de archivos junto al filtrado DNS
- Revisa la [Referencia de Configuración](../configuration/reference) para los ajustes relacionados con el proxy
