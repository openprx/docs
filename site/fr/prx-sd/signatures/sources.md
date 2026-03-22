---
title: Sources de signatures
description: Informations détaillées sur chaque source de renseignements sur les menaces intégrée dans PRX-SD, incluant la fréquence de mise à jour et la couverture.
---

# Sources de signatures

PRX-SD agrège le renseignement sur les menaces provenant de plus de 20 sources open-source et communautaires. Cette page fournit des informations détaillées sur chaque source, sa couverture, sa fréquence de mise à jour et son type de données.

## Sources abuse.ch

Le projet abuse.ch fournit plusieurs flux de menaces de haute qualité et librement disponibles :

| Source | Type de données | Contenu | Fréquence de mise à jour | Licence |
|--------|-----------------|---------|--------------------------|---------|
| **MalwareBazaar** | SHA-256 | Échantillons de logiciels malveillants soumis par des chercheurs du monde entier. Fenêtre glissante de 48 heures des dernières soumissions. | Toutes les 5 minutes | CC0 |
| **URLhaus** | SHA-256 | Hachages de fichiers associés aux URL distribuant des logiciels malveillants. Couvre les téléchargements par drive-by, les charges utiles de phishing et les dépôts de kits d'exploitation. | Horaire | CC0 |
| **Feodo Tracker** | SHA-256 | Chevaux de Troie bancaires et chargeurs : Emotet, Dridex, TrickBot, QakBot, BazarLoader, IcedID. | Toutes les 5 minutes | CC0 |
| **ThreatFox** | SHA-256 | IOC soumis par la communauté couvrant plusieurs familles de logiciels malveillants. Inclut les hachages de fichiers, les domaines et les IPs. | Horaire | CC0 |
| **SSL Blacklist** | SHA-1 (cert) | Empreintes SHA-1 de certificats SSL utilisés par les serveurs C2 de botnets. Utilisé pour la correspondance d'IOC réseau. | Quotidien | CC0 |

::: tip
Tous les flux abuse.ch sont disponibles sans inscription ni clés API. PRX-SD les télécharge directement depuis les points de terminaison API publics.
:::

## VirusShare

