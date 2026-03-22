---
title: Bloqueo de Anuncios y Dominios Maliciosos
description: "Bloquea anuncios, rastreadores y dominios maliciosos a nivel DNS usando el comando sd adblock. Compatible con múltiples listas de filtros, reglas personalizadas y registro persistente."
---

# Bloqueo de Anuncios y Dominios Maliciosos

PRX-SD incluye un motor adblock integrado que bloquea anuncios, rastreadores y dominios maliciosos conocidos a nivel DNS escribiendo entradas en el archivo hosts del sistema (`/etc/hosts` en Linux/macOS, `C:\Windows\System32\drivers\etc\hosts` en Windows). Las listas de filtros se almacenan localmente en `~/.prx-sd/adblock/` y admiten tanto la sintaxis de Adblock Plus (ABP) como el formato de archivo hosts.

## Cómo Funciona

Cuando habilitas adblock, PRX-SD:

1. Descarga las listas de filtros configuradas (EasyList, abuse.ch URLhaus, etc.)
2. Analiza las reglas ABP (`||domain.com^`) y las entradas de hosts (`0.0.0.0 domain.com`)
3. Escribe todos los dominios bloqueados en el archivo hosts del sistema, apuntándolos a `0.0.0.0`
4. Registra cada consulta de dominio bloqueada en `~/.prx-sd/adblock/blocked_log.jsonl`

::: tip
Para el filtrado completo a nivel DNS con reenvío ascendente, combina adblock con el [proxy DNS](./dns-proxy). El proxy integra las reglas de adblock, los feeds de dominios IOC y las listas de bloqueo personalizadas en un único resolvedor.
:::

## Comandos

### Habilitar Protección

Descarga las listas de filtros e instala el bloqueo DNS a través del archivo hosts. Requiere privilegios de root/administrador.

```bash
sudo sd adblock enable
```

Salida:

```
>>> Enabling adblock protection...
  Loaded 4 lists (128432 rules)
success: Adblock enabled: 95211 domains blocked via /etc/hosts
  Lists: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  Log: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### Deshabilitar Protección

Elimina todas las entradas de PRX-SD del archivo hosts. Las credenciales y las listas en caché se conservan.

```bash
sudo sd adblock disable
```

### Sincronizar Listas de Filtros

Fuerza la nueva descarga de todas las listas de filtros configuradas. Si adblock está habilitado actualmente, el archivo hosts se actualiza automáticamente con las nuevas reglas.

```bash
sudo sd adblock sync
```

### Ver Estadísticas

Muestra el estado actual, las listas cargadas, el recuento de reglas y el tamaño del registro de bloqueos.

```bash
sd adblock stats
```

Salida:

```
Adblock Engine Statistics
  Status:        ENABLED
  Lists loaded:  4
  Total rules:   128432
  Cache dir:     /home/user/.prx-sd/adblock
  Last sync:     2026-03-20T14:30:00Z
  Blocked log:   1842 entries

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### Verificar una URL o Dominio

Comprueba si una URL o dominio específico está bloqueado por las listas de filtros actuales.

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

Si el dominio no está completamente calificado con un esquema, PRX-SD antepone automáticamente `https://`.

Salida:

```
BLOCKED ads.example.com -> Ads
```

o:

```
ALLOWED docs.example.com
```

### Ver el Registro de Bloqueos

Muestra las entradas bloqueadas recientes del registro JSONL persistente. El indicador `--count` controla cuántas entradas mostrar (predeterminado: 50).

```bash
sd adblock log
sd adblock log --count 100
```

Cada entrada del registro contiene una marca de tiempo, dominio, URL, categoría y fuente.

### Agregar una Lista de Filtros Personalizada

Agrega una lista de filtros de terceros o personalizada por nombre y URL. El indicador `--category` clasifica la lista (predeterminado: `unknown`).

Categorías disponibles: `ads`, `tracking`, `malware`, `social`.

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### Eliminar una Lista de Filtros

Elimina una lista de filtros previamente agregada por nombre.

```bash
sd adblock remove my-blocklist
```

## Listas de Filtros Predeterminadas

PRX-SD incluye las siguientes fuentes de filtros integradas:

| Lista | Categoría | Descripción |
|-------|-----------|-------------|
| EasyList | Anuncios | Lista de filtros de anuncios mantenida por la comunidad |
| EasyPrivacy | Rastreo | Protección contra rastreadores e identificación de huellas digitales |
| URLhaus Domains | Malware | Dominios de URLs maliciosas de abuse.ch |
| Malware Domains | Malware | Dominios conocidos de distribución de malware |

## Formato de Lista de Filtros

Las listas personalizadas pueden usar el formato de sintaxis Adblock Plus (ABP) o el formato de archivo hosts:

**Formato ABP:**

```
||ads.example.com^
||tracker.analytics.io^
```

**Formato hosts:**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

Las líneas que comienzan con `!`, `#` o `[` se tratan como comentarios y se ignoran.

## Estructura del Directorio de Datos

```
~/.prx-sd/adblock/
  enabled           # Flag file (present when adblock is active)
  config.json       # Source list configuration
  blocked_log.jsonl # Persistent block log
  lists/            # Cached filter list files
```

::: warning
Habilitar y deshabilitar adblock modifica el archivo hosts de tu sistema. Siempre usa `sd adblock disable` para eliminar las entradas de forma limpia en lugar de editar el archivo hosts manualmente. El comando requiere privilegios de root/administrador.
:::

## Ejemplos

**Flujo completo de configuración:**

```bash
# Enable with default lists
sudo sd adblock enable

# Add a custom malware blocklist
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# Re-sync to download the new list
sudo sd adblock sync

# Verify a known malicious domain is blocked
sd adblock check malware-c2.example.com

# Check stats
sd adblock stats

# View recent blocks
sd adblock log --count 20
```

**Deshabilitar y limpiar:**

```bash
sudo sd adblock disable
```

## Próximos Pasos

- Configura el [Proxy DNS](./dns-proxy) para el filtrado completo a nivel DNS con reenvío ascendente
- Configura [Alertas por Webhook](../alerts/) para recibir notificaciones cuando se bloqueen dominios
- Explora la [Referencia de CLI](../cli/) para la lista completa de comandos
