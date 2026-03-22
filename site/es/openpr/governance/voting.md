---
title: Votación y Decisiones
description: "El sistema de votación de OpenPR soporta votación ponderada, quórum configurable, umbrales de aprobación y registros de decisiones inmutables."
---

# Votación y Decisiones

El sistema de votación en OpenPR determina el resultado de las propuestas de gobernanza. Soporta votación ponderada, requisitos de quórum configurables y umbrales de aprobación. Cada voto y decisión se registra con un registro de auditoría inmutable.

## Proceso de Votación

1. Una propuesta entra en el estado de **Votación**.
2. Los miembros elegibles del espacio de trabajo emiten sus votos (aprobar, rechazar o abstenerse).
3. Cuando termina el período de votación o se alcanza el quórum, se cuentan los votos.
4. El resultado se determina por el umbral de aprobación configurado.
5. Se crea un **registro de decisión** con el resultado.

## Configuración de Votación

Las configuraciones de gobernanza se establecen por espacio de trabajo:

| Configuración | Descripción | Ejemplo |
|--------------|-------------|---------|
| Quórum | Porcentaje mínimo de votantes elegibles que deben participar | 50% |
| Umbral de Aprobación | Porcentaje de votos afirmativos requerido para aprobar | 66% |
| Período de Votación | Duración que la ventana de votación permanece abierta | 7 días |
| Votación Ponderada | Si las puntuaciones de confianza afectan el peso del voto | Sí/No |

Configura esto en **Configuración del Espacio de Trabajo** > **Gobernanza** > **Configuración**, o a través de la API:

```bash
curl -X PUT http://localhost:8080/api/governance/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "quorum_percentage": 50,
    "approval_threshold": 66,
    "voting_period_days": 7,
    "weighted_voting": true
  }'
```

## Votación Ponderada

Cuando se habilita la votación ponderada, el voto de cada miembro se multiplica por su puntuación de confianza. Los miembros con puntuaciones de confianza más altas tienen más influencia en el resultado. Ver [Puntuaciones de Confianza](./trust-scores) para detalles.

## Registros de Decisiones

Cada votación completada crea un **registro de decisión** -- una entrada inmutable del registro que contiene:

- La propuesta sobre la que se votó
- Recuentos de votos (aprobar, rechazar, abstener)
- El resultado final (aprobado o rechazado)
- Marca de tiempo y votantes participantes
- Dominio de decisión (si está categorizado)

Los registros de decisiones no pueden ser modificados ni eliminados. Sirven como el historial autorizado de las decisiones del equipo.

### Ver Decisiones

```bash
# List decisions
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/decisions

# Get a specific decision
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/decisions/<decision_id>
```

## Mecanismo de Veto

Los vetadores designados (configurados por espacio de trabajo) pueden vetar propuestas aprobadas:

1. **Veto** -- Un vetador bloquea una propuesta aprobada con una razón declarada.
2. **Escalación** -- El proponente puede escalar el veto a una votación más amplia.
3. **Apelación** -- Cualquier miembro puede presentar una apelación contra un veto.

El poder de veto está diseñado como un mecanismo de seguridad para decisiones de alto impacto. Configura los vetadores en **Configuración del Espacio de Trabajo** > **Gobernanza** > **Vetadores**.

## Registros de Auditoría

Todas las acciones de gobernanza se registran en el registro de auditoría:

- Creación, envío y archivado de propuestas
- Votos emitidos (quién, cuándo, qué)
- Registros de decisiones
- Eventos de veto y escalaciones
- Cambios de configuración

```bash
# View governance audit logs
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/governance/audit-logs
```

## Dominios de Decisión

Las decisiones pueden categorizarse en dominios (p. ej., "Arquitectura", "Proceso", "Herramientas") para mejor organización y filtrado. Los dominios se configuran por espacio de trabajo.

## Próximos Pasos

- [Puntuaciones de Confianza](./trust-scores) -- Cómo las puntuaciones de confianza influyen en el peso de los votos
- [Propuestas](./proposals) -- Crear propuestas que van a votación
- [Descripción General de Gobernanza](./index) -- Referencia completa del módulo de gobernanza
