---
title: Interface d'administration
description: "Tableau de bord d'administration Vue 3 de PRX-WAF. Authentification JWT + TOTP, gestion des hôtes, gestion des règles, surveillance des événements de sécurité, tableau de bord WebSocket en temps réel et configuration des notifications."
---

# Interface d'administration

PRX-WAF inclut un tableau de bord d'administration Vue 3 + Tailwind CSS intégré dans le binaire. Il fournit une interface graphique pour gérer les hôtes, les règles, les certificats, les événements de sécurité et l'état du cluster.

## Accès à l'interface d'administration

L'interface d'administration est servie par le serveur API sur l'adresse configurée :

```
http://localhost:9527
```

Identifiants par défaut : `admin` / `admin`

::: warning
Changez le mot de passe par défaut immédiatement après la première connexion. Activez l'authentification à deux facteurs TOTP pour les environnements de production.
:::

## Authentification

L'interface d'administration prend en charge deux mécanismes d'authentification :

| Méthode | Description |
|---------|-------------|
| Jeton JWT | Obtenu via `/api/auth/login`, stocké dans le localStorage du navigateur |
| TOTP (Optionnel) | Mot de passe à usage unique basé sur le temps pour l'authentification à deux facteurs |

### API de connexion

```bash
curl -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Réponse :

```json
{
  "token": "eyJ...",
  "refresh_token": "..."
}
```

Pour les comptes avec TOTP activé, incluez le champ `totp_code` :

```json
{"username": "admin", "password": "admin", "totp_code": "123456"}
```

## Sections du tableau de bord

### Hôtes

Gérez les domaines protégés et leurs backends en amont :
- Ajouter, modifier et supprimer des hôtes
- Activer/désactiver la protection WAF par hôte
- Afficher les statistiques de trafic par hôte

### Règles

Gérez les règles de détection depuis toutes les sources :
- Afficher les règles OWASP CRS, ModSecurity, CVE et personnalisées
- Activer/désactiver des règles individuelles
- Rechercher et filtrer par catégorie, sévérité et source
- Importer et exporter des règles

### Règles IP

Gérez les listes d'autorisation et de blocage basées sur IP :
- Ajouter des adresses IP ou des plages CIDR
- Définir des actions d'autorisation/blocage
- Afficher les règles IP actives

### Règles URL

Gérez les règles de détection basées sur URL :
- Ajouter des patterns d'URL avec support regex
- Définir des actions de blocage/journalisation/autorisation

### Événements de sécurité

Afficher et analyser les attaques détectées :
- Flux d'événements en temps réel
- Filtrer par hôte, type d'attaque, IP source et plage horaire
- Exporter les événements en JSON ou CSV

### Statistiques

Afficher les métriques de trafic et de sécurité :
- Requêtes par seconde
- Distribution des attaques par type
- Hôtes les plus attaqués
- IPs sources les plus fréquentes
- Distribution des codes de réponse

### Certificats SSL

Gérez les certificats TLS :
- Afficher les certificats actifs et leurs dates d'expiration
- Télécharger des certificats manuels
- Surveiller l'état du renouvellement automatique Let's Encrypt

### Plugins WASM

Gérez les plugins WebAssembly :
- Télécharger de nouveaux plugins
- Afficher les plugins chargés et leur état
- Activer/désactiver les plugins

### Tunnels

Gérez les tunnels inversés :
- Créer et supprimer des tunnels basés sur WebSocket
- Surveiller l'état et le trafic des tunnels

### CrowdSec

Afficher l'état de l'intégration CrowdSec :
- Décisions actives depuis le LAPI
- Résultats d'inspection AppSec
- État de la connexion

### Notifications

Configurer les canaux d'alerte :
- Email (SMTP)
- Webhook
- Telegram

## Surveillance en temps réel

L'interface d'administration se connecte à un point de terminaison WebSocket (`/ws/events`) pour la diffusion d'événements de sécurité en direct. Les événements apparaissent en temps réel dès que les attaques sont détectées et bloquées.

Vous pouvez également vous connecter au WebSocket par programmation :

```javascript
const ws = new WebSocket("ws://localhost:9527/ws/events");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Security event:", data);
};
```

## Sécurisation de l'interface

### Restreindre l'accès admin par IP

Limitez l'accès à l'interface d'administration et à l'API aux réseaux de confiance :

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
```

### Activer la limitation de débit

Protégez l'API d'administration contre les attaques par force brute :

```toml
[security]
api_rate_limit_rps = 100
```

### Configurer le CORS

Restreignez les origines pouvant accéder à l'API d'administration :

```toml
[security]
cors_origins = ["https://admin.example.com"]
```

## Pile technologique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Vue 3 + Tailwind CSS |
| Build | Vite |
| État | Pinia |
| Client HTTP | Axios |
| Graphiques | Chart.js |
| Intégration | Fichiers statiques servis par Axum |

Le code source de l'interface d'administration se trouve dans `web/admin-ui/` dans le dépôt.

## Étapes suivantes

- [Démarrage rapide](../getting-started/quickstart) -- Configurer votre premier hôte protégé
- [Référence de configuration](../configuration/reference) -- Paramètres de sécurité de l'administration
- [Référence CLI](../cli/) -- Gestion alternative en ligne de commande
