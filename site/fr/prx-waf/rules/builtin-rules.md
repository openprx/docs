---
title: Règles intégrées
description: "PRX-WAF est livré avec 398 règles YAML couvrant OWASP CRS, les règles communautaires ModSecurity et les correctifs virtuels CVE ciblés. Inventaire complet et répartition par catégorie."
---

# Règles intégrées

PRX-WAF est livré avec 398 règles préconstruites dans trois catégories, plus 10+ vérificateurs de détection compilés dans le binaire. Ensemble, ils fournissent une couverture complète de l'OWASP Top 10 et des exploits CVE connus.

## OWASP Core Rule Set (310 règles)

Les règles OWASP CRS sont converties depuis l'[OWASP ModSecurity Core Rule Set v4](https://github.com/coreruleset/coreruleset) au format YAML natif de PRX-WAF. Elles couvrent les vecteurs d'attaque web les plus courants :

| Fichier | IDs CRS | Règles | Catégorie |
|------|---------|-------|----------|
| `sqli.yaml` | 942xxx | ~87 | Injection SQL |
| `xss.yaml` | 941xxx | ~41 | Cross-site scripting |
| `rce.yaml` | 932xxx | ~30 | Exécution de code à distance |
| `lfi.yaml` | 930xxx | ~20 | Inclusion de fichiers locaux |
| `rfi.yaml` | 931xxx | ~12 | Inclusion de fichiers distants |
| `php-injection.yaml` | 933xxx | ~18 | Injection PHP |
| `java-injection.yaml` | 944xxx | ~15 | Injection Java / Expression Language |
| `generic-attack.yaml` | 934xxx | ~12 | Node.js, SSI, fragmentation HTTP |
| `scanner-detection.yaml` | 913xxx | ~10 | Détection de UA de scanner de sécurité |
| `protocol-enforcement.yaml` | 920xxx | ~15 | Conformité au protocole HTTP |
| `protocol-attack.yaml` | 921xxx | ~10 | Contrebande de requêtes, injection CRLF |
| `multipart-attack.yaml` | 922xxx | ~8 | Contournement multipart |
| `method-enforcement.yaml` | 911xxx | ~5 | Liste blanche de méthodes HTTP |
| `session-fixation.yaml` | 943xxx | ~6 | Fixation de session |
| `web-shells.yaml` | 955xxx | ~8 | Détection de webshells |
| `response-*.yaml` | 950-956xxx | ~13 | Inspection des réponses |

### Fichiers de données de listes de mots

Les règles OWASP CRS utilisent la correspondance de phrases (`pm_from_file`) contre plus de 20 fichiers de listes de mots stockés dans `rules/owasp-crs/data/` :

- `scanners-user-agents.data` -- Chaînes user-agent de scanners connus
- `lfi-os-files.data` -- Chemins de fichiers OS sensibles
- `sql-errors.data` -- Motifs de messages d'erreur de bases de données
- Et plus encore

## Règles communautaires ModSecurity (46 règles)

Règles artisanales pour les catégories de menaces non entièrement couvertes par l'OWASP CRS :

| Fichier | Règles | Catégorie |
|------|-------|----------|
| `ip-reputation.yaml` | ~15 | Détection d'IP bot/scanner/proxy |
| `dos-protection.yaml` | ~12 | DoS et motifs de requêtes anormaux |
| `data-leakage.yaml` | ~10 | Détection de fuites PII et d'informations d'identification |
| `response-checks.yaml` | ~9 | Inspection du corps de réponse |

## Correctifs virtuels CVE (39 règles)

Règles de détection ciblées pour les CVEs très médiatisées. Elles agissent comme des correctifs virtuels, bloquant les tentatives d'exploitation avant qu'elles n'atteignent les applications vulnérables :

| Fichier | CVE(s) | Description |
|------|--------|-------------|
| `2021-log4shell.yaml` | CVE-2021-44228, CVE-2021-45046 | RCE Apache Log4j via JNDI lookup |
| `2022-spring4shell.yaml` | CVE-2022-22965, CVE-2022-22963 | RCE Spring Framework |
| `2022-text4shell.yaml` | CVE-2022-42889 | RCE Apache Commons Text |
| `2023-moveit.yaml` | CVE-2023-34362, CVE-2023-36934 | Injection SQL MOVEit Transfer |
| `2024-xz-backdoor.yaml` | CVE-2024-3094 | Détection de backdoor XZ Utils |
| `2024-recent.yaml` | Divers | CVEs très médiatisées de 2024 |
| `2025-recent.yaml` | Divers | CVEs très médiatisées de 2025 |

::: tip
Les règles de correctifs CVE sont définies au niveau de paranoïa 1 par défaut, ce qui signifie qu'elles sont actives dans toutes les configurations. Elles ont des taux de faux positifs très faibles car elles ciblent des charges utiles d'exploitation spécifiques.
:::

## Vérificateurs de détection intégrés

En plus des règles YAML, PRX-WAF inclut des vérificateurs de détection compilés dans le binaire. Ils s'exécutent dans des phases dédiées du pipeline de détection :

| Phase | Vérificateur | Description |
|-------|---------|-------------|
| 1-4 | Liste blanche/noire IP | Filtrage IP basé sur CIDR |
| 5 | Limiteur de débit CC/DDoS | Limitation de débit par fenêtre glissante par IP |
| 6 | Détection de scanner | Empreintes de scanner de vulnérabilités (Nmap, Nikto, etc.) |
| 7 | Détection de bot | Bots malveillants, crawlers IA, navigateurs headless |
| 8 | Injection SQL | libinjection + motifs regex |
| 9 | XSS | libinjection + motifs regex |
| 10 | RCE / Injection de commandes | Motifs d'injection de commandes OS |
| 11 | Traversée de répertoire | Détection de traversée de chemin (`../`) |
| 14 | Données sensibles | Détection multi-motifs PII/informations d'identification Aho-Corasick |
| 15 | Anti-hotlinking | Validation basée sur Referer par hôte |
| 16 | CrowdSec | Décisions bouncer + inspection AppSec |

## Mise à jour des règles

Les règles peuvent être synchronisées depuis les sources en amont à l'aide des outils inclus :

```bash
# Vérifier les mises à jour
python rules/tools/sync.py --check

# Synchroniser OWASP CRS vers une version spécifique
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/ --tag v4.10.0

# Synchroniser vers la dernière version
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/

# Rechargement à chaud après mise à jour
prx-waf rules reload
```

## Statistiques des règles

Affichez les statistiques de règles actuelles via le CLI :

```bash
prx-waf rules stats
```

Exemple de sortie :

```
Rule Statistics
===============
  OWASP CRS:    310 rules (21 files)
  ModSecurity:   46 rules (4 files)
  CVE Patches:   39 rules (7 files)
  Custom:         3 rules (1 file)
  ─────────────────────────
  Total:        398 rules (33 files)

  Enabled:      395
  Disabled:       3
  Paranoia 1:   280
  Paranoia 2:    78
  Paranoia 3:    30
  Paranoia 4:    10
```

## Étapes suivantes

- [Règles personnalisées](./custom-rules) -- Écrire vos propres règles
- [Syntaxe YAML](./yaml-syntax) -- Référence complète du schéma de règles
- [Présentation du moteur de règles](./index) -- Comment le pipeline évalue les règles
