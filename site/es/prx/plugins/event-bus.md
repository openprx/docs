---
title: Bus de eventos
description: Bus de eventos inter-plugin con pub/sub basado en temas, suscripciones con comodines y garantias de entrega en PRX.
---

# Bus de eventos

El bus de eventos de PRX habilita la comunicacion entre plugins y el sistema host a traves de un mecanismo de publicacion/suscripcion basado en temas. Los plugins pueden publicar eventos, suscribirse a temas y reaccionar a eventos del ciclo de vida -- todo sin acoplamiento directo entre componentes.

## Vision general

El bus de eventos proporciona:

- **Enrutamiento basado en temas** -- los eventos se publican a temas jerarquicos y se entregan a suscriptores coincidentes
- **Suscripciones con comodines** -- suscribirse a subarboles completos de temas con patrones estilo glob
- **Limites de payload** -- maximo 64 KB por payload de evento para prevenir abuso de recursos
- **Proteccion contra recursion** -- maximo 8 niveles de profundidad de evento-desencadenado-por-evento para prevenir bucles infinitos
- **Entrega al-menos-una-vez** -- los eventos se entregan a suscriptores sin persistencia ni reintento

## Estructura de temas

Los temas siguen una convencion de nomenclatura jerarquica separada por puntos bajo el namespace `prx.`:

```
prx.<category>.<event>
```

### Temas integrados

| Tema | Publicado por | Descripcion |
|------|-------------|-------------|
| `prx.lifecycle.started` | Host | PRX ha iniciado y todos los componentes estan inicializados |
| `prx.lifecycle.stopping` | Host | PRX se esta apagando; los plugins deben limpiar |
| `prx.lifecycle.config_reloaded` | Host | La configuracion se recargo en caliente |
| `prx.session.created` | Host | Se creo una nueva sesion de agente |
| `prx.session.terminated` | Host | Se termino una sesion de agente |
| `prx.session.message` | Host | Se envio o recibio un mensaje en una sesion |
| `prx.channel.connected` | Host | Un canal establecio una conexion |
| `prx.channel.disconnected` | Host | Un canal perdio su conexion |
| `prx.channel.error` | Host | Un canal encontro un error |
| `prx.tool.before_execute` | Host | Una herramienta esta a punto de ejecutarse (puede interceptarse) |
| `prx.tool.after_execute` | Host | Se completo la ejecucion de una herramienta |
| `prx.plugin.loaded` | Host | Se cargo un plugin |
| `prx.plugin.unloaded` | Host | Se descargo un plugin |
| `prx.evolution.proposed` | Host | Se genero una propuesta de auto-evolucion |
| `prx.evolution.applied` | Host | Se aplico un cambio de auto-evolucion |
| `prx.evolution.rolled_back` | Host | Se revirtio un cambio de auto-evolucion |
| `prx.memory.stored` | Host | Se almaceno una entrada de memoria |
| `prx.memory.recalled` | Host | Se recuperaron memorias para contexto |
| `prx.cron.tick` | Host | Ocurrio un tick del heartbeat cron |

### Temas personalizados

Los plugins pueden publicar a temas personalizados bajo su propio namespace:

```
prx.plugin.<plugin_name>.<event>
```

Por ejemplo, un plugin de clima podria publicar:

```
prx.plugin.weather.forecast_updated
prx.plugin.weather.alert_issued
```

## Patrones de suscripcion

### Coincidencia exacta

Suscribirse a un unico tema especifico:

```rust
event_bus.subscribe("prx.session.created", handler);
```

### Coincidencia con comodines

Suscribirse a todos los temas bajo un subarbol usando `*` (un nivel) o `**` (multiples niveles):

```rust
// All session events
event_bus.subscribe("prx.session.*", handler);

// All lifecycle events
event_bus.subscribe("prx.lifecycle.*", handler);

// All events from a specific plugin
event_bus.subscribe("prx.plugin.weather.*", handler);

// All events (use sparingly)
event_bus.subscribe("prx.**", handler);
```

| Patron | Coincide | No coincide |
|--------|---------|-------------|
| `prx.session.*` | `prx.session.created`, `prx.session.terminated` | `prx.session.message.sent` |
| `prx.session.**` | `prx.session.created`, `prx.session.message.sent` | `prx.channel.connected` |
| `prx.*.connected` | `prx.channel.connected` | `prx.channel.error` |
| `prx.**` | Todo bajo `prx.` | Temas fuera del namespace `prx.` |

## Estructura de evento

Cada evento contiene:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `topic` | `String` | La ruta completa del tema (ej., `prx.session.created`) |
| `payload` | `Vec<u8>` | Datos del evento serializados (JSON por convencion, max 64 KB) |
| `source` | `String` | La identidad del publicador (ej., `host`, `plugin:weather`) |
| `timestamp` | `u64` | Marca de tiempo Unix en milisegundos |
| `correlation_id` | `Option<String>` | ID opcional para rastrear eventos relacionados |

### Formato de payload

Los payloads se serializan como JSON por convencion. Cada tema define su propio esquema de payload. Por ejemplo:

**`prx.session.created`:**

```json
{
  "session_id": "sess_abc123",
  "channel": "telegram",
  "user_id": "user:telegram:123456789"
}
```

**`prx.tool.after_execute`:**

```json
{
  "session_id": "sess_abc123",
  "tool_name": "shell",
  "command": "ls -la /tmp",
  "duration_ms": 45,
  "success": true
}
```

## Configuracion

