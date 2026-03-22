---
title: Référence des commandes CLI
description: "Référence complète des 27 sous-commandes CLI sd, organisées par catégorie, avec les options globales et des exemples d'utilisation rapide."
---

# Référence des commandes CLI

L'interface en ligne de commande `sd` fournit 27 sous-commandes organisées en 10 catégories. Cette page sert d'index de référence rapide. Chaque commande renvoie à sa page de documentation détaillée lorsqu'elle est disponible.

## Options globales

Ces indicateurs peuvent être passés à n'importe quelle sous-commande :

| Indicateur | Défaut | Description |
|------------|--------|-------------|
| `--log-level <LEVEL>` | `warn` | Verbosité des journaux : `trace`, `debug`, `info`, `warn`, `error` |
| `--data-dir <PATH>` | `~/.prx-sd` | Répertoire de données de base pour les signatures, la quarantaine, la config et les plugins |
| `--help` | -- | Afficher l'aide pour toute commande ou sous-commande |
| `--version` | -- | Afficher la version du moteur |

```bash
# Activer la journalisation de débogage
sd --log-level debug scan /tmp

# Utiliser un répertoire de données personnalisé
sd --data-dir /opt/prx-sd scan /home
```

## Analyse

Commandes pour l'analyse à la demande de fichiers et du système.

| Commande | Description |
|----------|-------------|
| `sd scan <PATH>` | Analyser un fichier ou un répertoire à la recherche de menaces |
| `sd scan-memory` | Analyser la mémoire des processus en cours (Linux uniquement, nécessite root) |
| `sd scan-usb [DEVICE]` | Analyser les périphériques USB/amovibles |
| `sd check-rootkit` | Vérifier les indicateurs de rootkit (Linux uniquement) |

```bash
# Analyser un répertoire récursivement avec mise en quarantaine automatique
sd scan /home --auto-quarantine

# Analyser avec sortie JSON pour l'automatisation
sd scan /tmp --json

# Analyser avec 4 threads et rapport HTML
sd scan /var --threads 4 --report /tmp/report.html

# Exclure des motifs
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# Analyser et remédier automatiquement (tuer le processus, mettre en quarantaine, nettoyer la persistance)
sd scan /tmp --remediate

# Analyser la mémoire des processus
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# Analyser les périphériques USB
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# Vérifier les rootkits
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## Surveillance en temps réel

Commandes pour la surveillance continue du système de fichiers et le fonctionnement du démon en arrière-plan.

| Commande | Description |
|----------|-------------|
| `sd monitor <PATHS...>` | Démarrer la surveillance du système de fichiers en temps réel |
| `sd daemon [PATHS...]` | Exécuter comme démon en arrière-plan avec surveillance et mises à jour automatiques |

```bash
# Surveiller /home et /tmp pour les changements
sd monitor /home /tmp

# Surveiller avec mode blocage (fanotify, nécessite root)
sudo sd monitor /home --block

# Exécuter comme démon avec les chemins par défaut (/home, /tmp)
sd daemon

# Démon avec intervalle de mise à jour personnalisé (toutes les 2 heures)
sd daemon /home /tmp /var --update-hours 2
```

## Gestion de la quarantaine

Commandes pour gérer le coffre-fort de quarantaine chiffré AES-256-GCM.

| Commande | Description |
|----------|-------------|
| `sd quarantine list` | Lister tous les fichiers en quarantaine |
| `sd quarantine restore <ID>` | Restaurer un fichier en quarantaine à son emplacement d'origine |
| `sd quarantine delete <ID>` | Supprimer définitivement un fichier en quarantaine |
| `sd quarantine delete-all` | Supprimer définitivement tous les fichiers en quarantaine |
| `sd quarantine stats` | Afficher les statistiques du coffre-fort de quarantaine |

```bash
# Lister les fichiers en quarantaine
sd quarantine list

# Restaurer un fichier (utiliser les 8 premiers caractères de l'ID)
sd quarantine restore a1b2c3d4

# Restaurer vers un chemin alternatif
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# Supprimer une entrée spécifique
sd quarantine delete a1b2c3d4

# Supprimer toutes les entrées (avec invite de confirmation)
sd quarantine delete-all

# Supprimer toutes les entrées sans confirmation
sd quarantine delete-all --yes

# Voir les statistiques de quarantaine
sd quarantine stats
```

## Gestion des signatures

Commandes pour mettre à jour et importer des signatures de menaces.

| Commande | Description |
|----------|-------------|
| `sd update` | Vérifier et appliquer les mises à jour de la base de données de signatures |
| `sd import <FILE>` | Importer des signatures de hachage depuis un fichier de liste de blocage |
| `sd import-clamav <FILES...>` | Importer des fichiers de signatures ClamAV (.cvd, .hdb, .hsb) |
| `sd info` | Afficher la version du moteur, l'état des signatures et les informations système |

```bash
# Mettre à jour les signatures
sd update

# Vérifier les mises à jour sans télécharger
sd update --check-only

# Forcer le re-téléchargement
sd update --force

# Importer un fichier de hachages personnalisé
sd import /path/to/hashes.txt

# Importer des signatures ClamAV
sd import-clamav main.cvd daily.cvd

