---
title: Tunnel et traversee NAT
description: Apercu du systeme de tunneling de PRX pour exposer les instances d'agent locales aux webhooks, canaux et services externes.
---

# Tunnel et traversee NAT

Les agents PRX ont souvent besoin de recevoir des connexions entrantes -- callbacks de webhooks de GitHub, mises a jour Telegram, evenements Slack ou communication inter-noeuds. Lorsqu'il s'execute derriere un NAT ou un pare-feu, le sous-systeme de tunnel fournit une entree automatique en etablissant une connexion sortante vers un fournisseur de tunnel et en mappant une URL publique vers votre instance PRX locale.

## Pourquoi le tunneling est important

De nombreuses fonctionnalites PRX necessitent un endpoint accessible publiquement :

- **Canaux webhook** -- Telegram, Discord, Slack et GitHub poussent tous des evenements vers une URL que vous fournissez. Sans endpoint public, ces canaux ne peuvent pas livrer de messages a votre agent.
- **Callbacks OAuth2** -- Les flux d'authentification des fournisseurs redirigent le navigateur vers une URL locale. Les tunnels rendent cela possible meme lorsque PRX s'execute sur un reseau prive.
- **Communication noeud a noeud** -- Les deploiements PRX distribues necessitent que les noeuds puissent se joindre mutuellement. Les tunnels relient les noeuds a travers differents reseaux.
- **Hebergement de serveur MCP** -- Lorsque PRX agit comme serveur MCP pour des clients externes, le tunnel fournit l'endpoint public.

## Backends pris en charge

PRX est livre avec quatre backends de tunnel et un repli no-op :

| Backend | Fournisseur | Niveau gratuit | Domaine personnalise | Auth requise | Zero-Trust |
|---------|-------------|---------------|---------------------|-------------|------------|
| [Tunnel Cloudflare](./cloudflare) | Cloudflare | Oui | Oui (avec zone) | Oui (`cloudflared`) | Oui |
| [Tailscale Funnel](./tailscale) | Tailscale | Oui (personnel) | Via MagicDNS | Oui (compte Tailscale) | Oui |
| [ngrok](./ngrok) | ngrok | Oui (limite) | Oui (payant) | Oui (token auth) | Non |
| Commande personnalisee | Tout | Depend | Depend | Depend | Depend |
| Aucun | -- | -- | -- | -- | -- |

## Architecture

Le sous-systeme de tunnel est construit autour du trait `Tunnel` :

```rust
#[async_trait]
pub trait Tunnel: Send + Sync {
    /// Start the tunnel and return the public URL.
    async fn start(&mut self) -> Result<String>;

    /// Stop the tunnel and clean up resources.
    async fn stop(&mut self) -> Result<()>;

    /// Check if the tunnel is healthy and the public URL is reachable.
    async fn health_check(&self) -> Result<bool>;
}
```

Chaque backend implemente ce trait. La structure `TunnelProcess` gere le processus enfant sous-jacent (ex. `cloudflared`, `tailscale`, `ngrok`) -- gerant le lancement, la capture stdout/stderr, l'arret gracieux et le redemarrage automatique en cas d'echec.

```
┌─────────────────────────────────────────────┐
│                Passerelle PRX                │
│            (localhost:8080)                   │
└──────────────────┬──────────────────────────┘
                   │ (local)
┌──────────────────▼──────────────────────────┐
│              TunnelProcess                   │
│  ┌──────────────────────────────────┐       │
│  │  cloudflared / tailscale / ngrok │       │
│  │  (processus enfant)              │       │
│  └──────────────┬───────────────────┘       │
└─────────────────┼───────────────────────────┘
                  │ (TLS sortant)
┌─────────────────▼───────────────────────────┐
│     Reseau peripherique du fournisseur       │
│    https://votre-agent.example.com           │
└──────────────────────────────────────────────┘
```

## Configuration

Configurez le tunnel dans `config.toml` :

```toml
[tunnel]
# Backend selection: "cloudflare" | "tailscale" | "ngrok" | "custom" | "none"
backend = "cloudflare"

# Local address that the tunnel will forward traffic to.
# This should match your gateway listen address.
local_addr = "127.0.0.1:8080"

# Health check interval in seconds. The tunnel is restarted if
# the health check fails consecutively for `max_failures` times.
health_check_interval_secs = 30
max_failures = 3

# Auto-detect: if backend = "auto", PRX probes for available
# tunnel binaries in order: cloudflared, tailscale, ngrok.
# Falls back to "none" with a warning if nothing is found.
```

### Configuration specifique au backend

