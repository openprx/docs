---
title: Référence de configuration
description: "Référence complète de la configuration PRX-Email incluant les paramètres de transport, les options de stockage, les politiques de pièces jointes, les variables d'environnement et le réglage du runtime."
---

# Référence de configuration

Cette page est la référence complète de toutes les options de configuration, variables d'environnement et paramètres runtime de PRX-Email.

## Configuration du transport

La struct `EmailTransportConfig` configure les connexions IMAP et SMTP :

```rust
use prx_email::plugin::{
    EmailTransportConfig, ImapConfig, SmtpConfig, AuthConfig,
    AttachmentPolicy, AttachmentStoreConfig,
};

let config = EmailTransportConfig {
    imap: ImapConfig { /* ... */ },
    smtp: SmtpConfig { /* ... */ },
    attachment_store: Some(AttachmentStoreConfig { /* ... */ }),
    attachment_policy: AttachmentPolicy::default(),
};
```

### Paramètres IMAP

| Champ | Type | Défaut | Description |
|-------|------|---------|-------------|
| `imap.host` | `String` | (requis) | Nom d'hôte du serveur IMAP |
| `imap.port` | `u16` | (requis) | Port du serveur IMAP (typiquement 993) |
| `imap.user` | `String` | (requis) | Nom d'utilisateur IMAP |
| `imap.auth.password` | `Option<String>` | `None` | Mot de passe pour l'auth LOGIN |
| `imap.auth.oauth_token` | `Option<String>` | `None` | Jeton OAuth pour XOAUTH2 |

### Paramètres SMTP

| Champ | Type | Défaut | Description |
|-------|------|---------|-------------|
| `smtp.host` | `String` | (requis) | Nom d'hôte du serveur SMTP |
| `smtp.port` | `u16` | (requis) | Port du serveur SMTP (465 ou 587) |
| `smtp.user` | `String` | (requis) | Nom d'utilisateur SMTP |
| `smtp.auth.password` | `Option<String>` | `None` | Mot de passe pour PLAIN/LOGIN |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | Jeton OAuth pour XOAUTH2 |

### Règles de validation

- `imap.host` et `smtp.host` ne doivent pas être vides
- `imap.user` et `smtp.user` ne doivent pas être vides
- Exactement l'un de `password` ou `oauth_token` doit être défini pour chaque protocole
- `attachment_policy.max_size_bytes` doit être supérieur à 0
- `attachment_policy.allowed_content_types` ne doit pas être vide

## Configuration du stockage

### StoreConfig

| Champ | Type | Défaut | Description |
|-------|------|---------|-------------|
| `enable_wal` | `bool` | `true` | Activer le mode journal WAL |
| `busy_timeout_ms` | `u64` | `5000` | Délai d'expiration d'occupation SQLite en millisecondes |
| `wal_autocheckpoint_pages` | `i64` | `1000` | Pages entre les checkpoints automatiques |
| `synchronous` | `SynchronousMode` | `Normal` | Mode de sync : `Full`, `Normal` ou `Off` |