# Afficher les informations du moteur
sd info
```

## Configuration

Commandes pour gérer la configuration du moteur et la politique de remédiation.

| Commande | Description |
|----------|-------------|
| `sd config show` | Afficher la configuration actuelle |
| `sd config set <KEY> <VALUE>` | Définir une valeur de configuration |
| `sd config reset` | Réinitialiser la configuration aux valeurs par défaut |
| `sd policy show` | Afficher la politique de remédiation |
| `sd policy set <KEY> <VALUE>` | Définir une valeur de politique de remédiation |
| `sd policy reset` | Réinitialiser la politique de remédiation aux valeurs par défaut |

```bash
# Afficher la configuration
sd config show

# Définir les threads d'analyse
sd config set scan.threads 8

# Réinitialiser aux valeurs par défaut
sd config reset

# Afficher la politique de remédiation
sd policy show
```

Consultez [Présentation de la configuration](../configuration/) et [Référence de configuration](../configuration/reference) pour les détails.

## Analyses planifiées

Commandes pour gérer les analyses planifiées récurrentes via les minuteries systemd ou cron.

| Commande | Description |
|----------|-------------|
| `sd schedule add <PATH>` | Enregistrer une analyse planifiée récurrente |
| `sd schedule remove` | Supprimer l'analyse planifiée |
| `sd schedule status` | Afficher l'état de planification actuel |

```bash
# Planifier une analyse hebdomadaire de /home
sd schedule add /home --frequency weekly

# Planifier une analyse quotidienne
sd schedule add /var --frequency daily

# Fréquences disponibles : hourly, 4h, 12h, daily, weekly
sd schedule add /tmp --frequency 4h

# Supprimer le calendrier
sd schedule remove

# Vérifier l'état du calendrier
sd schedule status
```

## Alertes et webhooks

Commandes pour configurer les notifications d'alerte via des webhooks et des e-mails.

| Commande | Description |
|----------|-------------|
| `sd webhook list` | Lister les points de terminaison webhook configurés |
| `sd webhook add <NAME> <URL>` | Ajouter un point de terminaison webhook |
| `sd webhook remove <NAME>` | Supprimer un point de terminaison webhook |
| `sd webhook test` | Envoyer une alerte de test à tous les webhooks |
| `sd email-alert configure` | Configurer les alertes e-mail SMTP |
| `sd email-alert test` | Envoyer un e-mail d'alerte de test |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | Envoyer un e-mail d'alerte personnalisé |

```bash
# Ajouter un webhook Slack
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# Ajouter un webhook Discord
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# Ajouter un webhook générique
sd webhook add my-webhook https://example.com/webhook

# Lister tous les webhooks
sd webhook list

# Tester tous les webhooks
sd webhook test

# Configurer les alertes e-mail
sd email-alert configure

# Tester les alertes e-mail
sd email-alert test
```

## Protection réseau

Commandes pour le blocage des publicités et des domaines malveillants au niveau DNS.

| Commande | Description |
|----------|-------------|
| `sd adblock enable` | Activer la protection adblock via le fichier hosts |
| `sd adblock disable` | Désactiver la protection adblock |
| `sd adblock sync` | Re-télécharger toutes les listes de filtres |
| `sd adblock stats` | Afficher les statistiques du moteur adblock |
| `sd adblock check <URL>` | Vérifier si une URL/domaine est bloqué |
| `sd adblock log` | Afficher les entrées bloquées récentes |
| `sd adblock add <NAME> <URL>` | Ajouter une liste de filtres personnalisée |
| `sd adblock remove <NAME>` | Supprimer une liste de filtres |
| `sd dns-proxy` | Démarrer le proxy DNS local avec filtrage |

```bash
# Activer adblock
sudo sd adblock enable

# Démarrer le proxy DNS
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

Consultez [Adblock](../network/adblock) et [Proxy DNS](../network/dns-proxy) pour les détails.

## Rapports

| Commande | Description |
|----------|-------------|
| `sd report <OUTPUT>` | Générer un rapport HTML à partir des résultats d'analyse JSON |

```bash
# Analyser avec sortie JSON, puis générer un rapport HTML
sd scan /home --json > results.json
sd report report.html --input results.json

# Ou utiliser l'indicateur --report directement
sd scan /home --report /tmp/scan-report.html
```

## Système

Commandes pour la maintenance du moteur, l'intégration et la mise à jour automatique.

| Commande | Description |
|----------|-------------|
| `sd status` | Afficher l'état du démon (en cours/arrêté, PID, menaces bloquées) |
| `sd install-integration` | Installer l'intégration de scan par clic droit du gestionnaire de fichiers |
| `sd self-update` | Vérifier et appliquer les mises à jour du binaire du moteur |

```bash
# Vérifier l'état du démon
sd status

# Installer l'intégration de bureau
sd install-integration

# Vérifier les mises à jour du moteur
sd self-update --check-only

# Appliquer la mise à jour du moteur
sd self-update
```

## Communauté

Commandes pour le partage de renseignements sur les menaces communautaires.

| Commande | Description |
|----------|-------------|
| `sd community status` | Afficher la configuration de partage communautaire |
| `sd community enroll` | Inscrire cette machine auprès de l'API communautaire |
| `sd community disable` | Désactiver le partage communautaire |

```bash
# Vérifier l'état d'inscription
sd community status

# S'inscrire au partage communautaire
sd community enroll

# Désactiver le partage (conserve les identifiants)
sd community disable
```

## Étapes suivantes

- Commencez par le [Guide de démarrage rapide](../getting-started/quickstart) pour analyser en 5 minutes
- Explorez la [Configuration](../configuration/) pour personnaliser le comportement du moteur
- Configurez la [Surveillance en temps réel](../realtime/) pour une protection continue
- Apprenez-en plus sur le [Moteur de détection](../detection/) et son pipeline
