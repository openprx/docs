---
title: Execution Shell
description: L'outil shell execute des commandes dans des environnements isoles avec des backends d'isolation configurables, un assainissement de l'environnement, une application des delais d'attente et des limites de sortie.
---

# Execution Shell

L'outil `shell` est l'un des trois outils principaux de PRX, disponible dans les registres `default_tools()` et `all_tools()`. Il fournit l'execution de commandes au niveau du systeme d'exploitation a l'interieur d'un sandbox configurable, garantissant que les commandes initiees par l'agent s'executent sous une isolation stricte, des limites de temps et des contraintes de sortie.

Lorsque le LLM determine qu'il doit executer une commande shell -- installer un paquet, compiler du code, interroger l'etat du systeme ou executer un script -- il invoque l'outil `shell` avec la chaine de commande. PRX enveloppe l'execution dans le backend de sandbox configure, applique un delai d'attente par defaut de 60 secondes, plafonne la sortie a 1 Mo et supprime les variables d'environnement sensibles avant de lancer le processus enfant.

L'outil shell est generalement l'outil le plus puissant et le plus restreint de l'arsenal PRX. C'est la cible principale du moteur de politiques de securite, et la plupart des deploiements le marquent comme `supervised` pour exiger l'approbation humaine avant l'execution.

## Configuration

L'outil shell lui-meme n'a pas de section de configuration dediee. Son comportement est controle via le sandbox de securite et les limites de ressources :

```toml
[security.sandbox]
enabled = true
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# Custom Firejail arguments (when backend = "firejail")
firejail_args = ["--net=none", "--noroot"]

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]

[security.resources]
max_memory_mb = 512
max_cpu_time_seconds = 60
max_subprocesses = 10
memory_monitoring = true
```

Pour marquer le shell comme supervise (necessitant une approbation par invocation) :

```toml
[security.tool_policy.tools]
shell = "supervised"
```

## Backends de sandbox

PRX prend en charge cinq backends de sandbox. Lorsque `backend = "auto"`, PRX sonde les backends disponibles dans l'ordre de priorite suivant et selectionne le premier trouve :

| Backend | Plateforme | Niveau d'isolation | Surcharge | Notes |
|---------|------------|-------------------|-----------|-------|
| **Landlock** | Linux (5.13+) | LSM systeme de fichiers | Minimale | Natif au noyau, pas de dependances supplementaires. Restreint les chemins du systeme de fichiers au niveau du noyau. |
| **Firejail** | Linux | Complete (reseau, systeme de fichiers, PID) | Faible | Sandbox en espace utilisateur. Prend en charge `--net=none` pour l'isolation reseau, l'espace de noms PID, le filtrage seccomp. |
| **Bubblewrap** | Linux, macOS | Base sur les espaces de noms | Faible | Utilise les espaces de noms utilisateur. Listes configurables de chemins en lecture/ecriture. |
| **Docker** | Tout | Conteneur complet | Elevee | Execute les commandes dans un conteneur jetable. Isolation maximale mais latence la plus elevee. |
| **Aucun** | Tout | Couche applicative uniquement | Aucune | Pas d'isolation au niveau du systeme. PRX applique toujours le delai d'attente et les plafonds de sortie, mais le processus a un acces complet au systeme. |

### Landlock

Landlock est un module de securite Linux disponible dans le noyau 5.13+. Il restreint l'acces au systeme de fichiers au niveau du noyau sans necessiter de privileges root. PRX utilise Landlock pour limiter les chemins auxquels la commande shell peut lire et ecrire.

### Firejail

Firejail fournit un sandboxing complet via les espaces de noms Linux et seccomp. Des arguments personnalises peuvent etre passes via `firejail_args` :

```toml
[security.sandbox]
backend = "firejail"
firejail_args = ["--net=none", "--noroot", "--nosound", "--no3d"]
```

### Bubblewrap

Bubblewrap (`bwrap`) utilise les espaces de noms utilisateur pour creer des environnements sandbox minimaux. Il est plus leger que Firejail et fonctionne sur certaines configurations macOS :

```toml
[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp", "/home/user/workspace"]
readonly_paths = ["/usr", "/lib", "/bin"]
```

### Docker

Docker fournit une isolation complete en conteneur. Chaque commande s'execute dans un conteneur neuf base sur l'image configuree :

```toml
[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"
```

## Utilisation

L'outil shell est invoque par le LLM pendant les boucles agentiques. Dans les conversations d'agent, le LLM genere un appel d'outil comme :

```json
{
  "name": "shell",
  "arguments": {
    "command": "ls -la /home/user/project"
  }
}
```

Depuis le CLI, vous pouvez observer les invocations de l'outil shell dans la sortie de l'agent. L'appel d'outil affiche la commande en cours d'execution et le backend de sandbox utilise.

### Flux d'execution

