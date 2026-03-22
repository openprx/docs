---
title: Alertas por Correo Electrónico
description: "Configura notificaciones de correo electrónico para detecciones de amenazas y resultados de escaneo en PRX-SD."
---

# Alertas por Correo Electrónico

PRX-SD puede enviar notificaciones por correo electrónico cuando se detectan amenazas, los escaneos se completan o ocurren eventos críticos. Las alertas por correo electrónico complementan los webhooks para entornos donde el correo electrónico es el canal de comunicación principal o para contactar al personal de guardia.

## Uso

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### Subcomandos

| Subcomando | Descripción |
|------------|-------------|
| `configure` | Configurar el servidor SMTP y los ajustes de destinatarios |
| `test` | Enviar un correo electrónico de prueba para verificar la configuración |
| `send` | Enviar manualmente un correo electrónico de alerta |
| `status` | Mostrar el estado actual de la configuración de correo electrónico |

## Configurar el Correo Electrónico

### Configuración Interactiva

```bash
sd email-alert configure
```

El asistente interactivo solicita:

```
SMTP Server: smtp.gmail.com
SMTP Port [587]: 587
Use TLS [yes]: yes
Username: alerts@example.com
Password: ********
From Address [alerts@example.com]: prx-sd@example.com
From Name [PRX-SD]: PRX-SD Scanner
Recipients (comma-separated): security@example.com, oncall@example.com
Min Severity [suspicious]: malicious
```

### Configuración por Línea de Comandos

```bash
sd email-alert configure \
  --smtp-server smtp.gmail.com \
  --smtp-port 587 \
  --tls true \
  --username alerts@example.com \
  --password "app-password-here" \
  --from "prx-sd@example.com" \
  --from-name "PRX-SD Scanner" \
  --to "security@example.com,oncall@example.com" \
  --min-severity malicious
```

### Archivo de Configuración

Los ajustes de correo electrónico se almacenan en `~/.prx-sd/config.toml`:

```toml
[email]
enabled = true
min_severity = "malicious"    # suspicious | malicious
events = ["threat_detected", "ransomware_alert", "scan_completed"]

[email.smtp]
server = "smtp.gmail.com"
port = 587
tls = true
username = "alerts@example.com"
# Password stored encrypted - use 'sd email-alert configure' to set

[email.message]
from_address = "prx-sd@example.com"
from_name = "PRX-SD Scanner"
recipients = ["security@example.com", "oncall@example.com"]
subject_prefix = "[PRX-SD]"
```

::: tip
Para Gmail, usa una Contraseña de Aplicación en lugar de la contraseña de tu cuenta. Ve a Cuenta de Google > Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones para generar una.
:::

## Probar el Correo Electrónico

Envía un correo electrónico de prueba para verificar tu configuración:

```bash
sd email-alert test
```

```
Sending test email to security@example.com, oncall@example.com...
  SMTP connection:  OK (smtp.gmail.com:587, TLS)
  Authentication:   OK
  Delivery:         OK (Message-ID: <prx-sd-test-a1b2c3@example.com>)

Test email sent successfully.
```

## Enviar Alertas Manuales

Activa un correo electrónico de alerta manualmente (útil para probar integraciones o reenviar hallazgos):

```bash
# Send alert about a specific file
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# Send a scan summary
sd email-alert send --scan-report /tmp/scan-results.json
```

## Contenido del Correo Electrónico

### Correo de Detección de Amenaza

```
Subject: [PRX-SD] MALICIOUS: Win_Trojan_AgentTesla detected on web-server-01

PRX-SD Threat Detection Alert
==============================

Host:       web-server-01
Timestamp:  2026-03-21 10:15:32 UTC
Severity:   MALICIOUS

File:       /tmp/payload.exe
SHA-256:    e3b0c44298fc1c149afbf4c8996fb924...
Size:       240 KB
Type:       PE32 executable (GUI) Intel 80386, for MS Windows

Detection:  Win_Trojan_AgentTesla
Engine:     YARA (neo23x0/signature-base)

Action Taken: Quarantined (ID: a1b2c3d4)

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

### Correo de Resumen de Escaneo

```
Subject: [PRX-SD] Scan Complete: 3 threats found in /home

PRX-SD Scan Report
===================

Host:           web-server-01
Scan Path:      /home
Started:        2026-03-21 10:00:00 UTC
Completed:      2026-03-21 10:12:45 UTC
Duration:       12 minutes 45 seconds

Files Scanned:  45,231
Threats Found:  3

Detections:
  1. /home/user/downloads/crack.exe
     Severity: MALICIOUS | Detection: Win_Trojan_Agent
     Action: Quarantined

  2. /home/user/.cache/tmp/loader.sh
     Severity: MALICIOUS | Detection: Linux_Backdoor_Generic
     Action: Quarantined

  3. /home/user/scripts/util.py
     Severity: SUSPICIOUS | Detection: Heuristic_HighEntropy
     Action: Reported

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

## Eventos Admitidos

| Evento | Incluido por Defecto | Descripción |
|--------|---------------------|-------------|
| `threat_detected` | Sí | Se encontró un archivo malicioso o sospechoso |
| `ransomware_alert` | Sí | Se detectó comportamiento de ransomware |
| `scan_completed` | No | Trabajo de escaneo finalizado (solo si se encontraron amenazas) |
| `update_completed` | No | Actualización de firmas completada |
| `update_failed` | Sí | Actualización de firmas fallida |
| `daemon_error` | Sí | El demonio encontró un error crítico |

Configura qué eventos activan correos electrónicos:

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## Limitación de Velocidad

Para prevenir inundaciones de correo electrónico durante brotes grandes:

```toml
[email.rate_limit]
max_per_hour = 10            # Maximum emails per hour
digest_mode = true           # Batch multiple alerts into a single email
digest_interval_mins = 15    # Digest batch window
```

Cuando `digest_mode` está habilitado, las alertas dentro de la ventana de resumen se combinan en un único correo electrónico de resumen en lugar de enviar notificaciones individuales.

## Verificar el Estado

```bash
sd email-alert status
```

```
Email Alert Status
  Enabled:      true
  SMTP Server:  smtp.gmail.com:587 (TLS)
  From:         prx-sd@example.com
  Recipients:   security@example.com, oncall@example.com
  Min Severity: malicious
  Events:       threat_detected, ransomware_alert, daemon_error
  Last Sent:    2026-03-21 10:15:32 UTC
  Emails Today: 2
```

## Próximos Pasos

- [Alertas por Webhook](./webhook) -- notificaciones webhook en tiempo real
- [Escaneos Programados](./schedule) -- automatizar escaneos recurrentes
- [Respuesta a Amenazas](../remediation/) -- políticas de remediación automatizadas
- [Demonio](../realtime/daemon) -- protección en segundo plano con alertas
