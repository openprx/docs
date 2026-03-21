---
title: Remote Nodes
description: Manage and communicate with remote PRX nodes for distributed agent execution across machines.
---

# Remote Nodes

The `nodes` tool enables PRX agents to interact with remote PRX instances in a distributed deployment. A node is a separate PRX daemon running on another machine -- potentially with different hardware capabilities, network access, or tool configurations -- that has been paired with the controller instance.

Through the `nodes` tool, an agent can discover available nodes, check their health, route tasks to nodes with specialized capabilities (e.g., GPU access), and retrieve results. This enables workload distribution, environment specialization, and geographic distribution of agent tasks.

The `nodes` tool is registered in the `all_tools()` registry and is always available. Actual functionality depends on the node configuration and whether remote peers have been paired.

## კონფიგურაცია

### Controller Mode

The controller is the primary PRX instance that orchestrates work across nodes:

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

### Node Mode

A node is a PRX instance that accepts delegated work from a controller:

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
| `mdns` | Automatic discovery via multicast DNS on the local network | Dynamic environments, development |

```toml
# mDNS discovery
[node.discovery]
method = "mdns"
service_name = "_prx._tcp.local."
```

## გამოყენება

### List Available Nodes

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

### Check Node Health

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

### Send Task to Node

Route a task to a specific remote node for execution:

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

### Retrieve Node Results

Get results from a previously sent task:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "result",
    "task_id": "task_xyz789"
  }
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | Node action: `"list"`, `"health"`, `"send"`, `"result"`, `"capabilities"` |
| `node_id` | `string` | Conditional | -- | Target node identifier (required for `"health"`, `"send"`) |
| `task` | `string` | Conditional | -- | Task description (required for `"send"`) |
| `task_id` | `string` | Conditional | -- | Task identifier (required for `"result"`) |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if the operation completed |
| `output` | `string` | Operation result (node list, health status, task result, etc.) |
| `error` | `string?` | Error message if the operation failed (node unreachable, task not found, etc.) |

## არქიტექტურა

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

Nodes communicate using a custom protocol over TCP with mutual TLS (mTLS) authentication:

1. **Pairing**: A node is paired with a controller through a challenge-response handshake (see [Node Pairing](/ka/prx/nodes/pairing))
2. **Heartbeat**: Paired nodes send periodic heartbeats to report health and capabilities
3. **Task dispatch**: The controller sends tasks to nodes with serialized context
4. **Result return**: Nodes return task results with structured output

### Capability Advertisement

Each node advertises its capabilities, which the controller uses for intelligent task routing:

- **Hardware**: `gpu`, `cuda`, `tpu`, `high-memory`
- **Software**: `docker`, `python`, `rust`, `nodejs`
- **Network**: `network-access`, `vpn-connected`, `internal-network`
- **Tools**: List of available PRX tools on the node

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

Spread work across multiple nodes for parallel execution:

```
Agent: Process 3 datasets simultaneously.
  1. [nodes] action="send", node_id="node-a", task="Process dataset-1.csv"
  2. [nodes] action="send", node_id="node-b", task="Process dataset-2.csv"
  3. [nodes] action="send", node_id="node-c", task="Process dataset-3.csv"
  4. [collect results from all three]
```

## უსაფრთხოება

### Mutual TLS Authentication

All node communication uses mTLS. Both the controller and node must present valid certificates during the TLS handshake. Certificates are exchanged during the pairing process.

### Pairing Requirement

Nodes must complete a pairing handshake before they can exchange tasks. Unpaired nodes are rejected at the connection level. See [Node Pairing](/ka/prx/nodes/pairing) for the pairing protocol.

### Task Isolation

Tasks sent to remote nodes execute within the node's security policy. The node's sandbox configuration, tool restrictions, and resource limits apply independently of the controller's settings.

### Network Security

- Node communication ports should be firewalled to allow only known controller/node addresses
- mDNS discovery is limited to the local network segment
- Static peer lists are recommended for production deployments

### Policy Engine

The `nodes` tool is governed by the security policy:

```toml
[security.tool_policy.tools]
nodes = "supervised"       # Require approval before sending tasks to remote nodes
```

## დაკავშირებული

- [Remote Nodes](/ka/prx/nodes/) -- node system architecture
- [Node Pairing](/ka/prx/nodes/pairing) -- pairing protocol and certificate exchange
- [Communication Protocol](/ka/prx/nodes/protocol) -- wire protocol details
- [Security Pairing](/ka/prx/security/pairing) -- security model for device pairing
- [Sessions & Agents](/ka/prx/tools/sessions) -- alternative for local multi-agent execution
- [Tools Overview](/ka/prx/tools/) -- all tools and registry system
