---
title: Emparejamiento de nodos
description: Como emparejar nodos PRX con un controlador para ejecucion distribuida segura.
---

# Emparejamiento de nodos

Antes de que un nodo pueda recibir tareas de un controlador, deben emparejarse. El emparejamiento establece confianza mutua a traves de verificacion de identidad criptografica.

## Proceso de emparejamiento

1. Iniciar el nodo en modo de emparejamiento: `prx node pair`
2. El nodo muestra un codigo de emparejamiento (PIN de 6 digitos)
3. En el controlador, iniciar el emparejamiento: `prx pair add --address <node-ip>:3121`
4. Ingresar el codigo de emparejamiento cuando se solicite
5. Ambos lados intercambian y verifican claves publicas Ed25519

## Configuracion

```toml
[node.pairing]
auto_accept = false
pairing_timeout_secs = 120
max_paired_controllers = 3
```

## Gestion de nodos

```bash
# On the controller
prx node list              # List paired nodes
prx node status <node-id>  # Check node status
prx node unpair <node-id>  # Remove node pairing

# On the node
prx node pair              # Enter pairing mode
prx node info              # Show node identity
```

## Paginas relacionadas

- [Vision general de nodos](./)
- [Protocolo de comunicacion](./protocol)
- [Emparejamiento de dispositivos](/es/prx/security/pairing)
