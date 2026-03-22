---
title: Plugins WASM
description: "Système de plugins WASM de PRX-Email pour l'exécution en bac à sable dans le runtime PRX. Host-calls WIT, commutateur de sécurité réseau et guide de développement de plugins."
---

# Plugins WASM

PRX-Email inclut un plugin WASM qui compile le client email en WebAssembly pour une exécution en bac à sable dans le runtime PRX. Le plugin utilise WIT (WebAssembly Interface Types) pour définir les interfaces de host-calls, permettant au code hébergé WASM d'invoquer des opérations email comme sync, list, get, search, send et reply.

## Architecture

```
Runtime PRX (Hôte)
  |
  +-- Plugin WASM (prx-email-plugin)
        |
        +-- Host-Calls WIT
        |     email.sync    --> Sync IMAP de l'hôte
        |     email.list    --> Liste de boîte de réception de l'hôte
        |     email.get     --> Obtention de message de l'hôte
        |     email.search  --> Recherche de boîte de réception de l'hôte
        |     email.send    --> Envoi SMTP de l'hôte
        |     email.reply   --> Réponse SMTP de l'hôte
        |
        +-- email.execute   --> Dispatcher
              (transfère aux host-calls ci-dessus)
```

### Modèle d'exécution

Lorsqu'un plugin WASM appelle `email.execute`, le plugin dispatche l'appel vers la fonction de host-call appropriée. Le runtime hôte gère les opérations IMAP/SMTP réelles, et les résultats sont retournés via l'interface WIT.

## Commutateur de sécurité réseau

L'exécution IMAP/SMTP réelle depuis le contexte WASM est **désactivée par défaut**. Cela empêche les plugins en bac à sable de faire des connexions réseau non intentionnelles.

### Activer les opérations réseau

Définissez la variable d'environnement avant de démarrer le runtime PRX :

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Comportement lorsque désactivé

| Opération | Comportement |
|-----------|----------|
| `email.sync` | Retourne une erreur `EMAIL_NETWORK_GUARD` |
| `email.send` | Retourne une erreur `EMAIL_NETWORK_GUARD` |
| `email.reply` | Retourne une erreur `EMAIL_NETWORK_GUARD` |
| `email.list` | Fonctionne (lit depuis le SQLite local) |
| `email.get` | Fonctionne (lit depuis le SQLite local) |
| `email.search` | Fonctionne (lit depuis le SQLite local) |

::: tip
Les opérations en lecture seule (list, get, search) fonctionnent toujours car elles interrogent la base de données SQLite locale sans accès réseau. Seules les opérations nécessitant des connexions IMAP/SMTP sont conditionnées.
:::

### Capacité hôte non disponible

Lorsque le runtime hôte ne fournit pas du tout la capacité email (chemin d'exécution non-WASM), les opérations retournent `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

## Structure du plugin

```
wasm-plugin/
  Cargo.toml          # Configuration du crate de plugin
  plugin.toml         # Manifeste du plugin
  plugin.wasm         # Binaire WASM pré-compilé
  src/
    lib.rs            # Point d'entrée du plugin et dispatcher
    bindings.rs       # Liaisons générées par WIT
  wit/                # Définitions d'interface WIT
    deps/
      prx-host/       # Interfaces fournies par l'hôte
```

### Configuration Cargo

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wit-bindgen = { version = "0.51", features = ["macros"] }

[package.metadata.component]
package = "prx:plugin"

[package.metadata.component.target.dependencies]
"prx:host" = { path = "wit/deps/prx-host" }
```

## Compiler le plugin

### Prérequis

- Chaîne d'outils Rust
- Cible `wasm32-wasip1`

### Étapes de compilation

```bash
# Ajouter la cible WASM
rustup target add wasm32-wasip1

# Compiler le plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### Utiliser le script de compilation

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## Interface WIT

Le plugin communique avec l'hôte via des interfaces définies par WIT. Le package `prx:host` fournit les fonctions de host-call suivantes :

### Host-calls disponibles

| Fonction | Description | Réseau requis |
|----------|-------------|:----------------:|
| `email.sync` | Synchroniser la boîte de réception IMAP pour un compte/dossier | Oui |
| `email.list` | Lister les messages depuis la base de données locale | Non |
| `email.get` | Obtenir un message spécifique par ID | Non |
| `email.search` | Rechercher des messages par requête | Non |
| `email.send` | Envoyer un nouvel email via SMTP | Oui |
| `email.reply` | Répondre à un email existant | Oui |

### Format requête/réponse

Les host-calls utilisent la sérialisation JSON pour les payloads de requête et de réponse :

```rust
// Exemple : lister les messages
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## Flux de travail de développement

### 1. Modifier le code du plugin

Modifiez `wasm-plugin/src/lib.rs` pour ajouter une logique personnalisée :

```rust
// Ajouter du pré-traitement avant les opérations email
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // Validation personnalisée, journalisation ou transformation
    Ok(())
}
```

### 2. Recompiler

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. Tester localement

Testez avec le commutateur de sécurité réseau désactivé :

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# Exécutez votre runtime PRX avec le plugin mis à jour
```

### 4. Déployer

Copiez le fichier `.wasm` compilé dans le répertoire de plugins de votre runtime PRX.

## Modèle de sécurité

| Contrainte | Application |
|-----------|-------------|
| Accès réseau | Désactivé par défaut ; nécessite `PRX_EMAIL_ENABLE_REAL_NETWORK=1` |
| Accès système de fichiers | Pas d'accès direct au système de fichiers depuis WASM |
| Mémoire | Limitée par les limites de mémoire linéaire WASM |
| Temps d'exécution | Limité par le comptage de carburant |
| Sécurité des jetons | Les jetons OAuth sont gérés par l'hôte, non exposés au WASM |

::: warning
Le plugin WASM n'a pas accès direct aux jetons OAuth ou identifiants. Toute l'authentification est gérée par le runtime hôte. Le plugin ne reçoit que les résultats des opérations, jamais les identifiants bruts.
:::

## Étapes suivantes

- [Installation](../getting-started/installation) -- Instructions de compilation pour le plugin WASM
- [Référence de configuration](../configuration/) -- Commutateur de sécurité réseau et paramètres runtime
- [Dépannage](../troubleshooting/) -- Problèmes liés aux plugins
