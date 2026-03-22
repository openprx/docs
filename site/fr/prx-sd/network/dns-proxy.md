---
title: Proxy DNS
description: "Exécuter un proxy DNS local qui combine le filtrage adblock, les flux de domaines IOC et les listes de blocage personnalisées dans un seul résolveur avec journalisation complète des requêtes."
---

# Proxy DNS

La commande `sd dns-proxy` démarre un serveur proxy DNS local qui intercepte les requêtes DNS et les filtre à travers trois moteurs avant de les transmettre à un résolveur en amont :

1. **Moteur adblock** -- bloque les publicités, les traceurs et les domaines malveillants des listes de filtres
2. **Flux de domaines IOC** -- bloque les domaines des indicateurs de compromission du renseignement sur les menaces
3. **Liste de blocage DNS personnalisée** -- bloque les domaines des listes définies par l'utilisateur

Les requêtes qui correspondent à n'importe quel filtre reçoivent `0.0.0.0` en réponse (NXDOMAIN). Toutes les autres requêtes sont transmises au serveur DNS en amont configuré. Chaque requête et son état de résolution est journalisé dans un fichier JSONL.

## Démarrage rapide

```bash
# Démarrer le proxy DNS avec les valeurs par défaut (écoute 127.0.0.1:53, amont 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
Le proxy écoute sur le port 53 par défaut, ce qui nécessite des privilèges root. Pour les tests sans privilèges, utilisez un port élevé comme `--listen 127.0.0.1:5353`.
:::

## Options de la commande

```bash
sd dns-proxy [OPTIONS]
```

| Option | Défaut | Description |
|--------|---------|-------------|
| `--listen` | `127.0.0.1:53` | Adresse et port à écouter |
| `--upstream` | `8.8.8.8:53` | Serveur DNS en amont vers lequel transmettre les requêtes non bloquées |
| `--log-path` | `/tmp/prx-sd-dns.log` | Chemin du fichier journal JSONL des requêtes |

## Exemples d'utilisation

### Utilisation de base

Démarrer le proxy sur l'adresse par défaut avec Google DNS en amont :

```bash
sudo sd dns-proxy
```

Sortie :

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### Adresse d'écoute et DNS en amont personnalisés

Utiliser Cloudflare DNS en amont et écouter sur un port personnalisé :

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### Chemin de journal personnalisé

Écrire les journaux de requêtes à un emplacement spécifique :

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### Combinaison avec adblock

Le proxy DNS charge automatiquement les listes de filtres adblock depuis `~/.prx-sd/adblock/`. Pour une meilleure couverture :

```bash
# Étape 1 : Activer et synchroniser les listes adblock
sudo sd adblock enable
sd adblock sync

# Étape 2 : Démarrer le proxy DNS (il récupère les règles adblock automatiquement)
sudo sd dns-proxy
```

Le proxy lit les mêmes listes de filtres mises en cache utilisées par `sd adblock`. Toutes les listes ajoutées via `sd adblock add` sont automatiquement disponibles pour le proxy après son redémarrage.

## Configurer votre système pour utiliser le proxy

### Linux (systemd-resolved)

Modifiez `/etc/systemd/resolved.conf` :

```ini
[Resolve]
DNS=127.0.0.1
```

Puis redémarrez :

```bash
sudo systemctl restart systemd-resolved
```

### Linux (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

Pour rétablir :

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
Rediriger tout le trafic DNS vers le proxy local signifie que si le proxy est arrêté, la résolution DNS échouera jusqu'à ce que vous restauriez les paramètres originaux ou redémarriez le proxy.
:::

## Format des journaux

Le proxy DNS écrit des lignes JSONL (un objet JSON par ligne) dans le chemin de journal configuré. Chaque entrée contient :

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| Champ | Description |
|-------|-------------|
| `timestamp` | Horodatage ISO 8601 de la requête |
| `query` | Le nom de domaine interrogé |
| `type` | Type d'enregistrement DNS (A, AAAA, CNAME, etc.) |
| `action` | `blocked` ou `forwarded` |
| `filter` | Quel filtre a correspondu : `adblock`, `ioc`, `blocklist` ou `null` |
| `upstream_ms` | Temps aller-retour vers le DNS en amont (null si bloqué) |

## Architecture

```
Requête DNS client (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> bloqué? --> répondre 0.0.0.0
  |  2. Domaines IOC |---> bloqué? --> répondre 0.0.0.0
  |  3. Liste DNS    |---> bloqué? --> répondre 0.0.0.0
  |                  |
  |  Non bloqué :    |
  |  Transmettre au  |---> DNS en amont (ex. 8.8.8.8)
  |  DNS en amont    |<--- réponse
  |                  |
  |  Journaliser JSONL|
  +------------------+
        |
        v
  Le client reçoit la réponse
```

## Exécuter en tant que service

Pour exécuter le proxy DNS comme service systemd persistant :

```bash
# Créer un fichier d'unité systemd
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
Pour une expérience en arrière-plan entièrement gérée, envisagez d'utiliser `sd daemon` à la place, qui combine la surveillance de fichiers en temps réel, les mises à jour automatiques des signatures et peut être étendu pour inclure la fonctionnalité de proxy DNS.
:::

## Étapes suivantes

- Configurez les [listes de filtres adblock](./adblock) pour un blocage complet des domaines
- Configurez la [Surveillance en temps réel](../realtime/) pour la protection du système de fichiers aux côtés du filtrage DNS
- Consultez la [Référence de configuration](../configuration/reference) pour les paramètres liés au proxy
