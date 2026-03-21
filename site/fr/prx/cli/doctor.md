---
title: prx doctor
description: Lancer des diagnostics systeme pour verifier la sante du daemon, l'etat des canaux et la disponibilite des modeles.
---

# prx doctor

Lancer des diagnostics complets sur l'installation PRX. Verifie la validite de la configuration, la connectivite du daemon, la sante des canaux, l'acces a l'API des fournisseurs et la disponibilite des modeles.

## Utilisation

```bash
prx doctor [SOUS-COMMANDE] [OPTIONS]
```

## Options

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Chemin du fichier de configuration |
| `--json` | `-j` | `false` | Sortie au format JSON |
| `--verbose` | `-v` | `false` | Afficher la sortie detaillee des verifications |
| `--fix` | | `false` | Tenter de corriger automatiquement les problemes courants |

## Sous-commandes

### `prx doctor` (sans sous-commande)

Lancer toutes les verifications diagnostiques.

```bash
prx doctor
```

**Exemple de sortie :**

```
 PRX Doctor
 ══════════════════════════════════════════

 Configuration
   Config file exists ............... OK
   Config file valid ................ OK
   Data directory writable .......... OK

 Daemon
   Daemon running ................... OK (PID 12345)
   Gateway reachable ................ OK (127.0.0.1:3120)
   Uptime ........................... 3d 14h 22m

 Providers
   anthropic ....................... OK (claude-sonnet-4-20250514)
   ollama .......................... OK (llama3, 2 models)
   openai .......................... WARN (key not configured)

 Channels
   telegram-main ................... OK (connected)
   discord-dev ..................... OK (connected)
   slack-team ...................... FAIL (auth error)

 Memory
   Backend (sqlite) ................ OK
   Entries ......................... 1,247

 Evolution
   Engine .......................... OK (running)
   Last L1 cycle ................... 2h ago

 Summary: 10 passed, 1 warning, 1 failure
```

### `prx doctor models`

Verifier la disponibilite des modeles pour tous les fournisseurs configures.

```bash
prx doctor models [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--provider` | `-P` | tous | Verifier un fournisseur specifique uniquement |

```bash
# Verifier tous les modeles de fournisseurs
prx doctor models

# Verifier uniquement les modeles Ollama
prx doctor models --provider ollama
```

**Exemple de sortie :**

```
 Provider     Model                        Status    Latency
 anthropic    claude-sonnet-4-20250514              OK        245ms
 anthropic    claude-haiku-4-20250514               OK        189ms
 ollama       llama3                       OK        12ms
 ollama       codellama                    OK        15ms
 openai       gpt-4o                       SKIP (no key)
```

## Verifications diagnostiques

Le diagnostic lance les verifications suivantes :

| Categorie | Verification | Description |
|-----------|-------------|-------------|
| Config | Fichier existant | Le fichier de configuration est present au chemin attendu |
| Config | Syntaxe valide | Le TOML s'analyse sans erreur |
| Config | Schema valide | Toutes les valeurs correspondent aux types et plages attendus |
| Daemon | Processus en cours | Le PID du daemon est actif |
| Daemon | Passerelle accessible | Le point de terminaison de sante HTTP repond |
| Fournisseurs | Cle API configuree | Les cles API requises sont configurees |
| Fournisseurs | API accessible | L'API du fournisseur repond a une requete de test |
| Canaux | Token valide | Les tokens des bots sont acceptes |
| Canaux | Connecte | Le canal est activement connecte |
| Memoire | Backend disponible | Le stockage memoire est accessible |
| Evolution | Moteur en cours | Le moteur d'evolution est actif |

## Correction automatique

Le drapeau `--fix` tente de resoudre automatiquement les problemes courants :

- Cree les repertoires de donnees manquants
- Rafraichit les tokens OAuth expires
- Redemarrez les canaux deconnectes
- Supprime les entrees de cache invalides

```bash
prx doctor --fix
```

## Voir aussi

- [prx daemon](./daemon) -- demarrer le daemon s'il n'est pas en cours d'execution
- [prx channel doctor](./channel) -- diagnostics detailles des canaux
- [Depannage](/fr/prx/troubleshooting/) -- erreurs courantes et solutions
- [Guide de diagnostic](/fr/prx/troubleshooting/diagnostics) -- diagnostics approfondis
