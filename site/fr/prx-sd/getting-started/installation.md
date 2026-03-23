---
title: Installation
description: Installer PRX-SD sur Linux, macOS ou Windows WSL2 via le script d'installation, Cargo, la compilation depuis les sources ou Docker.
---

# Installation

PRX-SD supporte quatre méthodes d'installation. Choisissez celle qui correspond le mieux à votre flux de travail.

::: tip Recommandé
Le **script d'installation** est la méthode la plus rapide pour démarrer. Il détecte votre plateforme, télécharge le binaire correct et le place dans votre PATH.
:::

## Prérequis

| Exigence | Minimum | Notes |
|----------|---------|-------|
| Système d'exploitation | Linux (x86_64, aarch64), macOS (12+), Windows (WSL2) | Windows natif non supporté |
| Espace disque | 200 Mo | ~50 Mo pour le binaire + ~150 Mo pour la base de signatures |
| RAM | 512 Mo | 2 Go+ recommandé pour les scans de grands répertoires |
| Rust (compilation depuis les sources uniquement) | 1.85.0 | Non requis pour le script ou l'installation Docker |
| Git (compilation depuis les sources uniquement) | 2.30+ | Pour cloner le dépôt |
| Docker (Docker uniquement) | 20.10+ | Ou Podman 3.0+ |

## Méthode 1 : Script d'installation (recommandé)

Le script d'installation télécharge le dernier binaire de version pour votre plateforme et le place dans `/usr/local/bin`.

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

Pour installer une version spécifique :

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash -s -- --version 0.5.0
```

Le script supporte les variables d'environnement suivantes :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `INSTALL_DIR` | `/usr/local/bin` | Répertoire d'installation personnalisé |
| `VERSION` | `latest` | Version de version spécifique |
| `ARCH` | auto-détecté | Remplacer l'architecture (`x86_64`, `aarch64`) |

## Méthode 2 : Installation via Cargo

Si vous avez Rust installé, vous pouvez installer directement depuis crates.io :

```bash
cargo install prx-sd
```

Cela compile depuis les sources et place le binaire `sd` dans `~/.cargo/bin/`.

::: warning Dépendances de compilation
L'installation via Cargo compile les dépendances natives. Sur Debian/Ubuntu, vous aurez peut-être besoin de :
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
Sur macOS, les outils en ligne de commande Xcode sont requis :
```bash
xcode-select --install
```
:::

## Méthode 3 : Compilation depuis les sources

Clonez le dépôt et compilez en mode release :

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

Le binaire se trouve dans `target/release/sd`. Copiez-le dans votre PATH :

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### Options de compilation

| Indicateur de fonctionnalité | Défaut | Description |
|------------------------------|--------|-------------|
| `yara` | activé | Moteur de règles YARA-X |
| `ml` | désactivé | Moteur d'inférence ML ONNX |
| `gui` | désactivé | Interface graphique Tauri + Vue 3 |
| `virustotal` | désactivé | Intégration API VirusTotal |

Pour compiler avec le support d'inférence ML :

```bash
cargo build --release --features ml
```

Pour compiler l'interface graphique de bureau :

```bash
cargo build --release --features gui
```

## Méthode 4 : Docker

Récupérez l'image Docker officielle :

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

Exécutez une analyse en montant un répertoire cible :

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

Pour la surveillance en temps réel, exécutez comme démon :

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
Un fichier `docker-compose.yml` est disponible à la racine du dépôt pour les déploiements en production avec des mises à jour automatiques des signatures.
:::

## Notes par plateforme

### Linux

PRX-SD fonctionne sur toute distribution Linux moderne. Pour la surveillance en temps réel, le sous-système `inotify` est utilisé. Vous devrez peut-être augmenter la limite de surveillance pour les grandes arborescences de répertoires :

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

La détection de rootkits et l'analyse de la mémoire nécessitent des privilèges root.

### macOS

PRX-SD utilise FSEvents pour la surveillance en temps réel sur macOS. Apple Silicon (aarch64) et Intel (x86_64) sont tous deux supportés. Le script d'installation détecte automatiquement votre architecture.

::: warning macOS Gatekeeper
Si macOS bloque le binaire, supprimez l'attribut de quarantaine :
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows (WSL2)

PRX-SD s'exécute dans WSL2 en utilisant le binaire Linux. Installez d'abord WSL2 avec une distribution Linux, puis suivez les étapes d'installation Linux. Le support Windows natif est prévu pour une version future.

## Vérifier l'installation

Après l'installation, vérifiez que `sd` fonctionne :

```bash
sd --version
```

Sortie attendue :

```
prx-sd 0.5.0
```

Vérifiez l'état complet du système, y compris la base de données de signatures :

```bash
sd info
```

Cela affiche la version installée, le nombre de signatures, le nombre de règles YARA et les chemins de la base de données.

## Désinstallation

### Script / Installation via Cargo

```bash
# Supprimer le binaire
sudo rm /usr/local/bin/sd
# Ou si installé via Cargo
cargo uninstall prx-sd

# Supprimer la base de données de signatures et la configuration
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## Étapes suivantes

- [Démarrage rapide](./quickstart) -- Commencer à analyser en 5 minutes
- [Analyse de fichiers et répertoires](../scanning/file-scan) -- Référence complète de la commande `sd scan`
- [Présentation du moteur de détection](../detection/) -- Comprendre le pipeline multicouche
