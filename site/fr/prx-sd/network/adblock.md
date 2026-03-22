---
title: Blocage des publicités et domaines malveillants
description: "Bloquer les publicités, les traceurs et les domaines malveillants au niveau DNS en utilisant la commande sd adblock. Prend en charge plusieurs listes de filtres, des règles personnalisées et une journalisation persistante."
---

# Blocage des publicités et domaines malveillants

PRX-SD inclut un moteur adblock intégré qui bloque les publicités, les traceurs et les domaines malveillants connus au niveau DNS en écrivant des entrées dans le fichier hosts système (`/etc/hosts` sur Linux/macOS, `C:\Windows\System32\drivers\etc\hosts` sur Windows). Les listes de filtres sont stockées localement dans `~/.prx-sd/adblock/` et prennent en charge la syntaxe Adblock Plus (ABP) et le format fichier hosts.

## Fonctionnement

Lorsque vous activez adblock, PRX-SD :

1. Télécharge les listes de filtres configurées (EasyList, abuse.ch URLhaus, etc.)
2. Analyse les règles ABP (`||domain.com^`) et les entrées hosts (`0.0.0.0 domain.com`)
3. Écrit tous les domaines bloqués dans le fichier hosts système, en les pointant vers `0.0.0.0`
4. Journalise chaque recherche de domaine bloquée dans `~/.prx-sd/adblock/blocked_log.jsonl`

::: tip
Pour un filtrage complet au niveau DNS avec transfert en amont, combinez adblock avec le [proxy DNS](./dns-proxy). Le proxy intègre les règles adblock, les flux de domaines IOC et les listes de blocage personnalisées dans un seul résolveur.
:::

## Commandes

### Activer la protection

Téléchargez les listes de filtres et installez le blocage DNS via le fichier hosts. Nécessite des privilèges root/administrateur.

```bash
sudo sd adblock enable
```

Sortie :

```
>>> Enabling adblock protection...
  Loaded 4 lists (128432 rules)
success: Adblock enabled: 95211 domains blocked via /etc/hosts
  Lists: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  Log: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### Désactiver la protection

Supprimez toutes les entrées PRX-SD du fichier hosts. Les identifiants et les listes mises en cache sont préservés.

```bash
sudo sd adblock disable
```

### Synchroniser les listes de filtres

Forcez le re-téléchargement de toutes les listes de filtres configurées. Si adblock est actuellement activé, le fichier hosts est automatiquement mis à jour avec les nouvelles règles.

```bash
sudo sd adblock sync
```

### Afficher les statistiques

Affichez l'état actuel, les listes chargées, le nombre de règles et la taille du journal de blocage.

```bash
sd adblock stats
```

Sortie :

```
Adblock Engine Statistics
  Status:        ENABLED
  Lists loaded:  4
  Total rules:   128432
  Cache dir:     /home/user/.prx-sd/adblock
  Last sync:     2026-03-20T14:30:00Z
  Blocked log:   1842 entries

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### Vérifier une URL ou un domaine

Testez si une URL ou un domaine spécifique est bloqué par les listes de filtres actuelles.

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

Si le domaine n'est pas entièrement qualifié avec un schéma, PRX-SD ajoute automatiquement `https://`.

Sortie :

```
BLOCKED ads.example.com -> Ads
```

ou :

```
ALLOWED docs.example.com
```

### Afficher le journal de blocage

Affichez les entrées bloquées récentes depuis le journal JSONL persistant. L'indicateur `--count` contrôle le nombre d'entrées à afficher (défaut : 50).

```bash
sd adblock log
sd adblock log --count 100
```

Chaque entrée du journal contient un horodatage, le domaine, l'URL, la catégorie et la source.

### Ajouter une liste de filtres personnalisée

Ajoutez une liste de filtres tierce ou personnalisée par nom et URL. L'indicateur `--category` classe la liste (défaut : `unknown`).

Catégories disponibles : `ads`, `tracking`, `malware`, `social`.

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### Supprimer une liste de filtres

Supprimez une liste de filtres précédemment ajoutée par nom.

```bash
sd adblock remove my-blocklist
```

## Listes de filtres par défaut

PRX-SD est livré avec les sources de filtres intégrées suivantes :

| Liste | Catégorie | Description |
|------|----------|-------------|
| EasyList | Publicités | Liste de filtres publicitaires maintenue par la communauté |
| EasyPrivacy | Suivi | Protection contre les traceurs et les empreintes digitales |
| URLhaus Domains | Logiciels malveillants | Domaines d'URL malveillantes d'abuse.ch |
| Malware Domains | Logiciels malveillants | Domaines de distribution de logiciels malveillants connus |

## Format de liste de filtres

Les listes personnalisées peuvent utiliser la syntaxe Adblock Plus (ABP) ou le format fichier hosts :

**Format ABP :**

```
||ads.example.com^
||tracker.analytics.io^
```

**Format hosts :**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

Les lignes commençant par `!`, `#` ou `[` sont traitées comme des commentaires et ignorées.

## Structure du répertoire de données

```
~/.prx-sd/adblock/
  enabled           # Fichier indicateur (présent quand adblock est actif)
  config.json       # Configuration de la liste source
  blocked_log.jsonl # Journal de blocage persistant
  lists/            # Fichiers de listes de filtres mis en cache
```

::: warning
L'activation et la désactivation d'adblock modifient votre fichier hosts système. Utilisez toujours `sd adblock disable` pour supprimer proprement les entrées plutôt que de modifier le fichier hosts manuellement. La commande nécessite des privilèges root/administrateur.
:::

## Exemples

**Flux de travail d'installation complet :**

```bash
# Activer avec les listes par défaut
sudo sd adblock enable

# Ajouter une liste de blocage de logiciels malveillants personnalisée
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# Re-synchroniser pour télécharger la nouvelle liste
sudo sd adblock sync

# Vérifier qu'un domaine malveillant connu est bloqué
sd adblock check malware-c2.example.com

# Vérifier les statistiques
sd adblock stats

# Afficher les blocages récents
sd adblock log --count 20
```

**Désactiver et nettoyer :**

```bash
sudo sd adblock disable
```

## Étapes suivantes

- Configurez le [Proxy DNS](./dns-proxy) pour un filtrage DNS complet avec transfert en amont
- Configurez les [Alertes webhook](../alerts/) pour être notifié lorsque des domaines sont bloqués
- Explorez la [Référence CLI](../cli/) pour la liste complète des commandes
