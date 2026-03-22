---
title: Correspondance de hachages
description: "Comment PRX-SD utilise LMDB pour des lookups de hachages en O(1) sur des bases de données SHA-256 et MD5 provenant de abuse.ch, VirusShare et des listes de blocage intégrées."
---

# Correspondance de hachages

La correspondance de hachages est la première et la plus rapide des couches du pipeline de détection PRX-SD. Pour chaque fichier analysé, PRX-SD calcule un hachage cryptographique et le recherche dans une base de données locale de hachages connus comme malveillants. Une correspondance signifie que le fichier est une copie exacte, octet par octet, d'un échantillon de logiciel malveillant connu.

## Fonctionnement

1. **Calcul du hachage** -- PRX-SD calcule le hachage SHA-256 du fichier. Pour les lookups VirusShare, le hachage MD5 est également calculé.
2. **Lookup LMDB** -- Le hachage est vérifié dans la base de données LMDB en utilisant un arbre B+ mappé en mémoire. Cela fournit un temps de lookup en O(1) en moyenne.
3. **Récupération des métadonnées** -- Si une correspondance est trouvée, les métadonnées associées (source, famille de logiciels malveillants, date de première détection) sont retournées.
4. **Verdict** -- Une correspondance de hachage produit immédiatement un verdict `MALICIOUS` et les couches de détection restantes sont ignorées.

### Performance

| Opération | Temps |
|-----------|-------|
| Calcul SHA-256 (fichier de 1 Ko) | ~2 microsecondes |
| Calcul SHA-256 (fichier de 10 Mo) | ~15 millisecondes |
| Lookup LMDB | ~0,5 microseconde |
| Total par fichier (petit fichier, correspondance de hachage) | ~3 microsecondes |

LMDB utilise des fichiers mappés en mémoire, donc le cache de pages du système d'exploitation maintient les portions fréquemment accédées de la base de données en RAM. Sur un système avec suffisamment de mémoire, les lookups sont essentiellement gratuits.

## Types de hachages supportés

| Type de hachage | Taille | Utilisation |
|-----------------|--------|-------------|
| **SHA-256** | 256 bits (64 caractères hex) | Hachage principal pour tous les lookups. Utilisé par les flux abuse.ch et la liste de blocage intégrée. |
| **MD5** | 128 bits (32 caractères hex) | Utilisé pour la compatibilité avec la base de données VirusShare. Calculé uniquement lorsque des données VirusShare sont présentes. |

::: warning Limitations de MD5
MD5 est cryptographiquement cassé et susceptible aux attaques par collision. PRX-SD utilise MD5 uniquement pour la rétrocompatibilité avec la base de données VirusShare. SHA-256 est le hachage principal pour toutes les autres sources.
:::

## Sources de données

PRX-SD agrège les signatures de hachage provenant de plusieurs flux de renseignements sur les menaces :

| Source | Type de hachage | Gratuit | Contenu | Fréquence de mise à jour |
|--------|-----------------|---------|---------|--------------------------|
| abuse.ch MalwareBazaar | SHA-256 | Oui | Échantillons de logiciels malveillants récents des 48 dernières heures | Toutes les 5 minutes |
| abuse.ch URLhaus | SHA-256 | Oui | Fichiers de logiciels malveillants provenant d'URL malveillantes | Horaire |
| abuse.ch Feodo Tracker | SHA-256 | Oui | Chevaux de Troie bancaires (Emotet, Dridex, TrickBot) | Toutes les 5 minutes |
| abuse.ch ThreatFox | SHA-256 | Oui | Plateforme de partage d'IOC communautaire | Horaire |
| VirusShare | MD5 | Oui | 20M+ hachages de logiciels malveillants (historique) | Périodique |
| Liste de blocage intégrée | SHA-256 | Intégré | EICAR, WannaCry, NotPetya, Emotet, etc. | Avec les versions |

### Couverture totale de hachages

