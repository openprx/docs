---
title: Resolución de Problemas
description: "Soluciones para los problemas más comunes de PRX-WAF, incluyendo conexión a la base de datos, carga de reglas, falsos positivos, sincronización del clúster, certificados SSL y ajuste de rendimiento."
---

# Resolución de Problemas

Esta página cubre los problemas más comunes al ejecutar PRX-WAF, junto con sus causas y soluciones.

## Error de Conexión a la Base de Datos

**Síntomas:** PRX-WAF falla al iniciar con errores de "connection refused" o "authentication failed".

**Soluciones:**

1. **Verifica que PostgreSQL esté en ejecución:**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **Prueba la conectividad:**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. **Verifica la cadena de conexión** en tu configuración TOML:

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. **Ejecuta las migraciones** si la base de datos existe pero faltan las tablas:

```bash
prx-waf -c configs/default.toml migrate
```

## Las Reglas No Cargan

**Síntomas:** PRX-WAF inicia pero no hay reglas activas. Los ataques no son detectados.

**Soluciones:**

1. **Verifica las estadísticas de reglas:**

```bash
prx-waf rules stats
```

Si la salida muestra 0 reglas, el directorio de reglas puede estar vacío o mal configurado.

2. **Verifica la ruta del directorio de reglas** en tu configuración:

```toml
[rules]
dir = "rules/"
```

3. **Valida los archivos de reglas:**

```bash
python rules/tools/validate.py rules/
```

4. **Comprueba errores de sintaxis YAML** -- un único archivo malformado puede evitar que se carguen todas las reglas:

```bash
# Validate one file at a time to find the problem
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **Asegúrate de que las reglas integradas estén habilitadas:**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## La Recarga en Caliente No Funciona

**Síntomas:** Los archivos de reglas se modifican pero los cambios no surten efecto.

**Soluciones:**

1. **Verifica que la recarga en caliente esté habilitada:**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **Activa una recarga manual:**

```bash
prx-waf rules reload
```

3. **Envía SIGHUP:**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **Verifica los límites de observación del sistema de archivos** (Linux):

```bash
cat /proc/sys/fs/inotify/max_user_watches
# If too low, increase:
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Falsos Positivos

**Síntomas:** Las solicitudes legítimas están siendo bloqueadas (403 Forbidden).

**Soluciones:**

1. **Identifica la regla de bloqueo** en los eventos de seguridad:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

Busca el campo `rule_id` en el evento.

2. **Deshabilita la regla específica:**

```bash
prx-waf rules disable CRS-942100
```

3. **Reduce el nivel de paranoia.** Si estás ejecutando en paranoia 2+, intenta reducir a 1.

4. **Cambia la regla al modo de registro** para monitoreo en lugar de bloqueo:

Edita el archivo de reglas y cambia `action: "block"` a `action: "log"`, luego recarga:

```bash
prx-waf rules reload
```

5. **Agrega una lista blanca de IPs** para fuentes de confianza:

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
Al implementar nuevas reglas, comienza con `action: log` para monitorear falsos positivos antes de cambiar a `action: block`.
:::

## Problemas con Certificados SSL

**Síntomas:** Las conexiones HTTPS fallan, errores de certificados o falla la renovación de Let's Encrypt.

**Soluciones:**

1. **Verifica el estado del certificado** en la interfaz de administración bajo **Certificados SSL**.

2. **Verifica que el puerto 80 sea accesible** desde internet para los desafíos ACME HTTP-01.

3. **Verifica las rutas de los certificados** si usas certificados manuales:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **Verifica que el certificado coincida con el dominio:**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## Los Nodos del Clúster No Se Conectan

**Síntomas:** Los nodos trabajadores no pueden unirse al clúster. El estado muestra pares "disconnected".

**Soluciones:**

1. **Verifica la conectividad de red** en el puerto del clúster (predeterminado: UDP 16851):

```bash
# From worker to main
nc -zuv node-a 16851
```

2. **Verifica las reglas del firewall** -- la comunicación del clúster usa UDP:

```bash
sudo ufw allow 16851/udp
```

3. **Verifica los certificados** -- todos los nodos deben usar certificados firmados por la misma CA:

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. **Verifica la configuración de seeds** en los nodos trabajadores:

```toml
[cluster]
seeds = ["node-a:16851"]   # Must resolve to the main node
```

5. **Revisa los registros** con mayor verbosidad:

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## Uso Elevado de Memoria

**Síntomas:** El proceso PRX-WAF consume más memoria de la esperada.

**Soluciones:**

1. **Reduce el tamaño de la caché de respuestas:**

```toml
[cache]
max_size_mb = 128    # Reduce from default 256
```

2. **Reduce el pool de conexiones a la base de datos:**

```toml
[storage]
max_connections = 10   # Reduce from default 20
```

3. **Reduce los hilos de trabajo:**

```toml
[proxy]
worker_threads = 2    # Reduce from CPU count
```

4. **Monitorea el uso de memoria:**

```bash
ps aux | grep prx-waf
```

## Problemas de Conexión con CrowdSec

**Síntomas:** La integración con CrowdSec muestra "disconnected" o las decisiones no se cargan.

**Soluciones:**

1. **Prueba la conectividad LAPI:**

```bash
prx-waf crowdsec test
```

2. **Verifica la clave de API:**

```bash
# On the CrowdSec machine
cscli bouncers list
```

3. **Verifica la URL del LAPI:**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. **Establece una acción de reserva segura** para cuando el LAPI no sea accesible:

```toml
[crowdsec]
fallback_action = "log"    # Don't block when LAPI is down
```

## Ajuste de Rendimiento

### Tiempos de Respuesta Lentos

1. **Habilita la caché de respuestas:**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **Aumenta los hilos de trabajo:**

```toml
[proxy]
worker_threads = 8
```

3. **Aumenta las conexiones a la base de datos:**

```toml
[storage]
max_connections = 50
```

### Uso Elevado de CPU

1. **Reduce el número de reglas activas.** Deshabilita las reglas de paranoia nivel 3-4 si no son necesarias.

2. **Deshabilita las fases de detección no utilizadas.** Por ejemplo, si no usas CrowdSec:

```toml
[crowdsec]
enabled = false
```

## Obtener Ayuda

Si ninguna de las soluciones anteriores resuelve tu problema:

1. **Revisa los problemas existentes:** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. **Crea un nuevo problema** con:
   - Versión de PRX-WAF
   - Sistema operativo y versión del kernel
   - Archivo de configuración (con contraseñas redactadas)
   - Salida relevante de los registros
   - Pasos para reproducir

## Próximos Pasos

- [Referencia de Configuración](../configuration/reference) -- Ajustar todos los ajustes
- [Motor de Reglas](../rules/) -- Comprender cómo se evalúan las reglas
- [Modo Clúster](../cluster/) -- Resolución de problemas específicos del clúster
