---
title: Remote-Nodes
description: Remote-PRX-Nodes fur verteilte Agentenausfuhrung uber mehrere Maschinen hinweg verwalten und mit ihnen kommunizieren.
---

# Remote-Nodes

Das `nodes`-Werkzeug ermoglicht PRX-Agenten die Interaktion mit Remote-PRX-Instanzen in einer verteilten Bereitstellung. Ein Node ist ein separater PRX-Daemon, der auf einer anderen Maschine lauft -- potenziell mit unterschiedlichen Hardwarefahigkeiten, Netzwerkzugriff oder Werkzeugkonfigurationen -- und der mit der Controller-Instanz gepaart wurde.

Uber das `nodes`-Werkzeug kann ein Agent verfugbare Nodes entdecken, ihren Gesundheitszustand prufen, Aufgaben an Nodes mit spezialisierten Fahigkeiten (z.B. GPU-Zugriff) weiterleiten und Ergebnisse abrufen. Dies ermoglicht Arbeitslastverteilung, Umgebungsspezialisierung und geografische Verteilung von Agentenaufgaben.

Das `nodes`-Werkzeug ist in der `all_tools()`-Registry registriert und immer verfugbar. Die tatsachliche Funktionalitat hangt von der Node-Konfiguration ab und davon, ob Remote-Peers gepaart wurden.

## Konfiguration

### Controller-Modus

Der Controller ist die primare PRX-Instanz, die Arbeit uber Nodes orchestriert:

```toml
[node]
mode = "controller"
node_id = "primary"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"          # "static" | "mdns"
peers = [
  "192.168.1.101:3121",   # GPU-Host
  "192.168.1.102:3121",   # Staging-Umgebung
]
```

### Node-Modus

Ein Node ist eine PRX-Instanz, die delegierte Arbeit von einem Controller annimmt:

```toml
[node]
mode = "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.101:3121"
controller = "192.168.1.100:3121"
```

### Erkennungsmethoden

| Methode | Beschreibung | Anwendungsfall |
|---------|-------------|---------------|
| `static` | Explizite Liste von Peer-Adressen in der Konfiguration | Bekannte, stabile Infrastruktur |
| `mdns` | Automatische Erkennung uber Multicast-DNS im lokalen Netzwerk | Dynamische Umgebungen, Entwicklung |

```toml
# mDNS-Erkennung
[node.discovery]
method = "mdns"
service_name = "_prx._tcp.local."
```

## Verwendung

### Verfugbare Nodes auflisten

Alle gepaarten Remote-Nodes mit ihrem Status entdecken und auflisten:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "list"
  }
}
```

**Beispielantwort:**

```
Nodes:
  1. gpu-host-01 (192.168.1.101:3121) - ONLINE
     Capabilities: gpu, cuda, python
     Load: 23%

  2. staging-01 (192.168.1.102:3121) - ONLINE
     Capabilities: docker, network-access
     Load: 5%
```

### Node-Gesundheit prufen

Den Gesundheitszustand und die Fahigkeiten eines bestimmten Nodes abfragen:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "health",
    "node_id": "gpu-host-01"
  }
}
```

### Aufgabe an Node senden

Eine Aufgabe an einen bestimmten Remote-Node zur Ausfuhrung weiterleiten:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "send",
    "node_id": "gpu-host-01",
    "task": "Run the ML inference pipeline on the uploaded dataset."
  }
}
```

### Node-Ergebnisse abrufen

Ergebnisse einer zuvor gesendeten Aufgabe abrufen:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "result",
    "task_id": "task_xyz789"
  }
}
```

## Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `action` | `string` | Ja | -- | Node-Aktion: `"list"`, `"health"`, `"send"`, `"result"`, `"capabilities"` |
| `node_id` | `string` | Bedingt | -- | Ziel-Node-Bezeichner (erforderlich fur `"health"`, `"send"`) |
| `task` | `string` | Bedingt | -- | Aufgabenbeschreibung (erforderlich fur `"send"`) |
| `task_id` | `string` | Bedingt | -- | Aufgabenbezeichner (erforderlich fur `"result"`) |

**Ruckgabe:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | `bool` | `true`, wenn die Operation abgeschlossen wurde |
| `output` | `string` | Operationsergebnis (Node-Liste, Gesundheitsstatus, Aufgabenergebnis usw.) |
| `error` | `string?` | Fehlermeldung, wenn die Operation fehlschlug (Node nicht erreichbar, Aufgabe nicht gefunden usw.) |

## Architektur

Das PRX-Node-System verwendet eine Controller-Node-Topologie:

```
┌──────────────────┐         ┌──────────────────┐
│   Controller     │         │   Node A         │
│   (primarer PRX) │◄──────► │   (gpu-host-01)  │
│                  │  mTLS   │   GPU, CUDA      │
│   Agentenschleife│         │   Lokale Tools   │
│   ├── nodes Tool │         └──────────────────┘
│   └── delegate   │
│                  │         ┌──────────────────┐
│                  │◄──────► │   Node B         │
│                  │  mTLS   │   (staging-01)   │
│                  │         │   Docker, Net    │
└──────────────────┘         └──────────────────┘
```

