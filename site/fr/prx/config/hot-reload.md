---
title: Rechargement a chaud
description: Comment PRX applique les modifications de configuration sans redemarrage -- ce qui est rechargeable a chaud, ce qui necessite un redemarrage et comment le surveillant de fichiers fonctionne.
---

# Rechargement a chaud

PRX prend en charge le rechargement a chaud de la plupart des modifications de configuration. Lorsque vous modifiez `config.toml` (ou tout fragment dans `config.d/`), les modifications sont detectees et appliquees en quelques secondes -- aucun redemarrage requis.

## Comment ca fonctionne

PRX utilise un mecanisme a trois couches pour les mises a jour de configuration en direct :

1. **Surveillant de fichiers** -- Un surveillant de systeme de fichiers `notify` surveille le repertoire de configuration (a la fois `config.toml` et l'arborescence complete `config.d/`) pour les evenements d'ecriture.

2. **Temporisation** -- Les evenements sont temporises avec une fenetre de 1 seconde pour fusionner les ecritures successives rapides (ex. depuis les editeurs qui ecrivent puis renomment).

3. **Echange atomique** -- Lors de la detection d'un changement, PRX :
   - Calcule une empreinte SHA-256 de la nouvelle configuration
   - La compare a la derniere empreinte connue (ignore si identique)
   - Analyse le nouveau TOML dans une structure `Config`
   - En cas de succes : publie atomiquement la nouvelle configuration via `ArcSwap` (sans verrou)
   - En cas d'echec : conserve la configuration precedente et enregistre un avertissement

Le type `SharedConfig` (`Arc<ArcSwap<Config>>`) garantit que tous les composants lisant la configuration obtiennent un instantane coherent sans contention. Les lecteurs appellent `.load_full()` pour obtenir un instantane `Arc<Config>` qui reste valide meme si la configuration est echangee pendant l'utilisation.

## Ce qui est rechargeable a chaud

Les modifications suivantes prennent effet immediatement (en ~1 seconde) :

| Categorie | Exemples |
|-----------|---------|
| **Parametres de fournisseur** | `default_provider`, `default_model`, `default_temperature`, `api_key`, `api_url` |
| **Parametres de canal** | Telegram `allowed_users`, Discord `mention_only`, Slack `channel_id`, etc. |
| **Parametres memoire** | `backend`, `auto_save`, `embedding_provider`, periodes de retention |
| **Parametres de routeur** | `enabled`, poids (`alpha`/`beta`/`gamma`/`delta`/`epsilon`), seuils Automix |
| **Parametres de securite** | Backend sandbox, limites de ressources, configuration d'audit |
| **Parametres d'autonomie** | Regles de portee, niveaux d'autonomie |
| **Parametres MCP** | Definitions de serveurs, delais, listes d'outils autorises |
| **Parametres de recherche web** | `enabled`, `provider`, `max_results` |
| **Parametres du navigateur** | `enabled`, `allowed_domains` |
| **Parametres Xin** | `enabled`, `interval_minutes`, limites de taches |
| **Parametres de cout** | `daily_limit_usd`, `monthly_limit_usd`, tarification |
| **Parametres de fiabilite** | `max_retries`, `fallback_providers` |
| **Parametres d'observabilite** | `backend`, endpoint OTLP |
| **Parametres de proxy** | URL de proxy, listes no-proxy, portee |

## Ce qui necessite un redemarrage

Un petit nombre de parametres sont lies au demarrage et ne peuvent pas etre modifies au moment de l'execution :

| Parametre | Raison |
|-----------|--------|
| `[gateway] host` | Le listener TCP est lie une seule fois au demarrage |
| `[gateway] port` | Le listener TCP est lie une seule fois au demarrage |
| Parametres `[tunnel]` | Les connexions tunnel sont etablies au demarrage |
| Tokens de bots de canaux | Les connexions de bots (long-poll Telegram, passerelle Discord, socket Slack) sont initialisees une seule fois |

Pour ces parametres, vous devez redemarrer le daemon PRX :

```bash
# Si execute en tant que service systemd
sudo systemctl restart openprx

# Si execute au premier plan
# Arretez avec Ctrl+C, puis redemarrez
prx
```

## Commande de rechargement CLI

Vous pouvez declencher manuellement un rechargement de configuration sans modifier le fichier :

```bash
prx config reload
```

C'est equivalent a la detection d'un changement par le surveillant de fichiers. Cela relit et re-analyse les fichiers de configuration et echange atomiquement la configuration active. Cela est utile lorsque :

- Vous avez modifie le fichier mais le surveillant a manque l'evenement (rare)
- Vous souhaitez forcer un rechargement apres avoir mis a jour des variables d'environnement
- Vous scriptez des modifications de configuration

## Gestion des erreurs

Si le nouveau fichier de configuration contient des erreurs :

- **Erreurs de syntaxe TOML** -- L'analyseur rejette le fichier. La configuration precedente est conservee. Un avertissement est enregistre avec les details de l'erreur d'analyse.
- **Valeurs de champs invalides** -- La validation detecte des problemes comme `confidence_threshold > 1.0` ou un `premium_model_id` vide lorsqu'Automix est active. La configuration precedente est conservee.
- **Fichier manquant** -- Si `config.toml` est supprime, le surveillant enregistre une erreur mais la configuration en memoire continue de fonctionner.

Dans tous les cas d'erreur, PRX continue de fonctionner avec la derniere configuration valide connue. Aucune donnee n'est perdue et aucune interruption de service ne se produit.

## Surveillance des rechargements

Le `HotReloadManager` maintient un compteur `reload_version` monotone qui s'incremente a chaque rechargement reussi. Vous pouvez verifier la version actuelle via le point de terminaison de statut de la passerelle :

```bash
curl http://localhost:16830/api/status
```

La reponse inclut le nombre de rechargements actuels, vous aidant a verifier que vos modifications ont ete appliquees.

## Rechargements de fichiers scindes

Lors de l'utilisation de fichiers de configuration scindes (`config.d/*.toml`), le surveillant surveille recursivement l'ensemble du repertoire `config.d/`. Une modification de n'importe quel fragment `.toml` declenche une re-fusion complete et un rechargement de toute la configuration. Cela signifie :

- La modification de `config.d/channels.toml` recharge toute la configuration (pas seulement les canaux)
- L'ajout ou la suppression d'un fichier fragment declenche un rechargement
- L'ordre de fusion est alphabetique par nom de fichier, les fragments ayant la priorite sur `config.toml`