Chaque backend a sa propre section de configuration. Consultez les pages individuelles des backends pour les details :

- [Tunnel Cloudflare](./cloudflare) -- `[tunnel.cloudflare]`
- [Tailscale Funnel](./tailscale) -- `[tunnel.tailscale]`
- [ngrok](./ngrok) -- `[tunnel.ngrok]`

### Backend par commande personnalisee

Pour les fournisseurs de tunnel non nativement pris en charge, utilisez le backend `custom` :

```toml
[tunnel]
backend = "custom"

[tunnel.custom]
# The command to run. Must accept traffic on local_addr and print
# the public URL to stdout within startup_timeout_secs.
command = "bore"
args = ["local", "8080", "--to", "bore.pub"]
startup_timeout_secs = 15

# Optional: regex to extract the public URL from stdout.
# The first capture group is used as the URL.
url_pattern = "listening at (https?://[\\S]+)"
```

## Auto-detection

Lorsque `backend = "auto"`, PRX recherche les binaires de tunnel dans `$PATH` dans cet ordre :

1. `cloudflared` -- prefere pour ses capacites zero-trust
2. `tailscale` -- prefere pour le reseau mesh prive
3. `ngrok` -- largement disponible, configuration facile

Si aucun n'est trouve, le tunnel est desactive et PRX journalise un avertissement. Les canaux dependant des webhooks ne fonctionneront pas sans tunnel ni IP publique.

## Cycle de vie de TunnelProcess

La structure `TunnelProcess` gere le cycle de vie du processus enfant :

| Phase | Description |
|-------|-------------|
| **Lancement** | Demarrer le binaire de tunnel avec les arguments configures |
| **Extraction d'URL** | Analyser stdout pour l'URL publique (dans le delai `startup_timeout_secs`) |
| **Surveillance** | Verifications de sante periodiques via HTTP GET vers l'URL publique |
| **Redemarrage** | Si `max_failures` verifications de sante consecutives echouent, arreter et redemarrer |
| **Arret** | Envoyer SIGTERM, attendre 5 secondes, puis SIGKILL si toujours en cours d'execution |

## Variables d'environnement

La configuration du tunnel peut egalement etre definie via des variables d'environnement, qui ont la priorite sur `config.toml` :

| Variable | Description |
|----------|-------------|
| `PRX_TUNNEL_BACKEND` | Remplacer le backend de tunnel |
| `PRX_TUNNEL_LOCAL_ADDR` | Remplacer l'adresse locale de redirection |
| `PRX_TUNNEL_URL` | Ignorer le demarrage du tunnel et utiliser cette URL |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token du Tunnel Cloudflare |
| `NGROK_AUTHTOKEN` | Token d'authentification ngrok |

Definir `PRX_TUNNEL_URL` est utile lorsque vous avez deja un reverse proxy ou un load balancer exposant PRX publiquement. Le sous-systeme de tunnel sautera la gestion des processus et utilisera directement l'URL fournie.

## Considerations de securite

- **Terminaison TLS** -- Tous les backends pris en charge terminent le TLS au niveau peripherique du fournisseur. Le trafic entre le fournisseur et votre instance PRX locale transite par un tunnel chiffre.
- **Controle d'acces** -- Cloudflare et Tailscale prennent en charge les politiques d'acces basees sur l'identite. Utilisez-les lors de l'exposition d'endpoints d'agent sensibles.
- **Stockage des identifiants** -- Les tokens de tunnel et les cles d'authentification sont stockes dans le gestionnaire de secrets PRX. Ne les commitez jamais dans le controle de version.
- **Isolation des processus** -- `TunnelProcess` s'execute comme processus enfant separe. Il ne partage pas la memoire avec le runtime de l'agent PRX.

## Depannage

| Symptome | Cause | Resolution |
|----------|-------|------------|
| Le tunnel demarre mais les webhooks echouent | URL non propagee a la config du canal | Verifiez que `tunnel.public_url` est utilise par le canal |
| Le tunnel redemarre en boucle | La verification de sante atteint le mauvais endpoint | Verifiez que `local_addr` correspond a l'adresse d'ecoute de votre passerelle |
| Erreur "binary not found" | CLI du tunnel non installe | Installez le binaire approprie (`cloudflared`, `tailscale`, `ngrok`) |
| Timeout lors de l'extraction d'URL | Le binaire de tunnel met trop de temps a demarrer | Augmentez `startup_timeout_secs` |

## Pages associees

- [Tunnel Cloudflare](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Configuration de la passerelle](/fr/prx/gateway)
- [Apercu de la securite](/fr/prx/security/)
