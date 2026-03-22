---
title: Présentation du moteur de règles
description: "Fonctionnement du moteur de règles PRX-WAF. Règles déclaratives YAML, sources de règles multiples, niveaux de paranoïa, rechargement à chaud et le pipeline de détection en 16 phases."
---

# Moteur de règles

PRX-WAF utilise un moteur de règles déclaratif basé sur YAML pour détecter et bloquer les attaques web. Les règles décrivent quoi inspecter, comment faire correspondre et quelle action prendre. Le moteur évalue chaque requête entrante contre toutes les règles activées à travers 16 phases de détection séquentielles.

## Fonctionnement des règles

Chaque règle se compose de quatre composants clés :

1. **Champ** -- Quelle partie de la requête inspecter (chemin, requête, corps, en-têtes, etc.)
2. **Opérateur** -- Comment faire correspondre la valeur (regex, contains, detect_sqli, etc.)
3. **Valeur** -- Le motif ou le seuil à comparer
4. **Action** -- Que faire quand la règle correspond (block, log, allow)

```yaml
- id: "CUSTOM-001"
  name: "Block admin path from external IPs"
  category: "access-control"
  severity: "high"
  field: "path"
  operator: "regex"
  value: "(?i)^/admin"
  action: "block"
```

## Sources de règles

PRX-WAF est livré avec 398 règles dans quatre catégories :

| Source | Fichiers | Règles | Description |
|--------|-------|-------|-------------|
| OWASP CRS | 21 | 310 | OWASP ModSecurity Core Rule Set v4 (converti en YAML) |
| ModSecurity | 4 | 46 | Règles communautaires pour la réputation IP, DoS, fuites de données |
| Correctifs CVE | 7 | 39 | Correctifs virtuels ciblés pour Log4Shell, Spring4Shell, MOVEit, etc. |
| Personnalisées | 1 | 3 | Modèles exemples pour les règles spécifiques à l'application |

De plus, PRX-WAF inclut plus de 10 vérificateurs de détection intégrés compilés dans le binaire :

- Injection SQL (libinjection + regex)
- Cross-site scripting (libinjection + regex)
- Exécution de code à distance / injection de commandes
- Inclusion de fichiers locaux/distants
- Falsification de requête côté serveur (SSRF)
- Traversée de chemin/répertoire
- Détection de scanner (Nmap, Nikto, etc.)
- Détection de bot (bots malveillants, crawlers IA, navigateurs headless)
- Détection de violation de protocole
- Détection de mots sensibles (correspondance multi-motifs Aho-Corasick)

## Formats de règles

PRX-WAF prend en charge trois formats de fichiers de règles :

| Format | Extension | Description |
|--------|-----------|-------------|
| YAML | `.yaml`, `.yml` | Format natif PRX-WAF (recommandé) |
| ModSecurity | `.conf` | Directives SecRule (sous-ensemble de base : ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY) |
| JSON | `.json` | Tableau JSON d'objets de règles |

Consultez la [Syntaxe YAML](./yaml-syntax) pour la référence complète du schéma.

## Niveaux de paranoïa

Chaque règle déclare un niveau de paranoïa (1-4) qui contrôle son agressivité de correspondance. Les niveaux plus élevés détectent plus d'attaques mais augmentent le risque de faux positifs.

| Niveau | Nom | Description | Risque de faux positifs |
|-------|------|-------------|---------------------|
| 1 | Par défaut | Règles à haute confiance, sûres pour la production | Très faible |
| 2 | Recommandé | Couverture plus large, faible risque de FP | Faible |
| 3 | Agressif | Heuristiques étendues, nécessite un réglage | Modéré |
| 4 | Maximum | Tout, y compris les motifs spéculatifs | Élevé |

::: tip
Commencez avec le niveau de paranoïa 1 en production. Surveillez les journaux, ajustez les exclusions, puis activez progressivement les niveaux supérieurs.
:::

## Rechargement à chaud

PRX-WAF surveille le répertoire `rules/` pour les modifications de fichiers et recharge automatiquement les règles lors de la création, modification ou suppression d'un fichier. Les modifications prennent effet dans la fenêtre de debounce configurée (défaut : 500ms).

Vous pouvez également déclencher un rechargement manuellement :

```bash
# Via CLI
prx-waf rules reload

# Via SIGHUP (Unix uniquement)
kill -HUP $(pgrep prx-waf)
```

Les rechargements de règles sont atomiques -- l'ancien ensemble de règles continue de servir le trafic jusqu'à ce que le nouveau soit entièrement compilé et prêt.

## Disposition du répertoire

```
rules/
├── owasp-crs/          # OWASP CRS v4 (21 fichiers, 310 règles)
│   ├── sqli.yaml       # Injection SQL (CRS 942xxx)
│   ├── xss.yaml        # Cross-site scripting (CRS 941xxx)
│   ├── rce.yaml        # Exécution de code à distance (CRS 932xxx)
│   └── ...
├── modsecurity/        # Règles communautaires ModSecurity
├── cve-patches/        # Correctifs virtuels CVE (Log4Shell, Spring4Shell, etc.)
├── custom/             # Vos règles spécifiques à l'application
└── tools/              # Utilitaires de validation et de synchronisation des règles
```

## Étapes suivantes

- [Syntaxe YAML](./yaml-syntax) -- Référence complète du schéma de règles
- [Règles intégrées](./builtin-rules) -- Couverture détaillée de l'OWASP CRS et des correctifs CVE
- [Règles personnalisées](./custom-rules) -- Écrire vos propres règles de détection
