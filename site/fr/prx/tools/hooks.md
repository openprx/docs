---
title: Hooks
description: Systeme d'extension evenementiel avec 8 evenements du cycle de vie, execution de hooks shell, callbacks de plugins WASM, gestion via API HTTP et integration du bus d'evenements pour l'observabilite et l'automatisation.
---

# Hooks

Les hooks PRX fournissent un systeme d'extension evenementiel qui vous permet de reagir aux evenements du cycle de vie pendant l'execution de l'agent. Chaque moment significatif de la boucle d'agent -- demarrer un tour, appeler un LLM, invoquer un outil, rencontrer une erreur -- emet un evenement de hook. Vous attachez des actions a ces evenements via un fichier de configuration `hooks.json`, des manifestes de plugins WASM ou l'API HTTP.

Les hooks sont conçus selon le principe **fire-and-forget** (tirer et oublier). Ils ne bloquent jamais la boucle de l'agent, ne modifient jamais le flux d'execution et n'injectent jamais de donnees dans la conversation. Cela les rend ideaux pour la journalisation d'audit, la collecte de metriques, les notifications externes et l'automatisation d'effets de bord sans introduire de latence ni de modes de defaillance dans le pipeline principal de l'agent.

Il existe trois backends d'execution des hooks :

- **Hooks shell** -- Executent une commande externe avec le payload de l'evenement transmis via une variable d'environnement, un fichier temporaire ou stdin. Configures dans `hooks.json`.
- **Hooks de plugins WASM** -- Appellent la fonction `on-event` exportee par un plugin WASM. Declares dans le manifeste `plugin.toml` du plugin.
- **Hooks du bus d'evenements** -- Publient sur le bus d'evenements interne sur le topic `prx.lifecycle.<event>`. Toujours actifs ; aucune configuration necessaire.

## Evenements de hook

PRX emet 8 evenements du cycle de vie. Chaque evenement transporte un payload JSON avec des champs specifiques au contexte.

| Evenement | Moment d'emission | Champs du payload |
|-----------|-------------------|-------------------|
| `agent_start` | La boucle d'agent demarre un nouveau tour | `agent` (string), `session` (string) |
| `agent_end` | La boucle d'agent termine un tour | `success` (bool), `messages_count` (number) |
| `llm_request` | Avant d'envoyer une requete au fournisseur LLM | `provider` (string), `model` (string), `messages_count` (number) |
| `llm_response` | Apres reception de la reponse LLM | `provider` (string), `model` (string), `duration_ms` (number), `success` (bool) |
| `tool_call_start` | Avant le debut de l'execution d'un outil | `tool` (string), `arguments` (object) |
| `tool_call` | Apres la fin de l'execution d'un outil | `tool` (string), `success` (bool), `output` (string) |
| `turn_complete` | Tour complet termine (tous les outils resolus) | _(objet vide)_ |
| `error` | Toute erreur pendant l'execution | `component` (string), `message` (string) |

### Schemas des payloads

Tous les payloads sont des objets JSON. La structure de niveau superieur enveloppe les champs specifiques a l'evenement :

```json
{
  "event": "llm_response",
  "timestamp": "2026-03-21T08:15:30.123Z",
  "session_id": "sess_abc123",
  "payload": {
    "provider": "openai",
    "model": "gpt-4o",
    "duration_ms": 1842,
    "success": true
  }
}
```

Les champs `event`, `timestamp` et `session_id` sont presents sur chaque evenement de hook. L'objet `payload` varie selon le type d'evenement comme decrit dans le tableau ci-dessus.

## Configuration

Les hooks shell sont configures dans un fichier `hooks.json` place dans le repertoire de l'espace de travail (le meme repertoire que `config.toml`). PRX surveille ce fichier pour les modifications et **recharge a chaud** la configuration sans necessite de redemarrage.

### Structure de base

