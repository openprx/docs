---
title: Recherche web
description: Recherche sur le web via DuckDuckGo (gratuit, sans cle API) ou Brave Search (cle API requise) avec limites de resultats et delais d'attente configurables.
---

# Recherche web

L'outil `web_search_tool` permet aux agents PRX de rechercher sur le web des informations actuelles. Il prend en charge deux fournisseurs de recherche -- DuckDuckGo (gratuit, sans cle API requise) et Brave Search (necessite une cle API) -- et retourne des resultats de recherche structures que l'agent peut utiliser pour repondre a des questions sur les evenements recents, consulter de la documentation ou rechercher des sujets.

La recherche web est protegee par un feature gate et necessite `web_search.enabled = true` dans la configuration. Lorsqu'elle est activee, PRX enregistre egalement optionnellement l'outil `web_fetch` pour extraire le contenu complet des pages a partir d'URL trouvees dans les resultats de recherche.

La combinaison de `web_search_tool` et `web_fetch` donne aux agents un pipeline complet de recherche web : rechercher des pages pertinentes, puis recuperer et extraire le contenu des resultats les plus prometteurs.

## Configuration

```toml
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (gratuit) ou "brave" (cle API requise)
max_results = 5              # Resultats maximum par recherche (1-10)
timeout_secs = 10            # Delai d'attente des requetes en secondes

# Brave Search (necessite une cle API)
# provider = "brave"
# brave_api_key = "BSA-xxxxxxxxxxxx"

# Web fetch (extraction du contenu des pages)
fetch_enabled = true         # Activer l'outil web_fetch
fetch_max_chars = 50000      # Caracteres maximum retournes par web_fetch
```

### Comparaison des fournisseurs

| Fonctionnalite | DuckDuckGo | Brave Search |
|----------------|-----------|-------------|
| Cout | Gratuit | Niveau gratuit (2000 requetes/mois), plans payants disponibles |
| Cle API | Non requise | Requise (`brave_api_key`) |
| Qualite des resultats | Bonne pour les recherches generales | Meilleure qualite, mieux structuree |
| Limites de debit | Implicites (peut limiter) | Explicites (basees sur le plan) |
| Confidentialite | Axee sur la vie privee | Axee sur la vie privee |
| Donnees structurees | Basiques (titre, URL, extrait) | Riches (titre, URL, extrait, descriptions supplementaires) |

### Choix d'un fournisseur

- **DuckDuckGo** est la valeur par defaut et fonctionne pret a l'emploi sans configuration au-dela de `enabled = true`. Il convient a la plupart des cas d'utilisation et ne necessite aucun compte ni cle API.
- **Brave Search** fournit des resultats de meilleure qualite et des metadonnees plus riches. Utilisez-le lorsque la qualite de recherche est critique ou lorsque vous avez besoin de l'outil `web_fetch` pour une extraction fiable du contenu.

## Utilisation

### web_search_tool

L'outil de recherche retourne une liste de resultats avec titres, URL et extraits :

```json
{
  "name": "web_search_tool",
  "arguments": {
    "query": "Rust async runtime comparison tokio vs async-std 2026",
    "max_results": 5
  }
}
```

**Exemple de reponse :**

```json
{
  "success": true,
  "output": "1. Comparing Tokio and async-std in 2026 - https://blog.example.com/rust-async\n   Snippet: A detailed comparison of the two main Rust async runtimes...\n\n2. Tokio documentation - https://docs.rs/tokio\n   Snippet: Tokio is an asynchronous runtime for Rust...\n\n..."
}
```

### web_fetch

Apres avoir trouve des URL pertinentes via la recherche, l'agent peut recuperer et extraire le contenu :

```json
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://blog.example.com/rust-async"
  }
}
```

L'outil `web_fetch` :

1. Valide le domaine de l'URL par rapport a `browser.allowed_domains`
2. Recupere le contenu de la page
3. Extrait le texte lisible (supprime le HTML, les scripts, les styles)
4. Tronque a `fetch_max_chars`
5. Retourne le contenu extrait

::: warning
`web_fetch` necessite a la fois `web_search.fetch_enabled = true` **et** que `browser.allowed_domains` soit defini. L'URL recuperee doit correspondre a l'un des domaines autorises.
:::

## Parametres

