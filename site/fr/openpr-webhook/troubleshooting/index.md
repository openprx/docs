# Dépannage

## Problèmes courants

### 401 Unauthorized sur le POST webhook

**Symptôme :** Toutes les requêtes webhook retournent HTTP 401.

**Causes :**

1. **En-tête de signature manquant.** La requête doit inclure soit `X-Webhook-Signature` soit `X-OpenPR-Signature` avec le format `sha256={hex-digest}`.

2. **Mauvais secret.** Le digest HMAC-SHA256 doit correspondre à l'un des secrets dans `security.webhook_secrets`. Vérifiez que l'expéditeur et le récepteur utilisent la même chaîne secrète.

3. **Inadéquation du corps.** La signature est calculée sur le corps brut de la requête. Si un proxy ou middleware modifie le corps (par exemple, ré-encodage JSON), la signature ne correspondra pas.

**Débogage :**

```bash
# Activer la journalisation debug
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Autoriser temporairement les requêtes non signées pour les tests
# (config.toml)
[security]
allow_unsigned = true
```

### Événement ignoré (not_bot_task)

**Symptôme :** La réponse est `{"status": "ignored", "reason": "not_bot_task"}`.

**Cause :** Le payload webhook ne contient pas `bot_context.is_bot_task = true`. OpenPR-Webhook ne traite que les événements explicitement marqués comme tâches bot.

**Correction :** Assurez-vous que la plateforme OpenPR est configurée pour inclure le contexte bot dans les payloads webhook :

```json
{
  "event": "issue.updated",
  "bot_context": {
    "is_bot_task": true,
    "bot_name": "my-agent",
    "bot_agent_type": "cli"
  },
  "data": { ... }
}
```

### Aucun agent trouvé

**Symptôme :** La réponse est `{"status": "no_agent", "bot_name": "..."}`.

**Cause :** Aucun agent configuré ne correspond au `bot_name` ou au `bot_agent_type` du payload.

**Correction :**

1. Vérifiez qu'un agent est configuré avec un `id` ou un `name` qui correspond à la valeur de `bot_name`
2. Vérifiez que l'`agent_type` de l'agent correspond à `bot_agent_type`
3. La correspondance par nom est insensible à la casse, mais la correspondance par `id` est exacte

### L'agent CLI retourne "disabled"

**Symptôme :** Le dispatch CLI retourne `"cli disabled by feature flag or safe mode"`.

**Causes :**

1. `features.cli_enabled` n'est pas défini à `true`
2. La variable d'environnement `OPENPR_WEBHOOK_SAFE_MODE` est définie

**Correction :**

```toml
[features]
cli_enabled = true
```

Et vérifiez que le mode sécurisé n'est pas actif :

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Devrait être vide ou non défini
```

### Exécuteur CLI "not allowed"

**Symptôme :** Message d'erreur `"executor not allowed: {name}"`.

**Cause :** Le champ `executor` dans la configuration de l'agent CLI contient une valeur absente de la liste blanche.

**Exécuteurs autorisés :**
- `codex`
- `claude-code`
- `opencode`

Toute autre valeur est rejetée pour des raisons de sécurité.

### Le tunnel échoue à se connecter

**Symptôme :** Les messages de journalisation affichent `tunnel connect failed: ...` de façon répétée.

**Causes :**

1. **URL invalide.** L'URL du tunnel doit commencer par `wss://` ou `ws://`.
2. **Problème réseau.** Vérifiez que le serveur du plan de contrôle est accessible.
3. **Échec d'authentification.** Vérifiez que `tunnel.auth_token` est correct.
4. **Champs requis manquants.** `tunnel.agent_id` et `tunnel.auth_token` doivent être non vides.

**Débogage :**

```bash
# Tester la connectivité WebSocket manuellement
# (nécessite wscat ou websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### Le tunnel continue de se reconnecter

**Symptôme :** Les journaux affichent `tunnel disconnected, reconnecting in Ns` en boucle.

**Comportement normal :** Le tunnel se reconnecte automatiquement avec un backoff exponentiel (jusqu'à `tunnel_reconnect_backoff_max_secs`). Consultez les journaux du plan de contrôle pour la raison de la déconnexion.

**Réglage :**

```toml
[tunnel]
reconnect_secs = 3        # Intervalle de nouvelle tentative de base
heartbeat_secs = 20       # Intervalle de maintien de connexion

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Backoff maximum
```

### Échecs de callback

**Symptôme :** Les journaux affichent `start callback failed: ...` ou `final callback failed: ...`.

**Causes :**

1. **callback_enabled est false.** Les callbacks nécessitent `features.callback_enabled = true`.
2. **callback_url invalide.** Vérifiez que l'URL est accessible.
3. **Échec d'authentification.** Si le point de terminaison du callback nécessite une auth, définissez `callback_token`.
4. **Expiration.** Le délai d'expiration HTTP par défaut est de 15 secondes. Augmentez avec `runtime.http_timeout_secs`.

### Erreurs d'exécution de l'agent OpenClaw/Custom

**Symptôme :** La réponse contient `exec_error: ...` ou `error: ...`.

**Causes :**

1. **Binaire introuvable.** Vérifiez que le chemin `command` existe et est exécutable.
2. **Permission refusée.** Le processus openpr-webhook doit avoir la permission d'exécution.
3. **Dépendances manquantes.** L'outil CLI peut nécessiter d'autres programmes ou bibliothèques.

**Débogage :**

```bash
# Tester la commande manuellement
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## Liste de contrôle de diagnostic

1. **Vérifier la santé du service :**
   ```bash
   curl http://localhost:9000/health
   # Devrait retourner : ok
   ```

2. **Vérifier les agents chargés :**
   Regardez dans le journal de démarrage la ligne `Loaded N agent(s)`.

3. **Activer la journalisation debug :**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **Vérifier la signature manuellement :**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **Tester avec des requêtes non signées (développement uniquement) :**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **Vérifier le statut du mode sécurisé :**
   ```bash
   # Si défini, tunnel/cli/callback sont désactivés de force
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## Référence des messages de journalisation

| Niveau | Message | Signification |
|-----------|---------|---------|
| INFO | `Loaded N agent(s)` | Configuration chargée avec succès |
| INFO | `openpr-webhook listening on ...` | Serveur démarré |
| INFO | `Received webhook event: ...` | Événement entrant analysé |
| INFO | `Dispatching to agent: ...` | Agent correspondant, dispatch en cours |
| INFO | `tunnel connected: ...` | Tunnel WSS établi |
| WARN | `Invalid webhook signature` | Échec de la vérification de signature |
| WARN | `No agent for bot_name=...` | Aucun agent correspondant trouvé |
| WARN | `tunnel disconnected, reconnecting` | Connexion tunnel perdue |
| WARN | `tunnel using insecure ws:// transport` | TLS non utilisé |
| ERROR | `tunnel connect failed: ...` | Erreur de connexion WebSocket |
| ERROR | `openclaw failed: ...` | La commande OpenClaw a retourné un code non nul |
