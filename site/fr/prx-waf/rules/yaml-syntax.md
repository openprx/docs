---
title: Syntaxe des règles YAML
description: "Référence complète du format de règles YAML de PRX-WAF. Schéma, référence des champs, référence des opérateurs, référence des actions et exemples annotés."
---

# Syntaxe des règles YAML

Cette page documente le schéma complet de règles YAML utilisé par PRX-WAF. Chaque fichier de règles suit cette structure.

## Structure du fichier

Chaque fichier de règles YAML a une section de métadonnées de niveau supérieur suivie d'une liste de règles :

```yaml
version: "1.0"                     # Version du schéma (requis)
description: "Short description"   # Étiquette lisible par l'humain (requis)
source: "OWASP CRS v4.25.0"       # Origine des règles (optionnel)
license: "Apache-2.0"             # Identifiant de licence SPDX (optionnel)

rules:
  - <rule>
  - <rule>
```

## Schéma de règle

Chaque règle dans la liste `rules` possède les champs suivants :

```yaml
- id: "CRS-942100"              # ID de chaîne unique (REQUIS)
  name: "SQL injection attack"  # Brève description (REQUIS)
  category: "sqli"              # Tag de catégorie (REQUIS)
  severity: "critical"          # Niveau de sévérité (REQUIS)
  paranoia: 1                   # Niveau de paranoïa 1-4 (optionnel, défaut : 1)
  field: "all"                  # Champ de requête à inspecter (REQUIS)
  operator: "regex"             # Opérateur de correspondance (REQUIS)
  value: "(?i)select.+from"     # Motif ou seuil (REQUIS)
  action: "block"               # Action en cas de correspondance (REQUIS)
  tags:                         # Tags de chaîne (optionnel)
    - "owasp-crs"
    - "sqli"
  crs_id: 942100                # ID numérique CRS original (optionnel)
  reference: "https://..."      # Lien CVE ou documentation (optionnel)
```

### Champs requis

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique dans tous les fichiers de règles. Format : `<PRÉFIXE>-<CATÉGORIE>-<NNN>` |
| `name` | `string` | Brève description lisible par l'humain (max ~120 caractères) |
| `category` | `string` | Tag de catégorie pour le filtrage et les rapports |
| `severity` | `string` | L'une des valeurs : `critical`, `high`, `medium`, `low`, `info`, `notice`, `warning`, `error`, `unknown` |
| `field` | `string` | Quelle partie de la requête inspecter (voir Référence des champs) |
| `operator` | `string` | Comment faire correspondre la valeur (voir Référence des opérateurs) |
| `value` | `string` | Motif, seuil ou nom de fichier de liste de mots |
| `action` | `string` | Que faire quand la règle correspond (voir Référence des actions) |

### Champs optionnels

| Champ | Type | Défaut | Description |
|-------|------|---------|-------------|
| `paranoia` | `integer` | `1` | Niveau de paranoïa 1-4 |
| `tags` | `string[]` | `[]` | Tags pour le filtrage et l'affichage dans le tableau de bord |
| `crs_id` | `integer` | -- | ID numérique OWASP CRS original |
| `reference` | `string` | -- | URL vers CVE, article OWASP ou justification |

## Référence des champs

La valeur `field` détermine quelle partie de la requête HTTP est inspectée :

| Champ | Inspecte |
|-------|----------|
| `path` | Chemin URI de la requête (sans chaîne de requête) |
| `query` | Chaîne de requête (tous les paramètres, décodés) |
| `body` | Corps de la requête (décodé) |
| `headers` | Tous les en-têtes de requête (paires nom : valeur) |
| `user_agent` | En-tête User-Agent uniquement |
| `cookies` | Cookies de la requête |
| `method` | Méthode HTTP (GET, POST, PUT, etc.) |
| `content_type` | En-tête Content-Type |
| `content_length` | Valeur Content-Length (pour comparaison numérique) |
| `path_length` | Longueur du chemin URI (pour comparaison numérique) |
| `query_arg_count` | Nombre de paramètres de requête (pour comparaison numérique) |
| `all` | Tous les champs ci-dessus combinés |

