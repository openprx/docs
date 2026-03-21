---
title: Messagerie
description: Outils pour l'envoi de messages via les canaux de communication avec routage automatique et acces bas niveau a la passerelle.
---

# Messagerie

PRX fournit deux outils de messagerie qui permettent aux agents d'envoyer des messages via les canaux de communication. L'outil `message_send` est l'interface haut niveau pour envoyer des messages texte, des medias et des messages vocaux vers n'importe quel canal configure, tandis que l'outil `gateway` fournit un acces bas niveau a la passerelle HTTP/WebSocket Axum pour la livraison brute de messages.

Les outils de messagerie sont enregistres au niveau de la passerelle et sont disponibles lorsqu'un canal est actif. L'outil `message_send` route automatiquement les messages vers le canal actif (Telegram, Discord, Slack, CLI, etc.), tandis que l'outil `gateway` offre un acces direct au protocole de la passerelle pour les cas d'utilisation avances.

Ces outils completent le systeme de canaux entrants. Alors que les canaux gerent la reception des messages des utilisateurs et leur routage vers l'agent, les outils de messagerie gerent la direction sortante -- l'envoi de contenu genere par l'agent aux utilisateurs.

## Configuration

Les outils de messagerie n'ont pas de section de configuration dediee. Leur disponibilite depend de la configuration des canaux et de la passerelle :

```toml
# Configuration de la passerelle (les outils de messagerie en dependent)
[gateway]
host = "127.0.0.1"
port = 16830

# Configuration des canaux (message_send route vers le canal actif)
[channels_config]
cli = true
message_timeout_secs = 300

[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
stream_mode = "partial"
```

L'outil `message_send` est disponible des qu'au moins un canal est actif. L'outil `gateway` est toujours enregistre dans `all_tools()`.

## Reference des outils

### message_send

Envoie un message vers n'importe quel canal et destinataire configure. L'outil route automatiquement vers le canal actif -- le canal par lequel la conversation en cours se deroule.

**Envoyer un message texte :**

```json
{
  "name": "message_send",
  "arguments": {
    "text": "The build completed successfully. All 42 tests passed.",
    "channel": "telegram"
  }
}
```

**Envoyer un media (image/fichier) :**

```json
{
  "name": "message_send",
  "arguments": {
    "media_path": "/tmp/screenshot.png",
    "caption": "Current dashboard state",
    "channel": "telegram"
  }
}
```

**Envoyer un message vocal :**

