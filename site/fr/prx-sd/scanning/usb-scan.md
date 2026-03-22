---
title: Analyse des périphériques USB
description: "Détecter et analyser automatiquement les périphériques de stockage USB amovibles à la recherche de logiciels malveillants lors de leur connexion avec sd scan-usb."
---

# Analyse des périphériques USB

La commande `sd scan-usb` détecte les périphériques de stockage USB amovibles connectés et analyse leur contenu à la recherche de logiciels malveillants. C'est essentiel dans les environnements où les clés USB sont un vecteur courant de diffusion de logiciels malveillants, comme les réseaux isolés, les postes de travail partagés et les systèmes de contrôle industriels.

## Fonctionnement

Lorsqu'elle est invoquée, `sd scan-usb` effectue les étapes suivantes :

1. **Découverte des périphériques** -- Enumère les périphériques de blocs via `/sys/block/` et identifie les périphériques amovibles (stockage de masse USB).
2. **Détection du montage** -- Vérifie si le périphérique est déjà monté. Sinon, il peut optionnellement le monter en mode lecture seule dans un répertoire temporaire.
3. **Analyse complète** -- Exécute le pipeline de détection complet (correspondance de hachages, règles YARA, analyse heuristique) sur tous les fichiers du périphérique.
4. **Rapport** -- Produit un rapport d'analyse avec des verdicts par fichier.

::: tip Montage automatique
Par défaut, `sd scan-usb` analyse les périphériques déjà montés. Utilisez `--auto-mount` pour monter automatiquement les périphériques USB non montés en mode lecture seule pour l'analyse.
:::

## Utilisation de base

Analyser tous les périphériques de stockage USB connectés :

```bash
sd scan-usb
```

Exemple de sortie :

```
PRX-SD USB Scan
===============
Detected USB devices:
  /dev/sdb1 → /media/user/USB_DRIVE (vfat, 16 GB)

Scanning /media/user/USB_DRIVE...
Scanned: 847 files (2.1 GB)
Threats: 1

  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe
    Layer:   YARA rule
    Rule:    win_worm_usb_spreader
    Details: USB worm with autorun.inf exploitation

Duration: 4.2s
```

## Options de commande

| Option | Court | Défaut | Description |
|--------|-------|--------|-------------|
| `--auto-quarantine` | `-q` | désactivé | Mettre automatiquement en quarantaine les menaces détectées |
| `--auto-mount` | | désactivé | Monter les périphériques USB non montés en mode lecture seule |
| `--device` | `-d` | tous | Analyser uniquement un périphérique spécifique (par exemple, `/dev/sdb1`) |
| `--json` | `-j` | désactivé | Sortie des résultats en format JSON |
| `--eject-after` | | désactivé | Éjecter en toute sécurité le périphérique après l'analyse |
| `--max-size-mb` | | 100 | Ignorer les fichiers plus grands que cette taille |

## Mise en quarantaine automatique

Isoler automatiquement les menaces trouvées sur les périphériques USB :

```bash
sd scan-usb --auto-quarantine
```

```
Scanning /media/user/USB_DRIVE...
  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe → Quarantined (QR-20260321-012)
  [MALICIOUS] /media/user/USB_DRIVE/.hidden/payload.bin → Quarantined (QR-20260321-013)

Threats quarantined: 2
Safe to use: Review remaining files before opening.
```

::: warning Important
Lorsque `--auto-quarantine` est utilisé avec l'analyse USB, les fichiers malveillants sont déplacés vers le coffre-fort de quarantaine local sur la machine hôte, et non supprimés du périphérique USB. Les fichiers originaux sur le périphérique USB restent à moins d'utiliser également `--remediate`.
:::

## Analyser des périphériques spécifiques

Si plusieurs périphériques USB sont connectés, analysez-en un spécifique :

```bash
sd scan-usb --device /dev/sdb1
```

Lister les périphériques USB détectés sans les analyser :

```bash
sd scan-usb --list
```

```
Detected USB storage devices:
  1. /dev/sdb1  Kingston DataTraveler  16 GB  vfat  Mounted: /media/user/USB_DRIVE
  2. /dev/sdc1  SanDisk Ultra          64 GB  exfat Not mounted
```

## Sortie JSON

```bash
sd scan-usb --json
```

```json
{
  "scan_type": "usb",
  "timestamp": "2026-03-21T17:00:00Z",
  "devices": [
    {
      "device": "/dev/sdb1",
      "label": "USB_DRIVE",
      "filesystem": "vfat",
      "size_gb": 16,
      "mount_point": "/media/user/USB_DRIVE",
      "files_scanned": 847,
      "threats": [
        {
          "path": "/media/user/USB_DRIVE/autorun.exe",
          "verdict": "malicious",
          "layer": "yara",
          "rule": "win_worm_usb_spreader"
        }
      ]
    }
  ]
}
```

## Menaces USB courantes

Les périphériques USB sont fréquemment utilisés pour diffuser les types de logiciels malveillants suivants :

| Type de menace | Description | Couche de détection |
|----------------|-------------|---------------------|
| Vers autorun | Exploitent `autorun.inf` pour s'exécuter sur Windows | Règles YARA |
| Droppers USB | Exécutables déguisés (par exemple, `document.pdf.exe`) | Heuristique + YARA |
| Charges utiles BadUSB | Scripts ciblant les attaques d'émulation HID | Analyse de fichiers |
| Porteurs de ransomwares | Charges utiles chiffrées qui s'activent lors de la copie | Hachage + YARA |
| Outils d'exfiltration de données | Utilitaires conçus pour collecter et extraire des données | Analyse heuristique |

## Intégration avec la surveillance en temps réel

Vous pouvez combiner l'analyse USB avec le démon `sd monitor` pour analyser automatiquement les périphériques USB lors de leur connexion :

```bash
sd monitor --watch-usb /home /tmp
```

Cela démarre le moniteur de fichiers en temps réel et ajoute la capacité d'auto-analyse USB. Lorsqu'un nouveau périphérique USB est détecté via udev, il est automatiquement analysé.

::: tip Mode kiosque
Pour les terminaux publics ou les postes de travail partagés, combinez `--watch-usb` avec `--auto-quarantine` pour neutraliser automatiquement les menaces des périphériques USB sans intervention de l'utilisateur.
:::

## Étapes suivantes

- [Analyse de fichiers et répertoires](./file-scan) -- Référence complète pour `sd scan`
- [Analyse de la mémoire](./memory-scan) -- Analyser la mémoire des processus en cours d'exécution
- [Détection de rootkits](./rootkit) -- Vérifier les menaces au niveau système
- [Moteur de détection](../detection/) -- Fonctionnement du pipeline multicouche
