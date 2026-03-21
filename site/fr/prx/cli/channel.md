---
title: prx channel
description: Gerer les connexions aux canaux de messagerie -- lister, ajouter, supprimer, demarrer et diagnostiquer les canaux.
---

# prx channel

Gerer les canaux de messagerie auxquels PRX se connecte. Les canaux sont les ponts entre les plateformes de messagerie (Telegram, Discord, Slack, etc.) et le runtime de l'agent PRX.

## Utilisation

```bash
prx channel <SOUS-COMMANDE> [OPTIONS]
```

## Sous-commandes

### `prx channel list`

Lister tous les canaux configures et leur etat actuel.

```bash
prx channel list [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--json` | `-j` | `false` | Sortie au format JSON |
| `--verbose` | `-v` | `false` | Afficher les informations detaillees de connexion |

**Exemple de sortie :**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

Ajouter une nouvelle configuration de canal de maniere interactive ou via des drapeaux.

```bash
prx channel add [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--type` | `-t` | | Type de canal (ex. `telegram`, `discord`, `slack`) |
| `--name` | `-n` | genere automatiquement | Nom d'affichage du canal |
| `--token` | | | Token du bot ou cle API |
| `--enabled` | | `true` | Activer le canal immediatement |
| `--interactive` | `-i` | `true` | Utiliser l'assistant interactif |

```bash
# Mode interactif (invites guidees)
prx channel add

# Non interactif avec drapeaux
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

Supprimer une configuration de canal.

```bash
prx channel remove <NOM> [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--force` | `-f` | `false` | Ignorer l'invite de confirmation |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

Demarrer (ou redemarrer) un canal specifique sans redemarrer le daemon.

```bash
prx channel start <NOM>
```

```bash
# Redemarrer un canal en erreur
prx channel start slack-team
```

Cette commande envoie un message de controle au daemon en cours d'execution. Le daemon doit etre en marche pour que cette commande fonctionne.

### `prx channel doctor`

Lancer des diagnostics sur les connexions des canaux. Verifie la validite des tokens, la connectivite reseau, les URL de webhooks et les permissions.

```bash
prx channel doctor [NOM]
```

Si `NOM` est omis, tous les canaux sont verifies.

```bash
# Verifier tous les canaux
prx channel doctor

# Verifier un canal specifique
prx channel doctor telegram-main
```

**Exemple de sortie :**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## Exemples

```bash
# Workflow complet : ajouter, verifier, demarrer
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# Lister les canaux en JSON pour le scripting
prx channel list --json | jq '.[] | select(.status == "error")'
```

## Voir aussi

- [Apercu des canaux](/fr/prx/channels/) -- documentation detaillee des canaux
- [prx daemon](./daemon) -- le daemon qui execute les connexions aux canaux
- [prx doctor](./doctor) -- diagnostics complets du systeme incluant les canaux
