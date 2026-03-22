---
title: Dépannage
description: "Solutions pour les problèmes courants d'OpenPR incluant les connexions à la base de données, les erreurs d'authentification, les problèmes Docker et la configuration du serveur MCP."
---

# Dépannage

Cette page couvre les problèmes courants et leurs solutions lors de l'exécution d'OpenPR.

## Connexion à la base de données

### L'API échoue à démarrer avec "connection refused"

Le serveur API démarre avant que PostgreSQL ne soit prêt.

**Solution** : Le fichier Docker Compose inclut des vérifications de santé et `depends_on` avec `condition: service_healthy`. Si le problème persiste, augmentez le `start_period` de PostgreSQL :

```yaml
postgres:
  healthcheck:
    start_period: 30s  # Augmenter depuis la valeur par défaut 10s
```

### "role openpr does not exist"

L'utilisateur PostgreSQL n'a pas été créé.

**Solution** : Vérifiez que `POSTGRES_USER` et `POSTGRES_PASSWORD` sont définis dans l'environnement Docker Compose. Si vous exécutez PostgreSQL manuellement :

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### Migrations non appliquées

Les migrations ne s'exécutent automatiquement qu'au premier démarrage du conteneur PostgreSQL (via `docker-entrypoint-initdb.d`).

**Solution** : Si la base de données existe déjà, appliquez les migrations manuellement :

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# Puis exécutez chaque fichier SQL de migration dans l'ordre
```

Ou recréez le volume :

```bash
docker-compose down -v
docker-compose up -d
```

::: warning Perte de données
`docker-compose down -v` supprime le volume de la base de données. Sauvegardez vos données d'abord.
:::

## Authentification

### "Invalid token" après redémarrage du serveur

Les jetons JWT sont signés avec `JWT_SECRET`. Si cette valeur change entre les redémarrages, tous les jetons existants deviennent invalides.

**Solution** : Définissez un `JWT_SECRET` fixe dans `.env` :

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### Le premier utilisateur n'est pas administrateur

Le rôle admin est attribué au premier utilisateur qui s'enregistre. Si vous voyez `role: "user"` au lieu de `role: "admin"`, un autre compte a été enregistré en premier.

**Solution** : Utilisez la base de données pour mettre à jour le rôle :

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### Le build Podman échoue avec une erreur DNS

Le réseau par défaut de Podman n'a pas d'accès DNS pendant les builds.

**Solution** : Utilisez toujours `--network=host` lors de la construction d'images avec Podman :

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### Le frontend affiche "502 Bad Gateway"

Le conteneur Nginx ne peut pas atteindre le serveur API.

**Solution** : Vérifiez que :
1. Le conteneur API est en cours d'exécution : `docker-compose ps`
2. La vérification de santé de l'API réussit : `docker exec openpr-api curl -f http://localhost:8080/health`
3. Les deux conteneurs sont sur le même réseau : `docker network inspect openpr_openpr-network`

### Conflits de ports

Un autre service utilise le même port.

**Solution** : Changez le mappage de port externe dans `docker-compose.yml` :

```yaml
api:
  ports:
    - "8082:8080"  # Changé depuis 8081
```

## Serveur MCP

### "tools/list retourne vide"

Le serveur MCP ne peut pas se connecter à l'API.

**Solution** : Vérifiez les variables d'environnement :

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

Vérifiez que :
- `OPENPR_API_URL` pointe vers le bon point de terminaison API
- `OPENPR_BOT_TOKEN` est un jeton bot valide (commence par `opr_`)
- `OPENPR_WORKSPACE_ID` est un UUID d'espace de travail valide

### Le transport stdio ne fonctionne pas

Le binaire MCP doit être configuré comme commande dans votre client IA.

**Solution** : Assurez-vous que le chemin du binaire est correct et que les variables d'environnement sont définies :

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/absolute/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_...",
        "OPENPR_WORKSPACE_ID": "..."
      }
    }
  }
}
```

### La connexion SSE se coupe

Les connexions SSE peuvent être fermées par des serveurs proxy avec des délais d'attente courts.

**Solution** : Si vous utilisez un proxy inverse, augmentez le délai d'attente pour le point de terminaison SSE :

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## Frontend

### Page blanche après déploiement

Le build frontend peut utiliser la mauvaise URL d'API.

**Solution** : Définissez `VITE_API_URL` avant la compilation :

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### La connexion fonctionne mais les pages sont vides

Les requêtes API échouent silencieusement. Vérifiez la console du navigateur (F12) pour les erreurs 401 ou CORS.

**Solution** : Assurez-vous que l'API est accessible depuis le navigateur et que CORS est configuré. Le frontend doit proxifier les requêtes API via Nginx.

## Performance

### Recherches lentes

La recherche plein texte PostgreSQL peut être lente sur de grands ensembles de données sans index appropriés.

**Solution** : Assurez-vous que les index FTS existent (ils sont créés par les migrations) :

```sql
-- Vérifier les index existants
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### Utilisation mémoire élevée

Le serveur API traite les téléchargements de fichiers en mémoire.

**Solution** : Limitez les tailles de téléchargement et surveillez le répertoire `uploads/`. Envisagez de configurer un nettoyage périodique des anciens téléchargements.

## Obtenir de l'aide

Si votre problème n'est pas couvert ici :

1. Consultez les [Issues GitHub](https://github.com/openprx/openpr/issues) pour les problèmes connus.
2. Examinez les journaux du serveur API et MCP pour les messages d'erreur.
3. Ouvrez un nouveau problème avec vos journaux d'erreur, les détails de l'environnement et les étapes pour reproduire.