1. Le LLM genere un appel d'outil `shell` avec un argument `command`
2. Le moteur de politiques de securite verifie si l'appel est autorise, refuse ou necessite une supervision
3. Si supervise, PRX invite l'utilisateur a approuver avant de continuer
4. Le backend de sandbox enveloppe la commande dans la couche d'isolation appropriee
5. Les variables d'environnement sont assainies (voir ci-dessous)
6. La commande s'execute avec un delai d'attente de 60 secondes
7. stdout et stderr sont captures, tronques a 1 Mo si necessaire
8. Le resultat est retourne au LLM sous forme de `ToolResult` avec un statut de succes/echec

## Parametres

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|--------|--------|-------------|
| `command` | `string` | Oui | -- | La commande shell a executer. Passee a `/bin/sh -c` (ou equivalent). |

L'outil retourne un `ToolResult` contenant :

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` si la commande s'est terminee avec le code 0 |
| `output` | `string` | stdout et stderr combines, tronques a 1 Mo |
| `error` | `string?` | Message d'erreur si la commande a echoue ou a expire |

## Assainissement de l'environnement

L'outil shell ne transmet qu'une liste blanche stricte de variables d'environnement aux processus enfants. Cela previent la fuite accidentelle de cles API, de tokens et de secrets qui peuvent etre presents dans l'environnement du daemon.

**Variables d'environnement autorisees :**

| Variable | Objectif |
|----------|----------|
| `PATH` | Chemin de recherche des executables |
| `HOME` | Repertoire personnel de l'utilisateur |
| `TERM` | Type de terminal |
| `LANG` | Langue de la locale |
| `LC_ALL` | Surcharge de locale |
| `LC_CTYPE` | Locale du type de caractere |
| `USER` | Nom d'utilisateur courant |
| `SHELL` | Chemin du shell par defaut |
| `TMPDIR` | Repertoire temporaire |

Toutes les autres variables -- y compris `API_KEY`, `AWS_SECRET_ACCESS_KEY`, `GITHUB_TOKEN`, `OPENAI_API_KEY` et toutes les variables personnalisees -- sont supprimees de l'environnement du processus enfant. C'est une frontiere de securite codee en dur qui ne peut pas etre surchargee par la configuration.

## Limites de ressources

| Limite | Defaut | Configurable | Description |
|--------|--------|-------------|-------------|
| Delai d'attente | 60 secondes | `security.resources.max_cpu_time_seconds` | Temps d'horloge maximum par commande |
| Taille de sortie | 1 Mo | -- | Maximum stdout + stderr combines |
| Memoire | 512 Mo | `security.resources.max_memory_mb` | Utilisation memoire maximale par commande |
| Sous-processus | 10 | `security.resources.max_subprocesses` | Nombre maximum de processus enfants lances |

Lorsqu'une commande depasse le delai d'attente, PRX envoie SIGTERM suivi de SIGKILL apres un delai de grace. Le resultat de l'outil signale le depassement de delai comme une erreur.

Lorsque la sortie depasse 1 Mo, elle est tronquee et une note est ajoutee indiquant la troncature.

## Securite

- **Isolation sandbox** : Les commandes s'executent a l'interieur du backend de sandbox configure, limitant l'acces au systeme de fichiers, au reseau et aux processus
- **Assainissement de l'environnement** : Seules 9 variables d'environnement en liste blanche sont transmises aux processus enfants
- **Moteur de politiques** : Chaque invocation shell passe par le moteur de politiques de securite avant l'execution
- **Journalisation d'audit** : Toutes les commandes shell et leurs resultats sont journalises dans le journal d'audit lorsque `security.audit.enabled = true`
- **Mode supervise** : L'outil shell peut etre marque comme `supervised` dans la politique d'outils, necessitant l'approbation explicite de l'utilisateur avant chaque execution
- **Limites de ressources** : Des limites strictes sur le delai d'attente, la memoire, la taille de sortie et le nombre de sous-processus empechent l'epuisement des ressources

### Attenuation des menaces

L'outil shell est le vecteur principal pour les attaques par injection de prompt. Si un attaquant peut influencer le raisonnement du LLM (par du contenu de document malveillant, par exemple), l'outil shell est ce qu'il utiliserait pour executer des commandes. PRX attenue cela par :

1. **Confinement sandbox** -- meme si une commande malveillante s'execute, elle fonctionne avec un acces restreint au systeme de fichiers et au reseau
2. **Suppression de l'environnement** -- les cles API et les secrets ne sont pas disponibles pour le processus enfant
3. **Mode supervision** -- un humain dans la boucle peut examiner chaque commande avant l'execution
4. **Piste d'audit** -- toutes les commandes sont journalisees pour l'examen forensique

## Voir aussi

- [Sandbox de securite](/fr/prx/security/sandbox) -- documentation detaillee des backends de sandbox
- [Moteur de politiques](/fr/prx/security/policy-engine) -- regles de controle d'acces aux outils
- [Reference de configuration](/fr/prx/config/reference) -- champs `security.sandbox` et `security.resources`
- [Apercu des outils](/fr/prx/tools/) -- tous les 46+ outils et systeme de registre
