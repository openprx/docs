---
title: Router Automix
description: Enrutamiento LLM que optimiza costos comenzando con modelos economicos y escalando con baja confianza.
---

# Router Automix

El router Automix optimiza costos enviando cada consulta primero al modelo economico y solo escalando al modelo premium cuando la confianza de la respuesta inicial esta por debajo de un umbral.

## Como funciona

1. **Consulta inicial** -- enviar la consulta al modelo economico
2. **Verificacion de confianza** -- evaluar la puntuacion de confianza de la respuesta
3. **Escalar si es necesario** -- si la confianza esta por debajo del umbral, re-consultar con el modelo premium
4. **Retornar** -- devolver la primera respuesta con confianza suficiente

## Puntuacion de confianza

La confianza se evalua basandose en:

- Confianza auto-reportada en la respuesta
- Presencia de lenguaje evasivo ("No estoy seguro", "podria ser")
- Entropia a nivel de token de la respuesta
- Tasa de exito de llamadas a herramientas

## Configuracion

```toml
[router]
strategy = "automix"

[router.automix]
enabled = true
confidence_threshold = 0.7
cheap_model = "anthropic/claude-haiku"
premium_model = "anthropic/claude-opus-4-6"
max_escalations = 1
```

## Ahorro de costos

En uso tipico, Automix enruta el 60-80% de las consultas al modelo economico, logrando ahorros significativos de costo mientras mantiene la calidad para consultas complejas.

## Paginas relacionadas

- [Vision general del router](./)
- [Router heuristico](./heuristic)
- [Router KNN](./knn)
