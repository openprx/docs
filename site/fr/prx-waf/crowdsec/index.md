---
title: Intégration CrowdSec
description: "Intégration CrowdSec de PRX-WAF pour l'intelligence sur les menaces collaborative. Mode bouncer avec cache de décisions en mémoire, mode AppSec pour l'analyse HTTP en temps réel et log pusher pour le partage communautaire."
---

# Intégration CrowdSec

PRX-WAF s'intègre avec [CrowdSec](https://www.crowdsec.net/) pour apporter l'intelligence sur les menaces collaborative et communautaire directement dans le pipeline de détection WAF. Au lieu de s'appuyer uniquement sur des règles locales et des heuristiques, PRX-WAF peut exploiter le réseau CrowdSec -- où des milliers de machines partagent des signaux d'attaque en temps réel -- pour bloquer les IPs malveillantes connues, détecter les attaques au niveau application et contribuer les événements WAF à la communauté.

L'intégration fonctionne en **trois modes** qui peuvent être utilisés indépendamment ou ensemble :

| Mode | Objectif | Latence | Phase du pipeline |
|------|----------|---------|-------------------|
| **Bouncer** | Bloquer les IPs avec des décisions LAPI en cache | Microsecondes (en mémoire) | Phase 16a |
| **AppSec** | Analyser les requêtes HTTP complètes via CrowdSec AppSec | Millisecondes (appel HTTP) | Phase 16b |
| **Log Pusher** | Signaler les événements WAF au LAPI | Asynchrone (par lots) | Arrière-plan |

## Fonctionnement

### Mode Bouncer

Le mode Bouncer maintient un **cache de décisions en mémoire** synchronisé avec le Local API (LAPI) CrowdSec. Quand une requête arrive à la Phase 16a du pipeline de détection, PRX-WAF effectue une recherche O(1) dans le cache :

```
IP de la requête ──> DashMap (correspondance IP exacte) ──> Trouvé? ──> Appliquer décision (ban/captcha/throttle)
                          │
                          └──> Raté ──> RwLock<Vec> (scan de plage CIDR) ──> Trouvé? ──> Appliquer décision
                                               │
                                               └──> Raté ──> Autoriser (passer à la phase suivante)
```

Le cache est rafraîchi à un intervalle configurable (défaut : toutes les 10 secondes) en interrogeant le point de terminaison LAPI `/v1/decisions`. Cette conception garantit que les recherches d'IP ne bloquent jamais sur les E/S réseau -- la synchronisation se produit dans une tâche en arrière-plan.

**Structures de données :**

- **DashMap** pour les adresses IP exactes -- hashmap concurrent sans verrou, recherche O(1)
- **RwLock\<Vec\>** pour les plages CIDR -- scanné séquentiellement lors d'un cache miss, généralement un petit ensemble

**Le filtrage de scénarios** vous permet d'inclure ou d'exclure des décisions en fonction des noms de scénarios :

```toml
# N'agir que sur les scénarios de brute-force SSH et de scan HTTP
scenarios_containing = ["ssh-bf", "http-scan"]

# Ignorer les décisions de ces scénarios
scenarios_not_containing = ["manual"]
```

### Mode AppSec

Le mode AppSec envoie les détails complets des requêtes HTTP au composant AppSec de CrowdSec pour une analyse en temps réel. Contrairement au mode Bouncer qui vérifie uniquement les IPs, AppSec inspecte les en-têtes, le corps, l'URI et la méthode de la requête pour détecter les attaques au niveau application telles que les injections SQL, XSS et les traversées de chemin.

```
Requête ──> Phase 16b ──> POST http://appsec:7422/
                           Corps: { method, uri, headers, body }
                           ──> Moteur AppSec CrowdSec
                           ──> Réponse: allow / block (avec détails)
```

Les vérifications AppSec sont **asynchrones** -- PRX-WAF envoie la requête avec un délai d'attente configurable (défaut : 500ms). Si le point de terminaison AppSec est inaccessible ou expire, le `fallback_action` détermine s'il faut autoriser, bloquer ou journaliser la requête.

### Log Pusher

Le log pusher signale les événements de sécurité WAF au LAPI CrowdSec, contribuant au réseau d'intelligence communautaire sur les menaces. Les événements sont regroupés et vidés périodiquement pour minimiser la charge du LAPI.

