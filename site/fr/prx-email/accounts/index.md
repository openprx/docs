---
title: Gestion des comptes
description: "Créer, configurer et gérer les comptes email dans PRX-Email. Prend en charge les configurations multi-comptes avec des configurations IMAP/SMTP indépendantes."
---

# Gestion des comptes

PRX-Email prend en charge plusieurs comptes email, chacun avec sa propre configuration IMAP et SMTP, ses identifiants d'authentification et ses flags de fonctionnalité. Les comptes sont stockés dans la base de données SQLite et identifiés par un `account_id` unique.

## Créer un compte

Utilisez `EmailRepository` pour créer un nouveau compte :

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### Champs du compte

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `i64` | Clé primaire auto-générée |
| `email` | `String` | Adresse email (utilisée comme utilisateur IMAP/SMTP) |
| `display_name` | `Option<String>` | Nom lisible par l'homme pour le compte |
| `created_at` | `i64` | Horodatage Unix de la création |
| `updated_at` | `i64` | Horodatage Unix de la dernière mise à jour |

## Récupérer un compte

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email : {}", acct.email);
    println!("Nom : {}", acct.display_name.unwrap_or_default());
}
```

## Configuration multi-comptes

Chaque compte fonctionne indépendamment avec ses propres :

- **Connexion IMAP** -- Serveur, port et identifiants séparés
- **Connexion SMTP** -- Serveur, port et identifiants séparés
- **Dossiers** -- Liste des dossiers synchronisés par compte
- **État de synchronisation** -- Suivi des curseurs par paire compte/dossier
- **Flags de fonctionnalité** -- Activation indépendante des fonctionnalités
- **Boîte d'envoi** -- File d'envoi séparée avec suivi par message

```rust
// Compte 1 : Gmail avec OAuth
let gmail_id = repo.create_account(&NewAccount {
    email: "alice@gmail.com".to_string(),
    display_name: Some("Alice (Gmail)".to_string()),
    now_ts: now,
})?;

// Compte 2 : Email professionnel avec mot de passe
let work_id = repo.create_account(&NewAccount {
    email: "alice@company.com".to_string(),
    display_name: Some("Alice (Travail)".to_string()),
    now_ts: now,
})?;
```

## Flags de fonctionnalité

PRX-Email utilise des flags de fonctionnalité pour contrôler quelles capacités sont activées par compte. Cela supporte le déploiement progressif des nouvelles fonctionnalités.

### Flags de fonctionnalité disponibles

| Flag | Description |
|------|-------------|
| `inbox_read` | Autoriser la liste et la lecture des messages |
| `inbox_search` | Autoriser la recherche dans les messages |
| `email_send` | Autoriser l'envoi de nouveaux emails |
| `email_reply` | Autoriser la réponse aux emails |
| `outbox_retry` | Autoriser la relance des messages de boîte d'envoi échoués |

### Gérer les flags de fonctionnalité

```rust
// Activer une fonctionnalité pour un compte spécifique
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Désactiver une fonctionnalité
plugin.set_account_feature(account_id, "email_send", false, now)?;

// Définir le défaut global pour tous les comptes
plugin.set_feature_default("inbox_read", true, now)?;

// Vérifier si une fonctionnalité est activée
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
```

### Déploiement basé sur pourcentage

Déployez des fonctionnalités à un pourcentage de comptes :

```rust
// Activer email_send pour 50% des comptes
let enabled = plugin.apply_percentage_rollout(
    account_id,
    "email_send",
    50,  // pourcentage
    now,
)?;
println!("Fonctionnalité activée pour ce compte : {}", enabled);
```

Le déploiement utilise `account_id % 100` pour assigner les comptes à des buckets de façon déterministe, garantissant un comportement cohérent entre les redémarrages.

## Gestion des dossiers

Les dossiers sont créés automatiquement lors de la synchronisation IMAP, ou vous pouvez les créer manuellement :

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### Lister les dossiers

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## Étapes suivantes

- [Configuration IMAP](./imap) -- Configurer les connexions au serveur IMAP
- [Configuration SMTP](./smtp) -- Configurer le pipeline d'envoi SMTP
- [Authentification OAuth](./oauth) -- Configurer OAuth pour Gmail et Outlook
