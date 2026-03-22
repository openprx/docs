---
title: Règles YARA personnalisées
description: "Écrire, tester et déployer des règles YARA personnalisées pour PRX-SD afin de détecter les menaces spécifiques à votre environnement."
---

# Règles YARA personnalisées

YARA est un langage de correspondance de motifs conçu pour la détection de logiciels malveillants. PRX-SD prend en charge le chargement de règles YARA personnalisées aux côtés de ses règles intégrées et communautaires, vous permettant de créer une logique de détection adaptée à votre paysage de menaces spécifique.

## Emplacement des fichiers de règles

Placez les règles YARA personnalisées dans le répertoire `~/.prx-sd/yara/` :

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SD charge tous les fichiers `.yar` et `.yara` de ce répertoire au démarrage et lors des mises à jour de signatures. Les règles sont compilées dans un cache optimisé (`compiled.yarc`) pour une analyse rapide.

::: tip
Les sous-répertoires sont pris en charge. Organisez les règles par catégorie pour une gestion plus facile :
```
~/.prx-sd/yara/
  ransomware/
    lockbit_variant.yar
    custom_encryptor.yar
  webshells/
    internal_webshell.yar
  compliance/
    pii_detection.yar
```
:::

## Syntaxe des règles YARA

Une règle YARA se compose de trois sections : **meta**, **strings** et **condition**.

### Structure de base d'une règle

```yara
rule Detect_CustomMalware : trojan
{
    meta:
        author = "Security Team"
        description = "Detects custom trojan used in targeted attack"
        severity = "high"
        date = "2026-03-21"
        reference = "https://internal.wiki/incident-2026-042"

    strings:
        $magic = { 4D 5A 90 00 }              // PE header (hex bytes)
        $str1 = "cmd.exe /c" ascii nocase      // ASCII string, case-insensitive
        $str2 = "powershell -enc" ascii nocase
        $str3 = "C:\\Users\\Public\\payload" wide  // UTF-16 string
        $mutex = "Global\\CustomMutex_12345"
        $regex = /https?:\/\/[a-z0-9]{8,12}\.onion/ // Regex pattern

    condition:
        $magic at 0 and
        (2 of ($str*)) and
        ($mutex or $regex)
}
```

### Éléments clés de la syntaxe

| Élément | Syntaxe | Description |
|---------|--------|-------------|
| Chaînes hexadécimales | `{ 4D 5A ?? 00 }` | Motifs d'octets avec caractères génériques (`??`) |
| Chaînes de texte | `"text" ascii` | Chaînes ASCII simples |
| Chaînes larges | `"text" wide` | Chaînes encodées en UTF-16LE |
| Insensible à la casse | `"text" nocase` | Correspondance quelle que soit la casse |
| Regex | `/pattern/` | Motifs d'expressions régulières |
| Tags | `rule Name : tag1 tag2` | Tags de catégorisation |
| Taille du fichier | `filesize < 1MB` | Condition sur la taille du fichier |
| Point d'entrée | `entrypoint` | Décalage du point d'entrée PE/ELF |
| À un décalage | `$str at 0x100` | Chaîne à un décalage spécifique |
| Dans une plage | `$str in (0..1024)` | Chaîne dans une plage d'octets |
| Comptage | `#str > 3` | Nombre d'occurrences d'une chaîne |

### Niveaux de sévérité

PRX-SD lit le champ meta `severity` pour déterminer la classification de la menace :

| Sévérité | Verdict PRX-SD |
|----------|---------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| (non défini) | SUSPICIOUS |

## Exemples de règles

### Détecter un script suspect

```yara
rule Suspicious_PowerShell_Download : script
{
    meta:
        author = "Security Team"
        description = "PowerShell script downloading and executing remote content"
        severity = "high"

    strings:
        $dl1 = "Invoke-WebRequest" ascii nocase
        $dl2 = "Net.WebClient" ascii nocase
        $dl3 = "DownloadString" ascii nocase
        $dl4 = "DownloadFile" ascii nocase
        $exec1 = "Invoke-Expression" ascii nocase
        $exec2 = "iex(" ascii nocase
        $exec3 = "Start-Process" ascii nocase
        $enc = "-EncodedCommand" ascii nocase
        $bypass = "-ExecutionPolicy Bypass" ascii nocase

    condition:
        filesize < 5MB and
        (any of ($dl*)) and
        (any of ($exec*) or $enc or $bypass)
}
```

### Détecter les mineurs de cryptomonnaies

```yara
rule Crypto_Miner_Strings : miner
{
    meta:
        author = "Security Team"
        description = "Detects cryptocurrency mining software"
        severity = "medium"

    strings:
        $pool1 = "stratum+tcp://" ascii
        $pool2 = "stratum+ssl://" ascii
        $pool3 = "pool.minexmr.com" ascii
        $pool4 = "xmrpool.eu" ascii
        $algo1 = "cryptonight" ascii nocase
        $algo2 = "randomx" ascii nocase
        $algo3 = "ethash" ascii nocase
        $wallet = /[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}/ ascii  // Monero address

    condition:
        (any of ($pool*)) or
        ((any of ($algo*)) and $wallet)
}
```

### Détecter les webshells

```yara
rule PHP_Webshell_Generic : webshell
{
    meta:
        author = "Security Team"
        description = "Generic PHP webshell detection"
        severity = "critical"

    strings:
        $php = "<?php" ascii nocase
        $eval1 = "eval(" ascii nocase
        $eval2 = "assert(" ascii nocase
        $eval3 = "preg_replace" ascii nocase
        $input1 = "$_GET[" ascii
        $input2 = "$_POST[" ascii
        $input3 = "$_REQUEST[" ascii
        $input4 = "$_COOKIE[" ascii
        $cmd1 = "system(" ascii nocase
        $cmd2 = "passthru(" ascii nocase
        $cmd3 = "shell_exec(" ascii nocase
        $cmd4 = "exec(" ascii nocase
        $obf1 = "base64_decode" ascii nocase
        $obf2 = "str_rot13" ascii nocase
        $obf3 = "gzinflate" ascii nocase

    condition:
        $php and
        (any of ($eval*)) and
        (any of ($input*)) and
        (any of ($cmd*) or any of ($obf*))
}
```

## Tester les règles

Validez vos règles avant de les déployer :

```bash
# Vérification syntaxique d'un fichier de règles
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# Tester une règle contre un fichier spécifique
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# Tester toutes les règles personnalisées contre un répertoire d'échantillons
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# Simulation d'analyse avec seulement les règles personnalisées
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
Testez toujours les nouvelles règles contre un ensemble de fichiers sains connus pour vérifier les faux positifs avant de les déployer en surveillance de production.
:::

## Recharger les règles

Après avoir ajouté ou modifié des règles, rechargez sans redémarrer le démon :

```bash
# Recompiler et recharger les règles
sd yara reload

# Si le démon est en cours d'exécution, envoyer SIGHUP
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## Contribuer des règles

Partagez vos règles avec la communauté PRX-SD :

1. Forkez le dépôt [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures)
2. Ajoutez votre règle au répertoire de catégorie approprié
3. Incluez des champs `meta` complets (author, description, severity, reference)
4. Testez contre des échantillons malveillants et des fichiers sains
5. Soumettez une pull request avec des hachages d'échantillons pour validation

## Étapes suivantes

- [Sources de signatures](./sources) -- sources de règles YARA communautaires et tierces
- [Importer des hachages](./import) -- ajouter des listes de blocage basées sur les hachages
- [Mettre à jour les signatures](./update) -- maintenir toutes les règles à jour
- [Présentation du renseignement sur les menaces](./index) -- architecture complète des signatures
