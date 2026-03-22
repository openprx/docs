---
title: Respuesta a Amenazas
description: "Configura la remediación automática de amenazas con políticas de respuesta, limpieza de persistencia y aislamiento de red."
---

# Respuesta a Amenazas

El motor de remediación de PRX-SD proporciona respuesta automatizada a amenazas más allá de la simple detección. Cuando se identifica una amenaza, el motor puede tomar acciones graduales que van desde el registro hasta el aislamiento completo de red, dependiendo de la política configurada.

## Tipos de Respuesta

| Acción | Descripción | Reversible | Requiere Root |
|--------|-------------|-----------|--------------|
| **Reportar** | Registrar la detección y continuar. No se toman acciones sobre el archivo. | N/D | No |
| **Cuarentena** | Cifrar y mover el archivo al almacén de cuarentena. | Sí | No |
| **Bloquear** | Denegar el acceso/ejecución del archivo vía fanotify (solo tiempo real en Linux). | Sí | Sí |
| **Matar** | Terminar el proceso que creó o está usando el archivo malicioso. | No | Sí |
| **Limpiar** | Eliminar el contenido malicioso del archivo preservando el original (p. ej., eliminación de macros de documentos Office). | Parcial | No |
| **Eliminar** | Eliminar permanentemente el archivo malicioso del disco. | No | No |
| **Aislar** | Bloquear todo el acceso a la red para la máquina usando reglas de firewall. | Sí | Sí |
| **Lista de bloqueo** | Agregar el hash del archivo a la lista de bloqueo local para futuros escaneos. | Sí | No |

## Configuración de Políticas

### Usando Comandos sd policy

```bash
# Show current policy
sd policy show

# Set policy for malicious detections
sd policy set on_malicious quarantine

# Set policy for suspicious detections
sd policy set on_suspicious report

# Reset to defaults
sd policy reset
```

### Ejemplo de Salida

```bash
sd policy show
```

```
Threat Response Policy
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### Archivo de Configuración

Establece las políticas en `~/.prx-sd/config.toml`:

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # auto-add malicious hashes to local blocklist
clean_persistence = true        # remove persistence mechanisms on malicious detection
network_isolate = false         # enable network isolation for critical threats

[policy.notify]
webhook = true
email = false

[policy.escalation]
# Escalate to stronger action if same threat reappears
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
Las políticas `on_malicious` y `on_suspicious` aceptan diferentes conjuntos de acciones. Las acciones destructivas como `kill` y `delete` solo están disponibles para `on_malicious`.
:::

## Limpieza de Persistencia

Cuando `clean_persistence` está habilitado, PRX-SD busca y elimina los mecanismos de persistencia que el malware puede haber instalado. Esto se ejecuta automáticamente después de poner en cuarentena o eliminar una amenaza.

### Puntos de Persistencia en Linux

| Ubicación | Técnica | Acción de Limpieza |
|-----------|---------|-------------------|
| `/etc/cron.d/`, `/var/spool/cron/` | Trabajos cron | Eliminar entradas cron maliciosas |
| `/etc/systemd/system/` | Servicios systemd | Deshabilitar y eliminar unidades maliciosas |
| `~/.config/systemd/user/` | Servicios systemd de usuario | Deshabilitar y eliminar |
| `~/.bashrc`, `~/.profile` | Inyección en RC de shell | Eliminar líneas inyectadas |
| `~/.ssh/authorized_keys` | Claves backdoor SSH | Eliminar claves no autorizadas |
| `/etc/ld.so.preload` | Secuestro LD_PRELOAD | Eliminar entradas de precarga maliciosas |
| `/etc/init.d/` | Scripts init SysV | Eliminar scripts maliciosos |

### Puntos de Persistencia en macOS

| Ubicación | Técnica | Acción de Limpieza |
|-----------|---------|-------------------|
| `~/Library/LaunchAgents/` | Plists de LaunchAgent | Descargar y eliminar |
| `/Library/LaunchDaemons/` | Plists de LaunchDaemon | Descargar y eliminar |
| `~/Library/Application Support/` | Elementos de inicio de sesión | Eliminar elementos maliciosos |
| `/Library/StartupItems/` | Elementos de inicio | Eliminar |
| `~/.zshrc`, `~/.bash_profile` | Inyección en RC de shell | Eliminar líneas inyectadas |
| Keychain | Abuso de Keychain | Alertar (sin limpieza automática) |

### Puntos de Persistencia en Windows

| Ubicación | Técnica | Acción de Limpieza |
|-----------|---------|-------------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | Claves de registro Run | Eliminar valores maliciosos |
| `HKLM\SYSTEM\CurrentControlSet\Services` | Servicios maliciosos | Detener, deshabilitar y eliminar |
| Carpeta `Startup` | Accesos directos de inicio | Eliminar accesos directos maliciosos |
| Programador de tareas | Tareas programadas | Eliminar tareas maliciosas |
| Suscripciones WMI | Consumidores de eventos WMI | Eliminar suscripciones maliciosas |

::: warning
La limpieza de persistencia modifica archivos de configuración del sistema y entradas del registro. Revisa el log de limpieza en `~/.prx-sd/remediation.log` después de cada operación para verificar que solo se eliminaron entradas maliciosas.
:::

## Aislamiento de Red

Para amenazas críticas (ransomware activo, exfiltración de datos), PRX-SD puede aislar la máquina de la red:

### Linux (iptables)

```bash
# PRX-SD adds these rules automatically when isolating
iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD configures pf rules
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

Levantar el aislamiento:

```bash
sd isolate lift
```

::: warning
El aislamiento de red bloquea TODO el tráfico de red incluyendo SSH. Asegúrate de tener acceso físico o de consola fuera de banda antes de habilitar el aislamiento automático de red.
:::

## Log de Remediación

Todas las acciones de remediación se registran en `~/.prx-sd/remediation.log`:

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## Ejemplos

```bash
# Set aggressive policy for servers
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# Set conservative policy for workstations
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# Scan with explicit remediation
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# Check and lift network isolation
sd isolate status
sd isolate lift

# View remediation history
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## Próximos Pasos

- [Gestión de Cuarentena](../quarantine/) -- gestionar archivos en cuarentena
- [Protección contra Ransomware](../realtime/ransomware) -- respuesta especializada a ransomware
- [Alertas por Webhook](../alerts/webhook) -- notificar sobre acciones de remediación
- [Alertas por Correo Electrónico](../alerts/email) -- notificaciones por correo electrónico para amenazas
