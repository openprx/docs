---
title: მოვლენათა ავტობუსი
description: Inter-plugin event bus with topic-based pub/sub, wildcard subscriptions, and delivery guarantees in PRX.
---

# Event Bus

The PRX event bus enables communication between plugins and the host system through a topic-based publish/subscribe mechanism. Plugins can publish events, subscribe to topics, and react to lifecycle events -- all without direct coupling between components.

## მიმოხილვა

The event bus provides:

- **Topic-based routing** -- events are published to hierarchical topics and delivered to matching subscribers
- **Wildcard subscriptions** -- subscribe to entire topic subtrees with glob-style patterns
- **Payload limits** -- maximum 64 KB per event payload to prevent resource abuse
- **Recursion protection** -- maximum 8 levels of event-triggered-event depth to prevent infinite loops
- **At-most-once delivery** -- events are delivered to subscribers without persistence or retry

## Topic Structure

Topics follow a hierarchical dot-separated naming convention under the `prx.` namespace:

```
prx.<category>.<event>
```

### Built-in Topics

| Topic | Published By | Description |
|-------|-------------|-------------|
| `prx.lifecycle.started` | Host | PRX has started and all components are initialized |
| `prx.lifecycle.stopping` | Host | PRX is shutting down; plugins should clean up |
| `prx.lifecycle.config_reloaded` | Host | Configuration was hot-reloaded |
| `prx.session.created` | Host | A new agent session was created |
| `prx.session.terminated` | Host | An agent session was terminated |
| `prx.session.message` | Host | A message was sent or received in a session |
| `prx.channel.connected` | Host | A channel established a connection |
| `prx.channel.disconnected` | Host | A channel lost its connection |
| `prx.channel.error` | Host | A channel encountered an error |
| `prx.tool.before_execute` | Host | A tool is about to be executed (can be intercepted) |
| `prx.tool.after_execute` | Host | A tool execution completed |
| `prx.plugin.loaded` | Host | A plugin was loaded |
| `prx.plugin.unloaded` | Host | A plugin was unloaded |
| `prx.evolution.proposed` | Host | A self-evolution proposal was generated |
| `prx.evolution.applied` | Host | A self-evolution change was applied |
| `prx.evolution.rolled_back` | Host | A self-evolution change was rolled back |
| `prx.memory.stored` | Host | A memory entry was stored |
| `prx.memory.recalled` | Host | Memories were recalled for context |
| `prx.cron.tick` | Host | A cron heartbeat occurred |

### Custom Topics

Plugins can publish to custom topics under their own namespace:

```
prx.plugin.<plugin_name>.<event>
```

For example, a weather plugin might publish:

```
prx.plugin.weather.forecast_updated
prx.plugin.weather.alert_issued
```

## Subscription Patterns

### Exact Match

Subscribe to a single specific topic:

```rust
event_bus.subscribe("prx.session.created", handler);
```

### Wildcard Match

Subscribe to all topics under a subtree using `*` (single level) or `**` (multi-level):

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

| Pattern | Matches | Does Not Match |
|---------|---------|---------------|
| `prx.session.*` | `prx.session.created`, `prx.session.terminated` | `prx.session.message.sent` |
| `prx.session.**` | `prx.session.created`, `prx.session.message.sent` | `prx.channel.connected` |
| `prx.*.connected` | `prx.channel.connected` | `prx.channel.error` |
| `prx.**` | Everything under `prx.` | Topics outside the `prx.` namespace |

## Event Structure

Each event contains:

| Field | Type | Description |
|-------|------|-------------|
| `topic` | `String` | The full topic path (e.g., `prx.session.created`) |
| `payload` | `Vec<u8>` | Serialized event data (JSON by convention, max 64 KB) |
| `source` | `String` | The publisher's identity (e.g., `host`, `plugin:weather`) |
| `timestamp` | `u64` | Unix timestamp in milliseconds |
| `correlation_id` | `Option<String>` | Optional ID for tracing related events |

