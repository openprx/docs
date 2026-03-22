---
title: Analyse heuristique
description: "Le moteur heuristique PRX-SD effectue une analyse comportementale adaptée au type de fichier sur les fichiers PE, ELF, Mach-O, Office et PDF pour détecter les menaces inconnues."
---

# Analyse heuristique

L'analyse heuristique est la troisième couche du pipeline de détection PRX-SD. Alors que la correspondance de hachages et les règles YARA s'appuient sur des signatures et des motifs connus, les heuristiques analysent les **propriétés structurelles et comportementales** d'un fichier pour détecter des menaces qui n'ont jamais été vues auparavant -- y compris les logiciels malveillants zero-day, les implants personnalisés et les échantillons fortement obfusqués.

## Fonctionnement

PRX-SD identifie d'abord le type de fichier en utilisant la détection par nombre magique, puis applique un ensemble de vérifications heuristiques ciblées spécifiques à ce format de fichier. Chaque vérification qui se déclenche ajoute des points à un score cumulatif. Le score final détermine le verdict.

### Mécanisme de notation

| Plage de score | Verdict | Signification |
|----------------|---------|---------------|
| 0 - 29 | **Propre** | Aucun indicateur suspect significatif |
| 30 - 59 | **Suspect** | Quelques anomalies détectées ; révision manuelle recommandée |
| 60 - 100 | **Malveillant** | Menace à haute confiance ; multiples indicateurs forts |

Les scores sont additifs. Un fichier avec une légère anomalie (par exemple, entropie légèrement élevée) pourrait obtenir 15, tandis qu'un fichier combinant haute entropie, imports d'API suspects et signatures de packer obtiendrait 75+.

## Analyse PE (exécutable Windows)

Les heuristiques PE ciblent les exécutables Windows (.exe, .dll, .scr, .sys) :

| Vérification | Points | Description |
|-------------|--------|-------------|
| Entropie élevée des sections | 10-25 | Les sections avec une entropie > 7,0 indiquent un packing ou un chiffrement |
| Imports d'API suspects | 5-20 | Les API comme `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread` |
| Signatures de packer connus | 15-25 | En-têtes UPX, Themida, VMProtect, ASPack, PECompact détectés |
| Anomalie d'horodatage | 5-10 | Horodatage de compilation dans le futur ou avant 2000 |
| Anomalie de nom de section | 5-10 | Noms de sections non standard (`.rsrc` remplacé, chaînes aléatoires) |
| Anomalie de ressource | 5-15 | Fichiers PE intégrés dans les ressources, sections de ressources chiffrées |
| Anomalie de table d'imports | 10-15 | Très peu d'imports (packé), ou combinaisons d'imports suspects |
| Signature numérique | -10 | Une signature Authenticode valide réduit le score |
| Callbacks TLS | 10 | Entrées de callback TLS anti-débogage |
| Données d'overlay | 5-10 | Données significatives ajoutées après la structure PE |

### Exemple de résultats PE

```
Heuristic Analysis: updater.exe
Score: 72/100 [MALICIOUS]

Findings:
  [+25] Section '.text' entropy: 7.91 (likely packed or encrypted)
  [+15] Packer detected: UPX 3.96
  [+12] Suspicious API imports: VirtualAllocEx, WriteProcessMemory,
        CreateRemoteThread, NtUnmapViewOfSection
  [+10] Section name anomaly: '.UPX0', '.UPX1' (non-standard)
  [+10] Compilation timestamp: 2089-01-01 (future date)
```

## Analyse ELF (exécutable Linux)

Les heuristiques ELF ciblent les binaires Linux et les objets partagés :

| Vérification | Points | Description |
|-------------|--------|-------------|
| Entropie élevée des sections | 10-25 | Sections avec une entropie > 7,0 |
| Références LD_PRELOAD | 15-20 | Chaînes référençant `LD_PRELOAD` ou `/etc/ld.so.preload` |
| Persistance cron | 10-15 | Références à `/etc/crontab`, `/var/spool/cron`, répertoires cron |
| Persistance systemd | 10-15 | Références aux chemins d'unités systemd, `systemctl enable` |
| Indicateurs de backdoor SSH | 15-20 | Chemins `authorized_keys` modifiés, chaînes de configuration `sshd` |
| Anti-débogage | 10-15 | `ptrace(PTRACE_TRACEME)`, vérifications `/proc/self/status` |
| Opérations réseau | 5-10 | Création de sockets raw, liaisons de ports suspects |
| Auto-suppression | 10 | `unlink` du propre chemin binaire après exécution |
| Binaire strippé + haute entropie | 10 | Binaire strippé avec haute entropie suggère un logiciel malveillant packé |
| Redirection `/dev/null` | 5 | Redirection de la sortie vers `/dev/null` (comportement de démon) |

### Exemple de résultats ELF

```
Heuristic Analysis: .cache/systemd-helper
Score: 65/100 [MALICIOUS]

Findings:
  [+20] LD_PRELOAD reference: /etc/ld.so.preload manipulation
  [+15] Cron persistence: writes to /var/spool/cron/root
  [+15] SSH backdoor: modifies /root/.ssh/authorized_keys
  [+10] Self-deletion: unlinks /tmp/.cache/systemd-helper
  [+5]  Network: creates raw socket
```

## Analyse Mach-O (exécutable macOS)

Les heuristiques Mach-O ciblent les binaires macOS, les bundles et les binaires universels :

