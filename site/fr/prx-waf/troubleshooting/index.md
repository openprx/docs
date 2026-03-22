---
title: Dépannage
description: "Solutions pour les problèmes courants de PRX-WAF incluant la connexion à la base de données, le chargement des règles, les faux positifs, la synchronisation du cluster, les certificats SSL et l'optimisation des performances."
---

# Dépannage

Cette page couvre les problèmes les plus courants rencontrés lors de l'exécution de PRX-WAF, ainsi que leurs causes et solutions.

## Échec de connexion à la base de données

**Symptômes :** PRX-WAF échoue à démarrer avec des erreurs "connection refused" ou "authentication failed".

**Solutions :**

1. **Vérifier que PostgreSQL est en cours d'exécution :**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **Tester la connectivité :**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. **Vérifier la chaîne de connexion** dans votre configuration TOML :

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. **Exécuter les migrations** si la base de données existe mais que les tables manquent :

```bash
prx-waf -c configs/default.toml migrate
```

## Règles non chargées

**Symptômes :** PRX-WAF démarre mais aucune règle n'est active. Les attaques ne sont pas détectées.

**Solutions :**

1. **Vérifier les statistiques des règles :**

```bash
prx-waf rules stats
```

Si la sortie montre 0 règles, le répertoire de règles peut être vide ou mal configuré.

2. **Vérifier le chemin du répertoire de règles** dans votre configuration :

```toml
[rules]
dir = "rules/"
```

3. **Valider les fichiers de règles :**

```bash
python rules/tools/validate.py rules/
```

4. **Vérifier les erreurs de syntaxe YAML** -- un seul fichier malformé peut empêcher le chargement de toutes les règles :

```bash
# Valider un fichier à la fois pour trouver le problème
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **S'assurer que les règles intégrées sont activées :**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Rechargement à chaud non fonctionnel

**Symptômes :** Les fichiers de règles sont modifiés mais les changements ne prennent pas effet.

**Solutions :**

1. **Vérifier que le rechargement à chaud est activé :**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **Déclencher un rechargement manuel :**

```bash
prx-waf rules reload
```

3. **Envoyer un SIGHUP :**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **Vérifier les limites de surveillance du système de fichiers** (Linux) :

```bash
cat /proc/sys/fs/inotify/max_user_watches
# Si trop bas, augmenter:
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Faux positifs

**Symptômes :** Des requêtes légitimes sont bloquées (403 Forbidden).

**Solutions :**

1. **Identifier la règle bloquante** depuis les événements de sécurité :

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

Recherchez le champ `rule_id` dans l'événement.

2. **Désactiver la règle spécifique :**

```bash
prx-waf rules disable CRS-942100
```

3. **Réduire le niveau de paranoïa.** Si vous êtes au niveau de paranoïa 2+, essayez de réduire à 1 :

```toml
# Dans votre configuration de règles, ne charger que les règles de niveau de paranoïa 1
```

4. **Passer la règle en mode journalisation** pour surveiller au lieu de bloquer :

Modifiez le fichier de règles et changez `action: "block"` en `action: "log"`, puis rechargez :

```bash
prx-waf rules reload
```

5. **Ajouter une liste blanche IP** pour les sources de confiance :

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
Lors du déploiement de nouvelles règles, commencez avec `action: log` pour surveiller les faux positifs avant de passer à `action: block`.
:::

## Problèmes de certificats SSL

**Symptômes :** Les connexions HTTPS échouent, erreurs de certificat ou échec du renouvellement Let's Encrypt.

**Solutions :**

1. **Vérifier l'état du certificat** dans l'interface d'administration sous **Certificats SSL**.

2. **Vérifier que le port 80 est accessible** depuis Internet pour les défis ACME HTTP-01.

3. **Vérifier les chemins de certificats** si vous utilisez des certificats manuels :

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **Vérifier que le certificat correspond au domaine :**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## Nœuds de cluster non connectés

**Symptômes :** Les nœuds worker ne peuvent pas rejoindre le cluster. Le statut montre des pairs "disconnected".

**Solutions :**

1. **Vérifier la connectivité réseau** sur le port du cluster (défaut : UDP 16851) :

```bash
# Du worker vers le principal
nc -zuv node-a 16851
```

2. **Vérifier les règles du pare-feu** -- la communication du cluster utilise UDP :

```bash
sudo ufw allow 16851/udp
```

3. **Vérifier les certificats** -- tous les nœuds doivent utiliser des certificats signés par la même CA :

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. **Vérifier la configuration des seeds** sur les nœuds worker :

```toml
[cluster]
seeds = ["node-a:16851"]   # Doit résoudre vers le nœud principal
```

5. **Examiner les journaux** avec verbosité de débogage :

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## Utilisation mémoire élevée

**Symptômes :** Le processus PRX-WAF consomme plus de mémoire que prévu.

**Solutions :**

1. **Réduire la taille du cache de réponses :**

```toml
[cache]
max_size_mb = 128    # Réduire depuis la valeur par défaut 256
```

2. **Réduire le pool de connexions à la base de données :**

```toml
[storage]
max_connections = 10   # Réduire depuis la valeur par défaut 20
```

3. **Réduire les threads worker :**

```toml
[proxy]
worker_threads = 2    # Réduire depuis le nombre de CPU
```

4. **Surveiller l'utilisation mémoire :**

```bash
ps aux | grep prx-waf
```

## Problèmes de connexion CrowdSec

**Symptômes :** L'intégration CrowdSec affiche "disconnected" ou les décisions ne chargent pas.

**Solutions :**

1. **Tester la connectivité LAPI :**

```bash
prx-waf crowdsec test
```

2. **Vérifier la clé API :**

```bash
# Sur la machine CrowdSec
cscli bouncers list
```

3. **Vérifier l'URL LAPI :**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. **Définir une action de fallback sûre** pour quand le LAPI est inaccessible :

```toml
[crowdsec]
fallback_action = "log"    # Ne pas bloquer quand le LAPI est indisponible
```

## Optimisation des performances

### Temps de réponse lents

1. **Activer le cache de réponses :**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **Augmenter les threads worker :**

```toml
[proxy]
worker_threads = 8
```

3. **Augmenter les connexions à la base de données :**

```toml
[storage]
max_connections = 50
```

### Utilisation CPU élevée

1. **Réduire le nombre de règles actives.** Désactivez les règles de niveau de paranoïa 3-4 si elles ne sont pas nécessaires.

2. **Désactiver les phases de détection inutilisées.** Par exemple, si vous n'utilisez pas CrowdSec :

```toml
[crowdsec]
enabled = false
```

## Obtenir de l'aide

Si aucune des solutions ci-dessus ne résout votre problème :

1. **Vérifier les problèmes existants :** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. **Soumettre un nouveau problème** avec :
   - Version de PRX-WAF
   - Système d'exploitation et version du noyau
   - Fichier de configuration (avec les mots de passe supprimés)
   - Sortie de journaux pertinente
   - Étapes pour reproduire

## Étapes suivantes

- [Référence de configuration](../configuration/reference) -- Affiner tous les paramètres
- [Moteur de règles](../rules/) -- Comprendre comment les règles sont évaluées
- [Mode cluster](../cluster/) -- Dépannage spécifique au cluster
