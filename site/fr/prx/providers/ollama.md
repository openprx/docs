---
title: Ollama
description: Configurer Ollama comme fournisseur LLM dans PRX pour l'inference LLM locale et auto-hebergee
---

# Ollama

> Executez des LLM localement ou sur une infrastructure auto-hebergee avec Ollama. Prend en charge la vision, l'appel d'outils natif, les modeles de raisonnement et le routage cloud optionnel via Ollama Cloud.

## Prerequis

- [Ollama](https://ollama.com/) installe et en cours d'execution localement, **ou**
- Une instance Ollama distante avec acces reseau

## Configuration rapide

### 1. Installer Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start the server
ollama serve
```

### 2. Telecharger un modele

```bash
ollama pull qwen3
```

### 3. Configurer

```toml
[default]
provider = "ollama"
model = "qwen3"
```

Aucune cle API n'est requise pour l'utilisation locale.

### 4. Verifier

```bash
prx doctor models
```

## Modeles disponibles

Tout modele disponible via Ollama peut etre utilise. Choix populaires :

| Modele | Parametres | Vision | Outils | Notes |
|--------|-----------|--------|--------|-------|
| `qwen3` | 8B | Non | Oui | Excellent modele de code multilingue |
| `qwen2.5-coder` | 7B | Non | Oui | Specialise pour le code |
| `llama3.1` | 8B/70B/405B | Non | Oui | Famille de modeles ouverts de Meta |
| `mistral-nemo` | 12B | Non | Oui | Raisonnement efficace |
| `deepseek-r1` | 7B/14B/32B | Non | Oui | Modele de raisonnement |
| `llava` | 7B/13B | Oui | Non | Vision + langage |
| `gemma2` | 9B/27B | Non | Oui | Modele ouvert de Google |
| `codellama` | 7B/13B/34B | Non | Non | Llama specialise code |

Executez `ollama list` pour voir vos modeles installes.

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | optionnel | Cle API pour les instances Ollama distantes/cloud |
| `api_url` | string | `http://localhost:11434` | URL de base du serveur Ollama |
| `model` | string | requis | Nom du modele (ex. `qwen3`, `llama3.1:70b`) |
| `reasoning` | bool | optionnel | Activer le mode `think` pour les modeles de raisonnement |

## Fonctionnalites

### Zero configuration pour l'utilisation locale

Lors de l'execution locale d'Ollama, aucune cle API ni configuration speciale n'est necessaire. PRX se connecte automatiquement a `http://localhost:11434`.

### Appel d'outils natif

PRX utilise le support natif d'appel d'outils `/api/chat` d'Ollama. Les definitions d'outils sont envoyees dans le corps de la requete et des `tool_calls` structures sont retournes par les modeles compatibles (qwen2.5, llama3.1, mistral-nemo, etc.).

PRX gere egalement les comportements particuliers des modeles :
- **Appels d'outils imbriques** : `{"name": "tool_call", "arguments": {"name": "shell", ...}}` sont automatiquement desimbriques
- **Noms prefixes** : `tool.shell` est normalise en `shell`
- **Mapping des resultats d'outils** : Les ID d'appels d'outils sont suivis et mappes aux champs `tool_name` dans les messages de resultats d'outils suivants

### Prise en charge de la vision

Les modeles compatibles vision (ex. LLaVA) recoivent les images via le champ natif `images` d'Ollama. PRX extrait automatiquement les donnees d'image base64 des marqueurs `[IMAGE:...]` et les envoie comme entrees d'images separees.

### Mode raisonnement

Pour les modeles de raisonnement (QwQ, DeepSeek-R1, etc.), activez le parametre `think` :

```toml
[providers.ollama]
reasoning = true
```

Cela envoie `"think": true` dans la requete, activant le processus de raisonnement interne du modele. Si le modele retourne uniquement un champ `thinking` avec un contenu vide, PRX fournit un message de repli gracieux.

### Instances distantes et cloud

Pour se connecter a un serveur Ollama distant :

```toml
[providers.ollama]
api_url = "https://my-ollama-server.example.com:11434"
api_key = "${OLLAMA_API_KEY}"
```

L'authentification n'est envoyee que pour les endpoints non locaux (lorsque l'hote n'est pas `localhost`, `127.0.0.1` ou `::1`).

### Routage cloud

Ajoutez `:cloud` a un nom de modele pour forcer le routage via une instance Ollama distante :

```bash
prx chat --model "qwen3:cloud"
```

Le routage cloud necessite :
- Une `api_url` non locale
- Une `api_key` configuree

### Timeout etendu

Les requetes Ollama utilisent un timeout de 300 secondes (contre 120 secondes pour les fournisseurs cloud), tenant compte de l'inference potentiellement plus lente sur du materiel local.

## Depannage

### "Is Ollama running?"

L'erreur la plus courante. Solutions :
- Demarrer le serveur : `ollama serve`
- Verifier si le port est accessible : `curl http://localhost:11434`
- Si vous utilisez un port personnalise, mettez a jour `api_url` dans votre configuration

### Modele non trouve

Telechargez d'abord le modele :
```bash
ollama pull qwen3
```

### Reponses vides

Certains modeles de raisonnement peuvent retourner uniquement du contenu `thinking` sans reponse finale. Cela signifie generalement que le modele s'est arrete prematurement. Essayez :
- Renvoyer la requete
- Utiliser un modele different
- Desactiver le mode raisonnement si le modele ne le prend pas bien en charge

### Les appels d'outils ne fonctionnent pas

Tous les modeles Ollama ne prennent pas en charge l'appel d'outils. Modeles connus pour bien fonctionner :
- `qwen2.5` / `qwen3`
- `llama3.1`
- `mistral-nemo`
- `command-r`

### Erreurs de routage cloud

- "requested cloud routing, but Ollama endpoint is local" : Definissez `api_url` vers un serveur distant
- "requested cloud routing, but no API key is configured" : Definissez `api_key` ou `OLLAMA_API_KEY`