### Kommunikationsprotokoll

Nodes kommunizieren uber ein benutzerdefiniertes Protokoll uber TCP mit gegenseitiger TLS-Authentifizierung (mTLS):

1. **Pairing**: Ein Node wird mit einem Controller uber einen Challenge-Response-Handshake gepaart (siehe [Node-Pairing](/de/prx/nodes/pairing))
2. **Heartbeat**: Gepaarte Nodes senden periodische Heartbeats, um Gesundheit und Fahigkeiten zu melden
3. **Aufgabenverteilung**: Der Controller sendet Aufgaben mit serialisiertem Kontext an Nodes
4. **Ergebnisruckgabe**: Nodes geben Aufgabenergebnisse mit strukturierter Ausgabe zuruck

### Fahigkeitsbekanntmachung

Jeder Node gibt seine Fahigkeiten bekannt, die der Controller fur intelligentes Aufgaben-Routing verwendet:

- **Hardware**: `gpu`, `cuda`, `tpu`, `high-memory`
- **Software**: `docker`, `python`, `rust`, `nodejs`
- **Netzwerk**: `network-access`, `vpn-connected`, `internal-network`
- **Werkzeuge**: Liste der auf dem Node verfugbaren PRX-Werkzeuge

## Haufige Muster

### GPU-beschleunigte Aufgaben

ML- und rechenintensive Aufgaben an GPU-ausgestattete Nodes weiterleiten:

```
Agent: Der Benutzer mochte eine Bildklassifizierung durchfuhren.
  1. [nodes] action="list" → findet gpu-host-01 mit CUDA
  2. [nodes] action="send", node_id="gpu-host-01", task="Run image classification on /data/images/"
  3. [wartet auf Abschluss]
  4. [nodes] action="result", task_id="task_abc123"
```

### Umgebungsisolation

Nodes fur Aufgaben verwenden, die bestimmte Umgebungen erfordern:

```
Agent: Muss das Bereitstellungsskript in einer Staging-Umgebung testen.
  1. [nodes] action="send", node_id="staging-01", task="Run deploy.sh and verify all services start"
  2. [nodes] action="result", task_id="task_def456"
```

### Lastverteilung

Arbeit uber mehrere Nodes zur parallelen Ausfuhrung verteilen:

```
Agent: 3 Datensatze gleichzeitig verarbeiten.
  1. [nodes] action="send", node_id="node-a", task="Process dataset-1.csv"
  2. [nodes] action="send", node_id="node-b", task="Process dataset-2.csv"
  3. [nodes] action="send", node_id="node-c", task="Process dataset-3.csv"
  4. [Ergebnisse von allen dreien sammeln]
```

## Sicherheit

### Gegenseitige TLS-Authentifizierung

Jede Node-Kommunikation verwendet mTLS. Sowohl der Controller als auch der Node mussen wahrend des TLS-Handshakes gultige Zertifikate vorlegen. Zertifikate werden wahrend des Pairing-Prozesses ausgetauscht.

### Pairing-Anforderung

Nodes mussen einen Pairing-Handshake abschliessen, bevor sie Aufgaben austauschen konnen. Nicht gepaarte Nodes werden auf Verbindungsebene abgelehnt. Siehe [Node-Pairing](/de/prx/nodes/pairing) fur das Pairing-Protokoll.

### Aufgabenisolation

An Remote-Nodes gesendete Aufgaben werden innerhalb der Sicherheitsrichtlinie des Nodes ausgefuhrt. Die Sandbox-Konfiguration, Werkzeugbeschrankungen und Ressourcenlimits des Nodes gelten unabhangig von den Einstellungen des Controllers.

### Netzwerksicherheit

- Node-Kommunikationsports sollten per Firewall nur fur bekannte Controller-/Node-Adressen erlaubt werden
- mDNS-Erkennung ist auf das lokale Netzwerksegment beschrankt
- Statische Peer-Listen werden fur Produktionsbereitstellungen empfohlen

### Richtlinien-Engine

Das `nodes`-Werkzeug unterliegt der Sicherheitsrichtlinie:

```toml
[security.tool_policy.tools]
nodes = "supervised"       # Genehmigung erfordern, bevor Aufgaben an Remote-Nodes gesendet werden
```

## Verwandte Seiten

- [Remote-Nodes](/de/prx/nodes/) -- Node-System-Architektur
- [Node-Pairing](/de/prx/nodes/pairing) -- Pairing-Protokoll und Zertifikataustausch
- [Kommunikationsprotokoll](/de/prx/nodes/protocol) -- Wire-Protokoll-Details
- [Sicherheits-Pairing](/de/prx/security/pairing) -- Sicherheitsmodell fur Gerate-Pairing
- [Sitzungen & Agenten](/de/prx/tools/sessions) -- Alternative fur lokale Multi-Agenten-Ausfuhrung
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
