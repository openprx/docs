---
title: Depannage
description: Problemes courants et solutions pour PRX, incluant les outils de diagnostic et la FAQ.
---

# Depannage

Cette section couvre les problemes courants rencontres lors de l'execution de PRX et comment les resoudre.

## Diagnostics rapides

Lancez la commande doctor integree pour une verification de sante complete :

```bash
prx doctor
```

Cela verifie :

- La validite du fichier de configuration
- La connectivite et l'authentification des fournisseurs
- Les dependances systeme
- L'espace disque et les permissions
- Le statut du daemon actif

## Problemes courants

### Le daemon ne demarre pas

**Symptomes** : `prx daemon` quitte immediatement ou echoue a binder le port.

**Solutions** :
- Verifiez si une autre instance est en cours d'execution : `prx daemon status`
- Verifiez que le port est disponible : `ss -tlnp | grep 3120`
- Consultez les journaux : `prx daemon logs`
- Validez la configuration : `prx config check`

### Echec d'authentification du fournisseur

**Symptomes** : Erreurs "Unauthorized" ou "Invalid API key".

**Solutions** :
- Verifiez votre cle API : `prx auth status`
- Reauthentifiez-vous : `prx auth login <fournisseur>`
- Verifiez les variables d'environnement : `env | grep API_KEY`

### Utilisation excessive de memoire

**Symptomes** : Le processus PRX consomme une memoire excessive.

**Solutions** :
- Reduisez les sessions simultanees : definissez `[agent.limits] max_concurrent_sessions`
- Activez l'hygiene de la memoire : `prx memory compact`
- Verifiez les sessions longues : `prx session list`

### L'execution d'un outil se bloque

**Symptomes** : L'agent semble bloque pendant l'execution d'un outil.

**Solutions** :
- Verifiez la configuration du sandbox
- Verifiez que les dependances de l'outil sont installees
- Definissez un timeout : `[agent] session_timeout_secs = 300`
- Annulez la session : `prx session cancel <id>`

## Obtenir de l'aide

- Consultez la page [Diagnostics](./diagnostics) pour des procedures de diagnostic detaillees
- Ouvrez une issue sur GitHub : `https://github.com/openprx/prx/issues`
- Rejoignez le Discord de la communaute pour une aide en temps reel

## Pages associees

- [Diagnostics](./diagnostics)
