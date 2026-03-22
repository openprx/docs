---
title: Configuration SSL/TLS
description: "Configurer HTTPS dans PRX-WAF avec les certificats Let's Encrypt automatiques, la gestion manuelle des certificats, le support HTTP/3 QUIC et les meilleures pratiques TLS."
---

# Configuration SSL/TLS

PRX-WAF prend en charge la gestion automatique des certificats TLS via Let's Encrypt (ACME v2), la configuration manuelle des certificats et HTTP/3 via QUIC. Cette page couvre toute la configuration liée à HTTPS.

## Certificats automatiques (Let's Encrypt)

PRX-WAF utilise la bibliothèque `instant-acme` pour obtenir et renouveler automatiquement les certificats TLS depuis Let's Encrypt. Lorsqu'un hôte est configuré avec SSL activé, PRX-WAF va :

1. Répondre aux défis ACME HTTP-01 sur le port 80
2. Obtenir un certificat depuis Let's Encrypt
3. Stocker le certificat dans la base de données
4. Renouveler automatiquement avant expiration

::: tip
Pour que les certificats automatiques fonctionnent, le port 80 doit être accessible depuis Internet pour la validation du défi ACME HTTP-01.
:::

## Certificats manuels

Pour les environnements où l'ACME automatique n'est pas approprié, configurez les certificats manuellement :

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

Vous pouvez également télécharger des certificats via l'interface d'administration :

1. Naviguez vers **Certificats SSL** dans la barre latérale
2. Cliquez sur **Télécharger un certificat**
3. Fournissez la chaîne de certificats (PEM) et la clé privée (PEM)
4. Associez le certificat à un hôte

Ou via l'API :

```bash
curl -X POST http://localhost:9527/api/certificates \
  -H "Authorization: Bearer $TOKEN" \
  -F "cert=@/path/to/cert.pem" \
  -F "key=@/path/to/key.pem" \
  -F "host=example.com"
```

## Écouteur TLS

PRX-WAF écoute le trafic HTTPS sur l'adresse TLS configurée :

```toml
[proxy]
listen_addr     = "0.0.0.0:80"      # HTTP
listen_addr_tls = "0.0.0.0:443"     # HTTPS
```

## HTTP/3 (QUIC)

PRX-WAF prend en charge HTTP/3 via la bibliothèque Quinn QUIC. Activez-le dans la configuration :

```toml
[http3]
enabled     = true
listen_addr = "0.0.0.0:443"
cert_pem    = "/etc/prx-waf/tls/cert.pem"
key_pem     = "/etc/prx-waf/tls/key.pem"
```

::: warning
HTTP/3 nécessite un certificat TLS valide. Les chemins de cert et de clé doivent être fournis lorsque HTTP/3 est activé. Les certificats Let's Encrypt automatiques sont également pris en charge pour HTTP/3.
:::

HTTP/3 s'exécute sur UDP sur le même port que HTTPS (443). Les clients qui prennent en charge QUIC se mettront automatiquement à niveau, tandis que les autres se replieront sur HTTP/2 ou HTTP/1.1 sur TCP.

## Redirection HTTPS

Pour rediriger tout le trafic HTTP vers HTTPS, configurez vos hôtes avec le port 80 (HTTP) et le port 443 (HTTPS). PRX-WAF redirigera automatiquement les requêtes HTTP vers leurs équivalents HTTPS lorsque SSL est configuré pour un hôte.

## Stockage des certificats

Tous les certificats (automatiques et manuels) sont stockés dans la base de données PostgreSQL. La table `certificates` (migration `0003`) contient :

- Chaîne de certificats (PEM)
- Clé privée (chiffrée avec AES-256-GCM)
- Nom de domaine
- Date d'expiration
- Informations de compte ACME (pour le renouvellement automatique)

::: info
Les clés privées sont chiffrées au repos en utilisant AES-256-GCM. La clé de chiffrement est dérivée de la configuration. Ne stockez jamais de clés privées non chiffrées dans la base de données.
:::

## Docker avec HTTPS

Lors de l'exécution dans Docker, mappez le port 443 pour le trafic TLS :

```yaml
# docker-compose.yml
services:
  prx-waf:
    ports:
      - "80:80"
      - "443:443"
      - "9527:9527"
```

Pour HTTP/3, mappez également le port UDP :

```yaml
    ports:
      - "80:80"
      - "443:443/tcp"
      - "443:443/udp"  # HTTP/3 QUIC
      - "9527:9527"
```

## Meilleures pratiques

1. **Utilisez toujours HTTPS en production.** HTTP ne doit servir que les défis ACME et rediriger vers HTTPS.

2. **Activez HTTP/3** pour les clients qui le prennent en charge. QUIC offre une établissement de connexion plus rapide et de meilleures performances sur les réseaux à pertes.

3. **Utilisez les certificats automatiques** lorsque possible. Les certificats Let's Encrypt sont gratuits, approuvés par tous les navigateurs et renouvelés automatiquement par PRX-WAF.

4. **Restreignez l'accès à l'API d'administration.** L'API d'administration ne doit être accessible que depuis des réseaux de confiance :

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12"]
```

## Étapes suivantes

- [Proxy inverse](./reverse-proxy) -- Routage backend et configuration des hôtes
- [Présentation de la passerelle](./index) -- Mise en cache des réponses et tunnels
- [Mode cluster](../cluster/) -- TLS multi-nœuds avec certificats mTLS
