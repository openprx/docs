---
title: Installation
description: Installer PRX sur Linux, macOS ou Windows WSL2 via le script d'installation, Cargo, la compilation depuis les sources ou Docker.
---

# Installation

PRX se presente sous la forme d'un binaire statique unique appele `prx`. Choisissez la methode d'installation qui correspond a votre workflow.

## Prerequis

Avant d'installer PRX, assurez-vous que votre systeme repond a ces exigences :

| Exigence | Details |
|----------|---------|
| **OS** | Linux (x86_64, aarch64), macOS (Apple Silicon, Intel) ou Windows via WSL2 |
| **Rust** | 1.92.0+ (edition 2024) -- necessaire uniquement pour l'installation via Cargo ou la compilation depuis les sources |
| **Paquets systeme** | `pkg-config` (Linux, uniquement pour la compilation depuis les sources) |
| **Espace disque** | ~50 Mo pour le binaire, ~200 Mo avec le runtime de plugins WASM |
| **RAM** | 64 Mo minimum pour le daemon (sans inference LLM) |

::: tip
Si vous utilisez le script d'installation ou Docker, vous n'avez pas besoin d'avoir Rust installe sur votre systeme.
:::

## Methode 1 : Script d'installation (recommandee)

La methode la plus rapide pour demarrer. Le script detecte votre OS et votre architecture, telecharge le dernier binaire de release et le place dans votre `PATH`.

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

Le script installe `prx` dans `~/.local/bin/` par defaut. Assurez-vous que ce repertoire est dans votre `PATH` :

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Pour installer une version specifique :

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --version 0.3.0
```

Pour installer dans un repertoire personnalise :

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --prefix /usr/local
```

## Methode 2 : Installation via Cargo

Si vous avez la toolchain Rust installee, vous pouvez installer PRX directement depuis crates.io :

```bash
cargo install openprx
```

Cela compile le binaire release avec les fonctionnalites par defaut et le place dans `~/.cargo/bin/prx`.

Pour installer avec toutes les fonctionnalites optionnelles (Matrix E2EE, WhatsApp Web, etc.) :

```bash
cargo install openprx --all-features
```

::: info Drapeaux de fonctionnalites
PRX utilise les feature flags de Cargo pour le support optionnel de canaux :

| Fonctionnalite | Description |
|----------------|-------------|
| `channel-matrix` | Canal Matrix avec support du chiffrement de bout en bout |
| `whatsapp-web` | Canal WhatsApp Web multi-appareils |
| **defaut** | Tous les canaux stables actives |
:::

## Methode 3 : Compilation depuis les sources

Pour le developpement ou pour executer le dernier code non encore publie :

```bash
# Cloner le depot
git clone https://github.com/openprx/prx.git
cd prx

# Compiler le binaire release
cargo build --release

# Le binaire se trouve dans target/release/prx
./target/release/prx --version
```

Pour compiler avec toutes les fonctionnalites :

```bash
cargo build --release --all-features
```

Pour installer le binaire compile localement dans votre repertoire Cargo bin :

```bash
cargo install --path .
```

### Compilation de developpement

Pour une iteration plus rapide pendant le developpement, utilisez une compilation debug :

```bash
cargo build
./target/debug/prx --version
```

::: warning
Les compilations debug sont nettement plus lentes a l'execution. Utilisez toujours `--release` pour la production ou les benchmarks.
:::

## Methode 4 : Docker

Executez PRX en tant que conteneur sans installation locale requise :

```bash
docker pull ghcr.io/openprx/prx:latest
```

Executez avec un repertoire de configuration monte :

```bash
docker run -d \
  --name prx \
  -v ~/.config/openprx:/home/prx/.config/openprx \
  -p 3120:3120 \
  ghcr.io/openprx/prx:latest \
  daemon
```

Ou utilisez Docker Compose :

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    ports:
      - "3120:3120"
    volumes:
      - ./config:/home/prx/.config/openprx
      - ./data:/home/prx/.local/share/openprx
    command: daemon
```

::: tip
Lors de l'execution dans Docker, definissez vos cles API LLM via des variables d'environnement ou montez un fichier de configuration. Consultez la section [Configuration](../config/) pour plus de details.
:::

## Verification de l'installation

Apres l'installation, verifiez que PRX fonctionne :

```bash
prx --version
```

Sortie attendue :

```
prx 0.3.0
```

Lancez le diagnostic :

```bash
prx doctor
```

Cela verifie votre toolchain Rust (si installee), les dependances systeme, la validite du fichier de configuration et la connectivite reseau vers les fournisseurs LLM.

## Notes specifiques aux plateformes

### Linux

PRX fonctionne sur toute distribution Linux moderne (noyau 4.18+). Le binaire est lie statiquement avec `rustls` pour TLS, aucune installation d'OpenSSL n'est donc requise.

Pour les fonctionnalites de sandbox, vous pourriez avoir besoin de paquets supplementaires :

```bash
# Backend sandbox Firejail
sudo apt install firejail

# Backend sandbox Bubblewrap
sudo apt install bubblewrap

# Backend sandbox Docker (necessite le daemon Docker)
sudo apt install docker.io
```

### macOS

PRX fonctionne nativement sur les Mac Apple Silicon (aarch64) et Intel (x86_64). Le canal iMessage n'est disponible que sur macOS.

Si vous compilez depuis les sources, assurez-vous d'avoir les Xcode Command Line Tools :

```bash
xcode-select --install
```

### Windows (WSL2)

PRX est pris en charge sous Windows via WSL2. Installez une distribution Linux (Ubuntu recommande) et suivez les instructions Linux dans votre environnement WSL2.

```powershell
# Depuis PowerShell (installer WSL2 avec Ubuntu)
wsl --install -d Ubuntu
```

Puis dans WSL2 :

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

::: warning
Le support natif Windows n'est pas actuellement disponible. WSL2 offre des performances quasi natives Linux et constitue l'approche recommandee.
:::

## Desinstallation

Pour supprimer PRX :

```bash
# Si installe via le script d'installation
rm ~/.local/bin/prx

# Si installe via Cargo
cargo uninstall openprx

# Supprimer la configuration et les donnees (optionnel)
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## Prochaines etapes

- [Demarrage rapide](./quickstart) -- Faire fonctionner PRX en 5 minutes
- [Assistant de configuration](./onboarding) -- Configurer votre fournisseur LLM
- [Configuration](../config/) -- Reference complete de la configuration
