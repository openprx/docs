---
title: Règles YARA
description: "PRX-SD utilise YARA-X pour analyser les fichiers avec plus de 38 800 règles provenant de 8 sources incluant des dépôts communautaires, des ensembles de règles de qualité commerciale et 64 règles intégrées."
---

# Règles YARA

Les règles YARA constituent la deuxième couche du pipeline de détection PRX-SD. Alors que la correspondance de hachages détecte les copies exactes de logiciels malveillants connus, les règles YARA détectent les **familles**, **variantes** et **motifs comportementaux** en faisant correspondre des séquences d'octets, des chaînes et des conditions structurelles dans les fichiers.

PRX-SD est livré avec 38 800+ règles YARA agrégées depuis 8 sources et utilise le moteur **YARA-X** -- la réécriture Rust de nouvelle génération de YARA qui offre de meilleures performances, sécurité et compatibilité.

## Moteur YARA-X

PRX-SD utilise [YARA-X](https://github.com/VirusTotal/yara-x) au lieu de la bibliothèque YARA traditionnelle en C. Avantages clés :

| Fonctionnalité | YARA (C) | YARA-X (Rust) |
|----------------|----------|---------------|
| Langage | C | Rust (sécurité mémoire) |
| Performance | Bonne | 2-5x plus rapide sur les grands ensembles de règles |
| Compatibilité des règles | Référence | Compatibilité ascendante complète + nouvelles fonctionnalités |
| Sécurité des threads | Nécessite une gestion soigneuse | Sûr par conception |
| Support des modules | Modules intégrés | Modulaire, extensible |

## Sources de règles

PRX-SD agrège des règles depuis 8 sources :

| Source | Règles | Contenu | Couverture de plateforme |
|--------|--------|---------|--------------------------|
| **Règles intégrées** | 64 | Ransomwares, chevaux de Troie, backdoors, rootkits, mineurs, webshells | Linux + macOS + Windows |
| **Yara-Rules/rules** (GitHub) | ~12 400 | Emotet, TrickBot, CobaltStrike, Mirai, LockBit | Multiplateforme |
| **Neo23x0/signature-base** | ~8 200 | APT29, Lazarus, minage de crypto, webshells, ransomwares | Multiplateforme |
| **ReversingLabs YARA** | ~9 500 | Chevaux de Troie, ransomwares, backdoors, outils de piratage | Windows + Linux |
| **ESET IOC** | ~3 800 | Turla, Interception, menaces persistantes avancées | Multiplateforme |
| **InQuest** | ~4 836 | Documents OLE/DDE malveillants, charges utiles de macros | Multiplateforme |
| **JPCERT/CC** | ~500+ | Menaces ciblées Asie-Pacifique | Multiplateforme |
| **Personnalisé/importé** | Variable | Règles fournies par l'utilisateur | Tout |

**Total : 38 800+ règles** (après déduplication)

## Règles intégrées

Les 64 règles intégrées sont compilées dans le binaire PRX-SD et sont toujours disponibles, même sans télécharger d'ensembles de règles externes. Elles couvrent les catégories de menaces les plus prévalentes :

| Catégorie | Règles | Exemples |
|-----------|--------|---------|
| Ransomwares | 12 | WannaCry, LockBit, Conti, REvil, BlackCat, Ryuk |
| Chevaux de Troie | 10 | Emotet, TrickBot, Dridex, QakBot |
| Backdoors | 8 | Cobalt Strike Beacon, Metasploit Meterpreter, shells inversés |
| Rootkits | 6 | Reptile, Diamorphine, Jynx2 (Linux) |
| Mineurs de cryptomonnaie | 6 | XMRig, CGMiner, configurations de minage cachées |
| Webshells | 8 | China Chopper, WSO, B374K, shells PHP/ASP/JSP |
| RATs | 6 | njRAT, DarkComet, AsyncRAT, Quasar |
| Exploits | 4 | EternalBlue, PrintNightmare, charges utiles Log4Shell |
| Signatures de test | 4 | Variantes de fichier de test EICAR |

## Processus de correspondance de règles

Quand un fichier atteint la couche 2, YARA-X le traite comme suit :

1. **Compilation des règles** -- Au démarrage, toutes les règles sont compilées dans une représentation interne optimisée. Cela se produit une fois et est mis en cache en mémoire.
2. **Extraction d'atomes** -- YARA-X extrait de courtes séquences d'octets (atomes) des motifs de règles pour construire un index de recherche. Cela permet un pré-filtrage rapide.
3. **Analyse** -- Le contenu du fichier est analysé par rapport à l'index d'atomes. Seules les règles avec des atomes correspondants sont entièrement évaluées.
4. **Évaluation des conditions** -- Pour chaque règle candidate, la condition complète (logique booléenne, comptages de chaînes, vérifications de structure de fichier) est évaluée.
5. **Résultat** -- Les règles correspondantes sont collectées et le fichier est marqué comme `MALICIOUS` avec les noms des règles inclus dans le rapport.

### Performance

| Métrique | Valeur |
|---------|-------|
| Compilation des règles (38 800 règles) | ~2 secondes (une fois au démarrage) |
| Temps d'analyse par fichier | ~0,3 milliseconde en moyenne |
| Utilisation mémoire (règles compilées) | ~150 Mo |
| Débit | ~3 000 fichiers/seconde/thread |

## Mettre à jour les règles YARA

Les règles sont mises à jour en même temps que les signatures de hachage :

```bash
# Tout mettre à jour (hachages + règles YARA)
sd update

# Mettre à jour uniquement les règles YARA
sd update --source yara
```

Le processus de mise à jour :

1. Télécharge les archives de règles depuis chaque source
2. Valide la syntaxe des règles avec YARA-X
3. Déduplique les règles par nom et hachage de contenu
4. Compile l'ensemble de règles combiné
5. Remplace atomiquement l'ensemble de règles actif

::: tip Mises à jour sans interruption
Les mises à jour de règles sont atomiques. Le nouvel ensemble de règles est compilé et validé avant de remplacer le règles actives. Si la compilation échoue (par exemple en raison d'une erreur de syntaxe dans une règle communautaire), l'ensemble de règles existant reste actif.
:::

## Règles personnalisées

Vous pouvez ajouter vos propres règles YARA en plaçant des fichiers `.yar` ou `.yara` dans le répertoire de règles personnalisées :

```bash
# Répertoire de règles personnalisées par défaut
~/.config/prx-sd/rules/
```

Exemple de règle personnalisée :

```yara
rule custom_webshell_detector {
    meta:
        description = "Detects custom PHP webshell variant"
        author = "Security Team"
        severity = "high"

    strings:
        $eval = "eval(base64_decode(" ascii
        $system = "system($_" ascii
        $exec = "exec($_" ascii

    condition:
        filesize < 100KB and
        ($eval or $system or $exec)
}
```

Après avoir ajouté des règles personnalisées, rechargez l'ensemble de règles :

```bash
sd reload-rules
```

Ou redémarrez le démon de surveillance pour qu'il prenne en compte les changements automatiquement.

## Répertoires de règles

| Répertoire | Source | Comportement de mise à jour |
|-----------|--------|----------------------------|
| `~/.local/share/prx-sd/rules/builtin/` | Compilé dans le binaire | Mis à jour avec les versions |
| `~/.local/share/prx-sd/rules/community/` | Téléchargé depuis les sources | Mis à jour par `sd update` |
| `~/.config/prx-sd/rules/` | Règles personnalisées fournies par l'utilisateur | Manuel, jamais écrasé |

## Vérifier les règles

Vérifier le nombre de règles actuellement chargées et les sources :

```bash
sd info
```

```
YARA Rules
==========
Built-in:        64
Community:       38,736
Custom:          12
Total compiled:  38,812
Rule sources:    8
Last updated:    2026-03-21 10:00:00 UTC
```

Lister les règles correspondant à un mot-clé spécifique :

```bash
sd rules list --filter "ransomware"
```

## Étapes suivantes

- [Analyse heuristique](./heuristics) -- Détection comportementale pour les fichiers qui échappent aux signatures
- [Correspondance de hachages](./hash-matching) -- La couche de détection la plus rapide
- [Présentation du moteur de détection](./index) -- Comment toutes les couches fonctionnent ensemble
- [Types de fichiers supportés](./file-types) -- Les formats de fichiers que ciblent les règles YARA
