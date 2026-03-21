---
title: Systeme de plugins
description: Apercu du systeme de plugins WASM de PRX pour etendre les capacites de l'agent.
---

# Systeme de plugins

PRX prend en charge un systeme de plugins WebAssembly (WASM) qui permet d'etendre les capacites de l'agent sans modifier le code source principal. Les plugins s'executent dans un runtime WASM sandboxe avec un acces controle aux fonctions hote.

## Apercu

Le systeme de plugins fournit :

- **Execution sandboxee** -- les plugins s'executent en WASM avec isolation memoire
- **API de fonctions hote** -- acces controle aux requetes HTTP, au systeme de fichiers et a l'etat de l'agent
- **Rechargement a chaud** -- charger et decharger des plugins sans redemarrer le daemon
- **Support multi-langage** -- ecrivez des plugins en Rust, Go, C ou tout langage compilant vers WASM

## Types de plugins

| Type | Description | Exemple |
|------|-------------|---------|
| **Plugins d'outils** | Ajouter de nouveaux outils a l'agent | Integrations d'API personnalisees |
| **Plugins de canaux** | Ajouter de nouveaux canaux de messagerie | Plateforme de chat personnalisee |
| **Plugins de filtres** | Pre/post-traitement des messages | Moderation de contenu |
| **Plugins de fournisseurs** | Ajouter de nouveaux fournisseurs LLM | Endpoints de modeles personnalises |

## Demarrage rapide

```bash
# Install a plugin from a URL
prx plugin install https://example.com/my-plugin.wasm

# List installed plugins
prx plugin list

# Enable/disable a plugin
prx plugin enable my-plugin
prx plugin disable my-plugin
```

## Configuration

```toml
[plugins]
enabled = true
directory = "~/.local/share/openprx/plugins"
max_memory_mb = 64
max_execution_time_ms = 5000

[[plugins.registry]]
name = "my-plugin"
path = "~/.local/share/openprx/plugins/my-plugin.wasm"
enabled = true
```

## Pages associees

- [Architecture](./architecture)
- [Guide du developpeur](./developer-guide)
- [Fonctions hote](./host-functions)
- [PDK (Kit de developpement de plugins)](./pdk)
- [Exemples](./examples)
