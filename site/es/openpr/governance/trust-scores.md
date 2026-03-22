---
title: Puntuaciones de Confianza
description: "El sistema de puntuación de confianza de OpenPR realiza el seguimiento de la reputación por usuario basándose en la participación, la calidad de las decisiones y la retroalimentación del equipo. Las puntuaciones de confianza influyen en el peso de los votos."
---

# Puntuaciones de Confianza

Las puntuaciones de confianza son una métrica de reputación por usuario en OpenPR que rastrea la calidad de participación y el historial de toma de decisiones. Cuando se habilita la votación ponderada, las puntuaciones de confianza influyen directamente en el poder de voto.

## Cómo Funcionan las Puntuaciones de Confianza

Cada miembro del espacio de trabajo tiene una puntuación de confianza que refleja su participación en la gobernanza:

| Factor | Impacto | Descripción |
|--------|--------|-------------|
| Calidad de propuestas | Positivo | Las propuestas aprobadas aumentan la puntuación |
| Participación en votaciones | Positivo | La votación regular aumenta la puntuación |
| Decisiones alineadas | Positivo | Votar con la mayoría eventual |
| Propuestas rechazadas | Negativo | Las propuestas rechazadas disminuyen la puntuación |
| Decisiones vetadas | Negativo | Tener propuestas vetadas |
| Apelaciones | Variable | Las apelaciones exitosas restauran la puntuación |

## Rango de Puntuación

Las puntuaciones de confianza se normalizan a un rango numérico. Las puntuaciones más altas indican una participación de gobernanza más confiable:

| Rango | Nivel | Peso de Voto |
|-------|-------|--------------|
| 80-100 | Confianza Alta | peso 1.5x |
| 50-79 | Normal | peso 1.0x |
| 20-49 | Confianza Baja | peso 0.75x |
| 0-19 | Mínimo | peso 0.5x |

::: tip Votación Ponderada
La ponderación por puntuación de confianza solo aplica cuando la **votación ponderada** está habilitada en la configuración de gobernanza del espacio de trabajo. De lo contrario, todos los votos tienen el mismo peso.
:::

## Ver Puntuaciones de Confianza

### Mediante la Interfaz Web

Navega a **Configuración del Espacio de Trabajo** > **Gobernanza** > **Puntuaciones de Confianza** para ver todas las puntuaciones de los miembros y su historial.

### Mediante la API

```bash
# Get trust scores for the workspace
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/trust-scores

# Get a specific user's trust score history
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/trust-scores/<user_id>/history
```

## Historial de Puntuación de Confianza

Cada cambio en una puntuación de confianza se registra en la tabla `trust_score_logs` con:

- El usuario afectado
- Valores de puntuación anterior y nuevo
- La razón del cambio
- Marca de tiempo
- Propuesta o decisión relacionada (si aplica)

Este historial proporciona transparencia sobre cómo evolucionan las puntuaciones a lo largo del tiempo.

## Apelaciones

Si un miembro cree que su puntuación de confianza fue afectada injustamente, puede presentar una apelación:

1. Navega a su historial de puntuación de confianza.
2. Haz clic en **Apelar** en un cambio de puntuación específico.
3. Proporciona una razón para la apelación.
4. Los administradores del espacio de trabajo revisan y deciden sobre la apelación.

Las apelaciones exitosas restauran el cambio de puntuación. Los registros de apelaciones se preservan en el registro de auditoría.

```bash
# File an appeal
curl -X POST http://localhost:8080/api/trust-scores/<user_id>/appeals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"reason": "Score decreased due to a test proposal that was not meant for production."}'
```

## Revisiones de Impacto

Las puntuaciones de confianza son una entrada para las **revisiones de impacto** -- evaluaciones de cómo una propuesta o decisión afecta al proyecto. Las revisiones de impacto incluyen:

- Métricas cuantitativas (esfuerzo estimado, nivel de riesgo, alcance)
- Evaluaciones cualitativas de los participantes de la revisión
- Datos históricos de decisiones similares

## Próximos Pasos

- [Votación y Decisiones](./voting) -- Cómo las puntuaciones de confianza influyen en los resultados de la votación
- [Propuestas](./proposals) -- Crear propuestas que afectan las puntuaciones de confianza
- [Descripción General de Gobernanza](./index) -- Referencia completa del módulo de gobernanza