### Payload Format

Payloads are serialized as JSON by convention. Each topic defines its own payload schema. For example:

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

## კონფიგურაცია

```toml
[plugins.event_bus]
enabled = true
max_payload_bytes = 65536           # 64 KB
max_recursion_depth = 8             # prevent infinite event loops
max_subscribers_per_topic = 64      # limit subscribers per topic
channel_capacity = 1024             # internal event queue capacity
delivery_timeout_ms = 5000          # timeout for slow subscribers
```

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable or disable the event bus |
| `max_payload_bytes` | `usize` | `65536` | Maximum event payload size (64 KB) |
| `max_recursion_depth` | `u8` | `8` | Maximum depth of event-triggered-event chains |
| `max_subscribers_per_topic` | `usize` | `64` | Maximum subscribers per exact topic |
| `channel_capacity` | `usize` | `1024` | Bounded channel capacity for the event queue |
| `delivery_timeout_ms` | `u64` | `5000` | Maximum time to wait for a subscriber to process an event |

## Using the Event Bus in Plugins

### PDK (Plugin Development Kit)

The PRX PDK provides helper functions for event bus interaction within WASM plugins:

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

### Subscribing in Plugin Manifest

Plugins declare their subscriptions in the manifest file:

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

The host enforces these permission declarations. A plugin cannot subscribe to or publish topics outside its declared permissions.

## Delivery Guarantees

The event bus provides **at-most-once** delivery:

- Events are dispatched to all matching subscribers asynchronously
- If a subscriber is slow or unresponsive, the event is dropped after `delivery_timeout_ms`
- If the internal event queue is full (`channel_capacity` reached), new events are dropped with a warning
- There is no persistence, retry, or acknowledgement mechanism

For use cases requiring guaranteed delivery, consider using the webhook system or an external message queue.

## Recursion Protection

When an event handler publishes another event, it creates a chain. The event bus tracks the recursion depth and enforces `max_recursion_depth`:

```
prx.session.created           ← depth 0
  → handler publishes prx.plugin.audit.session_log    ← depth 1
    → handler publishes prx.plugin.metrics.counter     ← depth 2
      → ...
```

If the depth exceeds the limit, the event is dropped and a warning is logged:

```
WARN event_bus: Recursion depth 8 exceeded for topic prx.plugin.metrics.counter, event dropped
```

## Intercepting Tool Execution

The `prx.tool.before_execute` event supports interception. Subscribers can modify or cancel a tool call before it runs:

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

When any subscriber returns an error, the tool execution is cancelled and the error is reported to the agent.

## Monitoring

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

### Metrics

The event bus exposes Prometheus metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `prx_event_bus_published_total` | Counter | Total events published by topic |
| `prx_event_bus_delivered_total` | Counter | Total events delivered to subscribers |
| `prx_event_bus_dropped_total` | Counter | Events dropped (queue full, timeout, recursion) |
| `prx_event_bus_delivery_duration_seconds` | Histogram | Time to deliver events to subscribers |
| `prx_event_bus_subscribers` | Gauge | Current subscriber count by topic |

## შეზღუდვები

- At-most-once delivery means events can be lost if the queue is full or subscribers are slow
- The event bus is local to the PRX process; events are not distributed across nodes
- Payload size is capped at 64 KB; large data should be referenced by ID rather than embedded
- Wildcard subscriptions (especially `prx.**`) can generate significant load; use sparingly
- Plugin event handlers run in the WASM sandbox and cannot access the filesystem or network directly
- Event ordering is best-effort; subscribers may receive events out of order under high load

## Related Pages

- [Plugin System Overview](./)
- [Plugin Architecture](./architecture) -- WASM runtime and host-guest boundary
- [Developer Guide](./developer-guide) -- building plugins with the PDK
- [Host Functions](./host-functions) -- host functions available to plugins
- [Webhooks](../gateway/webhooks) -- for guaranteed delivery to external systems
