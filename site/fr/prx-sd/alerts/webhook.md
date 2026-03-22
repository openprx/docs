---
title: Alertes webhook
description: "Configurer les notifications webhook pour les détections de menaces, les événements de quarantaine et les résultats d'analyse dans PRX-SD."
---

# Alertes webhook

PRX-SD peut envoyer des notifications en temps réel à des points de terminaison webhook lorsque des menaces sont détectées, des fichiers sont mis en quarantaine ou des analyses se terminent. Les webhooks s'intègrent avec Slack, Discord, Microsoft Teams, PagerDuty ou tout point de terminaison HTTP personnalisé.

## Utilisation

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### Sous-commandes

| Sous-commande | Description |
|--------------|-------------|
| `add` | Enregistrer un nouveau point de terminaison webhook |
| `remove` | Supprimer un webhook enregistré |
| `list` | Lister tous les webhooks enregistrés |
| `test` | Envoyer une notification de test à un webhook |

## Ajouter des webhooks

```bash
sd webhook add [OPTIONS] <URL>
```

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--format` | `-f` | `generic` | Format de charge utile : `slack`, `discord`, `teams`, `generic` |
| `--name` | `-n` | auto | Nom lisible par l'humain pour ce webhook |
| `--events` | `-e` | tous | Événements séparés par des virgules à notifier |
| `--secret` | `-s` | | Secret de signature HMAC-SHA256 pour la vérification de la charge utile |
| `--min-severity` | | `suspicious` | Sévérité minimale à déclencher : `suspicious`, `malicious` |

### Événements pris en charge

| Événement | Description |
|-----------|-------------|
| `threat_detected` | Un fichier malveillant ou suspect a été trouvé |
| `file_quarantined` | Un fichier a été déplacé en quarantaine |
| `scan_completed` | Une tâche d'analyse s'est terminée |
| `update_completed` | Mise à jour des signatures terminée |
| `ransomware_alert` | Comportement de ransomware détecté |
| `daemon_status` | Le démon a démarré, s'est arrêté ou a rencontré une erreur |

### Exemples

```bash
# Ajouter un webhook Slack
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# Ajouter un webhook Discord
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# Ajouter un webhook générique avec signature HMAC
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# Ajouter un webhook pour les alertes malveillantes uniquement
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## Lister les webhooks

```bash
sd webhook list
```

```
Registered Webhooks (3)

Name              Format    Events              Min Severity  URL
security-alerts   slack     all                 suspicious    https://hooks.slack.com/...XXXX
av-alerts         discord   all                 suspicious    https://discord.com/...defg
siem-ingest       generic   all                 suspicious    https://siem.example.com/...
```

## Supprimer des webhooks

```bash
# Supprimer par nom
sd webhook remove security-alerts

# Supprimer par URL
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## Tester les webhooks

Envoyer une notification de test pour vérifier la connectivité :

```bash
# Tester un webhook spécifique
sd webhook test security-alerts

# Tester tous les webhooks
sd webhook test --all
```

Le test envoie une charge utile de détection de menace exemple pour que vous puissiez vérifier le formatage et la livraison.

## Formats de charge utile

### Format générique

Le format `generic` par défaut envoie une charge utile JSON via HTTP POST :

```json
{
  "event": "threat_detected",
  "timestamp": "2026-03-21T10:15:32Z",
  "hostname": "web-server-01",
  "threat": {
    "file": "/tmp/payload.exe",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "size": 245760,
    "severity": "malicious",
    "detection": {
      "engine": "yara",
      "rule": "Win_Trojan_AgentTesla",
      "source": "neo23x0/signature-base"
    }
  },
  "action_taken": "quarantined",
  "quarantine_id": "a1b2c3d4"
}
```

En-têtes inclus avec les charges utiles génériques :

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (si secret configuré)
```

### Format Slack

Les webhooks Slack reçoivent un message formaté avec une sévérité codée par couleur :

```json
{
  "attachments": [{
    "color": "#ff0000",
    "title": "Threat Detected: Win_Trojan_AgentTesla",
    "fields": [
      {"title": "File", "value": "/tmp/payload.exe", "short": false},
      {"title": "Severity", "value": "MALICIOUS", "short": true},
      {"title": "Action", "value": "Quarantined", "short": true},
      {"title": "Host", "value": "web-server-01", "short": true},
      {"title": "SHA-256", "value": "`e3b0c44298fc...`", "short": false}
    ],
    "ts": 1742554532
  }]
}
```

### Format Discord

Les webhooks Discord utilisent le format embeds :

```json
{
  "embeds": [{
    "title": "Threat Detected",
    "description": "**Win_Trojan_AgentTesla** found in `/tmp/payload.exe`",
    "color": 16711680,
    "fields": [
      {"name": "Severity", "value": "MALICIOUS", "inline": true},
      {"name": "Action", "value": "Quarantined", "inline": true},
      {"name": "Host", "value": "web-server-01", "inline": true}
    ],
    "timestamp": "2026-03-21T10:15:32Z"
  }]
}
```

## Fichier de configuration

Les webhooks peuvent également être configurés dans `~/.prx-sd/config.toml` :

```toml
[[webhook]]
name = "security-alerts"
url = "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
format = "slack"
events = ["threat_detected", "ransomware_alert", "file_quarantined"]
min_severity = "suspicious"

[[webhook]]
name = "siem-ingest"
url = "https://siem.example.com/api/v1/alerts"
format = "generic"
secret = "my-hmac-secret"
events = ["threat_detected"]
min_severity = "malicious"
```

::: tip
Les secrets de webhook sont stockés chiffrés dans le fichier de configuration. Utilisez `sd webhook add --secret` pour les définir de manière sécurisée plutôt que de modifier directement le fichier de configuration.
:::

## Comportement de réessai

Les livraisons de webhook échouées sont réessayées avec un backoff exponentiel :

| Tentative | Délai |
|-----------|-------|
| 1er réessai | 5 secondes |
| 2ème réessai | 30 secondes |
| 3ème réessai | 5 minutes |
| 4ème réessai | 30 minutes |
| (abandon) | Événement journalisé comme non livrable |

## Étapes suivantes

- [Alertes e-mail](./email) -- configuration des notifications par e-mail
- [Analyses planifiées](./schedule) -- configurer des tâches d'analyse récurrentes
- [Réponse aux menaces](/fr/prx-sd/remediation/) -- configurer la remédiation automatisée
- [Démon](/fr/prx-sd/realtime/daemon) -- surveillance en arrière-plan avec alertes
