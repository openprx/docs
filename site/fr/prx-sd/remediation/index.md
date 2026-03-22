---
title: Réponse aux menaces
description: "Configurer la remédiation automatique des menaces avec les politiques de réponse, le nettoyage de la persistance et l'isolation réseau."
---

# Réponse aux menaces

Le moteur de remédiation de PRX-SD fournit une réponse automatisée aux menaces au-delà de la simple détection. Lorsqu'une menace est identifiée, le moteur peut prendre des actions graduées allant de la journalisation à l'isolation réseau complète, selon la politique configurée.

## Types de réponse

| Action | Description | Réversible | Nécessite root |
|--------|-------------|-----------|--------------|
| **Report** | Journaliser la détection et continuer. Aucune action sur le fichier. | N/A | Non |
| **Quarantine** | Chiffrer et déplacer le fichier vers le coffre-fort de quarantaine. | Oui | Non |
| **Block** | Refuser l'accès/l'exécution du fichier via fanotify (Linux temps réel uniquement). | Oui | Oui |
| **Kill** | Terminer le processus qui a créé ou utilise le fichier malveillant. | Non | Oui |
| **Clean** | Supprimer le contenu malveillant du fichier tout en préservant l'original (ex. suppression de macro des documents Office). | Partiel | Non |
| **Delete** | Supprimer définitivement le fichier malveillant du disque. | Non | Non |
| **Isolate** | Bloquer tout accès réseau pour la machine en utilisant des règles de pare-feu. | Oui | Oui |
| **Blocklist** | Ajouter le hachage du fichier à la liste de blocage locale pour les analyses futures. | Oui | Non |

## Configuration des politiques

### Utilisation des commandes sd policy

```bash
# Afficher la politique actuelle
sd policy show

# Définir la politique pour les détections malveillantes
sd policy set on_malicious quarantine

# Définir la politique pour les détections suspectes
sd policy set on_suspicious report

# Réinitialiser aux valeurs par défaut
sd policy reset
```

### Exemple de sortie

```bash
sd policy show
```

```
Threat Response Policy
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### Fichier de configuration

Définissez les politiques dans `~/.prx-sd/config.toml` :

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # auto-add malicious hashes to local blocklist
clean_persistence = true        # remove persistence mechanisms on malicious detection
network_isolate = false         # enable network isolation for critical threats

[policy.notify]
webhook = true
email = false

[policy.escalation]
# Escalate to stronger action if same threat reappears
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
Les politiques `on_malicious` et `on_suspicious` acceptent différents ensembles d'actions. Les actions destructives comme `kill` et `delete` ne sont disponibles que pour `on_malicious`.
:::

## Nettoyage de la persistance

Lorsque `clean_persistence` est activé, PRX-SD analyse et supprime les mécanismes de persistance que les logiciels malveillants peuvent avoir installés. Cela s'exécute automatiquement après la mise en quarantaine ou la suppression d'une menace.

### Points de persistance Linux

| Emplacement | Technique | Action de nettoyage |
|----------|-----------|----------------|
| `/etc/cron.d/`, `/var/spool/cron/` | Tâches cron | Supprimer les entrées cron malveillantes |
| `/etc/systemd/system/` | Services systemd | Désactiver et supprimer les unités malveillantes |
| `~/.config/systemd/user/` | Services systemd utilisateur | Désactiver et supprimer |
| `~/.bashrc`, `~/.profile` | Injection dans les RC shell | Supprimer les lignes injectées |
| `~/.ssh/authorized_keys` | Clés SSH backdoor | Supprimer les clés non autorisées |
| `/etc/ld.so.preload` | Détournement LD_PRELOAD | Supprimer les entrées preload malveillantes |
| `/etc/init.d/` | Scripts init SysV | Supprimer les scripts malveillants |

### Points de persistance macOS

| Emplacement | Technique | Action de nettoyage |
|----------|-----------|----------------|
| `~/Library/LaunchAgents/` | Plists LaunchAgent | Décharger et supprimer |
| `/Library/LaunchDaemons/` | Plists LaunchDaemon | Décharger et supprimer |
| `~/Library/Application Support/` | Éléments de connexion | Supprimer les éléments malveillants |
| `/Library/StartupItems/` | Éléments de démarrage | Supprimer |
| `~/.zshrc`, `~/.bash_profile` | Injection dans les RC shell | Supprimer les lignes injectées |
| Keychain | Abus du trousseau | Alerter (pas de nettoyage automatique) |

### Points de persistance Windows

| Emplacement | Technique | Action de nettoyage |
|----------|-----------|----------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | Clés de registre Run | Supprimer les valeurs malveillantes |
| `HKLM\SYSTEM\CurrentControlSet\Services` | Services malveillants | Arrêter, désactiver et supprimer |
| Dossier `Startup` | Raccourcis de démarrage | Supprimer les raccourcis malveillants |
| Planificateur de tâches | Tâches planifiées | Supprimer les tâches malveillantes |
| Abonnements WMI | Consommateurs d'événements WMI | Supprimer les abonnements malveillants |

::: warning
Le nettoyage de la persistance modifie les fichiers de configuration système et les entrées de registre. Examinez le journal de nettoyage dans `~/.prx-sd/remediation.log` après chaque opération pour vérifier que seules les entrées malveillantes ont été supprimées.
:::

## Isolation réseau

Pour les menaces critiques (ransomwares actifs, exfiltration de données), PRX-SD peut isoler la machine du réseau :

### Linux (iptables)

```bash
# PRX-SD ajoute ces règles automatiquement lors de l'isolation
iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD configure les règles pf
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

Lever l'isolation :

```bash
sd isolate lift
```

::: warning
L'isolation réseau bloque TOUT le trafic réseau, y compris SSH. Assurez-vous d'avoir un accès physique ou une console hors bande avant d'activer l'isolation réseau automatique.
:::

## Journal de remédiation

Toutes les actions de remédiation sont journalisées dans `~/.prx-sd/remediation.log` :

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## Exemples

```bash
# Définir une politique agressive pour les serveurs
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# Définir une politique conservative pour les postes de travail
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# Analyser avec une remédiation explicite
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# Vérifier et lever l'isolation réseau
sd isolate status
sd isolate lift

# Afficher l'historique de remédiation
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## Étapes suivantes

- [Gestion de la quarantaine](/fr/prx-sd/quarantine/) -- gérer les fichiers mis en quarantaine
- [Protection contre les ransomwares](/fr/prx-sd/realtime/ransomware) -- réponse spécialisée aux ransomwares
- [Alertes webhook](/fr/prx-sd/alerts/webhook) -- notifier des actions de remédiation
- [Alertes e-mail](/fr/prx-sd/alerts/email) -- notifications par e-mail pour les menaces
