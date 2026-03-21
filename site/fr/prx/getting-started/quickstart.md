---
title: Demarrage rapide
description: Faire fonctionner PRX en 5 minutes. Installer, configurer un fournisseur LLM, demarrer le daemon et discuter.
---

# Demarrage rapide

Ce guide vous emmene de zero a un agent PRX fonctionnel en moins de 5 minutes.

## Etape 1 : Installer PRX

Installez la derniere version :

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

Verifiez l'installation :

```bash
prx --version
```

::: tip
Consultez le [Guide d'installation](./installation) pour les methodes alternatives (Cargo, compilation depuis les sources, Docker).
:::

## Etape 2 : Lancer l'assistant de configuration

L'assistant de configuration definit votre fournisseur LLM, votre cle API et vos parametres initiaux de maniere interactive :

```bash
prx onboard
```

L'assistant vous guide a travers :

1. **Selection d'un fournisseur** -- Anthropic, OpenAI, Ollama, OpenRouter et plus
2. **Saisie de votre cle API** -- stockee en toute securite dans le fichier de configuration
3. **Choix d'un modele par defaut** -- l'assistant recupere les modeles disponibles aupres de votre fournisseur
4. **Definition d'un backend memoire** -- Markdown (par defaut), SQLite ou PostgreSQL

Une fois l'assistant termine, votre configuration est sauvegardee dans `~/.config/openprx/openprx.toml`.

::: info Configuration rapide
Si vous connaissez deja votre fournisseur et votre modele, ignorez l'assistant interactif :

```bash
prx onboard --provider anthropic --api-key sk-ant-... --model claude-sonnet-4-20250514
```

Consultez l'[Assistant de configuration](./onboarding) pour toutes les options.
:::

## Etape 3 : Demarrer le daemon

Demarrez le daemon PRX en arriere-plan. Le daemon gere le runtime de l'agent, l'API de la passerelle et tous les canaux configures :

```bash
prx daemon
```

Par defaut, le daemon ecoute sur `127.0.0.1:3120`. Vous pouvez personnaliser l'hote et le port :

```bash
prx daemon --host 0.0.0.0 --port 8080
```

::: tip Execution en tant que service
Pour les deploiements en production, installez PRX en tant que service systeme pour qu'il demarre automatiquement au boot :

```bash
prx service install
```

Cela cree une unite systemd (Linux) ou un plist launchd (macOS). Consultez [prx service](../cli/service) pour plus de details.
:::

## Etape 4 : Discuter avec PRX

Ouvrez une session de chat interactive directement dans votre terminal :

```bash
prx chat
```

Cela se connecte au daemon en cours d'execution et ouvre un REPL ou vous pouvez parler a votre LLM configure. Tapez votre message et appuyez sur Entree :

```
You: What can you help me with?
PRX: I can help you with a wide range of tasks...
```

Vous pouvez egalement specifier un fournisseur et un modele pour une seule session :

```bash
prx chat --provider ollama --model llama3.2
```

Appuyez sur `Ctrl+C` ou tapez `/quit` pour quitter le chat.

## Etape 5 : Connecter un canal

PRX prend en charge 19 canaux de messagerie. Pour en connecter un, ajoutez sa configuration a votre fichier `~/.config/openprx/openprx.toml`.

Par exemple, pour connecter un bot Telegram :

```toml
[channels.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["your_telegram_username"]
```

Puis redemarrez le daemon pour prendre en compte le nouveau canal :

```bash
prx daemon
```

Ou utilisez la commande de gestion des canaux :

```bash
prx channel add telegram
```

Consultez l'[Apercu des canaux](../channels/) pour la liste complete des plateformes prises en charge et leur configuration.

## Etape 6 : Verifier l'etat

Affichez l'etat actuel de votre instance PRX :

```bash
prx status
```

Cela affiche :

- **Version** et chemin du binaire
- **Espace de travail** (repertoire)
- **Configuration** (emplacement du fichier)
- **Fournisseur** et modele utilises
- **Canaux actifs** et leur etat de connexion
- **Backend memoire** et statistiques
- **Temps de fonctionnement** et utilisation des ressources

Exemple de sortie :

```
PRX Status

Version:     0.3.0
Workspace:   /home/user/.local/share/openprx
Config:      /home/user/.config/openprx/openprx.toml
Provider:    anthropic (claude-sonnet-4-20250514)
Memory:      markdown (/home/user/.local/share/openprx/memory)
Channels:    telegram (connected), cli (active)
Gateway:     http://127.0.0.1:3120
Uptime:      2h 15m
```

## Et ensuite ?

Maintenant que PRX est en marche, explorez le reste de la documentation :

| Sujet | Description |
|-------|-------------|
| [Assistant de configuration](./onboarding) | Exploration approfondie de toutes les options de configuration |
| [Canaux](../channels/) | Connecter Telegram, Discord, Slack et 16 autres plateformes |
| [Fournisseurs](../providers/) | Configurer et basculer entre les fournisseurs LLM |
| [Outils](../tools/) | Explorer les 46+ outils integres |
| [Auto-evolution](../self-evolution/) | Decouvrir le systeme d'evolution L1/L2/L3 |
| [Configuration](../config/) | Reference complete avec toutes les options |
| [Reference CLI](../cli/) | Reference complete des commandes |
