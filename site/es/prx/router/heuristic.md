---
title: Router heuristico
description: Enrutamiento LLM basado en reglas en PRX usando puntuacion de caracteristicas de consulta y coincidencia de capacidades.
---

# Router heuristico

El router heuristico usa un sistema de puntuacion basado en reglas para seleccionar el modelo optimo para cada consulta. Analiza las caracteristicas de la consulta (longitud, complejidad, requisitos de herramientas) y las compara con los perfiles de capacidad de cada modelo.

## Como funciona

1. **Extraccion de caracteristicas** -- analizar la consulta en busca de longitud, patrones de palabras clave y requisitos de herramientas
2. **Puntuacion de capacidades** -- puntuar la idoneidad de cada modelo basandose en las caracteristicas extraidas
3. **Ponderacion de costo** -- aplicar preferencias de costo para favorecer modelos mas economicos en consultas simples
4. **Seleccion** -- elegir el modelo con mayor puntuacion que cumpla los umbrales minimos de calidad

## Factores de puntuacion

| Factor | Peso | Descripcion |
|--------|------|-------------|
| Coincidencia de capacidad | 0.4 | Capacidad del modelo para manejar el tipo de consulta |
| Rating Elo | 0.2 | Rendimiento historico del modelo |
| Eficiencia de costo | 0.2 | Tokens por dolar |
| Latencia | 0.1 | Tiempo de respuesta promedio |
| Ventana de contexto | 0.1 | Se ajusta al contexto de la conversacion |

## Configuracion

```toml
[router]
strategy = "heuristic"

[router.heuristic]
complexity_threshold = 0.6
prefer_cheap_below = 0.4
elo_weight = 0.2
cost_weight = 0.2
```

## Paginas relacionadas

- [Vision general del router](./)
- [Router KNN](./knn)
- [Router Automix](./automix)
