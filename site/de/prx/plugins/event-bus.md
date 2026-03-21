---
title: Event-Bus
description: Inter-Plugin-Event-Bus mit themenbasiertem Pub/Sub, Wildcard-Abonnements und Zustellungsgarantien in PRX.
---

# Event-Bus

Der PRX-Event-Bus ermoglicht die Kommunikation zwischen Plugins und dem Host-System uber einen themenbasierten Publish/Subscribe-Mechanismus. Plugins konnen Events veroffentlichen, Themen abonnieren und auf Lebenszyklus-Events reagieren -- alles ohne direkte Kopplung zwischen Komponenten.

## Ubersicht

Der Event-Bus bietet:

- **Themenbasiertes Routing** -- Events werden an hierarchische Themen veroffentlicht und an passende Abonnenten zugestellt
- **Wildcard-Abonnements** -- ganze Themen-Unterbaume mit Glob-Mustern abonnieren
- **Payload-Limits** -- maximal 64 KB pro Event-Payload, um Ressourcenmissbrauch zu verhindern
- **Rekursionsschutz** -- maximal 8 Ebenen von Event-ausgelosten-Event-Tiefe, um Endlosschleifen zu verhindern
- **At-most-once-Zustellung** -- Events werden ohne Persistenz oder Wiederholung an Abonnenten zugestellt

## Themenstruktur

Themen folgen einer hierarchischen, punktgetrennten Namenskonvention unter dem `prx.`-Namensraum:

```
prx.<kategorie>.<event>
```

### Eingebaute Themen

| Thema | Veroffentlicht von | Beschreibung |
|-------|-------------------|-------------|
| `prx.lifecycle.started` | Host | PRX wurde gestartet und alle Komponenten sind initialisiert |
| `prx.lifecycle.stopping` | Host | PRX fahrt herunter; Plugins sollten aufraumen |
| `prx.lifecycle.config_reloaded` | Host | Konfiguration wurde hot-reloaded |
| `prx.session.created` | Host | Eine neue Agenten-Sitzung wurde erstellt |
| `prx.session.terminated` | Host | Eine Agenten-Sitzung wurde beendet |
| `prx.session.message` | Host | Eine Nachricht wurde in einer Sitzung gesendet oder empfangen |
| `prx.channel.connected` | Host | Ein Kanal hat eine Verbindung hergestellt |
| `prx.channel.disconnected` | Host | Ein Kanal hat seine Verbindung verloren |
| `prx.channel.error` | Host | Ein Kanal hat einen Fehler festgestellt |
| `prx.tool.before_execute` | Host | Ein Werkzeug steht kurz vor der Ausfuhrung (kann abgefangen werden) |
| `prx.tool.after_execute` | Host | Eine Werkzeug-Ausfuhrung wurde abgeschlossen |
| `prx.plugin.loaded` | Host | Ein Plugin wurde geladen |
| `prx.plugin.unloaded` | Host | Ein Plugin wurde entladen |
| `prx.evolution.proposed` | Host | Ein Selbstevolutions-Vorschlag wurde generiert |
| `prx.evolution.applied` | Host | Eine Selbstevolutions-Anderung wurde angewendet |
| `prx.evolution.rolled_back` | Host | Eine Selbstevolutions-Anderung wurde zuruckgerollt |
| `prx.memory.stored` | Host | Ein Gedachtnis-Eintrag wurde gespeichert |
| `prx.memory.recalled` | Host | Erinnerungen wurden fur den Kontext abgerufen |
| `prx.cron.tick` | Host | Ein Cron-Heartbeat ist aufgetreten |

### Benutzerdefinierte Themen

Plugins konnen unter ihrem eigenen Namensraum auf benutzerdefinierte Themen veroffentlichen:

```
prx.plugin.<plugin_name>.<event>
```

Ein Wetter-Plugin konnte beispielsweise veroffentlichen:

```
prx.plugin.weather.forecast_updated
prx.plugin.weather.alert_issued
```

## Abonnement-Muster

### Exakte Ubereinstimmung

Ein einzelnes spezifisches Thema abonnieren:

```rust
event_bus.subscribe("prx.session.created", handler);
```

### Wildcard-Ubereinstimmung

