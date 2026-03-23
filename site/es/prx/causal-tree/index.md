---
title: Motor de Arbol Causal
description: Vision general del Motor de Arbol Causal (CTE) de PRX — prediccion especulativa multi-rama con ensayo, puntuacion y disyuntor automatico.
---

# Motor de Arbol Causal

El Motor de Arbol Causal (Causal Tree Engine, CTE) es un sistema de ejecucion especulativa que evalua multiples estrategias de respuesta en paralelo antes de confirmar la mejor. Se integra en el pipeline del agente PRX entre la clasificacion de intenciones y la invocacion del LLM.

> **Desactivado por defecto.** El CTE es opcional. Configure `causal_tree.enabled = true` en su archivo de configuracion para activarlo.

## Flujo de trabajo

```text
instantanea → expansion → ensayo → puntuacion → seleccion → retroalimentacion
```

1. **Instantanea** — Captura el estado causal actual (contexto de sesion, presupuesto, restricciones)
2. **Expansion** — Genera ramas candidatas (respuesta directa, uso de herramientas, delegacion a sub-agente)
3. **Ensayo** — Ejecuta "ejecuciones de prueba" ligeras de ramas prometedoras en modo solo lectura
4. **Puntuacion** — Clasifica ramas por un compuesto ponderado de confianza, costo y latencia
5. **Seleccion** — Confirma la rama con mayor puntuacion si alcanza el umbral; de lo contrario, recurre al respaldo
6. **Retroalimentacion** — Registra la decision para observabilidad y aprendizaje futuro

## Cuando activar el CTE

| Escenario | Recomendacion |
|-----------|--------------|
| Q&A simple, chat casual | Mantener CTE **desactivado** |
| Flujos de trabajo con herramientas multi-paso | Activar CTE |
| Tareas de agente autonomo (Xin / auto-evolucion) | Activar CTE |
| Despliegues sensibles al costo | Activar CTE con `extra_token_ratio_limit` estricto |

## Inicio rapido

Agregue a su archivo de configuracion PRX (`~/.openprx/config.toml`):

```toml
[causal_tree]
enabled = true
```

Todos los demas parametros tienen valores predeterminados razonables. Consulte la [Referencia de configuracion](./configuration) para la lista completa.

## Disyuntor

- Despues de `circuit_breaker_threshold` fallos consecutivos (predeterminado: 5), el CTE se dispara y todas las solicitudes lo omiten
- Despues de `circuit_breaker_cooldown_secs` (predeterminado: 60s), el disyuntor permite un reintento
- Una sola ejecucion exitosa reinicia el contador de fallos

## Metricas

| Metrica | Descripcion |
|---------|------------|
| `hit_at_1_ratio` | Fraccion de ejecuciones donde la primera rama fue correcta |
| `hit_at_3_ratio` | Fraccion donde la rama correcta estaba en el top-3 |
| `wasted_speculation_ratio` | Ensayos realizados pero no utilizados |
| `commit_success_rate` | Porcentaje de confirmaciones exitosas |
| `avg_extra_latency_ms` | Latencia adicional promedio por ejecucion |
| `circuit_breaker_trips` | Numero de veces que se disparo el disyuntor |

## Paginas relacionadas

- [Referencia de configuracion](./configuration)
- [Runtime del agente](/es/prx/agent/runtime)
- [Router LLM](/es/prx/router/)
- [Observabilidad](/es/prx/observability/)
