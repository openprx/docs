---
title: Présentation du renseignement sur les menaces
description: Architecture de la base de données de signatures PRX-SD incluant les signatures de hachage, les règles YARA, les flux IOC et l'intégration ClamAV.
---

# Présentation du renseignement sur les menaces

PRX-SD agrège le renseignement sur les menaces provenant de multiples sources open-source et communautaires dans une base de données locale unifiée. Cette approche multicouche garantit une couverture étendue -- des hachages de logiciels malveillants connus aux règles de motifs comportementaux en passant par les indicateurs de compromission réseau.

## Catégories de signatures

PRX-SD organise le renseignement sur les menaces en quatre catégories :

| Catégorie | Sources | Nombre | Vitesse de lookup | Stockage |
|-----------|---------|--------|-------------------|---------|
| **Signatures de hachage** | 7 sources | Des millions de SHA-256/MD5 | O(1) via LMDB | ~500 Mo |
| **Règles YARA** | 8 sources | 38 800+ règles | Correspondance de motifs | ~15 Mo |
| **Flux IOC** | 5 sources | 585 000+ indicateurs | Trie / table de hachage | ~25 Mo |
| **Base de données ClamAV** | 1 source | 11 000 000+ signatures | Moteur ClamAV | ~300 Mo |

### Signatures de hachage

La couche de détection la plus rapide. Chaque fichier est haché lors de l'analyse et vérifié par rapport à une base de données LMDB locale contenant des hachages de fichiers connus comme malveillants :

- **abuse.ch MalwareBazaar** -- Hachages SHA-256 d'échantillons de logiciels malveillants récents (fenêtre glissante de 48h)
- **abuse.ch URLhaus** -- Hachages SHA-256 de fichiers distribués via des URL malveillantes
- **abuse.ch Feodo Tracker** -- Hachages SHA-256 de chevaux de Troie bancaires (Emotet, Dridex, TrickBot)
- **abuse.ch ThreatFox** -- IOC SHA-256 de soumissions communautaires
- **abuse.ch SSL Blacklist** -- Empreintes SHA-1 de certificats SSL malveillants
- **VirusShare** -- 20 000 000+ hachages MD5 (disponible avec la mise à jour `--full`)
- **Liste de blocage intégrée** -- hachages codés en dur pour le fichier de test EICAR, WannaCry, NotPetya, Emotet

### Règles YARA

Règles de correspondance de motifs qui identifient les logiciels malveillants par des motifs de code, des chaînes et une structure plutôt que des hachages exacts. Cela détecte les variantes et familles de logiciels malveillants :

- **Règles intégrées** -- 64 règles organisées pour les ransomwares, chevaux de Troie, backdoors, rootkits, mineurs, webshells
- **Yara-Rules/rules** -- règles maintenus par la communauté pour Emotet, TrickBot, CobaltStrike, Mirai, LockBit
- **Neo23x0/signature-base** -- règles de haute qualité pour APT29, Lazarus, minage de crypto, webshells
- **ReversingLabs YARA** -- règles open-source de qualité commerciale pour chevaux de Troie, ransomwares, backdoors
- **ESET IOC** -- règles de suivi APT pour Turla, Interception et autres menaces avancées
- **InQuest** -- règles spécialisées pour les documents malveillants (exploits OLE, injections DDE)
- **Elastic Security** -- règles de détection de l'équipe de recherche sur les menaces d'Elastic
- **Google GCTI** -- règles YARA de Google Cloud Threat Intelligence

### Flux IOC

Indicateurs de compromission réseau pour détecter les connexions à des infrastructures connues comme malveillantes :

- **IPsum** -- liste de réputation IP malveillante agrégée (scoring multi-sources)
- **FireHOL** -- listes de blocage IP organisées à plusieurs niveaux de menace
- **Emerging Threats** -- règles Suricata/Snort converties en IOC IP/domaine
- **SANS ISC** -- flux d'IP suspects quotidiens du Centre de tempêtes Internet
- **URLhaus** -- URL malveillantes actives pour la distribution de logiciels malveillants

### Base de données ClamAV

Intégration optionnelle avec la base de données de virus ClamAV, qui fournit le plus grand ensemble de signatures open-source :

- **main.cvd** -- signatures de virus principales
- **daily.cvd** -- signatures mises à jour quotidiennement
- **bytecode.cvd** -- signatures de détection par bytecode

## Structure du répertoire de données

Toutes les données de signatures sont stockées dans `~/.prx-sd/signatures/` :

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOCs
    virusshare.lmdb           # VirusShare MD5 (--full uniquement)
    custom.lmdb               # Hachages importés par l'utilisateur
  yara/
    builtin/                  # Règles intégrées (livrées avec le binaire)
    community/                # Règles communautaires téléchargées
    custom/                   # Règles personnalisées écrites par l'utilisateur
    compiled.yarc             # Cache de règles pré-compilées
  ioc/
    ipsum.dat                 # Réputation IP IPsum
    firehol.dat               # Listes de blocage FireHOL
    et_compromised.dat        # IPs Emerging Threats
    sans_isc.dat              # IPs suspectes SANS ISC
    urlhaus_urls.dat          # URLs malveillantes URLhaus
  clamav/
    main.cvd                  # Signatures principales ClamAV
    daily.cvd                 # Mises à jour quotidiennes ClamAV
    bytecode.cvd              # Signatures bytecode ClamAV
  metadata.json               # Horodatages de mise à jour et informations de version
```

::: tip
Utilisez `sd info` pour voir l'état actuel de toutes les bases de données de signatures, y compris les comptages par source, les heures de dernière mise à jour et l'utilisation du disque.
:::

## Interroger l'état des signatures

```bash
sd info
```

```
PRX-SD Signature Database
  Hash signatures:    1,247,832 entries (7 sources)
  YARA rules:         38,847 rules (8 sources, 64 built-in)
  IOC indicators:     585,221 entries (5 sources)
  ClamAV signatures:  not installed
  Last updated:       2026-03-21 08:00:12 UTC
  Database version:   2026.0321.1
  Disk usage:         542 MB
```

## Étapes suivantes

- [Mettre à jour les signatures](./update) -- maintenir vos bases de données à jour
- [Sources de signatures](./sources) -- informations détaillées sur chaque source
- [Importer des hachages](./import) -- ajouter vos propres listes de blocage de hachages
- [Règles YARA personnalisées](./custom-rules) -- écrire et déployer des règles personnalisées
