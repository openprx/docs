---
title: Discord
description: Connecter PRX a Discord via une application bot
---

# Discord

> Connectez PRX a Discord en utilisant une application bot avec Gateway WebSocket pour la messagerie en temps reel dans les serveurs et les MP.

## Prerequis

- Un compte Discord
- Une application Discord avec un utilisateur bot cree dans le [Developer Portal](https://discord.com/developers/applications)
- Le bot invite sur votre serveur avec les permissions appropriees

## Configuration rapide

### 1. Creer une application bot

1. Allez sur le [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur "New Application" et donnez-lui un nom
3. Naviguez vers la section "Bot" et cliquez sur "Add Bot"
4. Copiez le token du bot
5. Sous "Privileged Gateway Intents", activez **Message Content Intent**

### 2. Inviter le bot

Generez une URL d'invitation sous "OAuth2 > URL Generator" :
- Portees : `bot`
- Permissions : `Send Messages`, `Read Message History`, `Add Reactions`, `Attach Files`

### 3. Configurer

```toml
[channels_config.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
allowed_users = ["123456789012345678"]
```

### 4. Verifier

```bash
prx channel doctor discord
```

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `bot_token` | `String` | *requis* | Token de bot Discord depuis le Developer Portal |
| `guild_id` | `String` | `null` | ID de guilde (serveur) optionnel pour restreindre le bot a un seul serveur |
| `allowed_users` | `[String]` | `[]` | IDs utilisateur Discord. Vide = refuser tous. `"*"` = autoriser tous |
| `listen_to_bots` | `bool` | `false` | Quand active, traite les messages des autres bots (ignore toujours ses propres messages) |
| `mention_only` | `bool` | `false` | Quand active, ne repond qu'aux messages qui @mentionnent le bot |

## Fonctionnalites

- **Gateway WebSocket** -- livraison de messages en temps reel via l'API Gateway de Discord
- **Support serveur et MP** -- repond dans les canaux de guilde et les messages prives
- **Traitement des pieces jointes texte** -- recupere et integre automatiquement les pieces jointes de type `text/*`
- **Restriction de guilde** -- optionnellement limiter le bot a un seul serveur avec `guild_id`
- **Communication bot-a-bot** -- activez `listen_to_bots` pour les workflows multi-bots
- **Indicateurs de saisie** -- affiche l'etat de saisie pendant la generation des reponses

## Limitations

- Les messages Discord sont limites a 2 000 caracteres (PRX decoupe automatiquement les reponses plus longues)
- Seules les pieces jointes de type MIME `text/*` sont recuperees et integrees ; les autres types de fichiers sont ignores
- Le "Message Content Intent" doit etre active pour que le bot puisse lire le texte des messages
- Necessite une connexion WebSocket stable au Gateway de Discord

## Depannage

### Le bot est en ligne mais ne repond pas
- Assurez-vous que "Message Content Intent" est active dans le Developer Portal sous les parametres du Bot
- Verifiez que l'ID utilisateur Discord de l'expediteur est dans `allowed_users`
- Verifiez que le bot a les permissions `Send Messages` et `Read Message History` dans le canal

### Le bot ne fonctionne que dans certains canaux
- Si `guild_id` est defini, le bot ne repond que dans ce serveur specifique
- Verifiez que le bot a ete invite avec les permissions correctes pour chaque canal

### Les messages des autres bots sont ignores
- Definissez `listen_to_bots = true` pour traiter les messages des autres comptes bot
- Le bot ignore toujours ses propres messages pour eviter les boucles de retour
