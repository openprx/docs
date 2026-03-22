---
title: Configuration du proxy inverse
description: "Configurer PRX-WAF comme proxy inverse. Routage d'hôte, backends en amont, équilibrage de charge, en-têtes de requête/réponse et vérifications de santé."
---

# Configuration du proxy inverse

PRX-WAF agit comme un proxy inverse, transmettant les requêtes client aux serveurs backend en amont après avoir traversé le pipeline de détection WAF. Cette page couvre le routage d'hôte, l'équilibrage de charge et la configuration du proxy.

## Configuration des hôtes

Chaque domaine protégé nécessite une entrée d'hôte qui mappe les requêtes entrantes vers un backend en amont. Les hôtes peuvent être configurés de trois façons :

### Via le fichier de configuration TOML

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### Via l'interface d'administration

1. Naviguez vers **Hôtes** dans la barre latérale
2. Cliquez sur **Ajouter un hôte**
3. Remplissez les détails de l'hôte
4. Cliquez sur **Enregistrer**

### Via l'API REST

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## Champs d'hôte

| Champ | Type | Requis | Description |
|-------|------|----------|-------------|
| `host` | `string` | Oui | Le nom de domaine à faire correspondre (ex. `example.com`) |
| `port` | `integer` | Oui | Port à écouter (généralement `80` ou `443`) |
| `remote_host` | `string` | Oui | IP ou nom d'hôte du backend en amont |
| `remote_port` | `integer` | Oui | Port du backend en amont |
| `ssl` | `boolean` | Non | Si le backend en amont utilise HTTPS (défaut : `false`) |
| `guard_status` | `boolean` | Non | Activer la protection WAF pour cet hôte (défaut : `true`) |

## Équilibrage de charge

PRX-WAF utilise l'équilibrage de charge round-robin pondéré entre les backends en amont. Lorsque plusieurs backends sont configurés pour un hôte, le trafic est distribué proportionnellement à leurs poids.

::: info
Plusieurs backends en amont par hôte peuvent être configurés via l'interface d'administration ou l'API. Le fichier de configuration TOML prend en charge les entrées d'hôte à backend unique.
:::

## En-têtes de requête

PRX-WAF ajoute automatiquement les en-têtes de proxy standard aux requêtes transmises :

| En-tête | Valeur |
|--------|-------|
| `X-Real-IP` | Adresse IP originale du client |
| `X-Forwarded-For` | IP client (ajoutée à la chaîne existante) |
| `X-Forwarded-Proto` | `http` ou `https` |
| `X-Forwarded-Host` | Valeur de l'en-tête Host original |

## Limite de taille du corps de requête

La taille maximale du corps de requête est contrôlée par la configuration de sécurité :

```toml
[security]
max_request_body_bytes = 10485760  # 10 Mo
```

Les requêtes dépassant cette limite sont rejetées avec une réponse 413 Payload Too Large avant d'atteindre le pipeline WAF.

## Gestion des hôtes

### Lister tous les hôtes

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### Mettre à jour un hôte

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### Supprimer un hôte

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Règles basées sur les IPs

PRX-WAF prend en charge les règles d'autorisation et de blocage basées sur IP qui sont évaluées dans les Phases 1-4 du pipeline de détection :

```bash
# Ajouter une règle de liste blanche IP
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# Ajouter une règle de liste noire IP
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## Étapes suivantes

- [SSL/TLS](./ssl-tls) -- Activer HTTPS avec Let's Encrypt
- [Présentation de la passerelle](./index) -- Mise en cache des réponses et tunnels
- [Référence de configuration](../configuration/reference) -- Toutes les clés de configuration du proxy