```json
{
  "name": "message_send",
  "arguments": {
    "voice_path": "/tmp/summary.mp3",
    "channel": "telegram"
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|--------|--------|-------------|
| `text` | `string` | Conditionnel | -- | Contenu du message texte (requis si pas de media/vocal) |
| `channel` | `string` | Non | Canal actif | Nom du canal cible (auto-detecte si omis) |
| `recipient` | `string` | Non | Utilisateur courant | Identifiant du destinataire (ID utilisateur, ID chat, etc.) |
| `media_path` | `string` | Non | -- | Chemin vers le fichier media (image, document, video) |
| `caption` | `string` | Non | -- | Legende pour les messages media |
| `voice_path` | `string` | Non | -- | Chemin vers le fichier vocal/audio |
| `reply_to` | `string` | Non | -- | ID du message auquel repondre (specifique a la plateforme) |

### gateway

Acces bas niveau a la passerelle pour l'envoi de messages bruts via la passerelle HTTP/WebSocket Axum. Cet outil est destine aux cas d'utilisation avances ou `message_send` est insuffisant.

```json
{
  "name": "gateway",
  "arguments": {
    "action": "send",
    "payload": {
      "type": "text",
      "content": "Raw gateway message",
      "target": "ws://localhost:16830/ws"
    }
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|--------|--------|-------------|
| `action` | `string` | Oui | -- | Action de la passerelle : `"send"`, `"broadcast"`, `"status"` |
| `payload` | `object` | Conditionnel | -- | Payload du message (requis pour `"send"` et `"broadcast"`) |

## Utilisation

### Routage automatique des canaux

Dans la plupart des cas, l'agent n'a pas besoin de specifier un canal. Lorsqu'un utilisateur envoie un message via Telegram, la reponse de l'agent est automatiquement routee vers Telegram :

```
Utilisateur (via Telegram) : Quel temps fait-il ?
Agent : [appelle message_send avec text="Actuellement 22C et ensoleille a Shanghai."]
       -> Automatiquement envoye sur Telegram, dans le meme chat
```

### Messagerie inter-canaux

L'agent peut envoyer des messages vers un canal different de celui ou la conversation se deroule :

```json
{
  "name": "message_send",
  "arguments": {
    "text": "Build failed! Check CI logs.",
    "channel": "discord",
    "recipient": "111222333"
  }
}
```

Cela est utile pour les workflows de notification ou l'agent surveille un canal et envoie des alertes vers un autre.

### Livraison de media

L'agent peut envoyer des fichiers, des images et de l'audio via les canaux de messagerie :

1. Generer ou telecharger le fichier media
2. Le sauvegarder dans un chemin temporaire
3. L'envoyer via `message_send` avec `media_path`

```
Reflexion de l'agent : L'utilisateur a demande un graphique des donnees.
  1. [shell] python3 generate_chart.py --output /tmp/chart.png
  2. [message_send] media_path="/tmp/chart.png", caption="Graphique des revenus mensuels"
```

### Messages vocaux

Pour les canaux qui prennent en charge la voix (Telegram, WhatsApp, Discord), l'agent peut envoyer des messages audio :

```
Reflexion de l'agent : L'utilisateur a demande un resume vocal.
  1. [tts] text="Voici votre resume quotidien..." output="/tmp/summary.mp3"
  2. [message_send] voice_path="/tmp/summary.mp3"
```

## Details du routage des canaux

Lorsque `message_send` est appele sans parametre `channel` explicite, PRX determine le canal cible selon la logique suivante :

1. **Canal de la session active** : Le canal associe a la session d'agent en cours (defini lorsque la session a ete creee par un message entrant)
2. **Canal par defaut** : Si aucun canal de session n'est defini, bascule vers le premier canal actif
3. **Repli CLI** : Si aucun canal n'est configure, la sortie va vers stdout

### Transports de canaux pris en charge

| Canal | Texte | Media | Vocal | Reponse |
|-------|:-----:|:-----:|:-----:|:-------:|
| Telegram | Oui | Oui | Oui | Oui |
| Discord | Oui | Oui | Oui | Oui |
| Slack | Oui | Oui | Non | Oui |
| WhatsApp | Oui | Oui | Oui | Oui |
| Signal | Oui | Oui | Non | Oui |
| Matrix | Oui | Oui | Non | Oui |
| Email | Oui | Oui (piece jointe) | Non | Oui |
| CLI | Oui | Non | Non | Non |

## Securite

### Autorisation des canaux

Les messages sortants sont soumis aux memes politiques de canal que les messages entrants. L'agent ne peut envoyer des messages qu'aux canaux configures et actifs. Toute tentative d'envoi vers un canal non configure retourne une erreur.

### Validation du destinataire

Lorsqu'un `recipient` est specifie, PRX valide que le destinataire est joignable via le canal cible. Pour les canaux avec des listes `allowed_users`, les messages sortants vers des destinataires non listes sont bloques.

### Limitation de debit

Les messages sortants sont soumis aux limites de debit du canal (configurees par plateforme). Par exemple, Telegram applique des limites de debit API que PRX respecte avec un backoff automatique.

### Moteur de politiques

Les outils de messagerie peuvent etre controles via la politique de securite :

```toml
[security.tool_policy.tools]
message_send = "allow"
gateway = "supervised"     # Necessite une approbation pour l'acces brut a la passerelle
```

### Journalisation d'audit

Tous les messages sortants sont enregistres dans le journal d'audit :

- Canal cible et destinataire
- Type de message (texte, media, vocal)
- Horodatage
- Statut de livraison

Les chemins des fichiers media sont journalises mais le contenu des fichiers n'est pas stocke dans le journal d'audit.

## Voir aussi

- [Apercu des canaux](/fr/prx/channels/) -- toutes les 19 plateformes de messagerie prises en charge
- [Passerelle](/fr/prx/gateway/) -- architecture API HTTP et WebSocket
- [API HTTP de la passerelle](/fr/prx/gateway/http-api) -- endpoints API REST
- [WebSocket de la passerelle](/fr/prx/gateway/websocket) -- streaming en temps reel
- [Outils de rendu (TTS)](/fr/prx/tools/media) -- synthese vocale pour les messages vocaux
- [Apercu des outils](/fr/prx/tools/) -- tous les outils et systeme de registre