```json
{
  "hooks": {
    "<event_name>": [
      {
        "command": "/path/to/script",
        "args": ["--flag", "value"],
        "env": {
          "CUSTOM_VAR": "value"
        },
        "cwd": "/working/directory",
        "timeout_ms": 5000,
        "stdin_json": true
      }
    ]
  }
}
```

Chaque nom d'evenement correspond a un tableau d'actions de hook. Plusieurs actions peuvent etre attachees au meme evenement ; elles s'executent de maniere concurrente et independante.

### Exemple complet

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/usr/local/bin/notify",
        "args": ["--channel", "ops", "--title", "Agent Started"],
        "timeout_ms": 3000
      }
    ],
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/log_latency.py"],
        "stdin_json": true,
        "timeout_ms": 2000
      }
    ],
    "tool_call": [
      {
        "command": "/opt/hooks/audit_tool_usage.sh",
        "env": {
          "LOG_DIR": "/var/log/prx/audit"
        },
        "timeout_ms": 5000
      }
    ],
    "error": [
      {
        "command": "curl",
        "args": [
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

## Champs des actions de hook

Chaque objet d'action de hook prend en charge les champs suivants :

| Champ | Type | Requis | Defaut | Description |
|-------|------|--------|--------|-------------|
| `command` | string | Oui | -- | Chemin absolu vers l'executable ou nom de commande present dans le PATH assaini |
| `args` | string[] | Non | `[]` | Arguments passes a la commande |
| `env` | object | Non | `{}` | Variables d'environnement supplementaires fusionnees dans l'environnement d'execution assaini |
| `cwd` | string | Non | rep. de travail | Repertoire de travail pour le processus lance |
| `timeout_ms` | number | Non | `30000` | Duree d'execution maximale en millisecondes. Le processus est tue (SIGKILL) s'il depasse cette limite |
| `stdin_json` | bool | Non | `false` | Lorsque `true`, le payload JSON complet de l'evenement est transmis au processus via stdin |

### Remarques sur `command`

Le champ `command` subit une validation de securite avant l'execution. Il ne doit pas contenir de metacaracteres shell (`;`, `|`, `&`, `` ` ``, `$()`) -- ceux-ci sont rejetes pour prevenir l'injection shell. Si vous avez besoin de fonctionnalites shell, encapsulez-les dans un fichier script et pointez `command` vers ce script.

Les chemins relatifs sont resolus par rapport au repertoire de l'espace de travail. Cependant, l'utilisation de chemins absolus est recommandee pour la previsibilite.

## Livraison du payload

Les actions de hook reçoivent le payload de l'evenement via trois canaux simultanement. Cette redondance garantit que les scripts dans n'importe quel langage peuvent acceder aux donnees via la methode la plus pratique.

### 1. Variable d'environnement (`ZERO_HOOK_PAYLOAD`)

La chaine JSON du payload est definie comme variable d'environnement `ZERO_HOOK_PAYLOAD`. C'est la methode d'acces la plus simple pour les scripts shell :

```bash
#!/bin/bash
# Lire le payload depuis la variable d'environnement
echo "$ZERO_HOOK_PAYLOAD" | jq '.payload.tool'
```

**Limite de taille** : 8 Ko. Si le payload serialise depasse 8 Ko, la variable d'environnement n'est **pas definie** et le payload n'est disponible que via le fichier temporaire et les canaux stdin.

### 2. Fichier temporaire (`ZERO_HOOK_PAYLOAD_FILE`)

Le payload est ecrit dans un fichier temporaire, et le chemin du fichier est defini dans la variable d'environnement `ZERO_HOOK_PAYLOAD_FILE`. Le fichier temporaire est automatiquement supprime apres la fin du processus de hook.

```python
import os, json

payload_file = os.environ["ZERO_HOOK_PAYLOAD_FILE"]
with open(payload_file) as f:
    data = json.load(f)
print(f"Tool: {data['payload']['tool']}, Success: {data['payload']['success']}")
```

Ce canal n'a pas de limite de taille et constitue la methode recommandee pour les payloads potentiellement volumineux (par ex., `tool_call` avec une sortie verbeuse).

### 3. Entree standard (stdin)

Lorsque `stdin_json` est defini a `true` dans l'action de hook, le payload JSON est transmis au processus via stdin. Cela est utile pour les commandes qui lisent nativement depuis stdin, comme `curl -d @-` ou `jq`.

```bash
#!/bin/bash
# Lire depuis stdin (necessite stdin_json: true dans la config du hook)
read -r payload
echo "$payload" | jq -r '.payload.message'
```

## Variables d'environnement

Chaque processus de hook reçoit les variables d'environnement suivantes, en plus de `ZERO_HOOK_PAYLOAD` et `ZERO_HOOK_PAYLOAD_FILE` :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `ZERO_HOOK_EVENT` | Le nom de l'evenement qui a declenche ce hook | `tool_call` |
| `ZERO_HOOK_SESSION` | Identifiant de la session courante | `sess_abc123` |
| `ZERO_HOOK_TIMESTAMP` | Horodatage ISO 8601 de l'evenement | `2026-03-21T08:15:30.123Z` |
| `ZERO_HOOK_PAYLOAD` | Payload complet en chaine JSON (omis si >8 Ko) | `{"event":"tool_call",...}` |
| `ZERO_HOOK_PAYLOAD_FILE` | Chemin vers le fichier temporaire contenant le payload | `/tmp/prx-hook-a1b2c3.json` |

L'environnement d'execution est **assaini** avant le demarrage du processus de hook. Les variables d'environnement sensibles et dangereuses sont supprimees (voir [Securite](#securite) ci-dessous), et seules les variables listees ci-dessus plus les surcharges `env` de l'action de hook sont disponibles.

## Hooks de plugins WASM

Les plugins WASM peuvent s'abonner aux evenements de hook en exportant la fonction `on-event` definie dans l'interface WIT (WebAssembly Interface Types) de PRX.

### Interface WIT

```wit
interface hooks {
    /// Called when a subscribed event fires.
    /// Returns Ok(()) on success, Err(message) on failure.
    on-event: func(event: string, payload-json: string) -> result<_, string>;
}
```

Le parametre `event` est le nom de l'evenement (par ex., `"tool_call"`), et `payload-json` est le payload complet serialise en chaine JSON, identique a ce que reçoivent les hooks shell.

### Modeles d'abonnement aux evenements

Les plugins declarent quels evenements ils souhaitent recevoir dans leur manifeste `plugin.toml` en utilisant la correspondance de motifs :

| Modele | Correspondance | Exemple |
|--------|----------------|---------|
| Correspondance exacte | Un seul evenement specifique | `"tool_call"` |
| Suffixe generique | Tous les evenements correspondant a un prefixe | `"prx.lifecycle.*"` |
| Universel | Tous les evenements | `"*"` |

### Exemple de manifeste de plugin

```toml
[plugin]
name = "audit-logger"
version = "0.1.0"
description = "Logs all lifecycle events to an audit trail"

[[capabilities]]
type = "hook"
events = ["agent_start", "agent_end", "error"]

[[capabilities]]
type = "hook"
events = ["prx.lifecycle.*"]
```

Un seul plugin peut declarer plusieurs blocs `[[capabilities]]` avec differents motifs d'evenements. L'union de tous les evenements correspondants determine les evenements que le plugin reçoit.

### Modele d'execution

Les hooks de plugins WASM s'executent a l'interieur du sandbox WASM avec les memes limites de ressources que les autres fonctions de plugin. Ils sont soumis a :

- **Limite memoire** : Definie dans la configuration des ressources du plugin (64 Mo par defaut)
- **Delai d'execution** : Identique a `timeout_ms` pour les hooks shell (30 secondes par defaut)
- **Pas d'acces au systeme de fichiers** : Sauf autorisation explicite via les capacites WASI
- **Pas d'acces reseau** : Sauf autorisation explicite via les drapeaux de capacite

Si un hook WASM retourne `Err(message)`, l'erreur est journalisee mais n'affecte pas la boucle de l'agent. Les hooks sont toujours fire-and-forget.

## Integration du bus d'evenements

Chaque evenement de hook est automatiquement publie sur le bus d'evenements interne sur le topic `prx.lifecycle.<event>`. Cela se produit independamment de la configuration de hooks shell ou WASM.

### Format des topics

```
prx.lifecycle.agent_start
prx.lifecycle.agent_end
prx.lifecycle.llm_request
prx.lifecycle.llm_response
prx.lifecycle.tool_call_start
prx.lifecycle.tool_call
prx.lifecycle.turn_complete
prx.lifecycle.error
```

### Types d'abonnement

Les composants internes et les plugins peuvent s'abonner aux topics du bus d'evenements selon trois modeles :

- **Exact** : `prx.lifecycle.tool_call` -- reçoit uniquement les evenements `tool_call`
- **Generique** : `prx.lifecycle.*` -- reçoit tous les evenements du cycle de vie
- **Hierarchique** : `prx.*` -- reçoit tous les evenements du domaine PRX (cycle de vie, metriques, etc.)

### Limites des payloads

| Contrainte | Valeur |
|------------|--------|
| Taille maximale du payload | 64 Ko |
| Profondeur de recursion maximale | 8 niveaux |
| Modele de distribution | Fire-and-forget (asynchrone) |
| Garantie de livraison | Au plus une fois |

Si un evenement de hook declenche un autre evenement de hook (par ex., un script de hook appelle un outil qui emet `tool_call`), le compteur de recursion s'incremente. A 8 niveaux de profondeur, les emissions d'evenements supplementaires sont silencieusement ignorees pour prevenir les boucles infinies.

## API HTTP

Les hooks peuvent etre geres programmatiquement via l'API HTTP. Tous les endpoints necessitent une authentification et retournent des reponses JSON.

### Lister tous les hooks

```
GET /api/hooks
```

Reponse :

```json
{
  "hooks": [
    {
      "id": "hook_01",
      "event": "error",
      "action": {
        "command": "/opt/hooks/notify_error.sh",
        "args": [],
        "timeout_ms": 5000,
        "stdin_json": false
      },
      "enabled": true,
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  ]
}
```

### Creer un hook

```
POST /api/hooks
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true
}
```

Reponse (201 Created) :

```json
{
  "id": "hook_02",
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true,
  "created_at": "2026-03-21T08:00:00Z",
  "updated_at": "2026-03-21T08:00:00Z"
}
```

### Mettre a jour un hook

```
PUT /api/hooks/hook_02
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency_v2.py"],
    "stdin_json": true,
    "timeout_ms": 5000
  },
  "enabled": true
}
```

Reponse (200 OK) : Retourne l'objet hook mis a jour.

### Supprimer un hook

```
DELETE /api/hooks/hook_02
```

Reponse (204 No Content) : Corps vide en cas de succes.

### Basculer un hook

```
PATCH /api/hooks/hook_01/toggle
```

Reponse (200 OK) :

```json
{
  "id": "hook_01",
  "enabled": false
}
```

Ce endpoint inverse l'etat `enabled`. Les hooks desactives restent dans la configuration mais ne sont pas executes lorsque leur evenement se declenche.

## Securite

L'execution des hooks est soumise a plusieurs mesures de securite pour prevenir l'escalade de privileges, l'exfiltration de donnees et le deni de service.

### Variables d'environnement bloquees

Les variables d'environnement suivantes sont supprimees de l'environnement d'execution des hooks et ne peuvent pas etre surchargees via le champ `env` dans les actions de hook :

| Variable | Raison |
|----------|--------|
| `LD_PRELOAD` | Vecteur d'attaque par injection de bibliotheque |
| `LD_LIBRARY_PATH` | Manipulation du chemin de recherche des bibliotheques |
| `DYLD_INSERT_LIBRARIES` | Injection de bibliotheque macOS |
| `DYLD_LIBRARY_PATH` | Manipulation du chemin des bibliotheques macOS |
| `PATH` | Empeche le detournement du PATH ; un PATH minimal securise est fourni |
| `HOME` | Empeche l'usurpation du repertoire personnel |

### Validation des entrees

- **Rejet des octets nuls** : Tout `command`, `args`, cle `env` ou valeur `env` contenant un octet nul (`\0`) est rejete. Cela previent les attaques par injection d'octets nuls qui pourraient tronquer les chaines au niveau du systeme d'exploitation.
- **Rejet des metacaracteres shell** : Le champ `command` ne doit pas contenir `;`, `|`, `&`, `` ` ``, `$(` ou d'autres metacaracteres shell. Cela previent l'injection shell meme si la commande est accidentellement passee a travers un shell.
- **Traversee de chemin** : Le champ `cwd` est valide pour s'assurer qu'il ne s'echappe pas du repertoire de l'espace de travail via des composants `..`.

### Application des delais d'attente

Chaque processus de hook est soumis au `timeout_ms` configure (30 secondes par defaut). Si le processus depasse cette limite :

1. `SIGTERM` est envoye au processus
2. Apres un delai de grace de 5 secondes, `SIGKILL` est envoye
3. Le hook est marque comme ayant expire dans les metriques internes
4. La boucle de l'agent n'est **pas** affectee

### Isolation des ressources

Les processus de hook heritent des memes restrictions de cgroups et d'espaces de noms que les executions d'outils shell lorsqu'un backend de sandbox est actif. En mode sandbox Docker, les hooks s'executent dans un conteneur separe sans acces reseau par defaut.

## Exemples

### Hook de journalisation d'audit

Journaliser chaque invocation d'outil dans un fichier pour l'audit de conformite :

```json
{
  "hooks": {
    "tool_call": [
      {
        "command": "/opt/hooks/audit_log.sh",
        "env": {
          "AUDIT_LOG": "/var/log/prx/tool_audit.jsonl"
        },
        "timeout_ms": 2000
      }
    ]
  }
}
```

`/opt/hooks/audit_log.sh` :

```bash
#!/bin/bash
echo "$ZERO_HOOK_PAYLOAD" >> "$AUDIT_LOG"
```

### Hook de notification d'erreur

Envoyer les evenements d'erreur vers un canal Slack :

```json
{
  "hooks": {
    "error": [
      {
        "command": "curl",
        "args": [
          "-s", "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

### Hook de metriques de latence LLM

Suivre les temps de reponse LLM pour les tableaux de bord de surveillance :

```json
{
  "hooks": {
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/metrics.py"],
        "stdin_json": true,
        "timeout_ms": 3000
      }
    ]
  }
}
```

`/opt/hooks/metrics.py` :

```python
import sys, json

data = json.load(sys.stdin)
payload = data["payload"]
provider = payload["provider"]
model = payload["model"]
duration = payload["duration_ms"]
success = payload["success"]

# Push to StatsD, Prometheus pushgateway, or any metrics backend
print(f"prx.llm.duration,provider={provider},model={model} {duration}")
print(f"prx.llm.success,provider={provider},model={model} {1 if success else 0}")
```

### Suivi du cycle de vie des sessions

Suivre le debut et la fin des sessions d'agent pour l'analyse d'utilisation :

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["start"],
        "timeout_ms": 2000
      }
    ],
    "agent_end": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["end"],
        "timeout_ms": 2000
      }
    ]
  }
}
```

## Voir aussi

- [Execution Shell](/fr/prx/tools/shell) -- Outil shell que les hooks enveloppent souvent
- [Integration MCP](/fr/prx/tools/mcp) -- Protocole d'outils externe qui emet des evenements `tool_call`
- [Plugins](/fr/prx/plugins/) -- Systeme de plugins WASM incluant les capacites de hook
- [Observabilite](/fr/prx/observability/) -- Metriques et tracing qui completent les hooks
- [Securite](/fr/prx/security/) -- Sandbox et moteur de politiques qui gouvernent l'execution des hooks