**Paramètres de regroupement :**

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Taille du lot | 50 événements | Vider quand le tampon atteint 50 événements |
| Intervalle de vidage | 30 secondes | Vider même si le tampon n'est pas plein |
| Authentification | JWT machine | Utilise `pusher_login` / `pusher_password` pour l'authentification machine |
| Arrêt | Vidage final | Tous les événements en tampon sont vidés avant la sortie du processus |

Le pusher s'authentifie auprès du LAPI en utilisant des identifiants machine (séparés de la clé API bouncer) et publie les événements sur le point de terminaison `/v1/alerts`.

## Configuration

Ajoutez la section `[crowdsec]` à votre fichier de configuration TOML :

```toml
[crowdsec]
# Interrupteur principal
enabled = true

# Mode d'intégration: "bouncer", "appsec" ou "both"
mode = "both"

# --- Paramètres Bouncer ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = utiliser la durée fournie par le LAPI
fallback_action = "allow"    # "allow" | "block" | "log"

# Filtrage de scénarios (optionnel)
scenarios_containing = []
scenarios_not_containing = []

# --- Paramètres AppSec ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- Paramètres Log Pusher ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### Référence de configuration

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `enabled` | `boolean` | `false` | Activer l'intégration CrowdSec |
| `mode` | `string` | `"bouncer"` | Mode d'intégration : `"bouncer"`, `"appsec"` ou `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | URL de base du LAPI CrowdSec |
| `api_key` | `string` | `""` | Clé API bouncer (obtenue via `cscli bouncers add`) |
| `update_frequency_secs` | `integer` | `10` | Fréquence de rafraîchissement du cache de décisions depuis le LAPI (secondes) |
| `cache_ttl_secs` | `integer` | `0` | Remplacer le TTL de décision. `0` signifie utiliser la durée fournie par le LAPI. |
| `fallback_action` | `string` | `"allow"` | Action quand le LAPI ou AppSec est inaccessible : `"allow"`, `"block"` ou `"log"` |
| `scenarios_containing` | `string[]` | `[]` | Ne mettre en cache que les décisions dont le nom de scénario contient l'une de ces sous-chaînes. Vide signifie tout. |
| `scenarios_not_containing` | `string[]` | `[]` | Exclure les décisions dont le nom de scénario contient l'une de ces sous-chaînes. |
| `appsec_endpoint` | `string` | -- | URL du point de terminaison AppSec CrowdSec |
| `appsec_key` | `string` | -- | Clé API AppSec |
| `appsec_timeout_ms` | `integer` | `500` | Délai d'attente des requêtes HTTP AppSec (millisecondes) |
| `pusher_login` | `string` | -- | Login machine pour l'authentification LAPI (log pusher) |
| `pusher_password` | `string` | -- | Mot de passe machine pour l'authentification LAPI (log pusher) |

## Guide de configuration

### Prérequis

1. Une instance CrowdSec en cours d'exécution avec le LAPI accessible depuis votre hôte PRX-WAF
2. Une clé API bouncer (pour le mode Bouncer)
3. Le composant AppSec CrowdSec (pour le mode AppSec, optionnel)
4. Des identifiants machine (pour le Log Pusher, optionnel)

### Étape 1 : Installer CrowdSec

Si vous n'avez pas encore CrowdSec installé :

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# Vérifier que le LAPI est en cours d'exécution
sudo cscli metrics
```

### Étape 2 : Enregistrer un Bouncer

```bash
# Créer une clé API bouncer pour PRX-WAF
sudo cscli bouncers add prx-waf-bouncer

# Sortie:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# Copiez cette clé -- elle n'est affichée qu'une seule fois.
```

### Étape 3 : Configurer PRX-WAF

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### Étape 4 : Vérifier la connectivité

```bash
# Via le CLI
prx-waf crowdsec test

# Ou via l'API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### Étape 5 (Optionnel) : Activer AppSec

Si vous avez le composant AppSec CrowdSec en cours d'exécution :

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### Étape 6 (Optionnel) : Activer le Log Pusher

Pour contribuer les événements WAF à CrowdSec :

