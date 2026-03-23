---
title: Dépannage
description: "Solutions aux problèmes courants de PRX-SD incluant les mises à jour de signatures, les performances d'analyse, les permissions, les faux positifs, les problèmes de démon et l'utilisation mémoire."
---

# Dépannage

Cette page couvre les problèmes les plus courants rencontrés lors de l'exécution de PRX-SD, ainsi que leurs causes et solutions.

## Échec de la mise à jour de la base de données de signatures

**Symptômes :** `sd update` échoue avec une erreur réseau, un délai d'attente ou une discordance SHA-256.

**Causes possibles :**
- Pas de connexion Internet ou pare-feu bloquant HTTPS sortant
- Le serveur de mise à jour est temporairement indisponible
- Un proxy ou un pare-feu d'entreprise modifie la réponse

**Solutions :**

1. **Vérifier la connectivité** au serveur de mise à jour :

```bash
curl -fsSL https://api.github.com/repos/openprx/prx-sd-signatures/commits?per_page=1
```

2. **Utiliser le script de mise à jour hors ligne** si vous avez des restrictions réseau :

```bash
# Sur une machine avec accès Internet
./tools/update-signatures.sh

# Copier le répertoire des signatures sur la machine cible
scp -r ~/.prx-sd/signatures user@target:~/.prx-sd/
```

3. **Forcer le re-téléchargement** pour effacer tout cache corrompu :

```bash
sd update --force
```

4. **Utiliser un serveur de mise à jour personnalisé** si vous hébergez un miroir privé :

```bash
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"
sd update
```

5. **Vérifier la discordance SHA-256** -- cela signifie généralement que le téléchargement a été corrompu en transit. Réessayez, ou téléchargez manuellement :

```bash
sd update --force
```

::: tip
Exécutez `sd update --check-only` pour vérifier si une mise à jour est disponible sans télécharger.
:::

## Lenteur de l'analyse

**Symptômes :** L'analyse d'un répertoire prend beaucoup plus de temps que prévu.

**Causes possibles :**
- Analyse de systèmes de fichiers montés sur le réseau (NFS, CIFS, SSHFS)
- Les règles YARA sont compilées à chaque analyse (pas de compilation en cache)
- Trop de threads en compétition pour les E/S sur les disques rotatifs
- Récursion d'archives sur de grandes archives imbriquées

**Solutions :**

1. **Augmenter le nombre de threads** pour le stockage SSD :

```bash
sd config set scan.threads 16
```

2. **Réduire le nombre de threads** pour les disques rotatifs (limité par les E/S) :

```bash
sd config set scan.threads 2
```

3. **Exclure les chemins lents ou non pertinents** :

```bash
sd config set scan.exclude_paths '["/mnt/nfs", "/proc", "/sys", "/dev", "*.iso"]'
```

4. **Désactiver l'analyse des archives** si non nécessaire :

```bash
sd config set scan.scan_archives false
```

5. **Réduire la profondeur des archives** pour éviter les archives profondément imbriquées :

```bash
sd config set scan.max_archive_depth 1
```

6. **Utiliser l'indicateur `--exclude`** pour les analyses ponctuelles :

```bash
sd scan /home --exclude "*.iso" --exclude "node_modules"
```

7. **Activer la journalisation de débogage** pour trouver les goulots d'étranglement :

```bash
sd --log-level debug scan /path/to/dir 2>&1 | grep -i "slow\|timeout\|skip"
```

## Erreurs de permission fanotify

**Symptômes :** `sd monitor --block` échoue avec "Permission denied" ou "Operation not permitted".

**Causes possibles :**
- Pas d'exécution en tant que root
- Le noyau Linux n'a pas `CONFIG_FANOTIFY_ACCESS_PERMISSIONS` activé
- AppArmor ou SELinux bloque l'accès fanotify

**Solutions :**

1. **Exécuter en tant que root** :

```bash
sudo sd monitor /home /tmp --block
```

2. **Vérifier la configuration du noyau** :

```bash
zgrep FANOTIFY /proc/config.gz
# Devrait afficher : CONFIG_FANOTIFY=y et CONFIG_FANOTIFY_ACCESS_PERMISSIONS=y
```

