---
title: Arquitectura de plugins
description: Arquitectura tecnica del runtime de plugins WASM de PRX, incluyendo la frontera host-guest y el modelo de memoria.
---

# Arquitectura de plugins

El sistema de plugins de PRX esta construido sobre un runtime WASM que proporciona un entorno de ejecucion seguro y portable para codigo de terceros. Esta pagina describe la arquitectura tecnica.

## Runtime

PRX usa el runtime Wasmtime para ejecutar plugins WASM. Cada instancia de plugin se ejecuta en su propio store WASM con memoria lineal aislada.

```
┌──────────────────────────────────┐
│         PRX Host             │
│                              │
│  ┌────────────────────────┐  │
│  │    WASM Runtime         │  │
│  │  ┌──────┐  ┌──────┐   │  │
│  │  │Plugin│  │Plugin│   │  │
│  │  │  A   │  │  B   │   │  │
│  │  └──┬───┘  └──┬───┘   │  │
│  │     │         │        │  │
│  │  Host Functions API    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## Frontera host-guest

Los plugins se comunican con el host a traves de un conjunto definido de funciones del host. La frontera aplica:

- **Seguridad de tipos** -- todos los parametros de funcion son validados
- **Limites de recursos** -- el uso de memoria y CPU esta limitado
- **Verificaciones de permisos** -- cada llamada a funcion del host se autoriza contra el manifiesto de permisos del plugin

## Modelo de memoria

Cada plugin tiene su propio espacio de memoria lineal (64 MB por defecto). Los datos se intercambian entre host y guest a traves de buffers de memoria compartida con serializacion explicita.

## Ciclo de vida del plugin

1. **Carga** -- el binario WASM se carga y valida
2. **Inicializacion** -- se llama a la funcion `init()` del plugin con la configuracion
3. **Listo** -- el plugin registra sus capacidades (herramientas, canales, etc.)
4. **Ejecucion** -- el host invoca funciones del plugin segun sea necesario
5. **Apagado** -- se llama a la funcion `shutdown()` del plugin para limpieza

## Paginas relacionadas

- [Vision general del sistema de plugins](./)
- [Funciones del host](./host-functions)
- [Guia del desarrollador](./developer-guide)