```bash
# Enregistrer une machine sur le LAPI CrowdSec
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### Configuration interactive

Pour une expérience de configuration guidée, utilisez l'assistant CLI :

```bash
prx-waf crowdsec setup
```

L'assistant vous guide à travers la configuration de l'URL LAPI, la saisie de la clé API, la sélection du mode et les tests de connectivité.

## Intégration dans le pipeline

Les vérifications CrowdSec s'exécutent à la **Phase 16** du pipeline de détection WAF à 16 phases -- la dernière phase avant le proxy vers le backend en amont. Ce positionnement est délibéré :

1. **Les vérifications moins coûteuses d'abord.** La liste blanche/noire IP (Phase 1-4), la limitation de débit (Phase 5) et la correspondance de patterns (Phase 8-13) s'exécutent avant CrowdSec, filtrant les attaques évidentes sans recherches externes.
2. **Bouncer avant AppSec.** La Phase 16a (Bouncer) s'exécute de manière synchrone avec une latence de microsecondes. Seulement si l'IP n'est pas dans le cache de décisions, la Phase 16b (AppSec) s'exécute, ce qui implique un aller-retour HTTP.
3. **Architecture non bloquante.** Le cache de décisions est rafraîchi dans une tâche en arrière-plan. Les appels AppSec utilisent HTTP async avec un délai d'attente. Aucun mode ne bloque le pool de threads proxy principal.

```
Phase 1-15 (vérifications locales)
    │
    └──> Phase 16a: Bouncer (recherche DashMap/CIDR, ~1-5 us)
              │
              ├── Décision trouvée ──> Block/Captcha/Throttle
              │
              └── Aucune décision ──> Phase 16b: AppSec (HTTP POST, ~1-50 ms)
                                           │
                                           ├── Block ──> 403 Forbidden
                                           │
                                           └── Allow ──> Proxy vers l'amont
```

## API REST

Tous les points de terminaison de l'API CrowdSec nécessitent une authentification (jeton JWT Bearer de l'API d'administration).

### Statut

```http
GET /api/crowdsec/status
```

Retourne l'état actuel de l'intégration incluant l'état de la connexion, les statistiques du cache et le résumé de configuration.

**Réponse :**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_connected": true,
  "appsec_connected": true,
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "last_refresh": "2026-03-21T10:15:30Z",
    "refresh_interval_secs": 10
  },
  "pusher": {
    "authenticated": true,
    "events_sent": 4521,
    "buffer_size": 12
  }
}
```

### Lister les décisions

```http
GET /api/crowdsec/decisions
```

Retourne toutes les décisions en cache avec leur type, portée, valeur et expiration.

**Réponse :**

```json
{
  "decisions": [
    {
      "id": 12345,
      "type": "ban",
      "scope": "ip",
      "value": "192.168.1.100",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "duration": "4h",
      "expires_at": "2026-03-21T14:00:00Z"
    },
    {
      "id": 12346,
      "type": "ban",
      "scope": "range",
      "value": "10.0.0.0/24",
      "scenario": "crowdsecurity/ssh-bf",
      "duration": "24h",
      "expires_at": "2026-03-22T10:00:00Z"
    }
  ],
  "total": 1336
}
```

### Supprimer une décision

```http
DELETE /api/crowdsec/decisions/:id
```

Supprime une décision du cache local et du LAPI. Utile pour débloquer les faux positifs.

**Exemple :**

```bash
curl -X DELETE http://localhost:9527/api/crowdsec/decisions/12345 \
  -H "Authorization: Bearer <token>"
```

### Tester la connectivité

```http
POST /api/crowdsec/test
```

