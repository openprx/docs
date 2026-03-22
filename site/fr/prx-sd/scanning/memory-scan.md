---
title: Analyse de la mémoire des processus
description: "Analyser la mémoire des processus en cours d'exécution à la recherche de logiciels malveillants en mémoire, de menaces sans fichier et de code injecté avec sd scan-memory."
---

# Analyse de la mémoire des processus

La commande `sd scan-memory` analyse la mémoire des processus en cours d'exécution pour détecter les logiciels malveillants sans fichier, les shellcodes injectés et les menaces en mémoire qui ne touchent jamais le disque. C'est essentiel pour détecter les menaces avancées qui échappent à l'analyse traditionnelle basée sur les fichiers.

::: warning Exigences
- **Privilèges root requis** -- L'analyse de la mémoire lit `/proc/<pid>/mem`, ce qui nécessite root ou `CAP_SYS_PTRACE`.
- **Linux uniquement** -- L'analyse de la mémoire des processus est actuellement supportée sous Linux. Le support macOS est planifié.
:::

## Fonctionnement

L'analyse de la mémoire des processus lit les mappages de mémoire virtuelle d'un processus en cours d'exécution et applique le même pipeline de détection que pour l'analyse de fichiers :

1. **Enumérer les régions de mémoire** -- Analyser `/proc/<pid>/maps` pour trouver les segments de mémoire lisibles (tas, pile, mappages anonymes, fichiers mappés).
2. **Lire le contenu de la mémoire** -- Lire chaque région depuis `/proc/<pid>/mem`.
3. **Analyse des règles YARA** -- Appliquer des règles YARA en mémoire optimisées pour détecter les motifs de shellcode, les DLL injectées et les signatures de logiciels malveillants connus en mémoire.
4. **Analyse de motifs** -- Vérifier la présence de motifs suspects tels que les régions de mémoire RWX, les en-têtes PE dans des mappages non sauvegardés par des fichiers, et les charges utiles d'exploitation connues.

## Utilisation de base

Analyser tous les processus en cours d'exécution :

```bash
sudo sd scan-memory
```

Analyser un processus spécifique par PID :

```bash
sudo sd scan-memory --pid 1234
```

Analyser plusieurs processus spécifiques :

```bash
sudo sd scan-memory --pid 1234 --pid 5678 --pid 9012
```

## Options de commande

| Option | Court | Défaut | Description |
|--------|-------|--------|-------------|
| `--pid` | `-p` | tous | Analyser uniquement l'ID de processus spécifié (répétable) |
| `--json` | `-j` | désactivé | Sortie des résultats en format JSON |
| `--exclude-pid` | | aucun | Exclure des PIDs spécifiques de l'analyse |
| `--exclude-user` | | aucun | Exclure les processus appartenant à un utilisateur spécifique |
| `--min-region-size` | | 4096 | Taille minimale de la région mémoire à analyser (octets) |
| `--skip-mapped-files` | | désactivé | Ignorer les régions de mémoire sauvegardées par des fichiers |

## Exemple de sortie

```bash
sudo sd scan-memory
```

```
PRX-SD Memory Scan Report
=========================
Processes scanned: 142
Memory regions scanned: 8,451
Total memory scanned: 4.2 GB

  [MALICIOUS] PID 3847 (svchost)
    Region:  0x7f4a00000000-0x7f4a00040000 (anon, RWX)
    Match:   YARA rule: memory_cobalt_strike_beacon
    Details: CobaltStrike Beacon shellcode detected in anonymous RWX mapping

  [SUSPICIOUS] PID 12045 (python3)
    Region:  0x7f8b10000000-0x7f8b10010000 (anon, RWX)
    Match:   Pattern analysis
    Details: Executable code in anonymous RWX region, possible shellcode injection

Duration: 12.4s
```

### Sortie JSON

```bash
sudo sd scan-memory --pid 3847 --json
```

```json
{
  "scan_type": "memory",
  "timestamp": "2026-03-21T15:00:00Z",
  "processes_scanned": 1,
  "regions_scanned": 64,
  "threats": [
    {
      "pid": 3847,
      "process_name": "svchost",
      "region_start": "0x7f4a00000000",
      "region_end": "0x7f4a00040000",
      "region_perms": "rwx",
      "region_type": "anonymous",
      "verdict": "malicious",
      "rule": "memory_cobalt_strike_beacon",
      "description": "CobaltStrike Beacon shellcode detected"
    }
  ]
}
```

## Cas d'utilisation

### Réponse aux incidents

Lors d'une investigation active, analyser tous les processus pour trouver les services compromis :

```bash
sudo sd scan-memory --json > /evidence/memory-scan-$(date +%s).json
```

### Détection de logiciels malveillants sans fichier

Les logiciels malveillants modernes s'exécutent souvent entièrement en mémoire sans écrire sur le disque. Les techniques courantes incluent :

- **Injection de processus** -- Les logiciels malveillants injectent du code dans des processus légitimes en utilisant `ptrace` ou des écritures dans `/proc/pid/mem`
- **Chargement réflexif de DLL** -- Une DLL est chargée depuis la mémoire sans toucher le système de fichiers
- **Exécution de shellcode** -- Un shellcode brut est alloué dans la mémoire RWX et exécuté directement

`sd scan-memory` détecte ces motifs en recherchant :

| Indicateur | Description |
|-----------|-------------|
| Mappages anonymes RWX | Code exécutable dans une mémoire non sauvegardée par des fichiers |
| En-têtes PE en mémoire | Structures PE Windows dans la mémoire de processus Linux (charges utiles multiplateformes) |
| Signatures de shellcode connus | Motifs de balise Metasploit, CobaltStrike, Sliver |
| Stubs de syscall suspects | Points d'entrée de syscall hookés ou patchés |

### Vérification de l'état du serveur

Exécuter des analyses de mémoire périodiques sur les serveurs de production :

```bash
# Ajouter à cron : analyser toutes les 6 heures
0 */6 * * * root /usr/local/bin/sd scan-memory --json --exclude-user nobody >> /var/log/prx-sd/memory-scan.log 2>&1
```

::: tip Impact sur les performances
L'analyse de la mémoire lit la mémoire des processus et peut brièvement augmenter les E/S. Sur les serveurs de production, envisagez d'analyser pendant les périodes de faible trafic ou d'exclure les processus non critiques.
:::

## Limitations

- L'analyse de la mémoire lit un instantané de la mémoire des processus au moment de l'analyse. Les régions de mémoire changeant rapidement peuvent donner des résultats incomplets.
- La mémoire du kernel n'est pas analysée par `scan-memory`. Utilisez `sd check-rootkit` pour la détection des menaces au niveau du kernel.
- Les charges utiles en mémoire fortement obfusquées ou chiffrées peuvent échapper aux règles YARA. La couche d'analyse de motifs fournit un mécanisme de détection secondaire.

## Étapes suivantes

- [Détection de rootkits](./rootkit) -- Détecter les rootkits kernel et espace utilisateur
- [Analyse de fichiers et répertoires](./file-scan) -- Analyse traditionnelle basée sur les fichiers
- [Règles YARA](../detection/yara-rules) -- Comprendre le moteur de règles utilisé pour l'analyse de la mémoire
- [Moteur de détection](../detection/) -- Comment toutes les couches de détection fonctionnent ensemble
