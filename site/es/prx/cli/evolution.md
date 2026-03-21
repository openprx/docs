---
title: prx evolution
description: Monitorear y controlar el motor de autoevolucion de PRX.
---

# prx evolution

Inspecciona y controla el motor de autoevolucion. PRX soporta tres niveles de evolucion autonoma: L1 (memoria), L2 (prompts) y L3 (estrategias). Este comando te permite verificar el estado de la evolucion, revisar el historial, actualizar la configuracion y activar ciclos de evolucion manuales.

## Uso

```bash
prx evolution <SUBCOMANDO> [OPTIONS]
```

## Subcomandos

### `prx evolution status`

Muestra el estado actual del motor de evolucion.

```bash
prx evolution status [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--json` | `-j` | `false` | Salida en formato JSON |

**Ejemplo de salida:**

```
 Evolution Engine Status
 ───────────────────────
 Engine:    running
 L1 Memory:    enabled   (last: 2h ago, next: in 4h)
 L2 Prompt:    enabled   (last: 1d ago, next: in 23h)
 L3 Strategy:  disabled
 Total cycles: 142
 Rollbacks:    3
```

### `prx evolution history`

Muestra el registro de historial de evolucion.

```bash
prx evolution history [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--limit` | `-n` | `20` | Numero de entradas a mostrar |
| `--level` | `-l` | todos | Filtrar por nivel: `l1`, `l2`, `l3` |
| `--json` | `-j` | `false` | Salida en formato JSON |

```bash
# Mostrar las ultimas 10 evoluciones L2
prx evolution history --limit 10 --level l2
```

**Ejemplo de salida:**

```
 Time                Level  Action                          Status
 2026-03-21 08:00    L1     memory consolidation            success
 2026-03-20 20:00    L1     memory consolidation            success
 2026-03-20 09:00    L2     prompt refinement (system)      success
 2026-03-19 14:22    L2     prompt refinement (tool-use)    rolled back
```

### `prx evolution config`

Visualiza o actualiza la configuracion de evolucion.

```bash
prx evolution config [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--set` | | | Establecer un valor de configuracion (ej., `--set l1.enabled=true`) |
| `--json` | `-j` | `false` | Salida en formato JSON |

```bash
# Ver configuracion actual
prx evolution config

# Habilitar evolucion de estrategia L3
prx evolution config --set l3.enabled=true

# Establecer intervalo de L1 a 2 horas
prx evolution config --set l1.interval=7200
```

### `prx evolution trigger`

Activar manualmente un ciclo de evolucion.

```bash
prx evolution trigger [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--level` | `-l` | `l1` | Nivel de evolucion a activar: `l1`, `l2`, `l3` |
| `--dry-run` | | `false` | Previsualizar la evolucion sin aplicar cambios |

```bash
# Activar evolucion de memoria L1
prx evolution trigger --level l1

# Previsualizar una evolucion de prompt L2
prx evolution trigger --level l2 --dry-run
```

## Niveles de evolucion

| Nivel | Objetivo | Descripcion |
|-------|----------|-------------|
| **L1** | Memoria | Consolida, deduplica y organiza las entradas de memoria |
| **L2** | Prompts | Refina los prompts de sistema y las instrucciones de uso de herramientas basandose en patrones de interaccion |
| **L3** | Estrategias | Adapta las estrategias de comportamiento de alto nivel (requiere activacion explicita) |

Todos los cambios de evolucion son reversibles. El motor mantiene un historial de rollback y revierte automaticamente los cambios que causan degradacion del rendimiento.

## Relacionado

- [Vision general de autoevolucion](/es/prx/self-evolution/) -- arquitectura y conceptos
- [L1: Evolucion de memoria](/es/prx/self-evolution/l1-memory) -- detalles de consolidacion de memoria
- [L2: Evolucion de prompts](/es/prx/self-evolution/l2-prompt) -- pipeline de refinamiento de prompts
- [L3: Evolucion de estrategia](/es/prx/self-evolution/l3-strategy) -- adaptacion de estrategias
- [Seguridad de evolucion](/es/prx/self-evolution/safety) -- mecanismos de rollback y seguridad
