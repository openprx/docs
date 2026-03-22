---
title: Démarrage rapide
description: "Protéger votre application web avec PRX-WAF en 5 minutes. Démarrer le proxy, ajouter un hôte backend, vérifier la protection et surveiller les événements de sécurité."
---

# Démarrage rapide

Ce guide vous amène de zéro à une application web entièrement protégée en moins de 5 minutes. À la fin, PRX-WAF proxiera le trafic vers votre backend, bloquera les attaques courantes et journalisera les événements de sécurité.

::: tip Prérequis
Vous avez besoin de Docker et Docker Compose installés. Consultez le [Guide d'installation](./installation) pour d'autres méthodes.
:::

## Étape 1 : Démarrer PRX-WAF

Clonez le dépôt et démarrez tous les services :

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

Vérifiez que tous les conteneurs sont en cours d'exécution :

```bash
docker compose ps
```

Sortie attendue :

```
NAME         SERVICE     STATUS
prx-waf      prx-waf     running
postgres     postgres    running
```

## Étape 2 : Se connecter à l'interface d'administration

Ouvrez votre navigateur et naviguez vers `http://localhost:9527`. Connectez-vous avec les identifiants par défaut :

- **Nom d'utilisateur :** `admin`
- **Mot de passe :** `admin`

::: warning
Changez le mot de passe par défaut immédiatement après votre première connexion.
:::

## Étape 3 : Ajouter un hôte backend

Ajoutez votre premier hôte protégé via l'interface d'administration ou l'API :

**Via l'interface d'administration :**
1. Naviguez vers **Hôtes** dans la barre latérale
2. Cliquez sur **Ajouter un hôte**
3. Remplissez :
   - **Hôte :** `example.com` (le domaine que vous voulez protéger)
   - **Hôte distant :** `192.168.1.100` (l'IP de votre serveur backend)
   - **Port distant :** `8080` (le port de votre serveur backend)
   - **Statut de garde :** Activé
4. Cliquez sur **Enregistrer**

**Via l'API :**

```bash
# Obtenir un jeton JWT
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Ajouter un hôte
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "192.168.1.100",
    "remote_port": 8080,
    "guard_status": true
  }'
```

## Étape 4 : Tester la protection

Envoyez une requête légitime à travers le proxy :

```bash
curl -H "Host: example.com" http://localhost/
```

Vous devriez recevoir la réponse normale de votre backend. Testez maintenant que le WAF bloque une tentative d'injection SQL :

```bash
curl -H "Host: example.com" "http://localhost/?id=1%20OR%201=1--"
```

Réponse attendue : **403 Forbidden**

Testez une tentative XSS :

```bash
curl -H "Host: example.com" "http://localhost/?q=<script>alert(1)</script>"
```

Réponse attendue : **403 Forbidden**

Testez une tentative de traversée de chemin :

```bash
curl -H "Host: example.com" "http://localhost/../../etc/passwd"
```

Réponse attendue : **403 Forbidden**

## Étape 5 : Surveiller les événements de sécurité

Affichez les attaques bloquées dans l'interface d'administration :

1. Naviguez vers **Événements de sécurité** dans la barre latérale
2. Vous devriez voir les requêtes bloquées de l'étape 4
3. Chaque événement affiche le type d'attaque, l'IP source, la règle correspondante et l'horodatage

Ou interrogez les événements via l'API :

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/security-events
```

```json
{
  "events": [
    {
      "id": 1,
      "host": "example.com",
      "source_ip": "172.18.0.1",
      "attack_type": "sqli",
      "rule_id": "CRS-942100",
      "action": "block",
      "timestamp": "2026-03-21T10:05:32Z"
    }
  ]
}
```

## Étape 6 : Activer la surveillance en temps réel (Optionnel)

Connectez-vous au point de terminaison WebSocket pour les événements de sécurité en direct :

```bash
# Utiliser websocat ou un client WebSocket similaire
websocat ws://localhost:9527/ws/events
```

Les événements sont diffusés en temps réel au fur et à mesure que les attaques sont détectées et bloquées.

## Ce que vous avez maintenant

Après avoir complété ces étapes, votre configuration comprend :

| Composant | État |
|-----------|--------|
| Proxy inverse | En écoute sur le port 80/443 |
| Moteur WAF | Pipeline de détection 16 phases actif |
| Règles intégrées | OWASP CRS (310+ règles) activé |
| Interface d'administration | En cours d'exécution sur le port 9527 |
| PostgreSQL | Stocke la configuration, les règles et les événements |
| Surveillance en temps réel | Flux d'événements WebSocket disponible |

## Étapes suivantes

- [Moteur de règles](../rules/) -- Comprendre le fonctionnement du moteur de règles YAML
- [Syntaxe YAML](../rules/yaml-syntax) -- Apprendre le schéma de règles pour les règles personnalisées
- [Proxy inverse](../gateway/reverse-proxy) -- Configurer l'équilibrage de charge et le routage en amont
- [SSL/TLS](../gateway/ssl-tls) -- Activer HTTPS avec les certificats Let's Encrypt automatiques
- [Référence de configuration](../configuration/reference) -- Affiner chaque aspect de PRX-WAF
