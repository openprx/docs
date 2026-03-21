---
title: Telegram
description: Connecter PRX a Telegram via le Bot API
---

# Telegram

> Connectez PRX a Telegram en utilisant le Bot API officiel avec prise en charge des messages prives, des groupes, des reponses en streaming et des pieces jointes media.

## Prerequis

- Un compte Telegram
- Un token de bot obtenu aupres de [@BotFather](https://t.me/BotFather)
- Les IDs utilisateur Telegram ou noms d'utilisateur des utilisateurs autorises

## Configuration rapide

### 1. Creer un bot

1. Ouvrez Telegram et envoyez un message a [@BotFather](https://t.me/BotFather)
2. Envoyez `/newbot` et suivez les instructions pour nommer votre bot
3. Copiez le token du bot (format : `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Configurer

Ajoutez les elements suivants a votre fichier de configuration PRX :

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
allowed_users = ["123456789", "your_username"]
```

Si `allowed_users` est laisse vide, PRX entre en **mode appairage** et genere un code d'association unique. Envoyez `/bind <code>` depuis votre compte Telegram pour vous appairer.

### 3. Verifier

```bash
prx channel doctor telegram
```

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `bot_token` | `String` | *requis* | Token Bot API Telegram obtenu de @BotFather |
| `allowed_users` | `[String]` | `[]` | IDs utilisateur ou noms d'utilisateur Telegram. Vide = mode appairage. `"*"` = autoriser tous |
| `stream_mode` | `String` | `"none"` | Mode streaming : `"none"`, `"edit"` ou `"typing"`. Le mode edit met a jour progressivement le message de reponse |
| `draft_update_interval_ms` | `u64` | `500` | Intervalle minimum (ms) entre les modifications de message brouillon pour eviter les limites de debit |
| `interrupt_on_new_message` | `bool` | `false` | Quand active, un nouveau message du meme expediteur annule la requete en cours |
| `mention_only` | `bool` | `false` | Quand active, ne repond qu'aux @-mentions dans les groupes. Les MP sont toujours traites |
| `ack_reactions` | `bool` | *herite* | Remplacement du parametre global `ack_reactions`. Se rabat sur `[channels_config].ack_reactions` si non defini |

## Fonctionnalites

- **Messages prives et discussions de groupe** -- repond aux MP et aux conversations de groupe
- **Reponses en streaming** -- les modifications progressives de message montrent la reponse au fur et a mesure de sa generation
- **Mode appairage** -- association par code unique securise lorsqu'aucun utilisateur autorise n'est configure
- **Pieces jointes media** -- gere les documents, photos et legendes
- **Decoupage des longs messages** -- decoupe automatiquement les reponses depassant la limite de 4096 caracteres de Telegram aux limites de mots
- **Reactions d'accuse de reception** -- reagit aux messages entrants pour confirmer la reception
- **Transcription vocale** -- transcrit les messages vocaux lorsque la STT est configuree

## Limitations

- Telegram limite les messages texte a 4 096 caracteres (PRX decoupe automatiquement les messages plus longs)
- Le polling du Bot API introduit une legere latence par rapport au mode webhook
- Les bots ne peuvent pas initier de conversations ; les utilisateurs devrez d'abord envoyer un message au bot
- Les envois de fichiers sont limites a 50 Mo via le Bot API

## Depannage

### Le bot ne repond pas aux messages
- Verifiez que le token du bot est correct avec `prx channel doctor telegram`
- Verifiez que l'ID utilisateur ou le nom d'utilisateur de l'expediteur est dans `allowed_users`
- Si `allowed_users` est vide, utilisez d'abord `/bind <code>` pour vous appairer

### Erreurs de limite de debit en streaming
- Augmentez `draft_update_interval_ms` (par ex. a `1000` ou plus)
- Telegram impose des limites de debit par chat sur les modifications de messages

### Le bot repond en MP mais pas dans les groupes
- Assurez-vous que `mention_only` est defini a `false`, ou mentionnez le bot avec @
- Dans BotFather, desactivez le mode "Group Privacy" pour que le bot puisse voir tous les messages de groupe