Teste la connectivité au LAPI (et au point de terminaison AppSec s'il est configuré). Retourne l'état de la connexion et la latence.

**Réponse :**

```json
{
  "lapi": {
    "reachable": true,
    "latency_ms": 3,
    "version": "1.6.4"
  },
  "appsec": {
    "reachable": true,
    "latency_ms": 12
  }
}
```

### Obtenir la configuration

```http
GET /api/crowdsec/config
```

Retourne la configuration CrowdSec actuelle (les champs sensibles comme `api_key` sont masqués).

### Mettre à jour la configuration

```http
PUT /api/crowdsec/config
Content-Type: application/json
```

Met à jour la configuration CrowdSec à l'exécution. Les changements prennent effet immédiatement sans redémarrage.

**Corps de la requête :**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_url": "http://127.0.0.1:8080",
  "api_key": "new-api-key",
  "update_frequency_secs": 15,
  "fallback_action": "log"
}
```

### Statistiques du cache

```http
GET /api/crowdsec/stats
```

Retourne des statistiques détaillées du cache incluant les taux de succès/échec et la répartition des types de décisions.

**Réponse :**

```json
{
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "total_lookups": 582910,
    "cache_hits": 3891,
    "cache_misses": 579019,
    "hit_rate_percent": 0.67
  },
  "decisions_by_type": {
    "ban": 1102,
    "captcha": 145,
    "throttle": 89
  },
  "decisions_by_scenario": {
    "crowdsecurity/http-bf-wordpress_bf": 423,
    "crowdsecurity/ssh-bf": 312,
    "crowdsecurity/http-bad-user-agent": 198
  }
}
```

### Événements récents

```http
GET /api/crowdsec/events
```

Retourne les événements de sécurité récents déclenchés par les décisions CrowdSec.

**Réponse :**

```json
{
  "events": [
    {
      "timestamp": "2026-03-21T10:14:22Z",
      "source_ip": "192.168.1.100",
      "action": "ban",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "request_uri": "/wp-login.php",
      "method": "POST"
    }
  ],
  "total": 892
}
```

## Commandes CLI

### Statut

```bash
prx-waf crowdsec status
```

Affiche l'état de l'intégration, l'état de la connexion LAPI, la taille du cache et les statistiques du pusher.

**Exemple de sortie :**

```
CrowdSec Integration Status
============================
  Enabled:        true
  Mode:           both
  LAPI URL:       http://127.0.0.1:8080
  LAPI Connected: true
  Cache:
    Exact IPs:    1,247
    CIDR Ranges:  89
    Last Refresh: 2s ago
  AppSec:
    Endpoint:     http://127.0.0.1:7422
    Connected:    true
  Pusher:
    Authenticated: true
    Events Sent:   4,521
    Buffer:        12 pending
```

### Lister les décisions

```bash
prx-waf crowdsec decisions
```

Affiche un tableau de toutes les décisions actives dans le cache local.

### Tester la connectivité

```bash
prx-waf crowdsec test
```

Effectue une vérification de connectivité contre le LAPI et le point de terminaison AppSec, en rapportant la latence et les informations de version.

### Assistant de configuration

```bash
prx-waf crowdsec setup
```

Un assistant interactif qui vous guide à travers :

1. Configuration de l'URL LAPI et de la clé API
2. Sélection du mode (bouncer / appsec / both)
3. Configuration du point de terminaison AppSec (si applicable)
4. Configuration des identifiants du log pusher (optionnel)
5. Vérification de la connectivité
6. Écriture de la configuration dans le fichier TOML

## Interface d'administration

Le tableau de bord d'administration Vue 3 inclut trois vues de gestion CrowdSec :

### Paramètres CrowdSec

La vue **CrowdSecSettings** (`Paramètres > CrowdSec`) fournit un formulaire pour configurer tous les paramètres CrowdSec :

- Bouton d'activation/désactivation
- Sélecteur de mode (bouncer / appsec / both)
- Champs URL LAPI et clé API
- Curseur d'intervalle de rafraîchissement du cache
- Sélecteur d'action de fallback
- Configuration du point de terminaison AppSec
- Identifiants du log pusher
- Bouton de test de connectivité avec retour en temps réel

### Décisions CrowdSec

La vue **CrowdSecDecisions** (`Sécurité > Décisions CrowdSec`) affiche toutes les décisions en cache dans un tableau triable et filtrable :

- Badges de type de décision (ban, captcha, throttle)
- IP/plage avec recherche de géolocalisation
- Nom du scénario avec lien vers la documentation
- Compte à rebours d'expiration
- Suppression en un clic pour débloquer les IPs

### Statistiques CrowdSec

La vue **CrowdSecStats** (`Tableau de bord > CrowdSec`) présente les métriques opérationnelles :

- Graphique de taux de succès/échec du cache (série temporelle)
- Répartition des types de décisions (graphique circulaire)
- Principaux scénarios bloqués (graphique en barres)
- Débit d'événements du pusher
- Histogramme de latence LAPI

## Schémas de déploiement

### Bouncer uniquement (point de départ recommandé)

Le déploiement le plus simple. PRX-WAF interroge les décisions depuis un LAPI CrowdSec et bloque les IPs malveillantes connues :

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "allow"
```

Idéal pour : la plupart des déploiements, overhead minimal, aucun composant CrowdSec supplémentaire nécessaire.

### Intégration complète (Bouncer + AppSec + Pusher)

Protection maximale avec intelligence bidirectionnelle sur les menaces :

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "log"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
pusher_login = "prx-waf-machine"
pusher_password = "secure-password"
```

Idéal pour : les environnements de production qui veulent à la fois la réputation IP et l'inspection au niveau application, plus la contribution communautaire.

### Haute disponibilité avec LAPI distant

Quand le LAPI CrowdSec s'exécute sur un serveur dédié :

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "https://crowdsec.internal:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 5
fallback_action = "allow"  # Ne pas bloquer si le LAPI est inaccessible
cache_ttl_secs = 300       # Conserver les décisions 5 min même si le LAPI tombe
```

