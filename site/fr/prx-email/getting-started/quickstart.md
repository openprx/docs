---
title: Démarrage rapide
description: "Configurer PRX-Email, créer votre premier compte, synchroniser votre boîte de réception et envoyer un email en moins de 5 minutes."
---

# Démarrage rapide

Ce guide vous amène de zéro à une configuration email fonctionnelle en moins de 5 minutes. À la fin, vous aurez PRX-Email configuré avec un compte, la boîte de réception synchronisée et un email de test envoyé.

::: tip Prérequis
Vous avez besoin de Rust 1.85+ installé. Consultez le [Guide d'installation](./installation) pour les dépendances de compilation.
:::

## Étape 1 : Ajouter PRX-Email à votre projet

Créez un nouveau projet Rust ou ajoutez-le à un existant :

```bash
cargo new my-email-app
cd my-email-app
```

Ajoutez la dépendance au `Cargo.toml` :

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## Étape 2 : Initialiser la base de données

PRX-Email utilise SQLite pour toute la persistance. Ouvrez un store et exécutez les migrations :

```rust
use prx_email::db::{EmailStore, EmailRepository, NewAccount};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Ouvrir (ou créer) un fichier de base de données SQLite
    let store = EmailStore::open("./email.db")?;

    // Exécuter les migrations pour créer toutes les tables
    store.migrate()?;

    // Créer un référentiel pour les opérations de base de données
    let repo = EmailRepository::new(&store);

    println!("Base de données initialisée avec succès.");
    Ok(())
}
```

La base de données est créée avec le mode WAL, les clés étrangères activées et un délai d'expiration d'occupation de 5 secondes par défaut.

## Étape 3 : Créer un compte email

```rust
let now = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)?
    .as_secs() as i64;

let account_id = repo.create_account(&NewAccount {
    email: "you@example.com".to_string(),
    display_name: Some("Your Name".to_string()),
    now_ts: now,
})?;

println!("Compte créé avec l'ID : {}", account_id);
```

## Étape 4 : Configurer le transport et créer le plugin

```rust
use prx_email::plugin::{
    EmailPlugin, EmailTransportConfig, ImapConfig, SmtpConfig,
    AuthConfig, AttachmentPolicy,
};

let config = EmailTransportConfig {
    imap: ImapConfig {
        host: "imap.example.com".to_string(),
        port: 993,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    smtp: SmtpConfig {
        host: "smtp.example.com".to_string(),
        port: 465,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    attachment_store: None,
    attachment_policy: AttachmentPolicy::default(),
};

let plugin = EmailPlugin::new_with_config(repo, config);
```

## Étape 5 : Synchroniser votre boîte de réception

```rust
use prx_email::plugin::SyncRequest;

let result = plugin.sync(SyncRequest {
    account_id,
    folder: Some("INBOX".to_string()),
    cursor: None,
    now_ts: now,
    max_messages: 50,
});

match result {
    Ok(()) => println!("Boîte de réception synchronisée avec succès."),
    Err(e) => eprintln!("Échec de la synchronisation : {:?}", e),
}
```

## Étape 6 : Lister les messages

```rust
use prx_email::plugin::ListMessagesRequest;

let messages = plugin.list(ListMessagesRequest {
    account_id,
    limit: 10,
})?;

for msg in &messages {
    println!(
        "[{}] {} - {}",
        msg.message_id,
        msg.sender.as_deref().unwrap_or("inconnu"),
        msg.subject.as_deref().unwrap_or("(pas de sujet)"),
    );
}
```

## Étape 7 : Envoyer un email

```rust
use prx_email::plugin::SendEmailRequest;

let response = plugin.send(SendEmailRequest {
    account_id,
    to: "recipient@example.com".to_string(),
    subject: "Bonjour depuis PRX-Email".to_string(),
    body_text: "Ceci est un email de test envoyé via PRX-Email.".to_string(),
    now_ts: now,
    attachment: None,
    failure_mode: None,
});

if response.ok {
    let result = response.data.as_ref().unwrap();
    println!("Envoyé ! ID boîte d'envoi : {}, Statut : {}", result.outbox_id, result.status);
} else {
    let error = response.error.as_ref().unwrap();
    eprintln!("Échec d'envoi : {:?} - {}", error.code, error.message);
}
```

## Étape 8 : Vérifier les métriques

```rust
let metrics = plugin.metrics_snapshot();
println!("Tentatives de sync : {}", metrics.sync_attempts);
println!("Syncs réussies :     {}", metrics.sync_success);
println!("Échecs de sync :     {}", metrics.sync_failures);
println!("Échecs d'envoi :     {}", metrics.send_failures);
println!("Nouvelles tentatives : {}", metrics.retry_count);
```

## Ce que vous avez maintenant

Après avoir complété ces étapes, votre application dispose de :

| Composant | Statut |
|-----------|--------|
| Base de données SQLite | Initialisée avec le schéma complet |
| Compte email | Créé et configuré |
| Synchronisation IMAP | Connectée et récupérant les messages |
| Boîte d'envoi SMTP | Prête avec pipeline d'envoi atomique |
| Métriques | Suivant les opérations de sync et d'envoi |

## Paramètres courants des fournisseurs

| Fournisseur | Hôte IMAP | Port IMAP | Hôte SMTP | Port SMTP | Auth |
|----------|-----------|-----------|-----------|-----------|------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | Mot de passe d'application ou OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth (recommandé) |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | Mot de passe d'application |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | Mot de passe d'application |

::: warning Gmail
Gmail nécessite soit un **Mot de passe d'application** (avec la 2FA activée) soit **OAuth 2.0**. Les mots de passe ordinaires ne fonctionnent pas avec IMAP/SMTP. Consultez le [Guide OAuth](../accounts/oauth) pour les instructions de configuration.
:::

## Étapes suivantes

- [Configuration IMAP](../accounts/imap) -- Paramètres IMAP avancés et synchronisation multi-dossiers
- [Configuration SMTP](../accounts/smtp) -- Pipeline de boîte d'envoi, logique de nouvelle tentative et gestion des pièces jointes
- [Authentification OAuth](../accounts/oauth) -- Configurer OAuth pour Gmail et Outlook
- [Stockage SQLite](../storage/) -- Optimisation de la base de données et planification de capacité
