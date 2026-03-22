---
title: Dépannage
description: "Solutions aux problèmes courants de PRX-Email : erreurs OAuth, échecs de synchronisation IMAP, problèmes d'envoi SMTP, erreurs SQLite et problèmes de plugins WASM."
---

# Dépannage

Cette page couvre les problèmes les plus courants rencontrés lors de l'exécution de PRX-Email, ainsi que leurs causes et solutions.

## Jeton OAuth expiré

**Symptômes :** Les opérations échouent avec le code d'erreur `Provider` et un message concernant des jetons expirés.

**Causes possibles :**
- Le jeton d'accès OAuth a expiré et aucun fournisseur de rafraîchissement n'est configuré
- La variable d'environnement `*_OAUTH_EXPIRES_AT` contient un horodatage obsolète
- Le fournisseur de rafraîchissement retourne des erreurs

**Solutions :**

1. **Vérifier les horodatages d'expiration des jetons :**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# Ces valeurs doivent être des horodatages Unix dans le futur
```

2. **Recharger manuellement les jetons depuis l'environnement :**

```rust
// Définir de nouveaux jetons
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// Recharger
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **Implémenter un fournisseur de rafraîchissement** pour le renouvellement automatique des jetons :

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **Relancer le script de bootstrap Outlook** pour obtenir de nouveaux jetons :

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Email tente de rafraîchir les jetons 60 secondes avant leur expiration. Si vos jetons expirent plus vite que votre intervalle de synchronisation, assurez-vous que le fournisseur de rafraîchissement est connecté.
:::

## Échec de la synchronisation IMAP

**Symptômes :** `sync()` retourne une erreur `Network`, ou le sync runner signale des échecs.

**Causes possibles :**
- Nom d'hôte ou port du serveur IMAP incorrect
- Problèmes de connectivité réseau
- Échec d'authentification (mauvais mot de passe ou jeton OAuth expiré)
- Limitation de débit du serveur IMAP

**Solutions :**

1. **Vérifier la connectivité au serveur IMAP :**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **Vérifier la configuration du transport :**

```rust
// S'assurer que l'hôte et le port sont corrects
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **Vérifier le mode d'authentification :**

```rust
// Exactement l'un des deux doit être défini
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **Vérifier l'état de backoff du sync runner.** Après des échecs répétés, le planificateur applique un backoff exponentiel. Réinitialisez temporairement en utilisant un `now_ts` dans un futur lointain :

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **Consulter les logs structurés** pour des informations d'erreur détaillées :

```bash
# Rechercher les logs structurés liés à la synchronisation
grep "prx_email.*sync" /path/to/logs
```

## Échec d'envoi SMTP

**Symptômes :** `send()` retourne un `ApiResponse` avec `ok: false` et une erreur `Network` ou `Provider`.

**Causes possibles :**
- Nom d'hôte ou port du serveur SMTP incorrect
- Échec d'authentification
- Adresse du destinataire rejetée par le fournisseur
- Limitation de débit ou quota d'envoi dépassé

**Solutions :**

1. **Vérifier le statut de la boîte d'envoi :**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **Vérifier la configuration SMTP :**

```rust
// Vérifier le mode d'auth
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **Vérifier les erreurs de validation.** L'API d'envoi rejette :
   - `to`, `subject` ou `body_text` vides
   - Flag de fonctionnalité `email_send` désactivé
   - Adresses email invalides

4. **Tester avec un échec simulé** pour vérifier votre gestion des erreurs :

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... champs ...
    failure_mode: Some(SendFailureMode::Network), // Simuler un échec
});
```

## Boîte d'envoi bloquée dans l'état "sending"

**Symptômes :** Les enregistrements de la boîte d'envoi ont `status = 'sending'` mais le processus a planté avant la finalisation.

**Cause :** Le processus a planté après avoir revendiqué l'enregistrement de boîte d'envoi mais avant de le finaliser en `sent` ou `failed`.

**Solution :** Récupérer manuellement les enregistrements bloqués via SQL :

```sql
-- Identifier les lignes bloquées (seuil : 15 minutes)
SELECT id, account_id, updated_at
FROM outbox
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;

-- Récupérer en failed et planifier une nouvelle tentative
UPDATE outbox
SET status = 'failed',
    last_error = 'recovered_from_stuck_sending',
    next_attempt_at = strftime('%s','now') + 30,
    updated_at = strftime('%s','now')
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;
```

