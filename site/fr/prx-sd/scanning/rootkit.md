---
title: Détection de rootkits
description: "Détecter les rootkits kernel et espace utilisateur sous Linux avec sd check-rootkit. Vérifications des processus cachés, modules kernel, hooks d'appels système, et plus."
---

# Détection de rootkits

La commande `sd check-rootkit` effectue des vérifications approfondies de l'intégrité du système pour détecter les rootkits au niveau du kernel et de l'espace utilisateur. Les rootkits sont parmi les types de logiciels malveillants les plus dangereux car ils cachent leur présence aux outils système standard, les rendant invisibles aux scanners de fichiers conventionnels.

::: warning Exigences
- **Privilèges root requis** -- La détection de rootkits lit les structures de données du kernel et les éléments internes du système.
- **Linux uniquement** -- Cette fonctionnalité repose sur `/proc`, `/sys` et les interfaces kernel spécifiques à Linux.
:::

## Ce qu'il détecte

PRX-SD vérifie la présence de rootkits sur plusieurs vecteurs :

### Vérifications au niveau du kernel

| Vérification | Description |
|-------------|-------------|
| Modules kernel cachés | Comparer les modules chargés depuis `/proc/modules` avec les entrées `sysfs` pour trouver les écarts |
| Hooks de la table d'appels système | Vérifier les entrées de la table des syscalls par rapport aux symboles kernel connus |
| Incohérences `/proc` | Détecter les processus cachés de `/proc` mais visibles via d'autres interfaces |
| Falsification de symboles kernel | Vérifier les pointeurs de fonction modifiés dans les structures kernel clés |
| Table des descripteurs d'interruption | Vérifier les entrées IDT pour les modifications inattendues |

### Vérifications de l'espace utilisateur

| Vérification | Description |
|-------------|-------------|
| Processus cachés | Recouper les résultats de `readdir(/proc)` avec l'énumération de PID par force brute |
| Injection LD_PRELOAD | Vérifier la présence de bibliothèques partagées malveillantes chargées via `LD_PRELOAD` ou `/etc/ld.so.preload` |
| Remplacement de binaires | Vérifier l'intégrité des binaires système critiques (`ls`, `ps`, `netstat`, `ss`, `lsof`) |
| Fichiers cachés | Détecter les fichiers cachés en interceptant le syscall `getdents` |
| Entrées cron suspectes | Analyser les crontabs à la recherche de commandes obfusquées ou encodées |
| Falsification des services systemd | Vérifier les unités systemd non autorisées ou modifiées |
| Backdoors SSH | Rechercher les clés SSH non autorisées, `sshd_config` modifié, ou binaires `sshd` backdoorisés |
| Écouteurs réseau | Identifier les sockets réseau cachés non affichés par `ss`/`netstat` |

## Utilisation de base

Exécuter une vérification complète de rootkit :

```bash
sudo sd check-rootkit
```

Exemple de sortie :

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## Options de commande

| Option | Court | Défaut | Description |
|--------|-------|--------|-------------|
| `--json` | `-j` | désactivé | Sortie des résultats en format JSON |
| `--kernel-only` | | désactivé | Exécuter uniquement les vérifications au niveau du kernel |
| `--userspace-only` | | désactivé | Exécuter uniquement les vérifications de l'espace utilisateur |
| `--baseline` | | aucun | Chemin vers un fichier de référence pour la comparaison |
| `--save-baseline` | | aucun | Sauvegarder l'état actuel comme référence |

## Comparaison avec une référence

Pour une surveillance continue, créez une référence de votre état système connu comme sain et comparez-le dans les vérifications futures :

```bash
# Créer la référence sur un système connu comme propre
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# Les vérifications futures comparent avec la référence
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

La référence enregistre les listes de modules kernel, les hachages de la table des syscalls, les sommes de contrôle des binaires critiques et les états des écouteurs réseau. Tout écart déclenche une alerte.

## Sortie JSON

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## Exemple : Détecter un rootkit de module kernel

Quand un rootkit cache un module kernel, `sd check-rootkit` détecte l'incohérence :

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning Résultats critiques
Un résultat `CRITICAL` du vérificateur de rootkits doit être traité comme un incident de sécurité grave. Ne tentez pas de remédiation sur un système potentiellement compromis. Au lieu de cela, isolez la machine et enquêtez depuis un support de confiance.
:::

## Planifier des vérifications régulières

Ajoutez des vérifications de rootkits à votre routine de surveillance :

```bash
# Cron : vérifier toutes les 4 heures
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## Étapes suivantes

- [Analyse de la mémoire](./memory-scan) -- Détecter les menaces en mémoire dans les processus en cours d'exécution
- [Analyse de fichiers et répertoires](./file-scan) -- Analyse traditionnelle basée sur les fichiers
- [Analyse USB](./usb-scan) -- Analyser les supports amovibles lors de la connexion
- [Moteur de détection](../detection/) -- Présentation de toutes les couches de détection
