---
title: Emparejamiento de dispositivos
description: Emparejamiento de dispositivos y verificacion de identidad para autenticacion de agentes PRX.
---

# Emparejamiento de dispositivos

PRX usa un modelo de emparejamiento de dispositivos para autenticar instancias de agentes y establecer confianza entre nodos. El emparejamiento asegura que solo dispositivos autorizados puedan conectarse y controlar el agente.

## Vision general

El proceso de emparejamiento:

1. Generar una identidad de dispositivo unica (par de claves Ed25519)
2. Intercambiar claves publicas entre el controlador y el agente
3. Verificar identidad a traves de un protocolo desafio-respuesta
4. Establecer un canal de comunicacion cifrado

## Flujo de emparejamiento

```
Controlador                   Agente
    |                           |
    |---- Solicitud de empar. ->|
    |                           |
    |<--- Desafio --------------|
    |                           |
    |---- Respuesta firmada --->|
    |                           |
    |<--- Empar. confirmado ----|
```

## Configuracion

```toml
[security.pairing]
require_pairing = true
max_paired_devices = 5
challenge_timeout_secs = 30
```

## Gestionar dispositivos emparejados

```bash
prx pair list          # Listar dispositivos emparejados
prx pair add           # Iniciar flujo de emparejamiento
prx pair remove <id>   # Eliminar un dispositivo emparejado
prx pair revoke-all    # Revocar todos los emparejamientos
```

## Paginas relacionadas

- [Vision general de seguridad](./)
- [Nodos](/es/prx/nodes/)
- [Gestion de secretos](./secrets)
