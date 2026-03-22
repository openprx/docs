---
title: Alertes e-mail
description: "Configurer les notifications par e-mail pour les détections de menaces et les résultats d'analyse dans PRX-SD."
---

# Alertes e-mail

PRX-SD peut envoyer des notifications par e-mail lorsque des menaces sont détectées, des analyses se terminent ou des événements critiques surviennent. Les alertes par e-mail complètent les webhooks pour les environnements où l'e-mail est le principal canal de communication ou pour joindre le personnel d'astreinte.

## Utilisation

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### Sous-commandes

| Sous-commande | Description |
|--------------|-------------|
| `configure` | Configurer le serveur SMTP et les paramètres des destinataires |
| `test` | Envoyer un e-mail de test pour vérifier la configuration |
| `send` | Envoyer manuellement un e-mail d'alerte |
| `status` | Afficher l'état actuel de la configuration e-mail |

## Configurer l'e-mail

### Configuration interactive

```bash
sd email-alert configure
```

L'assistant interactif demande :

```
SMTP Server: smtp.gmail.com
SMTP Port [587]: 587
Use TLS [yes]: yes
Username: alerts@example.com
Password: ********
From Address [alerts@example.com]: prx-sd@example.com
From Name [PRX-SD]: PRX-SD Scanner
Recipients (comma-separated): security@example.com, oncall@example.com
Min Severity [suspicious]: malicious
```

### Configuration en ligne de commande

```bash
sd email-alert configure \
  --smtp-server smtp.gmail.com \
  --smtp-port 587 \
  --tls true \
  --username alerts@example.com \
  --password "app-password-here" \
  --from "prx-sd@example.com" \
  --from-name "PRX-SD Scanner" \
  --to "security@example.com,oncall@example.com" \
  --min-severity malicious
```

### Fichier de configuration

Les paramètres e-mail sont stockés dans `~/.prx-sd/config.toml` :

```toml
[email]
enabled = true
min_severity = "malicious"    # suspicious | malicious
events = ["threat_detected", "ransomware_alert", "scan_completed"]

[email.smtp]
server = "smtp.gmail.com"
port = 587
tls = true
username = "alerts@example.com"
# Password stored encrypted - use 'sd email-alert configure' to set

[email.message]
from_address = "prx-sd@example.com"
from_name = "PRX-SD Scanner"
recipients = ["security@example.com", "oncall@example.com"]
subject_prefix = "[PRX-SD]"
```

::: tip
Pour Gmail, utilisez un Mot de passe d'application au lieu de votre mot de passe de compte. Allez dans Compte Google > Sécurité > Validation en deux étapes > Mots de passe d'application pour en générer un.
:::

## Tester l'e-mail

Envoyez un e-mail de test pour vérifier votre configuration :

```bash
sd email-alert test
```

```
Sending test email to security@example.com, oncall@example.com...
  SMTP connection:  OK (smtp.gmail.com:587, TLS)
  Authentication:   OK
  Delivery:         OK (Message-ID: <prx-sd-test-a1b2c3@example.com>)

Test email sent successfully.
```

## Envoyer des alertes manuelles

Déclencher un e-mail d'alerte manuellement (utile pour tester les intégrations ou transmettre des résultats) :

```bash
# Envoyer une alerte concernant un fichier spécifique
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# Envoyer un résumé d'analyse
sd email-alert send --scan-report /tmp/scan-results.json
```

## Contenu des e-mails

### E-mail de détection de menace

```
Subject: [PRX-SD] MALICIOUS: Win_Trojan_AgentTesla detected on web-server-01

PRX-SD Threat Detection Alert
==============================

Host:       web-server-01
Timestamp:  2026-03-21 10:15:32 UTC
Severity:   MALICIOUS

File:       /tmp/payload.exe
SHA-256:    e3b0c44298fc1c149afbf4c8996fb924...
Size:       240 KB
Type:       PE32 executable (GUI) Intel 80386, for MS Windows

Detection:  Win_Trojan_AgentTesla
Engine:     YARA (neo23x0/signature-base)

Action Taken: Quarantined (ID: a1b2c3d4)

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

### E-mail de résumé d'analyse

```
Subject: [PRX-SD] Scan Complete: 3 threats found in /home

PRX-SD Scan Report
===================

Host:           web-server-01
Scan Path:      /home
Started:        2026-03-21 10:00:00 UTC
Completed:      2026-03-21 10:12:45 UTC
Duration:       12 minutes 45 seconds

Files Scanned:  45,231
Threats Found:  3

Detections:
  1. /home/user/downloads/crack.exe
     Severity: MALICIOUS | Detection: Win_Trojan_Agent
     Action: Quarantined

  2. /home/user/.cache/tmp/loader.sh
     Severity: MALICIOUS | Detection: Linux_Backdoor_Generic
     Action: Quarantined

  3. /home/user/scripts/util.py
     Severity: SUSPICIOUS | Detection: Heuristic_HighEntropy
     Action: Reported

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

## Événements pris en charge

| Événement | Inclus par défaut | Description |
|-----------|------------------|-------------|
| `threat_detected` | Oui | Fichier malveillant ou suspect trouvé |
| `ransomware_alert` | Oui | Comportement de ransomware détecté |
| `scan_completed` | Non | Tâche d'analyse terminée (uniquement si des menaces trouvées) |
| `update_completed` | Non | Mise à jour des signatures terminée |
| `update_failed` | Oui | Échec de la mise à jour des signatures |
| `daemon_error` | Oui | Le démon a rencontré une erreur critique |

Configurez les événements qui déclenchent des e-mails :

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## Limitation du débit

Pour éviter les inondations d'e-mails lors de grandes épidémies :

```toml
[email.rate_limit]
max_per_hour = 10            # Maximum emails per hour
digest_mode = true           # Batch multiple alerts into a single email
digest_interval_mins = 15    # Digest batch window
```

Lorsque `digest_mode` est activé, les alertes dans la fenêtre de résumé sont combinées en un seul e-mail de résumé au lieu d'envoyer des notifications individuelles.

## Vérifier l'état

```bash
sd email-alert status
```

```
Email Alert Status
  Enabled:      true
  SMTP Server:  smtp.gmail.com:587 (TLS)
  From:         prx-sd@example.com
  Recipients:   security@example.com, oncall@example.com
  Min Severity: malicious
  Events:       threat_detected, ransomware_alert, daemon_error
  Last Sent:    2026-03-21 10:15:32 UTC
  Emails Today: 2
```

## Étapes suivantes

- [Alertes webhook](./webhook) -- notifications webhook en temps réel
- [Analyses planifiées](./schedule) -- automatiser les analyses récurrentes
- [Réponse aux menaces](/fr/prx-sd/remediation/) -- politiques de remédiation automatisée
- [Démon](/fr/prx-sd/realtime/daemon) -- protection en arrière-plan avec alertes