3. **Utiliser le mode non-blocage** comme solution de repli (détecte toujours les menaces, mais ne prévient pas l'accès aux fichiers) :

```bash
sd monitor /home /tmp
```

::: warning
Le mode blocage est uniquement disponible sur Linux avec le support fanotify. Sur macOS (FSEvents) et Windows (ReadDirectoryChangesW), la surveillance en temps réel fonctionne en mode détection seulement.
:::

4. **Vérifier SELinux/AppArmor** :

```bash
# SELinux : vérifier les refus
ausearch -m AVC -ts recent | grep prx-sd

# AppArmor : vérifier les refus
dmesg | grep apparmor | grep prx-sd
```

## Faux positif (fichier légitime détecté comme menace)

**Symptômes :** Un fichier connu comme sain est signalé comme Suspect ou Malveillant.

**Solutions :**

1. **Vérifier ce qui a déclenché la détection** :

```bash
sd scan /path/to/file --json
```

Examinez les champs `detection_type` et `threat_name` :
- `HashMatch` -- le hachage du fichier correspond à un hachage de malware connu (faux positif peu probable)
- `YaraRule` -- une règle YARA a correspondé à des motifs dans le fichier
- `Heuristic` -- le moteur heuristique a scoré le fichier au-dessus du seuil

2. **Pour les faux positifs heuristiques**, augmentez le seuil :

```bash
# La valeur par défaut est 60 ; augmentez à 70 pour moins de faux positifs
sd config set scan.heuristic_threshold 70
```

3. **Exclure le fichier ou répertoire de l'analyse** :

```bash
sd config set scan.exclude_paths '["/path/to/safe-file", "/opt/known-good/"]'
```

4. **Pour les faux positifs YARA**, vous pouvez exclure des règles spécifiques en les supprimant ou en les commentant dans le répertoire `~/.prx-sd/yara/`.

5. **Liste blanche via hachage** -- ajoutez le SHA-256 du fichier à une liste d'autorisation locale (fonctionnalité future). En solution de contournement, excluez le fichier par chemin.

::: tip
Si vous pensez qu'une détection est un véritable faux positif, veuillez le signaler sur [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues) avec le hachage du fichier (pas le fichier lui-même) et le nom de la règle.
:::

## Le démon ne peut pas démarrer

**Symptômes :** `sd daemon` quitte immédiatement, ou `sd status` affiche "stopped".

**Causes possibles :**
- Une autre instance est déjà en cours d'exécution (fichier PID existant)
- Le répertoire de données est inaccessible ou corrompu
- La base de données de signatures est manquante

**Solutions :**

1. **Vérifier un fichier PID périmé** :

```bash
cat ~/.prx-sd/prx-sd.pid
# Si le PID listé n'est pas en cours d'exécution, supprimez le fichier
rm ~/.prx-sd/prx-sd.pid
```

2. **Vérifier l'état du démon** :

```bash
sd status
```

3. **Exécuter en premier plan** avec journalisation de débogage pour voir les erreurs de démarrage :

```bash
sd --log-level debug daemon /home /tmp
```

4. **S'assurer que les signatures existent** :

```bash
sd info
# Si hash_count est 0, exécutez :
sd update
```

5. **Vérifier les permissions du répertoire** :

```bash
ls -la ~/.prx-sd/
# Tous les répertoires doivent être possédés par votre utilisateur et accessibles en écriture
```

6. **Réinitialiser** si le répertoire de données est corrompu :

```bash
# Sauvegarder les données existantes
mv ~/.prx-sd ~/.prx-sd.bak

# Re-exécuter n'importe quelle commande pour déclencher la configuration initiale
sd info

# Re-télécharger les signatures
sd update
```

## Ajustement du niveau de journalisation

**Problème :** Vous avez besoin de plus d'informations de diagnostic pour déboguer un problème.

PRX-SD prend en charge cinq niveaux de journalisation, du plus au moins verbeux :

| Niveau | Description |
|-------|-------------|
| `trace` | Tout, y compris les détails de correspondance YARA par fichier |
| `debug` | Opérations détaillées du moteur, chargement des plugins, recherches de hachages |
| `info` | Progression de l'analyse, mises à jour des signatures, enregistrement des plugins |
| `warn` | Avertissements et erreurs non fatales (défaut) |
| `error` | Uniquement les erreurs critiques |

```bash
# Verbosité maximale
sd --log-level trace scan /tmp

# Niveau debug pour le dépannage
sd --log-level debug monitor /home

# Rediriger les journaux vers un fichier pour analyse
sd --log-level debug scan /home 2> /tmp/prx-sd-debug.log
```

::: tip
L'indicateur `--log-level` est global et doit venir **avant** la sous-commande :
```bash
# Correct
sd --log-level debug scan /tmp

# Incorrect (indicateur après la sous-commande)
sd scan /tmp --log-level debug
```
:::

## Utilisation mémoire élevée

**Symptômes :** Le processus `sd` consomme plus de mémoire que prévu, surtout lors de l'analyse de grands répertoires.

**Causes possibles :**
- Analyse d'un très grand nombre de fichiers avec de nombreux threads
- Les règles YARA sont compilées en mémoire (38 800+ règles utilisent une mémoire significative)
- L'analyse des archives gonfle les fichiers compressés volumineux en mémoire
- Plugins WASM avec des limites `max_memory_mb` élevées

**Solutions :**

1. **Réduire le nombre de threads** (chaque thread charge son propre contexte YARA) :

```bash
sd config set scan.threads 2
```

2. **Limiter la taille maximale des fichiers** pour ignorer les très grands fichiers :

```bash
# Limiter à 50 Mio
sd config set scan.max_file_size 52428800
```

3. **Désactiver l'analyse des archives** pour les systèmes à mémoire limitée :

```bash
sd config set scan.scan_archives false
```

4. **Réduire la profondeur des archives** :

```bash
sd config set scan.max_archive_depth 1
```

5. **Vérifier les limites mémoire des plugins WASM** -- examinez `~/.prx-sd/plugins/*/plugin.json` pour les plugins avec des valeurs `max_memory_mb` élevées et réduisez-les.

6. **Surveiller la mémoire pendant les analyses** :

```bash
# Dans un autre terminal
watch -n 1 'ps aux | grep sd | grep -v grep'
```

7. **Pour le démon**, surveiller la mémoire dans le temps :

```bash
sd status
# Affiche le PID ; utilisez top/htop pour surveiller la mémoire
```

## Autres problèmes courants

### Avertissement "Aucune règle YARA trouvée"

Le répertoire de règles YARA est vide. Re-exécutez la configuration initiale ou téléchargez les règles :

```bash
sd update
# Ou déclencher manuellement la configuration en supprimant le répertoire yara :
rm -rf ~/.prx-sd/yara
sd info  # déclenche la configuration initiale avec les règles intégrées
```

### Erreur "Impossible d'ouvrir la base de données de signatures"

La base de données de signatures LMDB peut être corrompue :

```bash
rm -rf ~/.prx-sd/signatures
sd update
```

### Adblock : "privilèges insuffisants"

Les commandes d'activation/désactivation d'adblock modifient le fichier hosts système et nécessitent root :

```bash
sudo sd adblock enable
sudo sd adblock disable
```

### L'analyse ignore des fichiers avec une erreur "timeout"

Les délais d'attente par fichier sont de 30 secondes par défaut. Augmentez pour les fichiers complexes :

```bash
sd config set scan.timeout_per_file_ms 60000
```

## Obtenir de l'aide

Si aucune des solutions ci-dessus ne résout votre problème :

1. **Vérifiez les problèmes existants :** [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)
2. **Soumettez un nouveau problème** avec :
   - Version de PRX-SD (`sd info`)
   - Système d'exploitation et version du noyau
   - Sortie du journal de débogage (`sd --log-level debug ...`)
   - Étapes pour reproduire

## Étapes suivantes

- Consultez la [Référence de configuration](../configuration/reference) pour affiner le comportement du moteur
- Apprenez le [Moteur de détection](../detection/) pour comprendre comment les menaces sont identifiées
- Configurez les [Alertes](../alerts/) pour être notifié des problèmes de manière proactive