```toml
[plugins.event_bus]
enabled = true
max_payload_bytes = 65536           # 64 KB
max_recursion_depth = 8             # prevent infinite event loops
max_subscribers_per_topic = 64      # limit subscribers per topic
channel_capacity = 1024             # internal event queue capacity
delivery_timeout_ms = 5000          # timeout for slow subscribers
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar o deshabilitar el bus de eventos |
| `max_payload_bytes` | `usize` | `65536` | Tamano maximo del payload de evento (64 KB) |
| `max_recursion_depth` | `u8` | `8` | Profundidad maxima de cadenas de evento-desencadenado-por-evento |
| `max_subscribers_per_topic` | `usize` | `64` | Suscriptores maximos por tema exacto |
| `channel_capacity` | `usize` | `1024` | Capacidad del canal acotado para la cola de eventos |
| `delivery_timeout_ms` | `u64` | `5000` | Tiempo maximo de espera para que un suscriptor procese un evento |

## Usar el bus de eventos en plugins

### PDK (Kit de Desarrollo de Plugins)

El PDK de PRX proporciona funciones auxiliares para la interaccion con el bus de eventos dentro de plugins WASM:

```rust
use prx_pdk::event_bus;

// Subscribe to events
event_bus::subscribe("prx.session.created", |event| {
    let payload: SessionCreated = serde_json::from_slice(&event.payload)?;
    log::info!("New session: {}", payload.session_id);
    Ok(())
})?;

// Publish an event
let payload = serde_json::to_vec(&MyEvent { data: "hello" })?;
event_bus::publish("prx.plugin.my_plugin.my_event", &payload)?;
```

### Suscripcion en el manifiesto del plugin

Los plugins declaran sus suscripciones en el archivo de manifiesto:

```toml
# plugin.toml
[plugin]
name = "my-plugin"
version = "1.0.0"

[permissions]
event_bus_subscribe = [
    "prx.session.*",
    "prx.tool.after_execute",
]
event_bus_publish = [
    "prx.plugin.my_plugin.*",
]
```

El host aplica estas declaraciones de permisos. Un plugin no puede suscribirse a ni publicar temas fuera de sus permisos declarados.

## Garantias de entrega

El bus de eventos proporciona entrega **al-menos-una-vez**:

- Los eventos se despachan a todos los suscriptores coincidentes de forma asincrona
- Si un suscriptor es lento o no responde, el evento se descarta despues de `delivery_timeout_ms`
- Si la cola interna de eventos esta llena (se alcanzo `channel_capacity`), los nuevos eventos se descartan con una advertencia
- No hay mecanismo de persistencia, reintento ni acuse de recibo

Para casos de uso que requieran entrega garantizada, considera usar el sistema de webhooks o una cola de mensajes externa.

## Proteccion contra recursion

Cuando un manejador de evento publica otro evento, crea una cadena. El bus de eventos rastrea la profundidad de recursion y aplica `max_recursion_depth`:

```
prx.session.created           ← depth 0
  → handler publishes prx.plugin.audit.session_log    ← depth 1
    → handler publishes prx.plugin.metrics.counter     ← depth 2
      → ...
```

Si la profundidad excede el limite, el evento se descarta y se registra una advertencia:

```
WARN event_bus: Recursion depth 8 exceeded for topic prx.plugin.metrics.counter, event dropped
```

## Intercepcion de ejecucion de herramientas

El evento `prx.tool.before_execute` soporta intercepcion. Los suscriptores pueden modificar o cancelar una llamada a herramienta antes de que se ejecute:

```rust
event_bus::subscribe("prx.tool.before_execute", |event| {
    let mut payload: ToolBeforeExecute = serde_json::from_slice(&event.payload)?;

    // Block dangerous commands
    if payload.tool_name == "shell" && payload.args.contains("rm -rf") {
        return Err(EventBusError::Rejected("Dangerous command blocked".into()));
    }

    Ok(())
})?;
```

Cuando cualquier suscriptor devuelve un error, la ejecucion de la herramienta se cancela y el error se reporta al agente.

## Monitoreo

### CLI

```bash
# View recent event bus activity
prx events --tail 50

# Filter by topic pattern
prx events --topic "prx.session.*"

# Show event payloads
prx events --verbose

# View subscriber counts
prx events stats
```

### Metricas

El bus de eventos expone metricas de Prometheus:

| Metrica | Tipo | Descripcion |
|---------|------|-------------|
| `prx_event_bus_published_total` | Counter | Total de eventos publicados por tema |
| `prx_event_bus_delivered_total` | Counter | Total de eventos entregados a suscriptores |
| `prx_event_bus_dropped_total` | Counter | Eventos descartados (cola llena, timeout, recursion) |
| `prx_event_bus_delivery_duration_seconds` | Histogram | Tiempo para entregar eventos a suscriptores |
| `prx_event_bus_subscribers` | Gauge | Conteo actual de suscriptores por tema |

## Limitaciones

- La entrega al-menos-una-vez significa que los eventos pueden perderse si la cola esta llena o los suscriptores son lentos
- El bus de eventos es local al proceso PRX; los eventos no se distribuyen entre nodos
- El tamano del payload esta limitado a 64 KB; datos grandes deben referenciarse por ID en lugar de embeberse
- Las suscripciones con comodines (especialmente `prx.**`) pueden generar carga significativa; usar con moderacion
- Los manejadores de eventos de plugins se ejecutan en el sandbox WASM y no pueden acceder directamente al sistema de archivos ni a la red
- El ordenamiento de eventos es de mejor esfuerzo; los suscriptores pueden recibir eventos fuera de orden bajo alta carga

## Paginas relacionadas

- [Vision general del sistema de plugins](./)
- [Arquitectura de plugins](./architecture) -- runtime WASM y frontera host-guest
- [Guia del desarrollador](./developer-guide) -- construir plugins con el PDK
- [Funciones del host](./host-functions) -- funciones del host disponibles para plugins
- [Webhooks](../gateway/webhooks) -- para entrega garantizada a sistemas externos
