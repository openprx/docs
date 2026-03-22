---
title: Installation
description: "Installer PRX-Email depuis les sources, ajouter comme dépendance Cargo, ou compiler le plugin WASM pour l'intégration au runtime PRX."
---

# Installation

PRX-Email peut être utilisé comme dépendance de bibliothèque Rust, compilé depuis les sources pour une utilisation autonome, ou compilé comme plugin WASM pour le runtime PRX.

::: tip Recommandé
Pour la plupart des utilisateurs, ajouter PRX-Email comme **dépendance Cargo** est le moyen le plus rapide d'intégrer des capacités email dans votre projet Rust.
:::

## Prérequis

| Exigence | Minimum | Notes |
|-------------|---------|-------|
| Rust | 1.85.0 (édition 2024) | Requis pour toutes les méthodes d'installation |
| Git | 2.30+ | Pour cloner le dépôt |
| SQLite | bundled | Inclus via la fonctionnalité bundled de `rusqlite` ; aucun SQLite système nécessaire |
| Cible `wasm32-wasip1` | latest | Nécessaire uniquement pour la compilation du plugin WASM |

## Méthode 1 : Dépendance Cargo (recommandée)

Ajoutez PRX-Email au `Cargo.toml` de votre projet :

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

Cela récupère la bibliothèque et toutes les dépendances incluant `rusqlite` (SQLite bundled), `imap`, `lettre` et `mail-parser`.

::: warning Dépendances de compilation
La fonctionnalité bundled de `rusqlite` compile SQLite depuis les sources C. Sur Debian/Ubuntu, vous pouvez avoir besoin de :
```bash
sudo apt install -y build-essential pkg-config
```
Sur macOS, les Xcode Command Line Tools sont requis :
```bash
xcode-select --install
```
:::

## Méthode 2 : Compiler depuis les sources

Clonez le dépôt et compilez en mode release :

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

Exécutez la suite de tests pour vérifier que tout fonctionne :

```bash
cargo test
```

Exécutez clippy pour la validation des lints :

```bash
cargo clippy -- -D warnings
```

## Méthode 3 : Plugin WASM

Le plugin WASM permet à PRX-Email de s'exécuter dans le runtime PRX comme module WebAssembly en bac à sable. Le plugin utilise WIT (WebAssembly Interface Types) pour définir les interfaces de host-calls.

### Compiler le plugin WASM

```bash
cd prx_email

# Ajouter la cible WASM
rustup target add wasm32-wasip1

# Compiler le plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

Le plugin compilé se trouve à `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`.

Alternativement, utilisez le script de compilation :

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### Configuration du plugin

Le plugin WASM inclut un manifeste `plugin.toml` dans le répertoire `wasm-plugin/` qui définit les métadonnées et capacités du plugin.

### Commutateur de sécurité réseau

Par défaut, le plugin WASM s'exécute avec les **opérations réseau réelles désactivées**. Pour activer les connexions IMAP/SMTP réelles depuis le contexte WASM :

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

Lorsque désactivé, les opérations dépendantes du réseau (`email.sync`, `email.send`, `email.reply`) retournent une erreur contrôlée avec un indice de garde. C'est une mesure de sécurité pour éviter les accès réseau non intentionnels depuis les plugins en bac à sable.

## Dépendances

PRX-Email utilise les dépendances clés suivantes :

| Crate | Version | Objectif |
|-------|---------|---------|
| `rusqlite` | 0.31 | Base de données SQLite avec compilation C bundled |
| `imap` | 2.4 | Client IMAP pour la synchronisation de la boîte de réception |
| `lettre` | 0.11 | Client SMTP pour l'envoi d'emails |
| `mail-parser` | 0.10 | Analyse des messages MIME |
| `rustls` | 0.23 | TLS pour les connexions IMAP |
| `rustls-connector` | 0.20 | Wrapper de flux TLS |
| `serde` / `serde_json` | 1.0 | Sérialisation pour les modèles et réponses API |
| `sha2` | 0.10 | SHA-256 pour les Message-IDs de fallback |
| `base64` | 0.22 | Encodage base64 pour les pièces jointes |
| `thiserror` | 1.0 | Dérivation des types d'erreur |

Toutes les connexions TLS utilisent `rustls` (Rust pur) -- aucune dépendance OpenSSL.

## Vérifier l'installation

Après la compilation, vérifiez que la bibliothèque compile et que les tests passent :

```bash
cargo check
cargo test
```

Sortie attendue :

```
running 7 tests
test plugin::email_plugin::tests::parse_mime_extracts_text_html_and_attachments ... ok
test plugin::email_plugin::tests::references_chain_appends_parent_message_id ... ok
test plugin::email_plugin::tests::reply_sets_in_reply_to_header_on_outbox ... ok
test plugin::email_plugin::tests::parse_mime_fallback_message_id_is_stable_and_unique ... ok
test plugin::email_plugin::tests::list_search_reject_out_of_range_limit ... ok
test plugin::email_plugin::tests::run_sync_runner_respects_max_concurrency_cap ... ok
test plugin::email_plugin::tests::reload_auth_from_env_updates_tokens ... ok

test result: ok. 7 passed; 0 failed; 0 ignored
```

## Étapes suivantes

- [Démarrage rapide](./quickstart) -- Configurer votre premier compte email et envoyer un message
- [Gestion des comptes](../accounts/) -- Configurer IMAP, SMTP et OAuth
- [Plugins WASM](../plugins/) -- En savoir plus sur l'interface de plugin WASM
