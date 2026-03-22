---
title: Règles personnalisées
description: "Écrire des règles de détection personnalisées pour PRX-WAF. Guide étape par étape avec exemples pour le contrôle d'accès, le blocage de bots, la limitation de débit et la protection spécifique aux applications."
---

# Règles personnalisées

PRX-WAF facilite l'écriture de règles de détection personnalisées adaptées à votre application spécifique. Les règles personnalisées sont écrites en YAML et placées dans le répertoire `rules/custom/`.

## Démarrer

1. Créez un nouveau fichier YAML dans `rules/custom/` :

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. Modifiez le fichier en suivant le [schéma de règles YAML](./yaml-syntax).

3. Validez avant de déployer :

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. Les règles sont rechargées à chaud automatiquement, ou déclenchez un rechargement manuel :

```bash
prx-waf rules reload
```

## Exemple : Bloquer l'accès aux chemins internes

Empêcher l'accès externe aux points de terminaison d'API internes :

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## Exemple : Détecter les User-Agents suspects

Journaliser les requêtes d'outils automatisés pour la surveillance :

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## Exemple : Limitation de débit par paramètres de requête

Bloquer les requêtes avec un nombre excessif de paramètres de requête (courant dans les attaques DoS) :

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Exemple : Bloquer des extensions de fichiers spécifiques

Empêcher l'accès aux fichiers de sauvegarde ou de configuration :

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## Exemple : Détecter le credential stuffing

Détecter les tentatives de connexion rapides (utile avec le limiteur de débit intégré) :

```yaml
  - id: "CUSTOM-AUTH-001"
    name: "Log login endpoint access for monitoring"
    category: "access-control"
    severity: "low"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(api/)?(login|signin|authenticate|auth/token)"
    action: "log"
    tags: ["custom", "authentication", "monitoring"]
```

## Exemple : Correctif virtuel CVE

Créez un correctif virtuel rapide pour une vulnérabilité spécifique :

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## Utiliser les scripts Rhai pour une logique complexe

Pour les règles qui nécessitent plus qu'une simple correspondance de motifs, PRX-WAF prend en charge les scripts Rhai en Phase 12 :

```rhai
// rules/custom/scripts/geo-block.rhai
// Block requests from specific countries during maintenance
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
Les scripts Rhai s'exécutent dans un environnement sandboxé. Ils ne peuvent pas accéder au système de fichiers, au réseau ou à toute ressource système en dehors du contexte de requête.
:::

## Meilleures pratiques

1. **Commencez avec `action: log`** -- Surveillez avant de bloquer pour détecter les faux positifs tôt.

2. **Utilisez des ancres regex spécifiques** -- Utilisez `^` et `$` pour éviter les correspondances partielles qui causent des faux positifs.

3. **Définissez des niveaux de paranoïa appropriés** -- Si une règle peut correspondre à un trafic légitime, définissez la paranoïa à 2 ou 3 plutôt que de bloquer au niveau 1.

4. **Utilisez des groupes non-capturants** -- Utilisez `(?:...)` au lieu de `(...)` pour la clarté et les performances.

5. **Ajoutez des tags descriptifs** -- Les tags apparaissent dans l'interface d'administration et aident au filtrage des événements de sécurité.

6. **Incluez des références** -- Ajoutez une URL `reference` pointant vers le CVE pertinent, l'article OWASP ou la documentation interne.

7. **Testez votre regex** -- Validez les motifs regex avant de déployer :

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **Validez avant de déployer** -- Exécutez toujours le validateur :

```bash
python rules/tools/validate.py rules/custom/
```

## Importer via CLI

Vous pouvez également importer des règles depuis des fichiers ou des URLs en utilisant le CLI :

```bash
# Importer depuis un fichier local
prx-waf rules import /path/to/rules.yaml

# Importer depuis une URL
prx-waf rules import https://example.com/rules/custom.yaml

# Valider un fichier de règles
prx-waf rules validate /path/to/rules.yaml
```

## Importer des règles ModSecurity

Convertir les règles ModSecurity `.conf` existantes au format YAML PRX-WAF :

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
Le convertisseur ModSecurity prend en charge un sous-ensemble de base des directives SecRule (ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY). Les règles ModSecurity complexes avec chaînage ou scripts Lua ne sont pas prises en charge et doivent être réécrites manuellement.
:::

## Étapes suivantes

- [Syntaxe YAML](./yaml-syntax) -- Référence complète du schéma de règles
- [Règles intégrées](./builtin-rules) -- Examiner les règles existantes avant d'en écrire de nouvelles
- [Présentation du moteur de règles](./index) -- Comprendre comment les règles sont évaluées dans le pipeline
