# Démarrage rapide

Ce guide vous accompagne dans la configuration d'OpenPR-Webhook avec un agent de transfert webhook simple, puis dans son test avec un événement simulé.

## Étape 1 : Créer la configuration

Créez un fichier nommé `config.toml` :

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["my-test-secret"]

[[agents]]
id = "echo-agent"
name = "Echo Agent"
agent_type = "webhook"

[agents.webhook]
url = "https://httpbin.org/post"
```

Cette configuration :

- Écoute sur le port 9000
- Exige des signatures HMAC-SHA256 en utilisant le secret `my-test-secret`
- Achemine les événements bot vers httpbin.org pour les tests

## Étape 2 : Démarrer le service

```bash
./target/release/openpr-webhook config.toml
```

Vous devriez voir :

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## Étape 3 : Envoyer un événement de test

Générez une signature HMAC-SHA256 pour un payload de test et envoyez-la :

```bash
# Le payload de test
PAYLOAD='{"event":"issue.updated","bot_context":{"is_bot_task":true,"bot_name":"echo-agent","bot_agent_type":"webhook"},"data":{"issue":{"id":"42","key":"PROJ-42","title":"Fix login bug"}},"actor":{"name":"alice"},"project":{"name":"backend"}}'

# Calculer la signature HMAC-SHA256
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

# Envoyer le webhook
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

Réponse attendue :

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## Étape 4 : Tester le filtrage

Les événements sans `bot_context.is_bot_task = true` sont silencieusement ignorés :

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

Réponse :

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## Étape 5 : Tester le rejet de signature

Une signature invalide retourne HTTP 401 :

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

Réponse : `401 Unauthorized`

## Comprendre la correspondance d'agents

Lorsqu'un événement webhook arrive avec `is_bot_task = true`, le service associe un agent selon cette logique :

1. **Par nom** -- si `bot_context.bot_name` correspond à l'`id` ou au `name` d'un agent (insensible à la casse)
2. **Par type en fallback** -- si aucune correspondance par nom, utilise le premier agent dont l'`agent_type` correspond à `bot_context.bot_agent_type`

Si aucun agent ne correspond, la réponse inclut `"status": "no_agent"`.

## Étapes suivantes

- [Types d'agents](../agents/index.md) -- découvrir les 5 types d'agents
- [Référence des exécuteurs](../agents/executors.md) -- analyse approfondie de chaque exécuteur
- [Référence de configuration](../configuration/index.md) -- schéma TOML complet
