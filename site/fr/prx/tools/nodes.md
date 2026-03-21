---
title: Remote Nodes
description: Manage and communicate with remote PRX nodes for distributed agent execution across machines.
---

# Remote Nondes

L'outil `nodes` permet aux agents PRX d'interagir avec des instances PRX distantes dans un deploiement distribue. A node is un separe PRX daemon running on another machine -- potentially with different hardware capabilities, acces reseau, ou tool configurations -- that a ete paired avec le controller instance.

Via l'outil `nodes`, un agent peut decouvrir les noeuds disponibles, verifier leur sante, router des taches to nodes with specialized capabilities (e.g., GPU access), and retrieve results. Cela permet workload distribution, environment specialization, and geographic distribution of agent tasks.

The `nodes` tool est enregistre dans le registre `all_tools()` and est toujours disponible. Actual functionality depend de the node configuration and whether remote peers ont ete paired.

## Configuration

### Controller Mode

The controller est le principal PRX instance that orchestrates work across nodes:

```toml
[node]
mode = "controller"
node_id = "primary"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"          # "static" | "mdns"
peers = [
  "192.168.1.101:3121",   # GPU host
  "192.168.1.102:3121",   # Staging environment
]
```

### Nonde Mode

A node is a PRX instance that accepts delegated work depuis un controller:

```toml
[node]
mode = "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.101:3121"
controller = "192.168.1.100:3121"
```

### Discovery Methods

| Method | Description | Use Case |
|--------|------------|----------|
| `static` | Explicit list of peer addresses in configuration | Known, stable infrastructure |
| `mdns` | Automatic discovery via multicast DNS sur le local network | Dynamic environments, development |

```toml
# mDNS discovery
[node.discovery]
method = "mdns"
service_name = "_prx._tcp.local."
```

## Utilisation

### List Available Nondes

Discover and list all paired remote nodes with their status:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "list"
  }
}
```

**Example response:**

```
Nodes:
  1. gpu-host-01 (192.168.1.101:3121) - ONLINE
     Capabilities: gpu, cuda, python
     Load: 23%

  2. staging-01 (192.168.1.102:3121) - ONLINE
     Capabilities: docker, network-access
     Load: 5%
```

### Check Nonde Health

Query a specific node's health and capabilities:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "health",
    "node_id": "gpu-host-01"
  }
}
```

### Send Task to Nonde

Route a task vers un specific remote node for execution:

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

### Retrieve Nonde Results

Get results depuis un previously sent task:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "result",
    "task_id": "task_xyz789"
  }
}
```

## Parametres

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Oui | -- | Nonde action: `"list"`, `"health"`, `"send"`, `"result"`, `"capabilities"` |
| `node_id` | `string` | Conditional | -- | Target node identifier (required for `"health"`, `"send"`) |
| `task` | `string` | Conditional | -- | Task description (required for `"send"`) |
| `task_id` | `string` | Conditional | -- | Task identifier (required for `"result"`) |

**Retours:**

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` si le operation completed |
| `output` | `string` | Operation result (node list, health status, task result, etc.) |
| `error` | `string?` | Error message si le operation failed (node unreachable, task not found, etc.) |

## Architecture

The PRX node system uses a controller-node topology:

```
┌──────────────────┐         ┌──────────────────┐
│   Controller     │         │   Node A         │
│   (primary PRX)  │◄──────► │   (gpu-host-01)  │
│                  │  mTLS   │   GPU, CUDA      │
│   Agent Loop     │         │   Local tools    │
│   ├── nodes tool │         └──────────────────┘
│   └── delegate   │
│                  │         ┌──────────────────┐
│                  │◄──────► │   Node B         │
│                  │  mTLS   │   (staging-01)   │
│                  │         │   Docker, Net    │
└──────────────────┘         └──────────────────┘
```

### Communication Protocol

Nondes communicate using a custom protocol over TCP with mutual TLS (mTLS) authentication:

1. **Pairing**: A node is paired avec un controller via un challenge-response handshake (see [Nonde Pairing](/fr/prx/nodes/pairing))
2. **Heartbeat**: Paired nodes send periodic heartbeats to report health and capabilities
3. **Task dispatch**: The controller sends tasks to nodes with serialized context
4. **Result retour**: Nondes retour task results with structured output

### Capability Advertisement

Each node advertises its capabilities, which the controller uses for intelligent task routing:

- **Hardware**: `gpu`, `cuda`, `tpu`, `high-memory`
- **Software**: `docker`, `python`, `rust`, `nodejs`
- **Network**: `network-access`, `vpn-connected`, `internal-network`
- **Tools**: List of available PRX tools sur le node

## Common Patterns

### GPU-Accelerated Tasks

Route ML and compute-intensive tasks to GPU-equipped nodes:

```
Agent: The user wants to run image classification.
  1. [nodes] action="list" → finds gpu-host-01 with CUDA
  2. [nodes] action="send", node_id="gpu-host-01", task="Run image classification on /data/images/"
  3. [waits for completion]
  4. [nodes] action="result", task_id="task_abc123"
```

### Environment Isolation

Use nodes for tasks that require specific environments:

```
Agent: Need to test the deployment script in a staging environment.
  1. [nodes] action="send", node_id="staging-01", task="Run deploy.sh and verify all services start"
  2. [nodes] action="result", task_id="task_def456"
```

### Load Distribution

Spread work a travers plusieurs nodes for parallel execution:

```
Agent: Process 3 datasets simultaneously.
  1. [nodes] action="send", node_id="node-a", task="Process dataset-1.csv"
  2. [nodes] action="send", node_id="node-b", task="Process dataset-2.csv"
  3. [nodes] action="send", node_id="node-c", task="Process dataset-3.csv"
  4. [collect results from all three]
```

## Securite

### Mutual TLS Authentication

All node communication uses mTLS. Both the controller and node must present valid certificates during the TLS handshake. Certificates are exchanged during the pairing process.

### Pairing Requirement

Nondes must complete a pairing handshake before they can exchange tasks. Unpaired nodes sont rejetes at la connexion level. See [Nonde Pairing](/fr/prx/nodes/pairing) pour le pairing protocol.

### Task Isolation

Tasks sent to remote nodes execute within the node's politique de securite. The node's sandbox configuration, tool restrictions, and resource limits apply independently of the controller's settings.

### Network Security

- Nonde communication ports devrait etre firewalled to allow only known controller/node addresses
- mDNS discovery is limited vers le local network segment
- Static peer lists are recommended for production deployments

### Moteur de politiques

The `nodes` tool is governed par le politique de securite:

```toml
[security.tool_policy.tools]
nodes = "supervised"       # Require approval before sending tasks to remote nodes
```

## Voir aussi

- [Remote Nondes](/fr/prx/nodes/) -- node system architecture
- [Nonde Pairing](/fr/prx/nodes/pairing) -- pairing protocol and certificate exchange
- [Communication Protocol](/fr/prx/nodes/protocol) -- wire protocol details
- [Security Pairing](/fr/prx/security/pairing) -- security model for device pairing
- [Sessions & Agents](/fr/prx/tools/sessions) -- alternative for local multi-execution de l'agent
- [Tools Overview](/fr/prx/tools/) -- tous les outils et systeme de registre
