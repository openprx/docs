---
title: Alertas por Webhook
description: "Configura notificaciones webhook para detecciones de amenazas, eventos de cuarentena y resultados de escaneo en PRX-SD."
---

# Alertas por Webhook

PRX-SD puede enviar notificaciones en tiempo real a endpoints de webhook cuando se detectan amenazas, los archivos se ponen en cuarentena o los escaneos se completan. Los webhooks se integran con Slack, Discord, Microsoft Teams, PagerDuty o cualquier endpoint HTTP personalizado.

## Uso

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### Subcomandos

| Subcomando | Descripción |
|------------|-------------|
| `add` | Registrar un nuevo endpoint de webhook |
| `remove` | Eliminar un webhook registrado |
| `list` | Listar todos los webhooks registrados |
| `test` | Enviar una notificación de prueba a un webhook |

## Agregar Webhooks

```bash
sd webhook add [OPTIONS] <URL>
```

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--format` | `-f` | `generic` | Formato de carga útil: `slack`, `discord`, `teams`, `generic` |
| `--name` | `-n` | automático | Nombre legible para este webhook |
| `--events` | `-e` | todos | Eventos separados por comas para notificar |
| `--secret` | `-s` | | Secreto de firma HMAC-SHA256 para verificación de carga útil |
| `--min-severity` | | `suspicious` | Severidad mínima para activar: `suspicious`, `malicious` |

### Eventos Admitidos

| Evento | Descripción |
|--------|-------------|
| `threat_detected` | Se encontró un archivo malicioso o sospechoso |
| `file_quarantined` | Un archivo fue movido a cuarentena |
| `scan_completed` | Un trabajo de escaneo finalizó |
| `update_completed` | Actualización de firmas completada |
| `ransomware_alert` | Se detectó comportamiento de ransomware |
| `daemon_status` | El demonio inició, se detuvo o encontró un error |

### Ejemplos

```bash
# Add a Slack webhook
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# Add a Discord webhook
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# Add a generic webhook with HMAC signing
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# Add a webhook for malicious-only alerts
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## Listar Webhooks

```bash
sd webhook list
```

```
Registered Webhooks (3)

Name              Format    Events              Min Severity  URL
security-alerts   slack     all                 suspicious    https://hooks.slack.com/...XXXX
av-alerts         discord   all                 suspicious    https://discord.com/...defg
siem-ingest       generic   all                 suspicious    https://siem.example.com/...
```

## Eliminar Webhooks

```bash
# Remove by name
sd webhook remove security-alerts

# Remove by URL
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## Probar Webhooks

Envía una notificación de prueba para verificar la conectividad:

```bash
# Test a specific webhook
sd webhook test security-alerts

# Test all webhooks
sd webhook test --all
```

La prueba envía una carga útil de detección de amenaza de muestra para que puedas verificar el formato y la entrega.

## Formatos de Carga Útil

### Formato Genérico

El formato `generic` predeterminado envía una carga útil JSON vía HTTP POST:

```json
{
  "event": "threat_detected",
  "timestamp": "2026-03-21T10:15:32Z",
  "hostname": "web-server-01",
  "threat": {
    "file": "/tmp/payload.exe",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "size": 245760,
    "severity": "malicious",
    "detection": {
      "engine": "yara",
      "rule": "Win_Trojan_AgentTesla",
      "source": "neo23x0/signature-base"
    }
  },
  "action_taken": "quarantined",
  "quarantine_id": "a1b2c3d4"
}
```

Encabezados incluidos con las cargas útiles genéricas:

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (if secret configured)
```

### Formato Slack

Los webhooks de Slack reciben un mensaje formateado con severidad codificada por color:

```json
{
  "attachments": [{
    "color": "#ff0000",
    "title": "Threat Detected: Win_Trojan_AgentTesla",
    "fields": [
      {"title": "File", "value": "/tmp/payload.exe", "short": false},
      {"title": "Severity", "value": "MALICIOUS", "short": true},
      {"title": "Action", "value": "Quarantined", "short": true},
      {"title": "Host", "value": "web-server-01", "short": true},
      {"title": "SHA-256", "value": "`e3b0c44298fc...`", "short": false}
    ],
    "ts": 1742554532
  }]
}
```

### Formato Discord

Los webhooks de Discord usan el formato de embeds:

```json
{
  "embeds": [{
    "title": "Threat Detected",
    "description": "**Win_Trojan_AgentTesla** found in `/tmp/payload.exe`",
    "color": 16711680,
    "fields": [
      {"name": "Severity", "value": "MALICIOUS", "inline": true},
      {"name": "Action", "value": "Quarantined", "inline": true},
      {"name": "Host", "value": "web-server-01", "inline": true}
    ],
    "timestamp": "2026-03-21T10:15:32Z"
  }]
}
```

## Archivo de Configuración

Los webhooks también pueden configurarse en `~/.prx-sd/config.toml`:

```toml
[[webhook]]
name = "security-alerts"
url = "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
format = "slack"
events = ["threat_detected", "ransomware_alert", "file_quarantined"]
min_severity = "suspicious"

[[webhook]]
name = "siem-ingest"
url = "https://siem.example.com/api/v1/alerts"
format = "generic"
secret = "my-hmac-secret"
events = ["threat_detected"]
min_severity = "malicious"
```

::: tip
Los secretos de webhook se almacenan cifrados en el archivo de configuración. Usa `sd webhook add --secret` para establecerlos de forma segura en lugar de editar el archivo de configuración directamente.
:::

## Comportamiento de Reintentos

Las entregas de webhook fallidas se reintentan con retroceso exponencial:

| Intento | Retraso |
|---------|---------|
| 1er reintento | 5 segundos |
| 2do reintento | 30 segundos |
| 3er reintento | 5 minutos |
| 4to reintento | 30 minutos |
| (abandonar) | Evento registrado como no entregable |

## Próximos Pasos

- [Alertas por Correo Electrónico](./email) -- configuración de notificaciones por correo electrónico
- [Escaneos Programados](./schedule) -- configurar trabajos de escaneo recurrentes
- [Respuesta a Amenazas](../remediation/) -- configurar remediación automatizada
- [Demonio](../realtime/daemon) -- monitoreo en segundo plano con alertas