| Champ | Détails |
|-------|---------|
| **Type de données** | Hachages MD5 |
| **Nombre** | 20 000 000+ |
| **Contenu** | L'un des plus grands référentiels publics de hachages de logiciels malveillants. Contient des hachages MD5 organisés en fichiers de liste numérotés (VirusShare_00000.md5 à VirusShare_00500+.md5). |
| **Fréquence de mise à jour** | Nouveaux fichiers de liste ajoutés périodiquement |
| **Accès** | Gratuit (nécessite l'indicateur `--full` en raison de la taille du téléchargement) |
| **Licence** | Gratuit pour usage non commercial |

::: warning
Le téléchargement complet de VirusShare est d'environ 500 Mo et prend un temps significatif à importer. Utilisez `sd update --full` pour l'inclure, ou `sd update` pour les mises à jour standard sans VirusShare.
:::

## Sources de règles YARA

| Source | Nombre de règles | Domaine d'intérêt | Qualité |
|--------|-----------------|-------------------|----|
| **Règles intégrées** | 64 | Ransomwares, chevaux de Troie, backdoors, rootkits, mineurs, webshells pour Linux, macOS, Windows | Organisées par l'équipe PRX-SD |
| **Yara-Rules/rules** | Communauté | Emotet, TrickBot, CobaltStrike, Mirai, LockBit, APTs | Maintenu par la communauté |
| **Neo23x0/signature-base** | Volume élevé | APT29, Lazarus Group, minage de crypto, webshells, familles de ransomwares | Haute qualité, Florian Roth |
| **ReversingLabs YARA** | Qualité commerciale | Chevaux de Troie, ransomwares, backdoors, outils de piratage, exploits | Professionnel, open-source |
| **Elastic Security** | Croissant | Règles de détection des points de terminaison couvrant les menaces Windows, Linux, macOS | Équipe de recherche Elastic sur les menaces |
| **Google GCTI** | Sélectif | Règles à haute confiance de Google Cloud Threat Intelligence | Très haute qualité |
| **ESET IOC** | Sélectif | Suivi APT : Turla, Interception, InvisiMole et autres menaces avancées | Centré sur les APTs |
| **InQuest** | Spécialisé | Documents malveillants : exploits OLE, injection DDE, logiciels malveillants à base de macros | Spécifique aux documents |

### Catégories de règles YARA

L'ensemble de règles combiné couvre ces catégories de logiciels malveillants :

| Catégorie | Familles exemples | Couverture de plateforme |
|-----------|------------------|--------------------------|
| Ransomwares | WannaCry, LockBit, Conti, REvil, Akira, BlackCat | Windows, Linux |
| Chevaux de Troie | Emotet, TrickBot, QakBot, Agent Tesla, RedLine | Windows |
| Backdoors | CobaltStrike, Metasploit, ShadowPad, PlugX | Multiplateforme |
| Rootkits | Reptile, Diamorphine, Horse Pill | Linux |
| Mineurs | XMRig, variantes CCMiner | Multiplateforme |
| Webshells | China Chopper, WSO, b374k, c99, r57 | Multiplateforme |
| APTs | APT29, Lazarus, Turla, Sandworm, OceanLotus | Multiplateforme |
| Exploits | EternalBlue, PrintNightmare, charges utiles Log4Shell | Multiplateforme |
| Outils de piratage | Mimikatz, Rubeus, BloodHound, Impacket | Windows |
| Documents | Macros Office malveillantes, exploits PDF, exploits RTF | Multiplateforme |

## Sources de flux IOC

| Source | Type d'indicateur | Nombre | Contenu | Fréquence de mise à jour |
|--------|------------------|--------|---------|--------------------------|
| **IPsum** | Adresses IP | 150 000+ | Réputation IP malveillante agrégée de 50+ listes de blocage. Scoring multi-niveaux (niveau 1-8 basé sur le nombre de listes citant l'IP). | Quotidien |
| **FireHOL** | Adresses IP | 200 000+ | Listes de blocage IP organisées par niveau de menace (niveau 1 à 4). Les niveaux plus élevés ont des critères d'inclusion plus stricts. | Toutes les 6 heures |
| **Emerging Threats** | Adresses IP | 100 000+ | IPs extraites des règles IDS Suricata et Snort. Couvre les C2 de botnets, l'analyse, la force brute, les tentatives d'exploitation. | Quotidien |
| **SANS ISC** | Adresses IP | 50 000+ | IPs suspectes du réseau de capteurs DShield du Centre de tempêtes Internet. | Quotidien |
| **URLhaus (URLs)** | URLs | 85 000+ | URLs malveillantes actives utilisées pour la distribution de logiciels malveillants, le phishing et la livraison d'exploits. | Horaire |

## Base de données ClamAV

| Champ | Détails |
|-------|---------|
| **Type de données** | Signatures multi-formats (hachage, bytecode, regex, logique) |
| **Nombre** | 11 000 000+ signatures |
| **Fichiers** | `main.cvd` (principal), `daily.cvd` (mises à jour quotidiennes), `bytecode.cvd` (règles bytecode) |
| **Contenu** | La plus grande base de données de signatures de virus open-source. Couvre les virus, chevaux de Troie, vers, phishing, PUAs. |
| **Fréquence de mise à jour** | Plusieurs fois par jour |
| **Accès** | Gratuit via freshclam ou téléchargement direct |

Pour activer l'intégration ClamAV :

```bash
# Importer les bases de données ClamAV
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

Consultez [Importer des hachages](./import) pour les instructions détaillées d'import ClamAV.

## Configuration des sources

Activer ou désactiver des sources individuelles dans `config.toml` :

```toml
[signatures.sources]
malware_bazaar = true
urlhaus = true
feodo_tracker = true
threatfox = true
ssl_blacklist = true
virusshare = false          # Activer avec sd update --full
builtin_rules = true
yara_community = true
neo23x0 = true
reversinglabs = true
elastic = true
gcti = true
eset = true
inquest = true
ipsum = true
firehol = true
emerging_threats = true
sans_isc = true
clamav = false              # Activer après l'import des BDs ClamAV
```

## Étapes suivantes

- [Mettre à jour les signatures](./update) -- télécharger et mettre à jour toutes les sources
- [Importer des hachages](./import) -- ajouter des hachages personnalisés et des bases de données ClamAV
- [Règles YARA personnalisées](./custom-rules) -- écrire vos propres règles de détection
- [Présentation du renseignement sur les menaces](./index) -- architecture et structure du répertoire de données