| Vérification | Points | Description |
|-------------|--------|-------------|
| Entropie élevée des sections | 10-25 | Sections avec une entropie > 7,0 |
| Injection dylib | 15-20 | Références `DYLD_INSERT_LIBRARIES`, chargement suspect de dylib |
| Persistance LaunchAgent/Daemon | 10-15 | Références à `~/Library/LaunchAgents`, `/Library/LaunchDaemons` |
| Accès au trousseau | 10-15 | Appels API trousseau, utilisation de la commande `security` |
| Contournement Gatekeeper | 10-15 | Chaînes `xattr -d com.apple.quarantine` |
| Contournement TCC de confidentialité | 10-15 | Références à la base de données TCC, abus de l'API d'accessibilité |
| Anti-analyse | 10 | Vérifications `sysctl` pour les débogueurs, chaînes de détection de VM |
| Anomalie de signature de code | 5-10 | Binaire signé ad hoc ou non signé |

### Exemple de résultats Mach-O

```
Heuristic Analysis: com.apple.helper
Score: 55/100 [SUSPICIOUS]

Findings:
  [+20] Dylib injection: DYLD_INSERT_LIBRARIES manipulation
  [+15] LaunchAgent persistence: writes to ~/Library/LaunchAgents/
  [+10] Keychain access: SecKeychainFindGenericPassword calls
  [+10] Unsigned binary: no code signature present
```

## Analyse de documents Office

Les heuristiques Office ciblent les formats Microsoft Office (.doc, .docx, .xls, .xlsx, .ppt) :

| Vérification | Points | Description |
|-------------|--------|-------------|
| Macros VBA présentes | 10-15 | Macros à exécution automatique (`AutoOpen`, `Document_Open`, `Workbook_Open`) |
| Macro avec exécution shell | 20-30 | `Shell()`, `WScript.Shell`, invocation `PowerShell` dans les macros |
| Champs DDE | 15-20 | Champs Dynamic Data Exchange exécutant des commandes |
| Lien de modèle externe | 10-15 | Injection de modèle distant via `attachedTemplate` |
| VBA obfusqué | 10-20 | Code de macro fortement obfusqué (Chr(), abus de concaténation de chaînes) |
| Objets OLE intégrés | 5-10 | Exécutables ou scripts intégrés comme objets OLE |
| Métadonnées suspectes | 5 | Champs d'auteur avec des chaînes base64 ou des motifs inhabituels |

### Exemple de résultats Office

```
Heuristic Analysis: Q3_Report.xlsm
Score: 60/100 [MALICIOUS]

Findings:
  [+15] VBA macro with AutoOpen trigger
  [+25] Macro executes: Shell("powershell -enc JABjAGwA...")
  [+10] Obfuscated VBA: 47 Chr() calls, string concatenation abuse
  [+10] External template: https://evil.example.com/template.dotm
```

## Analyse PDF

Les heuristiques PDF ciblent les documents PDF :

| Vérification | Points | Description |
|-------------|--------|-------------|
| JavaScript intégré | 15-25 | JavaScript dans les actions `/JS` ou `/JavaScript` |
| Action Launch | 20-25 | Action `/Launch` exécutant des commandes système |
| Action URI | 5-10 | Actions URI suspectes pointant vers des motifs malveillants connus |
| Flux obfusqués | 10-15 | Couches d'encodage multiples (FlateDecode + ASCII85 + hex) |
| Fichiers intégrés | 5-10 | Fichiers exécutables intégrés comme pièces jointes |
| Soumission de formulaire | 5-10 | Formulaires soumettant des données à des URL externes |
| AcroForm avec JavaScript | 15 | Formulaires interactifs avec JavaScript intégré |

### Exemple de résultats PDF

```
Heuristic Analysis: shipping_label.pdf
Score: 45/100 [SUSPICIOUS]

Findings:
  [+20] Embedded JavaScript: 3 /JS actions found
  [+15] Obfuscated stream: triple-encoded FlateDecode chain
  [+10] Embedded file: invoice.exe (PE executable)
```

## Référence des résultats courants

Le tableau suivant liste les résultats heuristiques les plus fréquemment déclenchés pour tous les types de fichiers :

| Résultat | Gravité | Types de fichiers | Taux de faux positifs |
|---------|---------|-------------------|----------------------|
| Section à haute entropie | Moyen | PE, ELF, Mach-O | Faible-Moyen (assets de jeu, données compressées) |
| Détection de packer | Élevé | PE | Très faible |
| Macro à exécution automatique | Élevé | Office | Faible (certaines macros légitimes) |
| Manipulation LD_PRELOAD | Élevé | ELF | Très faible |
| JavaScript intégré | Moyen-Élevé | PDF | Faible |
| Imports d'API suspects | Moyen | PE | Moyen (les outils de sécurité déclenchent ceci) |
| Auto-suppression | Élevé | ELF | Très faible |

::: tip Réduire les faux positifs
Si un fichier légitime déclenche des alertes heuristiques, vous pouvez l'ajouter à la liste d'autorisation par hachage SHA-256 :
```bash
sd allowlist add /path/to/legitimate/file
```
Les fichiers mis en liste d'autorisation ignorent l'analyse heuristique mais sont toujours vérifiés par rapport aux bases de données de hachages et YARA.
:::

## Étapes suivantes

- [Types de fichiers supportés](./file-types) -- Matrice complète des types de fichiers et détails de détection par nombre magique
- [Règles YARA](./yara-rules) -- Détection basée sur des motifs qui complète les heuristiques
- [Correspondance de hachages](./hash-matching) -- La couche de détection la plus rapide
- [Présentation du moteur de détection](./index) -- Comment toutes les couches fonctionnent ensemble