Alle Themen unter einem Unterbaum mit `*` (einzelne Ebene) oder `**` (mehrere Ebenen) abonnieren:

```rust
// Alle Sitzungs-Events
event_bus.subscribe("prx.session.*", handler);

// Alle Lebenszyklus-Events
event_bus.subscribe("prx.lifecycle.*", handler);

// Alle Events eines bestimmten Plugins
event_bus.subscribe("prx.plugin.weather.*", handler);

// Alle Events (sparsam verwenden)
event_bus.subscribe("prx.**", handler);
```

| Muster | Trifft zu | Trifft nicht zu |
|--------|-----------|----------------|
| `prx.session.*` | `prx.session.created`, `prx.session.terminated` | `prx.session.message.sent` |
| `prx.session.**` | `prx.session.created`, `prx.session.message.sent` | `prx.channel.connected` |
| `prx.*.connected` | `prx.channel.connected` | `prx.channel.error` |
| `prx.**` | Alles unter `prx.` | Themen ausserhalb des `prx.`-Namensraums |

## Event-Struktur

Jedes Event enthalt:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `topic` | `String` | Der vollstandige Themenpfad (z.B. `prx.session.created`) |
| `payload` | `Vec<u8>` | Serialisierte Event-Daten (JSON nach Konvention, max. 64 KB) |
| `source` | `String` | Die Identitat des Veroffentlichers (z.B. `host`, `plugin:weather`) |
| `timestamp` | `u64` | Unix-Zeitstempel in Millisekunden |
| `correlation_id` | `Option<String>` | Optionale ID zur Nachverfolgung zusammenhangender Events |

### Payload-Format

Payloads werden nach Konvention als JSON serialisiert. Jedes Thema definiert sein eigenes Payload-Schema. Beispiel:

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

## Konfiguration

```toml
[plugins.event_bus]
enabled = true
max_payload_bytes = 65536           # 64 KB
max_recursion_depth = 8             # Endlose Event-Schleifen verhindern
max_subscribers_per_topic = 64      # Abonnenten pro Thema begrenzen
channel_capacity = 1024             # Interne Event-Queue-Kapazitat
delivery_timeout_ms = 5000          # Timeout fur langsame Abonnenten
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Event-Bus aktivieren oder deaktivieren |
| `max_payload_bytes` | `usize` | `65536` | Maximale Event-Payload-Grosse (64 KB) |
| `max_recursion_depth` | `u8` | `8` | Maximale Tiefe von Event-ausgelosten-Event-Ketten |
| `max_subscribers_per_topic` | `usize` | `64` | Maximale Abonnenten pro exaktem Thema |
| `channel_capacity` | `usize` | `1024` | Begrenzte Kanalkapazitat fur die Event-Queue |
| `delivery_timeout_ms` | `u64` | `5000` | Maximale Wartezeit, bis ein Abonnent ein Event verarbeitet |

## Event-Bus in Plugins verwenden

### PDK (Plugin Development Kit)

Das PRX-PDK bietet Hilfsfunktionen fur die Event-Bus-Interaktion innerhalb von WASM-Plugins:

```rust
use prx_pdk::event_bus;

// Events abonnieren
event_bus::subscribe("prx.session.created", |event| {
    let payload: SessionCreated = serde_json::from_slice(&event.payload)?;
    log::info!("New session: {}", payload.session_id);
    Ok(())
})?;

// Ein Event veroffentlichen
let payload = serde_json::to_vec(&MyEvent { data: "hello" })?;
event_bus::publish("prx.plugin.my_plugin.my_event", &payload)?;
```

### Abonnements im Plugin-Manifest

Plugins deklarieren ihre Abonnements in der Manifest-Datei:

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

Der Host erzwingt diese Berechtigungsdeklarationen. Ein Plugin kann keine Themen ausserhalb seiner deklarierten Berechtigungen abonnieren oder darin veroffentlichen.

## Zustellungsgarantien

Der Event-Bus bietet **At-most-once**-Zustellung:

- Events werden asynchron an alle passenden Abonnenten verteilt
- Wenn ein Abonnent langsam oder nicht reagierend ist, wird das Event nach `delivery_timeout_ms` verworfen
- Wenn die interne Event-Queue voll ist (`channel_capacity` erreicht), werden neue Events mit einer Warnung verworfen
- Es gibt keinen Persistenz-, Wiederholungs- oder Bestatigungs-Mechanismus

Fur Anwendungsfalle, die garantierte Zustellung erfordern, sollten Sie das Webhook-System oder eine externe Nachrichtenwarteschlange verwenden.

## Rekursionsschutz

Wenn ein Event-Handler ein weiteres Event veroffentlicht, entsteht eine Kette. Der Event-Bus verfolgt die Rekursionstiefe und erzwingt `max_recursion_depth`:

```
prx.session.created           ← Tiefe 0
  → Handler veroffentlicht prx.plugin.audit.session_log    ← Tiefe 1
    → Handler veroffentlicht prx.plugin.metrics.counter     ← Tiefe 2
      → ...
