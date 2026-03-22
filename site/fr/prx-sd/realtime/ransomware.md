---
title: Protection contre les ransomwares
description: Détection comportementale des ransomwares utilisant l'analyse d'entropie, la surveillance des extensions et la détection de chiffrement par lots.
---

# Protection contre les ransomwares

PRX-SD inclut un moteur `RansomwareDetector` dédié qui identifie le comportement des ransomwares en temps réel. Contrairement à la détection basée sur les signatures qui nécessite des échantillons connus, le détecteur de ransomwares utilise des heuristiques comportementales pour détecter les ransomwares zero-day avant qu'ils aient terminé de chiffrer vos fichiers.

## Fonctionnement

Le détecteur de ransomwares s'exécute dans le cadre du moniteur en temps réel et analyse les événements du système de fichiers à la recherche de motifs indiquant un chiffrement actif. Il fonctionne sur trois axes de détection :

### 1. Détection de chiffrement par lots

Le détecteur suit les taux de modification des fichiers par processus et par répertoire. Lorsqu'un seul processus modifie un nombre anormalement élevé de fichiers dans une courte fenêtre temporelle, il déclenche une alerte.

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `batch_threshold` | `20` | Nombre de modifications de fichiers pour déclencher la détection |
| `batch_window_secs` | `10` | Fenêtre temporelle en secondes pour le comptage par lots |
| `min_files_affected` | `5` | Nombre minimum de fichiers distincts avant une alerte |

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
```

### 2. Surveillance des changements d'extension

Les ransomwares renomment généralement les fichiers avec une nouvelle extension après le chiffrement. Le détecteur surveille les changements d'extensions en masse, particulièrement vers les extensions de ransomwares connues :

```
.encrypted, .enc, .locked, .crypto, .crypt, .crypted,
.ransomware, .ransom, .rans, .pay, .pay2key,
.locky, .zepto, .cerber, .cerber3, .dharma, .wallet,
.onion, .wncry, .wcry, .wannacry, .petya, .notpetya,
.ryuk, .conti, .lockbit, .revil, .sodinokibi,
.maze, .egregor, .darkside, .blackmatter, .hive,
.deadbolt, .akira, .alphv, .blackcat, .royal,
.rhysida, .medusa, .bianlian, .clop, .8base
```

::: warning
La surveillance des extensions seule n'est pas suffisante -- les ransomwares sophistiqués peuvent utiliser des extensions aléatoires ou d'apparence légitime. PRX-SD combine les changements d'extensions avec l'analyse d'entropie pour une détection fiable.
:::

### 3. Détection d'entropie élevée

Les fichiers chiffrés ont une entropie de Shannon quasi maximale (proche de 8,0 pour l'analyse au niveau des octets). Le détecteur compare l'entropie des fichiers avant et après modification :

| Métrique | Seuil | Signification |
|---------|-------|---------------|
| Entropie du fichier | > 7,8 | Le contenu du fichier est probablement chiffré ou compressé |
| Delta d'entropie | > 3,0 | Le fichier est passé d'une faible à une haute entropie (chiffrement) |
| Entropie de l'en-tête | > 7,5 | Les 4 premiers Ko sont à haute entropie (octets magiques originaux détruits) |

Lorsque l'entropie d'un fichier saute significativement après modification, et que le fichier était précédemment un type de document connu (PDF, DOCX, image), c'est un indicateur fort de chiffrement.

## Score de détection

Chaque axe de détection contribue à un score composite de ransomware :

| Signal | Poids | Description |
|--------|-------|-------------|
| Modification de fichiers par lots | 40 | Nombreux fichiers modifiés rapidement par un processus |
| Changement d'extension vers une extension de ransomware connue | 30 | Fichier renommé avec une extension de ransomware |
| Changement d'extension vers une extension inconnue | 15 | Fichier renommé avec une nouvelle extension inhabituelle |
| Delta d'entropie élevé | 25 | L'entropie du fichier a considérablement augmenté |
| Entropie absolue élevée | 10 | Le fichier a une entropie quasi maximale |
| Création d'une note de rançon | 35 | Fichiers correspondant aux motifs de notes de rançon détectés |
| Suppression de copies fantômes | 50 | Tentative de suppression des copies de volume fantôme |

Un score composite supérieur à **60** déclenche un verdict `MALICIOUS`. Les scores entre **30-59** produisent une alerte `SUSPICIOUS`.

## Détection de notes de rançon

Le détecteur surveille la création de fichiers correspondant aux motifs courants de notes de rançon :

```
README_RESTORE_FILES.txt, HOW_TO_DECRYPT.txt,
DECRYPT_INSTRUCTIONS.html, YOUR_FILES_ARE_ENCRYPTED.txt,
RECOVER_YOUR_FILES.txt, !README!.txt, _readme.txt,
HELP_DECRYPT.html, RANSOM_NOTE.txt, #DECRYPT#.txt
```

::: tip
La détection de notes de rançon est basée sur des motifs et ne nécessite pas que le fichier de note lui-même soit malveillant. La simple création d'un fichier correspondant à ces motifs, combinée à d'autres signaux, contribue au score de ransomware.
:::

## Réponse automatique

Lorsqu'un ransomware est détecté, la réponse dépend de la politique configurée :

| Action | Description |
|--------|-------------|
| **Alert** | Journaliser l'événement et envoyer des notifications (webhook, e-mail) |
| **Block** | Refuser l'opération sur le fichier (mode blocage fanotify Linux uniquement) |
| **Kill** | Terminer le processus incriminé |
| **Quarantine** | Déplacer les fichiers affectés vers le coffre-fort de quarantaine chiffré |
| **Isolate** | Bloquer tout accès réseau pour la machine (urgence) |

Configurez la réponse dans `config.toml` :

```toml
[ransomware.response]
on_detection = "kill"           # alert | block | kill | quarantine | isolate
quarantine_affected = true      # mettre en quarantaine les fichiers modifiés comme preuves
notify_webhook = true           # envoyer une notification webhook
notify_email = true             # envoyer une alerte e-mail
snapshot_process_tree = true    # capturer l'arborescence des processus pour la forensique
```

## Configuration

Configuration complète du détecteur de ransomwares :

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
entropy_threshold = 7.8
entropy_delta_threshold = 3.0
score_threshold_malicious = 60
score_threshold_suspicious = 30

# Répertoires à protéger avec une sensibilité accrue
protected_dirs = [
    "~/Documents",
    "~/Pictures",
    "~/Desktop",
    "/var/www",
]

# Processus exemptés de la surveillance (par exemple, logiciels de sauvegarde)
exempt_processes = [
    "borgbackup",
    "restic",
    "rsync",
]

[ransomware.response]
on_detection = "kill"
quarantine_affected = true
notify_webhook = true
notify_email = false
```

## Exemples

```bash
# Démarrer la surveillance avec protection contre les ransomwares
sd monitor --auto-quarantine /home

# Le détecteur de ransomwares est activé par défaut en mode démon
sd daemon start

# Vérifier l'état du détecteur de ransomwares
sd status --verbose
```

## Étapes suivantes

- [Surveillance de fichiers](./monitor) -- configurer la surveillance en temps réel
- [Démon](./daemon) -- exécuter comme service en arrière-plan
- [Réponse aux menaces](/fr/prx-sd/remediation/) -- configuration complète de la politique de remédiation
- [Alertes webhook](/fr/prx-sd/alerts/webhook) -- recevoir des notifications instantanées
