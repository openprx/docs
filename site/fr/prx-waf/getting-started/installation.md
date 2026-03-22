---
title: Installation
description: "Installer PRX-WAF avec Docker Compose, Cargo ou en compilant depuis les sources. Inclut les prérequis, les notes par plateforme et la vérification post-installation."
---

# Installation

PRX-WAF prend en charge trois méthodes d'installation. Choisissez celle qui convient le mieux à votre flux de travail.

::: tip Recommandé
**Docker Compose** est le moyen le plus rapide de démarrer. Il lance PRX-WAF, PostgreSQL et l'interface d'administration en une seule commande.
:::

## Prérequis

| Exigence | Minimum | Notes |
|-------------|---------|-------|
| Système d'exploitation | Linux (x86_64, aarch64), macOS (12+) | Windows via WSL2 |
| PostgreSQL | 16+ | Inclus dans Docker Compose |
| Rust (compilation depuis sources uniquement) | 1.82.0 | Non nécessaire pour l'installation Docker |
| Node.js (compilation de l'interface d'administration uniquement) | 18+ | Non nécessaire pour l'installation Docker |
| Docker | 20.10+ | Ou Podman 3.0+ |
| Espace disque | 500 Mo | ~100 Mo binaire + ~400 Mo données PostgreSQL |
| RAM | 512 Mo | 2 Go+ recommandé pour la production |

## Méthode 1 : Docker Compose (Recommandé)

Clonez le dépôt et démarrez tous les services avec Docker Compose :

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Examinez et modifiez les variables d'environnement dans docker-compose.yml
# (mot de passe de base de données, identifiants admin, ports d'écoute)
docker compose up -d
```

Cela démarre trois conteneurs :

| Conteneur | Port | Description |
|-----------|------|-------------|
| `prx-waf` | `80`, `443` | Proxy inverse (HTTP + HTTPS) |
| `prx-waf` | `9527` | API d'administration + Interface Vue 3 |
| `postgres` | `5432` | Base de données PostgreSQL 16 |

Vérifiez le déploiement :

```bash
# Vérifier l'état des conteneurs
docker compose ps

# Vérifier le point de terminaison de santé
curl http://localhost:9527/health
```

Ouvrez l'interface d'administration à `http://localhost:9527` et connectez-vous avec les identifiants par défaut : `admin` / `admin`.

::: warning Changer le mot de passe par défaut
Changez le mot de passe admin par défaut immédiatement après la première connexion. Allez dans **Paramètres > Compte** dans l'interface d'administration ou utilisez l'API.
:::

### Docker Compose avec Podman

Si vous utilisez Podman au lieu de Docker :

```bash
podman-compose up -d --build
```

::: info DNS Podman
Lors de l'utilisation de Podman, l'adresse du résolveur DNS pour la communication inter-conteneurs est `10.89.0.1` au lieu du `127.0.0.11` de Docker. Le fichier `docker-compose.yml` inclus gère cela automatiquement.
:::

## Méthode 2 : Installation Cargo

Si vous avez Rust installé, vous pouvez installer PRX-WAF depuis le dépôt :

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

Le binaire se trouve à `target/release/prx-waf`. Copiez-le dans votre PATH :

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning Dépendances de compilation
La compilation Cargo compile les dépendances natives. Sur Debian/Ubuntu, vous pourriez avoir besoin :
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
Sur macOS, les Xcode Command Line Tools sont nécessaires :
```bash
xcode-select --install
```
:::

### Configuration de la base de données

PRX-WAF nécessite une base de données PostgreSQL 16+ :

```bash
# Créer la base de données et l'utilisateur
createdb prx_waf
createuser prx_waf

# Exécuter les migrations
./target/release/prx-waf -c configs/default.toml migrate

# Créer l'utilisateur admin par défaut (admin/admin)
./target/release/prx-waf -c configs/default.toml seed-admin
```

### Démarrer le serveur

```bash
./target/release/prx-waf -c configs/default.toml run
```

Cela démarre le proxy inverse sur les ports 80/443 et l'API d'administration sur le port 9527.

## Méthode 3 : Compilation depuis les sources (Développement)

Pour le développement avec rechargement en direct de l'interface d'administration :

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Compiler le backend Rust
cargo build

# Compiler l'interface d'administration
cd web/admin-ui
npm install
npm run build
cd ../..

# Démarrer le serveur de développement
cargo run -- -c configs/default.toml run
```

### Compiler l'interface d'administration pour la production

```bash
cd web/admin-ui
npm install
npm run build
```

Les fichiers compilés sont intégrés dans le binaire Rust au moment de la compilation et servis par le serveur API.

## Service systemd

Pour les déploiements de production sur métal nu, créez un service systemd :

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## Vérifier l'installation

Après l'installation, vérifiez que PRX-WAF est en cours d'exécution :

```bash
# Vérifier le point de terminaison de santé
curl http://localhost:9527/health

# Vérifier l'interface d'administration
curl -s http://localhost:9527 | head -5
```

Connectez-vous à l'interface d'administration à `http://localhost:9527` pour vérifier que le tableau de bord se charge correctement.

## Étapes suivantes

- [Démarrage rapide](./quickstart) -- Protéger votre première application en 5 minutes
- [Configuration](../configuration/) -- Personnaliser les paramètres PRX-WAF
- [Moteur de règles](../rules/) -- Comprendre le pipeline de détection