| Mode de mise à jour | Hachages | Taille de la base de données |
|---------------------|----------|------------------------------|
| Standard (`sd update`) | ~28 000 SHA-256 | ~5 Mo |
| Complet (`sd update --full`) | ~28 000 SHA-256 + 20M+ MD5 | ~800 Mo |

## Mettre à jour la base de données de hachages

### Mise à jour standard

Récupère les derniers hachages SHA-256 de tous les flux abuse.ch :

```bash
sd update
```

Cela s'exécute automatiquement lors de la première installation de PRX-SD et peut être planifié avec cron ou `sd service` pour des mises à jour continues.

### Mise à jour complète

Inclut la base de données MD5 complète de VirusShare :

```bash
sd update --full
```

::: tip Quand utiliser le mode complet
La base de données VirusShare contient 20M+ hachages MD5 historiques remontant à plusieurs années. Elle est utile pour les investigations forensiques et les analyses complètes, mais ajoute ~800 Mo à la base de données. Pour la protection quotidienne, la mise à jour standard est suffisante.
:::

### Import manuel de hachages

Importez des listes de hachages personnalisées depuis des fichiers texte (un hachage par ligne) :

```bash
sd import my_hashes.txt
```

La commande d'import détecte automatiquement le type de hachage (SHA-256 ou MD5) en fonction de la longueur de la chaîne. Vous pouvez également spécifier des métadonnées :

```bash
sd import my_hashes.txt --source "internal-ir" --family "custom-trojan"
```

## Base de données LMDB

PRX-SD stocke les hachages dans [LMDB](http://www.lmdb.tech/doc/) (Lightning Memory-Mapped Database), choisi pour ses propriétés :

| Propriété | Avantage |
|-----------|---------|
| E/S mappées en mémoire | Lectures sans copie, pas de surcharge de sérialisation |
| Structure d'arbre B+ | Lookups amortis en O(1) |
| Transactions ACID | Lectures concurrentes sûres lors des mises à jour |
| Résistance aux pannes | La copie sur écriture prévient la corruption |
| Taille compacte | Stockage efficace des clés de hachage |

La base de données est stockée dans `~/.local/share/prx-sd/signatures.lmdb` par défaut. Le chemin peut être personnalisé :

```toml
# ~/.config/prx-sd/config.toml
[database]
path = "/opt/prx-sd/signatures.lmdb"
```

## Vérifier l'état de la base de données

Afficher les statistiques actuelles de la base de données de hachages :

```bash
sd info
```

```
PRX-SD Signature Database
=========================
SHA-256 hashes:  28,428
MD5 hashes:      0 (run 'sd update --full' for VirusShare)
YARA rules:      38,800
Database path:   /home/user/.local/share/prx-sd/signatures.lmdb
Database size:   4.8 MB
Last updated:    2026-03-21 10:00:00 UTC
```

## Comment la correspondance de hachages s'intègre dans le pipeline

La correspondance de hachages est conçue comme la première ligne de défense car :

- **Vitesse** -- À ~3 microsecondes par fichier, elle ajoute une surcharge négligeable. Un million de fichiers sains peuvent être vérifiés en moins de 3 secondes.
- **Zéro faux positif** -- Une correspondance SHA-256 est une garantie cryptographique que le fichier est identique à un échantillon de logiciel malveillant connu.
- **Court-circuit** -- Lorsqu'une correspondance de hachage est trouvée, l'analyse YARA et heuristique est entièrement ignorée, économisant un temps de traitement significatif.

La limitation de la correspondance de hachages est qu'elle ne détecte que les **copies exactes** d'échantillons connus. Une modification d'un seul octet produit un hachage différent et échappe à cette couche. C'est pourquoi les couches YARA et heuristique existent comme défenses supplémentaires.

## Étapes suivantes

- [Règles YARA](./yara-rules) -- Détection basée sur des motifs pour les variantes et les familles
- [Analyse heuristique](./heuristics) -- Détection comportementale pour les menaces inconnues
- [Présentation du moteur de détection](./index) -- Comment toutes les couches fonctionnent ensemble
- [Analyse de fichiers et répertoires](../scanning/file-scan) -- Utilisation de la correspondance de hachages en pratique
