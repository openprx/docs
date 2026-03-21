---
title: Modelo de amenazas
description: Modelo de amenazas de PRX que cubre entradas adversariales, inyeccion de prompts, abuso de herramientas y exfiltracion de datos.
---

# Modelo de amenazas

Esta pagina documenta el modelo de amenazas de PRX -- el conjunto de amenazas que consideramos, nuestras suposiciones de seguridad y las mitigaciones implementadas.

## Categorias de amenazas

### 1. Inyeccion de prompts

**Amenaza**: Contenido adversarial en la entrada del usuario o datos recuperados manipula al agente para realizar acciones no deseadas.

**Mitigaciones**:
- Flujo de aprobacion de llamadas a herramientas
- El motor de politicas restringe las acciones disponibles
- Sanitizacion de entrada para patrones de inyeccion conocidos

### 2. Abuso de herramientas

**Amenaza**: El agente usa herramientas de formas no previstas (ej., leer archivos sensibles, realizar solicitudes de red no autorizadas).

**Mitigaciones**:
- Aislamiento sandbox para ejecucion de herramientas
- Motor de politicas con reglas de denegar-por-defecto
- Limitacion de tasa por herramienta
- Registro de auditoria de todas las llamadas a herramientas

### 3. Exfiltracion de datos

**Amenaza**: Datos sensibles del sistema local se envian a servicios externos via contexto LLM o llamadas a herramientas.

**Mitigaciones**:
- Lista blanca de red en sandbox
- Filtrado de contenido para patrones sensibles (claves API, contrasenas)
- Reglas de politica que restringen el flujo de datos

### 4. Cadena de suministro

**Amenaza**: Plugins maliciosos o dependencias comprometen al agente.

**Mitigaciones**:
- Sandbox WASM para plugins
- Manifiestos de permisos de plugins
- Auditoria de dependencias (cargo audit)

## Suposiciones de seguridad

- El sistema operativo del host es de confianza
- Los proveedores LLM gestionan las claves API de forma segura
- El usuario es responsable de revisar las acciones del agente cuando se requiere aprobacion

## Reportar vulnerabilidades

Si descubres una vulnerabilidad de seguridad, por favor reportala a `security@openprx.dev`.

## Paginas relacionadas

- [Vision general de seguridad](./)
- [Motor de politicas](./policy-engine)
- [Sandbox](./sandbox)