### Parametres de web_search_tool

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|--------|--------|-------------|
| `query` | `string` | Oui | -- | La chaine de requete de recherche |
| `max_results` | `integer` | Non | Valeur config (`5`) | Nombre maximum de resultats a retourner (1-10) |

**Retourne :**

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` si la recherche s'est terminee |
| `output` | `string` | Resultats de recherche formates avec titres, URL et extraits |
| `error` | `string?` | Message d'erreur si la recherche a echoue (delai, erreur fournisseur, etc.) |

### Parametres de web_fetch

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|--------|--------|-------------|
| `url` | `string` | Oui | -- | L'URL a recuperer et dont extraire le contenu |

**Retourne :**

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` si la page a ete recuperee et analysee |
| `output` | `string` | Contenu texte extrait, tronque a `fetch_max_chars` |
| `error` | `string?` | Message d'erreur si la recuperation a echoue (domaine non autorise, delai, etc.) |

## Flux de recherche typique

Un flux de recherche web complet suit generalement ce schema :

1. **Rechercher** : L'agent utilise `web_search_tool` pour trouver des pages pertinentes
2. **Evaluer** : L'agent examine les extraits de recherche pour identifier les resultats les plus pertinents
3. **Recuperer** : L'agent utilise `web_fetch` pour extraire le contenu complet des pages selectionnees
4. **Synthetiser** : L'agent combine les informations de plusieurs sources dans une reponse

```
Reflexion de l'agent : L'utilisateur a demande les fonctionnalites de la derniere version de Rust.
  1. [web_search_tool] query="Rust 1.82 release features changelog"
  2. [examine les resultats, selectionne les 2 meilleurs URL]
  3. [web_fetch] url="https://blog.rust-lang.org/2026/..."
  4. [web_fetch] url="https://releases.rs/docs/1.82.0/"
  5. [synthetise la reponse a partir du contenu recupere]
```

## Securite

### Identifiants des fournisseurs

- **DuckDuckGo** : Aucun identifiant requis. Les requetes sont envoyees aux endpoints API de DuckDuckGo.
- **Brave Search** : La `brave_api_key` est stockee dans le fichier de configuration. Utilisez le stockage chiffre de secrets PRX pour la proteger :

```toml
[web_search]
brave_api_key = "enc:xxxxxxxxxxxxx"  # Chiffre avec ChaCha20-Poly1305
```

### Restrictions de domaine pour web_fetch

L'outil `web_fetch` respecte la liste `browser.allowed_domains`. Cela empeche l'agent de recuperer du contenu depuis des URL arbitraires, ce qui pourrait :

- Exposer l'agent a du contenu malveillant (injection de prompt via des pages web)
- Declencher une falsification de requete cote serveur (SSRF) si l'agent recupere des URL internes
- Fuiter des informations via des requetes DNS ou HTTP vers des domaines controles par un attaquant

```toml
[browser]
allowed_domains = ["docs.rs", "crates.io", "github.com", "*.rust-lang.org"]
```

### Protection par delai d'attente

Les operations de recherche et de recuperation ont des delais d'attente configurables pour empecher le blocage sur des serveurs lents ou non reactifs :

- `web_search.timeout_secs` (par defaut : 10 secondes) -- delai d'attente de la requete de recherche
- Les delais d'attente au niveau du reseau s'appliquent egalement a `web_fetch`

### Limites de taille du contenu

Le parametre `fetch_max_chars` (par defaut : 50 000 caracteres) empeche l'epuisement de la memoire a cause de pages web extremement volumineuses. Le contenu au-dela de cette limite est tronque.

### Moteur de politiques

Les outils de recherche web passent par le moteur de politiques de securite :

```toml
[security.tool_policy.tools]
web_search_tool = "allow"
web_fetch = "supervised"     # Necessite une approbation avant la recuperation
```

## Voir aussi

- [Requete HTTP](/fr/prx/tools/http-request) -- requetes HTTP programmatiques vers des API
- [Outil navigateur](/fr/prx/tools/browser) -- automatisation complete du navigateur pour les sites riches en JavaScript
- [Reference de configuration](/fr/prx/config/reference) -- champs `[web_search]` et `[browser]`
- [Gestion des secrets](/fr/prx/security/secrets) -- stockage chiffre pour les cles API
- [Apercu des outils](/fr/prx/tools/) -- tous les outils et systeme de registre
