---
title: Authentification OAuth
description: "Configurer l'authentification OAuth 2.0 XOAUTH2 pour PRX-Email avec Gmail et Outlook. Gestion du cycle de vie des jetons, fournisseurs de rafraîchissement et rechargement à chaud."
---

# Authentification OAuth

PRX-Email prend en charge l'authentification OAuth 2.0 via le mécanisme XOAUTH2 pour IMAP et SMTP. Cela est requis pour Outlook/Office 365 et recommandé pour Gmail. Le plugin fournit le suivi de l'expiration des jetons, des fournisseurs de rafraîchissement extensibles et un rechargement à chaud basé sur les variables d'environnement.

## Fonctionnement de XOAUTH2

XOAUTH2 remplace l'authentification traditionnelle par mot de passe avec un jeton d'accès OAuth. Le client envoie une chaîne spécialement formatée lors de l'AUTHENTICATE IMAP ou SMTP AUTH :

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

PRX-Email gère cela automatiquement lorsque `auth.oauth_token` est défini.

## Configuration OAuth Gmail

### 1. Créer des identifiants Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un existant
3. Activez l'API Gmail
4. Créez des identifiants OAuth 2.0 (type Application de bureau)
5. Notez l'**ID client** et le **Secret client**

### 2. Obtenir un jeton d'accès

Utilisez le playground OAuth de Google ou votre propre flux OAuth pour obtenir un jeton d'accès avec les portées suivantes :

- `https://mail.google.com/` (accès IMAP/SMTP complet)

### 3. Configurer PRX-Email

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Configuration OAuth Outlook

PRX-Email inclut un script de bootstrap pour Outlook/Office 365 OAuth qui gère l'intégralité du flux de code d'autorisation.

### 1. Enregistrer une application Azure

1. Allez sur [Azure Portal App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Enregistrez une nouvelle application
3. Définissez un URI de redirection (ex. `http://localhost:53682/callback`)
4. Notez l'**ID d'application (client)** et l'**ID du répertoire (locataire)**
5. Sous Permissions API, ajoutez :
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. Exécuter le script de bootstrap

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

Le script va :
1. Afficher une URL d'autorisation -- ouvrez-la dans votre navigateur
2. Attendre que vous colliez l'URL de callback ou le code d'autorisation
3. Échanger le code contre des jetons d'accès et de rafraîchissement
4. Sauvegarder les jetons dans `./outlook_oauth.local.env` avec `chmod 600`

### Options du script

| Flag | Description |
|------|-------------|
| `--output <fichier>` | Chemin de sortie personnalisé (défaut : `./outlook_oauth.local.env`) |
| `--dry-run` | Afficher l'URL d'autorisation et quitter |
| `-h`, `--help` | Afficher les informations d'utilisation |

### Variables d'environnement

| Variable | Requis | Description |
|----------|----------|-------------|
| `CLIENT_ID` | Oui | ID client de l'application Azure |
| `TENANT` | Oui | ID de locataire, ou `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | Oui | URI de redirection enregistré dans l'application Azure |
| `SCOPE` | Non | Portées personnalisées (défaut : IMAP + SMTP + offline_access) |

::: warning Sécurité
Ne commitez jamais le fichier de jetons généré. Ajoutez `*.local.env` à votre `.gitignore`.
:::

### 3. Charger les jetons

Après que le script de bootstrap génère les jetons, sourcez le fichier env et configurez PRX-Email :

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## Gestion du cycle de vie des jetons

### Suivi de l'expiration

PRX-Email suit les horodatages d'expiration des jetons OAuth par protocole (IMAP/SMTP) :

```rust
// Définir l'expiration via l'environnement
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

Avant chaque opération, le plugin vérifie si le jeton expire dans les 60 secondes. Si c'est le cas, un rafraîchissement est tenté.

### Fournisseur de rafraîchissement extensible

Implémentez le trait `OAuthRefreshProvider` pour gérer le rafraîchissement automatique des jetons :

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // Appelez le point de terminaison de jeton de votre fournisseur OAuth
        // Retournez le nouveau jeton d'accès et l'expiration optionnelle
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

Attachez le fournisseur lors de la création du plugin :

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### Rechargement à chaud depuis l'environnement

Rechargez les jetons OAuth au runtime sans redémarrage :

```rust
// Définir de nouveaux jetons dans l'environnement
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// Déclencher le rechargement
plugin.reload_auth_from_env("PRX_EMAIL");
```

La méthode `reload_auth_from_env` lit les variables d'environnement avec le préfixe donné et met à jour les jetons OAuth IMAP/SMTP et les horodatages d'expiration. Lorsqu'un jeton OAuth est chargé, le mot de passe correspondant est effacé pour maintenir l'invariant un-des-deux-auth.

### Rechargement complet de la configuration

Pour une reconfiguration complète du transport :

```rust
plugin.reload_config(new_transport_config)?;
```

Cela valide la nouvelle configuration et remplace atomiquement toute la configuration du transport.

## Variables d'environnement OAuth

| Variable | Description |
|----------|-------------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | Jeton d'accès OAuth IMAP |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | Jeton d'accès OAuth SMTP |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | Expiration du jeton IMAP (secondes Unix) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | Expiration du jeton SMTP (secondes Unix) |

Le préfixe est passé à `reload_auth_from_env()`. Pour la configuration PRX-Email par défaut, utilisez `PRX_EMAIL` comme préfixe.

## Bonnes pratiques de sécurité

1. **Ne journalisez jamais les jetons.** PRX-Email assainit les messages de débogage et redacte les contenus liés à l'autorisation.
2. **Utilisez les jetons de rafraîchissement.** Les jetons d'accès expirent ; implémentez toujours un fournisseur de rafraîchissement pour une utilisation en production.
3. **Stockez les jetons de façon sécurisée.** Utilisez les permissions de fichier (`chmod 600`) et ne commitez jamais les fichiers de jetons dans le contrôle de version.
4. **Faites tourner les jetons régulièrement.** Même avec le rafraîchissement automatique, vérifiez périodiquement que les jetons sont bien renouvelés.

## Étapes suivantes

- [Gestion des comptes](./index) -- Gérer les comptes et les flags de fonctionnalité
- [Référence de configuration](../configuration/) -- Toutes les variables d'environnement et paramètres
- [Dépannage](../troubleshooting/) -- Résolution des erreurs liées à OAuth
