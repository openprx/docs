# Tunnel WSS

Le Tunnel WSS (Phase B) fournit une connexion WebSocket active d'OpenPR-Webhook vers un serveur de plan de contrôle. Au lieu d'attendre des webhooks HTTP entrants, le tunnel permet au plan de contrôle de pousser des tâches directement vers l'agent via une connexion persistante.

C'est particulièrement utile lorsque le service webhook s'exécute derrière un NAT ou un pare-feu et ne peut pas recevoir de requêtes HTTP entrantes.

## Fonctionnement

```
Plan de contrôle (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   client tunnel   |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  Agent CLI (codex / claude-code / opencode)
```

1. OpenPR-Webhook ouvre une connexion WebSocket vers l'URL du plan de contrôle
2. S'authentifie avec un jeton Bearer dans l'en-tête `Authorization`
3. Envoie des messages de heartbeat périodiques pour maintenir la connexion active
4. Reçoit les messages `task.dispatch` du plan de contrôle
5. Acquitte immédiatement avec `task.ack`
6. Exécute la tâche de façon asynchrone via l'agent CLI
7. Renvoie `task.result` lorsque l'exécution se termine

## Activer le tunnel

Le tunnel nécessite **deux** éléments activés :

1. Flag de fonctionnalité : `features.tunnel_enabled = true`
2. Section tunnel : `tunnel.enabled = true`

Les deux conditions doivent être vraies, et `OPENPR_WEBHOOK_SAFE_MODE` ne doit pas être défini.

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # Généralement nécessaire pour l'exécution de tâches

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## Format d'enveloppe des messages

Tous les messages du tunnel utilisent une enveloppe standard :

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "heartbeat",
  "ts": 1711234567,
  "agent_id": "my-webhook-agent",
  "payload": { "alive": true },
  "sig": "sha256=abc123..."
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | Chaîne (UUID) | Identifiant unique du message |
| `type` | Chaîne | Type de message (voir ci-dessous) |
| `ts` | Entier | Horodatage Unix (secondes) |
| `agent_id` | Chaîne | ID de l'agent émetteur |
| `payload` | Objet | Payload spécifique au type |
| `sig` | Chaîne (optionnel) | Signature HMAC-SHA256 de l'enveloppe |

## Types de messages

### Sortants (agent vers plan de contrôle)

| Type | Quand | Payload |
|------|------|---------|
| `heartbeat` | Toutes les N secondes | `{"alive": true}` |
| `task.ack` | Immédiatement à la réception d'une tâche | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | Après la fin de la tâche | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | Sur les erreurs de protocole | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### Entrants (plan de contrôle vers agent)

| Type | Objectif | Payload |
|------|---------|---------|
| `task.dispatch` | Assigner une tâche à cet agent | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## Flux de dispatch de tâches

```
Plan de contrôle                 openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack (immédiat)
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- exécute l'agent CLI
    |                                 |    (async, jusqu'au timeout)
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

Les champs du payload `task.dispatch` :

| Champ | Type | Description |
|-------|------|-------------|
| `run_id` | Chaîne | Identifiant unique de l'exécution (auto-généré si absent) |
| `issue_id` | Chaîne | ID du ticket à traiter |
| `agent` | Chaîne (optionnel) | ID de l'agent cible (revient au premier agent `cli`) |
| `body` | Objet | Payload webhook complet à passer au dispatcher |

## Signature HMAC de l'enveloppe

Quand `tunnel.hmac_secret` est configuré, toutes les enveloppes sortantes sont signées :

1. L'enveloppe est sérialisée en JSON avec `sig` défini à `null`
2. HMAC-SHA256 est calculé sur les octets JSON en utilisant le secret
3. La signature est définie comme `sha256={hex}` dans le champ `sig`

Pour les messages entrants, si `tunnel.require_inbound_sig = true`, tout message sans signature valide est rejeté avec une enveloppe `error`.

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## Comportement de reconnexion

Le client tunnel se reconnecte automatiquement en cas de déconnexion :

- Délai de reconnexion initial : `reconnect_secs` (défaut : 3 secondes)
- Backoff : double à chaque échec consécutif
- Backoff maximum : `runtime.tunnel_reconnect_backoff_max_secs` (défaut : 60 secondes)
- Réinitialise au délai de base après une connexion réussie

## Contrôle de la concurrence

L'exécution des tâches CLI via le tunnel est limitée par `runtime.cli_max_concurrency` :

```toml
[runtime]
cli_max_concurrency = 2  # Autoriser 2 tâches CLI concurrentes (défaut : 1)
```

Les tâches dépassant la limite de concurrence attendent un permis de sémaphore. Cela évite de surcharger la machine lorsque plusieurs tâches sont dispatchées en succession rapide.

## Référence de configuration

| Champ | Défaut | Description |
|-------|---------|-------------|
| `tunnel.enabled` | `false` | Activer/désactiver le tunnel |
| `tunnel.url` | -- | URL WebSocket (`wss://` ou `ws://`) |
| `tunnel.agent_id` | `openpr-webhook` | Identifiant de l'agent |
| `tunnel.auth_token` | -- | Jeton Bearer pour l'authentification |
| `tunnel.reconnect_secs` | `3` | Intervalle de reconnexion de base |
| `tunnel.heartbeat_secs` | `20` | Intervalle de heartbeat (minimum 3s) |
| `tunnel.hmac_secret` | -- | Secret de signature HMAC-SHA256 |
| `tunnel.require_inbound_sig` | `false` | Rejeter les messages entrants non signés |

## Notes de sécurité

- Utilisez toujours `wss://` en production. Le service enregistre un avertissement si `ws://` est utilisé.
- Le `auth_token` est envoyé comme en-tête HTTP lors de la mise à niveau WebSocket ; assurez-vous que TLS est utilisé.
- Activez `require_inbound_sig` avec un `hmac_secret` pour prévenir les dispatches de tâches falsifiés.
