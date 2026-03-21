---
title: AWS Bedrock
description: Configurer AWS Bedrock comme fournisseur LLM dans PRX
---

# AWS Bedrock

> Accedez aux modeles de fondation (Claude, Titan, Llama, Mistral et plus) via l'API Converse d'AWS Bedrock avec authentification SigV4, appel d'outils natif et mise en cache des prompts.

## Prerequis

- Un compte AWS avec l'acces aux modeles Bedrock active
- Des identifiants AWS (Access Key ID + Secret Access Key) avec les permissions `bedrock:InvokeModel`

## Configuration rapide

### 1. Activer l'acces aux modeles

1. Ouvrez la [Console AWS Bedrock](https://console.aws.amazon.com/bedrock/)
2. Naviguez vers **Model access** dans la barre laterale gauche
3. Demandez l'acces aux modeles que vous souhaitez utiliser (ex. Anthropic Claude, Meta Llama)

### 2. Configurer les identifiants AWS

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # optional, defaults to us-east-1
```

### 3. Configurer PRX

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. Verifier

```bash
prx doctor models
```

## Modeles disponibles

Les ID de modeles suivent le format Bedrock `<fournisseur>.<modele>-<version>` :

| ID du modele | Fournisseur | Contexte | Vision | Outils | Notes |
|-------------|-------------|----------|--------|--------|-------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | Oui | Oui | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | Oui | Oui | Dernier Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | Oui | Oui | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | Oui | Oui | Modele Claude rapide |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | Non | Oui | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | Non | Oui | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | Non | Non | Amazon Titan |

Consultez la [documentation AWS Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) pour la liste complete des modeles disponibles dans votre region.

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `model` | string | requis | ID du modele Bedrock (ex. `anthropic.claude-sonnet-4-6`) |

L'authentification est entierement geree via les variables d'environnement AWS :

| Variable d'environnement | Requis | Description |
|--------------------------|--------|-------------|
| `AWS_ACCESS_KEY_ID` | Oui | ID de la cle d'acces AWS |
| `AWS_SECRET_ACCESS_KEY` | Oui | Cle d'acces secrete AWS |
| `AWS_SESSION_TOKEN` | Non | Token de session temporaire (pour les roles assumes) |
| `AWS_REGION` | Non | Region AWS (defaut : `us-east-1`) |
| `AWS_DEFAULT_REGION` | Non | Region de repli si `AWS_REGION` n'est pas defini |

## Fonctionnalites

### Signature SigV4 sans dependance

PRX implemente la signature de requetes AWS SigV4 en utilisant uniquement les crates `hmac` et `sha2`, sans aucune dependance au SDK AWS. Cela garde le binaire compact et evite les conflits de versions du SDK. La signature inclut :

- Chaine de derivation de cles HMAC-SHA256
- Construction de requete canonique avec en-tetes tries
- Prise en charge de `x-amz-security-token` pour les identifiants temporaires

### API Converse

PRX utilise l'API Converse de Bedrock (et non l'ancienne API InvokeModel), qui fournit :
- Un format de message unifie pour tous les fournisseurs de modeles
- Appel d'outils structure avec les blocs `toolUse` et `toolResult`
- Prise en charge des prompts systeme
- Format de reponse coherent

### Appel d'outils natif

Les outils sont envoyes au format natif `toolConfig` de Bedrock avec des definitions `toolSpec` incluant `name`, `description` et `inputSchema`. Les resultats d'outils sont encapsules dans des blocs de contenu `toolResult` au sein des messages `user`.

### Mise en cache des prompts

PRX applique les heuristiques de mise en cache des prompts de Bedrock (utilisant les memes seuils que le fournisseur Anthropic) :
- Les prompts systeme > 3 Ko recoivent un bloc `cachePoint`
- Les conversations avec > 4 messages non-systeme ont le dernier message annote avec un `cachePoint`

### Encodage d'URL pour les ID de modeles

Les ID de modeles Bedrock contenant des deux-points (ex. `v1:0`) necessitent un traitement special. PRX :
- Envoie les deux-points bruts dans l'URL HTTP (comme reqwest le fait)
- Encode les deux-points en `%3A` dans l'URI canonique pour la signature SigV4
- Cette double approche assure que le routage HTTP et la verification de signature reussissent

## Alias du fournisseur

Les noms suivants resolvent vers le fournisseur Bedrock :

- `bedrock`
- `aws-bedrock`

## Depannage

### "AWS Bedrock credentials not set"

Assurez-vous que `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` sont definis comme variables d'environnement. PRX ne lit pas `~/.aws/credentials` ni `~/.aws/config`.

### 403 AccessDeniedException

Causes courantes :
- L'utilisateur/role IAM n'a pas la permission `bedrock:InvokeModel`
- Vous n'avez pas demande l'acces au modele dans la console Bedrock
- Le modele n'est pas disponible dans votre region configuree

### SignatureDoesNotMatch

Cela indique generalement un decalage d'horloge. Assurez-vous que l'horloge systeme est synchronisee :
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```

### Modele non disponible dans la region

Tous les modeles ne sont pas disponibles dans toutes les regions. Consultez la [matrice de disponibilite des modeles Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) et ajustez `AWS_REGION` en consequence.

### Utilisation d'identifiants temporaires (STS)

Si vous utilisez AWS STS (roles assumes, SSO), definissez les trois variables :
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

Le token de session est automatiquement inclus dans la signature SigV4 sous forme d'en-tete `x-amz-security-token`.
