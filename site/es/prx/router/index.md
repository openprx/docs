---
title: Router LLM
description: Vision general del router inteligente de LLM en PRX para seleccion de modelos, optimizacion de costos y equilibrio de calidad.
---

# Router LLM

El router de PRX es un sistema inteligente de seleccion de modelos que elige automaticamente el mejor proveedor LLM y modelo para cada solicitud. Equilibra calidad, costo y latencia usando multiples estrategias de enrutamiento.

## Vision general

En lugar de usar siempre un unico modelo, el router selecciona dinamicamente entre los modelos configurados basandose en:

- Complejidad y tipo de consulta
- Puntuaciones de capacidad del modelo y ratings Elo
- Restricciones de costo
- Requisitos de latencia
- Datos historicos de rendimiento

## Estrategias de enrutamiento

| Estrategia | Descripcion | Mejor para |
|------------|-------------|-----------|
| [Heuristico](./heuristic) | Puntuacion basada en reglas usando caracteristicas de la consulta | Configuraciones simples, comportamiento predecible |
| [KNN](./knn) | Similitud semantica con consultas exitosas pasadas | Enrutamiento aprendido, alta precision |
| [Automix](./automix) | Comenzar barato, escalar con baja confianza | Optimizacion de costos |

## Configuracion

```toml
[router]
enabled = true
strategy = "heuristic"  # "heuristic" | "knn" | "automix"
default_model = "anthropic/claude-sonnet-4-6"

[router.models]
cheap = "anthropic/claude-haiku"
standard = "anthropic/claude-sonnet-4-6"
premium = "anthropic/claude-opus-4-6"
```

## Paginas relacionadas

- [Router heuristico](./heuristic)
- [Router KNN](./knn)
- [Router Automix](./automix)
- [Proveedores LLM](/es/prx/providers/)