## Référence des opérateurs

La valeur `operator` détermine comment la `value` est comparée au champ inspecté :

| Opérateur | Description | Format de valeur |
|----------|-------------|--------------|
| `regex` | Expression régulière compatible PCRE | Motif regex |
| `contains` | Le champ contient la chaîne littérale | Chaîne littérale |
| `equals` | Le champ est exactement égal à la valeur (sensible à la casse) | Chaîne littérale |
| `not_in` | La valeur du champ N'EST PAS dans la liste | Liste séparée par des virgules |
| `gt` | La valeur du champ (numérique) est supérieure à | Chaîne de nombre |
| `lt` | La valeur du champ (numérique) est inférieure à | Chaîne de nombre |
| `ge` | La valeur du champ (numérique) est supérieure ou égale à | Chaîne de nombre |
| `le` | La valeur du champ (numérique) est inférieure ou égale à | Chaîne de nombre |
| `detect_sqli` | Détection d'injection SQL via libinjection | `"true"` ou `""` |
| `detect_xss` | Détection XSS via libinjection | `"true"` ou `""` |
| `pm_from_file` | Correspondance de phrase contre un fichier de liste de mots | Nom de fichier dans `owasp-crs/data/` |
| `pm` | Correspondance de phrase contre une liste en ligne | Phrases séparées par des virgules |

## Référence des actions

La valeur `action` détermine ce qui se passe quand une règle correspond :

| Action | Description |
|--------|-------------|
| `block` | Rejeter la requête avec une réponse 403 Forbidden |
| `log` | Autoriser la requête mais journaliser la correspondance (mode surveillance) |
| `allow` | Autoriser explicitement la requête (remplace les autres règles) |
| `deny` | Alias pour `block` |
| `redirect` | Rediriger la requête (configuration spécifique au moteur) |
| `drop` | Abandonner silencieusement la connexion |

::: tip
Commencez les nouvelles règles avec `action: log` pour surveiller les faux positifs avant de passer à `action: block`.
:::

## Convention de l'espace de noms des IDs

Les IDs de règles doivent suivre la convention de préfixe établie :

| Répertoire | Préfixe ID | Exemple |
|-----------|-----------|---------|
| `owasp-crs/` | `CRS-<nombre>` | `CRS-942100` |
| `modsecurity/` | `MODSEC-<CATÉGORIE>-<NNN>` | `MODSEC-IP-001` |
| `cve-patches/` | `CVE-<ANNÉE>-<COURT>-<NNN>` | `CVE-2021-LOG4J-001` |
| `custom/` | `CUSTOM-<CATÉGORIE>-<NNN>` | `CUSTOM-API-001` |

## Exemple complet

```yaml
version: "1.0"
description: "Application-specific access control rules"
source: "custom"
license: "Apache-2.0"

rules:
  - id: "CUSTOM-API-001"
    name: "Block access to internal admin API"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/internal/"
    action: "block"
    tags: ["custom", "access-control"]

  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client)"
    action: "log"
    tags: ["custom", "bot", "scanner"]

  - id: "CUSTOM-RATE-001"
    name: "Block requests with excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Validation des règles

Validez vos fichiers de règles avant de les déployer :

```bash
# Valider toutes les règles
python rules/tools/validate.py rules/

# Valider un fichier spécifique
python rules/tools/validate.py rules/custom/myapp.yaml
```

Le validateur vérifie :
- Les champs requis sont présents
- Pas d'IDs de règles en double dans tous les fichiers
- Les valeurs de sévérité et d'action sont valides
- Les niveaux de paranoïa sont dans la plage 1-4
- Les expressions régulières se compilent correctement
- Les opérateurs numériques ne sont pas utilisés avec des valeurs de chaîne

## Étapes suivantes

- [Règles intégrées](./builtin-rules) -- Explorer les règles OWASP CRS et les correctifs CVE
- [Règles personnalisées](./custom-rules) -- Écrire vos propres règles étape par étape
- [Présentation du moteur de règles](./index) -- Comment le pipeline de détection traite les règles