Idéal pour : les déploiements multi-serveurs où le LAPI CrowdSec est centralisé.

### Sécurité stricte (blocage en cas d'échec)

Pour les environnements haute sécurité où vous préférez bloquer le trafic quand l'intelligence sur les menaces est indisponible :

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
fallback_action = "block"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 200     # Délai court, échec rapide
```

::: warning
Définir `fallback_action = "block"` signifie que tout le trafic sera bloqué si le LAPI ou le point de terminaison AppSec devient inaccessible. N'utilisez cela que dans des environnements où la disponibilité de CrowdSec est garantie.
:::

## Filtrage de scénarios

Les scénarios CrowdSec représentent des patterns d'attaque spécifiques (ex. `crowdsecurity/ssh-bf` pour la force brute SSH, `crowdsecurity/http-bad-user-agent` pour les user-agents malveillants). Vous pouvez filtrer les scénarios sur lesquels PRX-WAF agit :

### Inclure uniquement des scénarios spécifiques

```toml
[crowdsec]
# Ne bloquer que les IPs marquées pour des attaques liées à HTTP
scenarios_containing = ["http-"]
```

Cela est utile quand votre WAF ne gère que le trafic HTTP et que vous ne voulez pas que les décisions de force brute SSH ou SMTP encombrent le cache.

### Exclure des scénarios spécifiques

```toml
[crowdsec]
# Tout bloquer sauf les décisions manuelles
scenarios_not_containing = ["manual"]
```

### Combiner des filtres

```toml
[crowdsec]
# Uniquement les scénarios HTTP, mais exclure DDoS (géré en amont)
scenarios_containing = ["http-"]
scenarios_not_containing = ["http-ddos"]
```

## Dépannage

### Connexion LAPI refusée

```
CrowdSec LAPI unreachable: connection refused at http://127.0.0.1:8080
```

**Cause :** Le LAPI CrowdSec n'est pas en cours d'exécution ou écoute sur une adresse différente.

**Solution :**
```bash
# Vérifier l'état de CrowdSec
sudo systemctl status crowdsec

# Vérifier que le LAPI écoute
sudo ss -tlnp | grep 8080

# Vérifier les journaux CrowdSec
sudo journalctl -u crowdsec -f
```

### Clé API invalide

```
CrowdSec LAPI returned 403: invalid API key
```

**Cause :** La clé API bouncer est incorrecte ou a été révoquée.

**Solution :**
```bash
# Lister les bouncers existants
sudo cscli bouncers list

# Créer une nouvelle clé bouncer
sudo cscli bouncers add prx-waf-bouncer
```

### Délai d'attente AppSec

```
CrowdSec AppSec timeout after 500ms
```

**Cause :** Le point de terminaison AppSec est lent ou surchargé.

**Solution :**
- Augmenter `appsec_timeout_ms` (ex. à 1000)
- Vérifier l'utilisation des ressources AppSec
- Envisager d'utiliser `mode = "bouncer"` uniquement si AppSec n'est pas critique

### Cache de décisions vide

Si `prx-waf crowdsec decisions` ne montre aucune entrée :

1. Vérifier que le LAPI a des décisions : `sudo cscli decisions list`
2. Vérifier le filtrage de scénarios -- votre filtre `scenarios_containing` peut être trop restrictif
3. Vérifier que la clé bouncer a les permissions de lecture

### Échec d'authentification du Log Pusher

```
CrowdSec pusher: machine authentication failed
```

**Cause :** Identifiants machine invalides.

**Solution :**
```bash
# Vérifier que la machine existe
sudo cscli machines list

# Ré-enregistrer la machine
sudo cscli machines add prx-waf-pusher --password "new-password" --force
```

Mettez à jour `pusher_login` et `pusher_password` dans la configuration en conséquence.

## Étapes suivantes

- [Référence de configuration](../configuration/reference) -- Référence complète de configuration TOML
- [Référence CLI](../cli/) -- Toutes les commandes CLI y compris les sous-commandes CrowdSec
- [Moteur de règles](../rules/) -- Comment CrowdSec s'intègre dans le pipeline de détection
- [Interface d'administration](../admin-ui/) -- Gestion de CrowdSec depuis le tableau de bord
