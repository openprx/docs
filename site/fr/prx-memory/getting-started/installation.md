---
title: Installation
description: "Installer PRX-Memory depuis les sources avec Cargo, ou compiler le binaire démon pour les transports stdio et HTTP."
---

# Installation

PRX-Memory est distribué comme un workspace Rust. L'artefact principal est le binaire démon `prx-memoryd` du crate `prx-memory-mcp`.

::: tip Recommandé
Compiler depuis les sources vous donne les dernières fonctionnalités et vous permet d'activer des backends optionnels comme LanceDB.
:::

## Prérequis

| Exigence | Minimum | Notes |
|-------------|---------|-------|
| Rust | chaîne d'outils stable | Installez via [rustup](https://rustup.rs/) |
| Système d'exploitation | Linux, macOS, Windows (WSL2) | Toute plateforme supportée par Rust |
| Git | 2.30+ | Pour cloner le dépôt |
| Espace disque | 100 Mo | Binaire + dépendances |
| RAM | 256 Mo | Plus recommandé pour les grandes bases de mémoire |

## Méthode 1 : Compiler depuis les sources (recommandée)

Clonez le dépôt et compilez en mode release :

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

Le binaire se trouve à `target/release/prx-memoryd`. Copiez-le dans votre PATH :

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### Options de compilation

| Flag de fonctionnalité | Défaut | Description |
|-------------|---------|-------------|
| `lancedb-backend` | désactivé | Backend de stockage vectoriel LanceDB |

Pour compiler avec le support LanceDB :

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning Dépendances de compilation
Sur Debian/Ubuntu, vous pouvez avoir besoin de :
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
Sur macOS, les Xcode Command Line Tools sont requis :
```bash
xcode-select --install
```
:::

## Méthode 2 : Installation via Cargo

Si Rust est installé, vous pouvez installer directement :

```bash
cargo install prx-memory-mcp
```

Cela compile depuis les sources et place le binaire `prx-memoryd` dans `~/.cargo/bin/`.

## Méthode 3 : Utilisation comme bibliothèque

Pour utiliser les crates PRX-Memory comme dépendances dans votre propre projet Rust, ajoutez-les à votre `Cargo.toml` :

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## Vérifier l'installation

Après la compilation, vérifiez que le binaire fonctionne :

```bash
prx-memoryd --help
```

Testez une session stdio de base :

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Testez une session HTTP :

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Vérifiez le point de terminaison de santé :

```bash
curl -sS http://127.0.0.1:8787/health
```

## Configuration pour le développement

Pour le développement et les tests, utilisez le flux de travail Rust standard :

```bash
# Formater
cargo fmt --all

# Linter
cargo clippy --all-targets --all-features -- -D warnings

# Tester
cargo test --all-targets --all-features

# Vérifier (retour rapide)
cargo check --all-targets --all-features
```

## Désinstallation

```bash
# Supprimer le binaire
sudo rm /usr/local/bin/prx-memoryd
# Ou si installé via Cargo
cargo uninstall prx-memory-mcp

# Supprimer les fichiers de données
rm -rf ./data/memory-db.json
```

## Étapes suivantes

- [Démarrage rapide](./quickstart) -- Mettre PRX-Memory en route en 5 minutes
- [Configuration](../configuration/) -- Toutes les variables d'environnement et profils
- [Intégration MCP](../mcp/) -- Connecter à votre client MCP