### Pragmas SQLite appliqués

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- quand enable_wal = true
PRAGMA synchronous = NORMAL;      -- correspond au paramètre synchronous
PRAGMA wal_autocheckpoint = 1000; -- correspond à wal_autocheckpoint_pages
```

## Politique des pièces jointes

### AttachmentPolicy

| Champ | Type | Défaut | Description |
|-------|------|---------|-------------|
| `max_size_bytes` | `usize` | `26 214 400` (25 MiO) | Taille maximale des pièces jointes |
| `allowed_content_types` | `HashSet<String>` | Voir ci-dessous | Types MIME autorisés |

### Types MIME autorisés par défaut

| Type MIME | Description |
|-----------|-------------|
| `application/pdf` | Documents PDF |
| `image/jpeg` | Images JPEG |
| `image/png` | Images PNG |
| `text/plain` | Fichiers texte brut |
| `application/zip` | Archives ZIP |

### AttachmentStoreConfig

| Champ | Type | Défaut | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | (requis) | Activer la persistance des pièces jointes |
| `dir` | `String` | (requis) | Répertoire racine pour les pièces jointes stockées |

::: warning Sécurité des chemins
Les chemins de pièces jointes sont validés contre les attaques de traversée de répertoire. Tout chemin se résolvant hors de la racine `dir` configurée est rejeté, y compris les échappements basés sur les liens symboliques.
:::

## Configuration du Sync Runner

### SyncRunnerConfig

| Champ | Type | Défaut | Description |
|-------|------|---------|-------------|
| `max_concurrency` | `usize` | `4` | Nombre maximum de tâches par tick du runner |
| `base_backoff_seconds` | `i64` | `10` | Backoff initial en cas d'échec |
| `max_backoff_seconds` | `i64` | `300` | Backoff maximum (5 minutes) |

## Variables d'environnement

### Gestion des jetons OAuth

| Variable | Description |
|----------|-------------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | Jeton d'accès OAuth IMAP |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | Jeton d'accès OAuth SMTP |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | Expiration du jeton IMAP (secondes Unix) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | Expiration du jeton SMTP (secondes Unix) |

Le préfixe par défaut est `PRX_EMAIL`. Utilisez `reload_auth_from_env("PRX_EMAIL")` pour charger ces variables au runtime.

### Plugin WASM

| Variable | Défaut | Description |
|----------|---------|-------------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | non défini (désactivé) | Définir à `1` pour activer IMAP/SMTP réels depuis le contexte WASM |

## Limites de l'API

| Limite | Valeur | Description |
|-------|-------|-------------|
| Limite min de list/search | 1 | Paramètre `limit` minimum |
| Limite max de list/search | 500 | Paramètre `limit` maximum |
| Troncature des messages de débogage | 160 caractères | Les messages de débogage du fournisseur sont tronqués |
| Longueur des extraits de message | 120 caractères | Extraits de message auto-générés |

## Codes d'erreur

| Code | Description |
|------|-------------|
| `Validation` | Échec de validation des entrées (champs vides, limites hors plage, fonctionnalités inconnues) |
| `FeatureDisabled` | Opération bloquée par un flag de fonctionnalité |
| `Network` | Erreur de connexion ou de protocole IMAP/SMTP |
| `Provider` | Le fournisseur email a rejeté l'opération |
| `Storage` | Erreur de base de données SQLite |

## Constantes de la boîte d'envoi

| Constante | Valeur | Description |
|----------|-------|-------------|
| Backoff de base | 5 secondes | Backoff initial avant nouvelle tentative |
| Formule de backoff | `5 * 2^retries` | Croissance exponentielle |
| Nouvelles tentatives max | Non borné | Limité par la croissance du backoff |
| Clé d'idempotence | `outbox-{id}-{retries}` | Message-ID déterministe |

## Flags de fonctionnalité

| Flag | Description | Niveau de risque |
|------|-------------|------------|
| `inbox_read` | Lister et obtenir les messages | Faible |
| `inbox_search` | Rechercher les messages par requête | Faible |
| `email_send` | Envoyer de nouveaux emails | Moyen |
| `email_reply` | Répondre aux emails existants | Moyen |
| `outbox_retry` | Relancer les messages de boîte d'envoi échoués | Faible |

## Journalisation

PRX-Email écrit les journaux structurés vers stderr au format :

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### Sécurité

- Les jetons OAuth, mots de passe et clés API ne sont **jamais journalisés**
- Les adresses email sont redactées dans les journaux de débogage (ex. `a***@example.com`)
- Les messages de débogage du fournisseur sont assainis : les en-têtes d'autorisation sont redactés et la sortie est tronquée à 160 caractères

## Étapes suivantes

- [Installation](../getting-started/installation) -- Configurer PRX-Email
- [Gestion des comptes](../accounts/) -- Configurer les comptes et fonctionnalités
- [Dépannage](../troubleshooting/) -- Résoudre les problèmes de configuration
