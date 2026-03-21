---
title: Sandbox
description: Sandbox-Backends zur Isolation der Werkzeugausfuhrung in PRX.
---

# Sandbox

Die PRX-Sandbox bietet Prozess- und Dateisystem-Isolation fur die Werkzeugausfuhrung. Wenn ein Agent ein Werkzeug aufruft, das externe Befehle ausfuhrt, stellt die Sandbox sicher, dass der Befehl in einer eingeschrankten Umgebung lauft.

## Sandbox-Backends

PRX unterstutzt mehrere Sandbox-Backends:

| Backend | Plattform | Isolationsgrad | Overhead |
|---------|-----------|----------------|----------|
| **Docker** | Linux, macOS | Vollstandiger Container | Hoch |
| **Bubblewrap** | Linux | Namespace + Seccomp | Niedrig |
| **Firejail** | Linux | Namespace + Seccomp | Niedrig |
| **Landlock** | Linux (5.13+) | Kernel-LSM | Minimal |
| **None** | Alle | Keine Isolation | Keine |

## Konfiguration

```toml
[security.sandbox]
backend = "bubblewrap"

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]
```

## Funktionsweise

1. Agent fordert einen Werkzeugaufruf an (z.B. Shell-Befehlsausfuhrung)
2. Richtlinien-Engine pruft, ob der Aufruf erlaubt ist
3. Sandbox umschliesst die Ausfuhrung mit dem konfigurierten Backend
4. Das Werkzeug lauft mit eingeschranktem Dateisystem- und Netzwerkzugriff
5. Ergebnisse werden erfasst und an den Agenten zuruckgegeben

## Verwandte Seiten

- [Sicherheitsubersicht](./)
- [Richtlinien-Engine](./policy-engine)
- [Sitzungs-Worker](/de/prx/agent/session-worker)