## Pièce jointe rejetée

**Symptômes :** L'envoi échoue avec "attachment exceeds size limit" ou "attachment content type is not allowed".

**Solutions :**

1. **Vérifier la politique des pièces jointes :**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **Vérifier la taille du fichier** par rapport à la limite (défaut : 25 MiO).

3. **Ajouter le type MIME** à la liste autorisée s'il est sûr :

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **Pour les pièces jointes basées sur un chemin**, assurez-vous que le chemin du fichier est sous la racine de stockage des pièces jointes configurée. Les chemins contenant `../` ou des liens symboliques se résolvant hors de la racine sont rejetés.

## Erreur de fonctionnalité désactivée

**Symptômes :** Les opérations retournent le code d'erreur `FeatureDisabled`.

**Cause :** Le flag de fonctionnalité pour l'opération demandée n'est pas activé pour le compte.

**Solution :**

```rust
// Vérifier l'état actuel
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// Activer la fonctionnalité
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Ou définir la valeur par défaut globale
plugin.set_feature_default("email_send", true, now)?;
```

## Erreurs de base de données SQLite

**Symptômes :** Les opérations échouent avec le code d'erreur `Storage`.

**Causes possibles :**
- Le fichier de base de données est verrouillé par un autre processus
- Le disque est plein
- Le fichier de base de données est corrompu
- Les migrations n'ont pas été exécutées

**Solutions :**

1. **Exécuter les migrations :**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **Vérifier le verrouillage de la base de données.** Une seule connexion d'écriture peut être active à la fois. Augmentez le délai d'attente :

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 secondes
    ..StoreConfig::default()
};
```

3. **Vérifier l'espace disque :**

```bash
df -h .
```

4. **Réparer ou recréer** si la base de données est corrompue :

```bash
# Sauvegarder la base de données existante
cp email.db email.db.bak

# Vérifier l'intégrité
sqlite3 email.db "PRAGMA integrity_check;"

# Si corrompue, exporter et réimporter
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## Problèmes de plugin WASM

### Erreur de garde réseau

**Symptômes :** Les opérations email hébergées par WASM retournent l'erreur `EMAIL_NETWORK_GUARD`.

**Cause :** Le commutateur de sécurité réseau n'est pas activé.

**Solution :**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Capacité hôte non disponible

**Symptômes :** Les opérations retournent `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

**Cause :** Le runtime hôte ne fournit pas la capacité email. Cela se produit lors d'une exécution hors du contexte WASM.

**Solution :** Assurez-vous que le runtime PRX est configuré pour fournir les host-calls email au plugin.

## Le sync runner continue de sauter des tâches

**Symptômes :** Le sync runner rapporte `attempted: 0` même si des tâches sont configurées.

**Cause :** Toutes les tâches sont en backoff en raison d'échecs précédents.

**Solutions :**

1. **Vérifier l'état du backoff d'échec** en examinant les logs structurés.

2. **Vérifier l'accessibilité réseau** et l'authentification IMAP avant de relancer.

3. **Réinitialiser le backoff** en utilisant un horodatage dans un futur lointain :

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## Taux d'échec d'envoi élevé

**Symptômes :** Les métriques montrent un nombre élevé de `send_failures`.

**Solutions :**

1. **Inspecter les logs structurés** filtrés par `run_id` et `error_code` :

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **Vérifier le mode d'auth SMTP.** Assurez-vous qu'exactement l'un des deux est défini : mot de passe ou oauth_token.

3. **Valider la disponibilité du fournisseur** avant d'activer un déploiement large.

4. **Consulter les métriques :**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## Obtenir de l'aide

Si aucune des solutions ci-dessus ne résout votre problème :

1. **Vérifier les issues existantes :** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **Ouvrir une nouvelle issue** avec :
   - Version de PRX-Email (vérifier `Cargo.toml`)
   - Version de la chaîne d'outils Rust (`rustc --version`)
   - Sortie de logs structurés pertinente
   - Étapes pour reproduire

## Étapes suivantes

- [Référence de configuration](../configuration/) -- Vérifier tous les paramètres
- [Authentification OAuth](../accounts/oauth) -- Résoudre les problèmes spécifiques à OAuth
- [Stockage SQLite](../storage/) -- Maintenance et récupération de la base de données