```

Wenn die Tiefe das Limit uberschreitet, wird das Event verworfen und eine Warnung protokolliert:

```
WARN event_bus: Recursion depth 8 exceeded for topic prx.plugin.metrics.counter, event dropped
```

## Werkzeug-Ausfuhrung abfangen

Das `prx.tool.before_execute`-Event unterstutzt Abfangen. Abonnenten konnen einen Werkzeugaufruf modifizieren oder abbrechen, bevor er ausgefuhrt wird:

```rust
event_bus::subscribe("prx.tool.before_execute", |event| {
    let mut payload: ToolBeforeExecute = serde_json::from_slice(&event.payload)?;

    // Gefahrliche Befehle blockieren
    if payload.tool_name == "shell" && payload.args.contains("rm -rf") {
        return Err(EventBusError::Rejected("Dangerous command blocked".into()));
    }

    Ok(())
})?;
```

Wenn ein Abonnent einen Fehler zuruckgibt, wird die Werkzeug-Ausfuhrung abgebrochen und der Fehler dem Agenten gemeldet.

## Uberwachung

### CLI

```bash
# Letzte Event-Bus-Aktivitat anzeigen
prx events --tail 50

# Nach Themenmuster filtern
prx events --topic "prx.session.*"

# Event-Payloads anzeigen
prx events --verbose

# Abonnenten-Zahlen anzeigen
prx events stats
```

### Metriken

Der Event-Bus stellt Prometheus-Metriken bereit:

| Metrik | Typ | Beschreibung |
|--------|-----|-------------|
| `prx_event_bus_published_total` | Counter | Gesamtzahl veroffentlichter Events nach Thema |
| `prx_event_bus_delivered_total` | Counter | Gesamtzahl an Abonnenten zugestellter Events |
| `prx_event_bus_dropped_total` | Counter | Verworfene Events (Queue voll, Timeout, Rekursion) |
| `prx_event_bus_delivery_duration_seconds` | Histogram | Zeit zur Zustellung von Events an Abonnenten |
| `prx_event_bus_subscribers` | Gauge | Aktuelle Abonnenten-Anzahl nach Thema |

## Einschrankungen

- At-most-once-Zustellung bedeutet, dass Events verloren gehen konnen, wenn die Queue voll ist oder Abonnenten langsam sind
- Der Event-Bus ist lokal fur den PRX-Prozess; Events werden nicht uber Nodes verteilt
- Die Payload-Grosse ist auf 64 KB begrenzt; grosse Daten sollten uber ID referenziert statt eingebettet werden
- Wildcard-Abonnements (insbesondere `prx.**`) konnen erhebliche Last erzeugen; sparsam verwenden
- Plugin-Event-Handler laufen in der WASM-Sandbox und konnen nicht direkt auf das Dateisystem oder Netzwerk zugreifen
- Die Event-Reihenfolge ist best-effort; Abonnenten konnen Events unter hoher Last in falscher Reihenfolge empfangen

## Verwandte Seiten

- [Plugin-System-Ubersicht](./)
- [Plugin-Architektur](./architecture) -- WASM-Laufzeit und Host-Guest-Grenze
- [Entwicklerhandbuch](./developer-guide) -- Plugins mit dem PDK erstellen
- [Host-Funktionen](./host-functions) -- Host-Funktionen fur Plugins
- [Webhooks](../gateway/webhooks) -- fur garantierte Zustellung an externe Systeme
