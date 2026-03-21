---
title: Seguridad
description: Vision general del modelo de seguridad de PRX que cubre motor de politicas, sandbox, gestion de secretos y modelo de amenazas.
---

# Seguridad

La seguridad es una preocupacion fundamental en PRX. Como framework de agentes autonomos, PRX debe controlar cuidadosamente que acciones pueden realizar los agentes, a que datos pueden acceder y como interactuan con sistemas externos.

## Capas de seguridad

PRX implementa defensa en profundidad a traves de multiples capas de seguridad:

| Capa | Componente | Proposito |
|------|-----------|----------|
| Politica | [Motor de politicas](./policy-engine) | Reglas declarativas para acceso a herramientas y flujo de datos |
| Aislamiento | [Sandbox](./sandbox) | Aislamiento de proceso/contenedor para ejecucion de herramientas |
| Autenticacion | [Emparejamiento](./pairing) | Emparejamiento de dispositivos y verificacion de identidad |
| Secretos | [Gestion de secretos](./secrets) | Almacenamiento seguro para claves API y credenciales |

## Configuracion

```toml
[security]
sandbox_backend = "bubblewrap"  # "docker" | "firejail" | "bubblewrap" | "landlock" | "none"
require_tool_approval = true
max_tool_calls_per_turn = 10

[security.policy]
default_action = "deny"
```

## Modelo de amenazas

El [modelo de amenazas](./threat-model) de PRX considera entradas adversariales, inyeccion de prompts, abuso de herramientas y exfiltracion de datos como vectores de amenaza principales.

## Paginas relacionadas

- [Motor de politicas](./policy-engine)
- [Emparejamiento](./pairing)
- [Sandbox](./sandbox)
- [Gestion de secretos](./secrets)
- [Modelo de amenazas](./threat-model)
