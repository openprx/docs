---
title: Router KNN
description: Enrutamiento LLM basado en similitud semantica usando K vecinos mas cercanos sobre embeddings de consultas historicas.
---

# Router KNN

El router KNN (K-Nearest Neighbors) usa similitud semantica para comparar consultas entrantes contra una base de datos de consultas historicas con asignaciones de modelos optimos conocidas. Esto permite un enrutamiento aprendido que mejora con el tiempo.

## Como funciona

1. **Embeber consulta** -- convertir la consulta entrante en un embedding vectorial
2. **Busqueda KNN** -- encontrar las K consultas pasadas mas similares en el almacen de embeddings
3. **Votacion** -- agregar las asignaciones de modelo de los K vecinos
4. **Seleccion** -- elegir el modelo con mas votos (ponderados por similitud)

## Datos de entrenamiento

El router KNN construye su conjunto de datos a partir de:

- Registros de sesion del agente con calificaciones de calidad
- Resultados de pruebas A/B de la evolucion de prompts
- Retroalimentacion manual y correcciones

## Configuracion

```toml
[router]
strategy = "knn"

[router.knn]
k = 5
embedding_provider = "ollama"
embedding_model = "nomic-embed-text"
min_similarity = 0.6
min_dataset_size = 100
fallback_strategy = "heuristic"
```

## Arranque en frio

Cuando no hay suficientes datos de entrenamiento disponibles (por debajo de `min_dataset_size`), el router KNN recurre a la estrategia heuristica.

## Paginas relacionadas

- [Vision general del router](./)
- [Router heuristico](./heuristic)
- [Router Automix](./automix)
- [Memoria de embeddings](/es/prx/memory/embeddings)
