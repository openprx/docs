---
title: Application de bureau (GUI)
description: "PRX-SD est livré avec une application de bureau multiplateforme construite avec Tauri 2 et Vue 3, avec intégration dans la barre système, analyse par glisser-déposer et un tableau de bord en temps réel."
---

# Application de bureau (GUI)

PRX-SD inclut une application de bureau multiplateforme construite avec **Tauri 2** (backend Rust) et **Vue 3** (frontend TypeScript). L'interface graphique fournit une interface visuelle à toutes les fonctionnalités principales du moteur sans nécessiter la ligne de commande.

## Architecture

```
+----------------------------------------------+
|              PRX-SD Desktop App               |
|                                               |
|   Vue 3 Frontend          Tauri 2 Backend     |
|   (Vite + TypeScript)     (Rust + IPC)        |
|                                               |
|   +------------------+   +-----------------+  |
|   | Dashboard        |<->| scan_path()     |  |
|   | File Scanner     |   | scan_directory()|  |
|   | Quarantine Mgmt  |   | get_config()    |  |
|   | Config Editor    |   | save_config()   |  |
|   | Signature Update |   | update_sigs()   |  |
|   | Alert History    |   | get_alerts()    |  |
|   | Adblock Panel    |   | adblock_*()     |  |
|   | Monitor Control  |   | start/stop()    |  |
|   +------------------+   +-----------------+  |
|                                               |
|   Icône de la barre système (32x32)           |
+----------------------------------------------+
```

Le backend Tauri expose 18 commandes IPC que le frontend Vue appelle pour interagir avec le moteur d'analyse, le coffre-fort de quarantaine, la base de données de signatures et le moteur de filtres adblock. Tout le travail lourd (analyse, correspondance YARA, recherches de hachages) s'exécute en Rust ; le frontend ne gère que l'affichage.

## Fonctionnalités

### Tableau de bord en temps réel

Le tableau de bord affiche l'état de sécurité en un coup d'œil :

- **Nombre total d'analyses** effectuées
- **Nombre de menaces trouvées**
- **Nombre de fichiers mis en quarantaine**
- **Heure de la dernière analyse**
- **État de la surveillance** (actif/inactif)
- **Graphique d'historique d'analyse** (7 derniers jours)
- **Liste des menaces récentes** avec chemins, noms des menaces et niveaux de sévérité

<!-- Screenshot placeholder: dashboard.png -->

### Analyse par glisser-déposer

Déposez des fichiers ou des dossiers sur la fenêtre de l'application pour démarrer immédiatement une analyse. Les résultats apparaissent dans un tableau triable avec des colonnes pour le chemin, le niveau de menace, le type de détection, le nom de la menace et l'heure d'analyse.

<!-- Screenshot placeholder: scan-results.png -->

### Gestion de la quarantaine

Affichez, restaurez et supprimez les fichiers mis en quarantaine via une interface visuelle :

- Tableau triable avec ID, chemin original, nom de la menace, date et taille du fichier
- Restauration en un clic à l'emplacement d'origine
- Suppression permanente en un clic
- Statistiques du coffre-fort (nombre total de fichiers, taille totale, entrée la plus ancienne/récente)

### Éditeur de configuration

Modifiez tous les paramètres du moteur via une interface basée sur des formulaires. Les modifications sont écrites dans `~/.prx-sd/config.json` et prennent effet à la prochaine analyse.

### Mises à jour des signatures

Déclenchez les mises à jour de la base de données de signatures depuis l'interface graphique. Le backend télécharge le dernier manifeste, vérifie l'intégrité SHA-256 et installe la mise à jour. Le moteur est automatiquement réinitialisé avec les nouvelles signatures.

### Panneau adblock

Gérez le blocage des publicités et des domaines malveillants :

- Activer/désactiver la protection adblock
- Synchroniser les listes de filtres
- Vérifier des domaines individuels
- Afficher le journal de blocage (50 dernières entrées)
- Afficher la configuration des listes et les statistiques

### Barre système

PRX-SD réside dans la barre système avec une icône persistante, offrant un accès rapide à :

- Ouvrir la fenêtre principale
- Démarrer/arrêter la surveillance en temps réel
- Vérifier l'état du démon
- Déclencher une analyse rapide
- Quitter l'application

::: tip
L'icône de la barre système est configurée à 32x32 pixels. Sur les écrans haute résolution (HiDPI), Tauri utilise automatiquement la variante `128x128@2x.png`.
:::

## Compiler depuis les sources

### Prérequis

- **Rust** 1.85.0 ou ultérieur
- **Node.js** 18+ avec npm
- **Dépendances système** (Linux) :

```bash
# Debian/Ubuntu
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel
```

### Mode développement

Exécutez le serveur de développement frontend et le backend Tauri ensemble avec le rechargement à chaud :

```bash
cd gui
npm install
npm run tauri dev
```

Cela démarre :
- Le serveur de développement Vite à `http://localhost:1420`
- Le backend Tauri qui charge l'URL de développement

### Build de production

Compilez le bundle d'application distribuable :

```bash
cd gui
npm install
npm run tauri build
```

La sortie de build varie selon la plateforme :

| Plateforme | Sortie |
|----------|--------|
| Linux | `.deb`, `.AppImage`, `.rpm` dans `src-tauri/target/release/bundle/` |
| macOS | `.dmg`, `.app` dans `src-tauri/target/release/bundle/` |
| Windows | `.msi`, `.exe` dans `src-tauri\target\release\bundle\` |

## Configuration de l'application

L'application Tauri est configurée via `gui/src-tauri/tauri.conf.json` :

```json
{
  "productName": "PRX-SD",
  "version": "0.1.0",
  "identifier": "com.prxsd.app",
  "app": {
    "windows": [
      {
        "title": "PRX-SD Antivirus",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "center": true,
        "resizable": true
      }
    ],
    "trayIcon": {
      "id": "main-tray",
      "iconPath": "icons/32x32.png",
      "tooltip": "PRX-SD Antivirus"
    }
  }
}
```

## Commandes IPC

Le backend expose ces commandes Tauri au frontend :

| Commande | Description |
|---------|-------------|
| `scan_path` | Analyser un fichier ou répertoire, retourner les résultats |
| `scan_directory` | Analyser un répertoire de manière récursive |
| `start_monitor` | Valider et démarrer la surveillance en temps réel |
| `stop_monitor` | Arrêter le démon de surveillance |
| `get_quarantine_list` | Lister toutes les entrées en quarantaine |
| `restore_quarantine` | Restaurer un fichier en quarantaine par ID |
| `delete_quarantine` | Supprimer une entrée de quarantaine par ID |
| `get_config` | Lire la configuration d'analyse actuelle |
| `save_config` | Écrire la configuration d'analyse sur le disque |
| `get_engine_info` | Obtenir la version du moteur, le nombre de signatures, les règles YARA |
| `update_signatures` | Télécharger et installer les dernières signatures |
| `get_alert_history` | Lire l'historique des alertes depuis les journaux d'audit |
| `get_dashboard_stats` | Agréger les statistiques du tableau de bord |
| `get_adblock_stats` | Obtenir l'état d'adblock et le nombre de règles |
| `adblock_enable` | Activer le blocage publicitaire via le fichier hosts |
| `adblock_disable` | Désactiver le blocage publicitaire via le fichier hosts |
| `adblock_sync` | Re-télécharger les listes de filtres |
| `adblock_check` | Vérifier si un domaine est bloqué |
| `get_adblock_log` | Lire les entrées récentes du journal de blocage |

## Répertoire de données

L'interface graphique utilise le même répertoire de données `~/.prx-sd/` que la CLI. Les modifications de configuration effectuées dans l'interface graphique sont visibles par les commandes `sd` et vice versa.

::: warning
L'interface graphique et la CLI partagent le même état du moteur d'analyse. Si le démon est en cours d'exécution via `sd daemon`, le bouton "Démarrer la surveillance" de l'interface graphique valide l'état de préparation mais la surveillance réelle est gérée par le processus démon. Évitez d'exécuter simultanément le scanner de l'interface graphique et le scanner démon sur les mêmes fichiers.
:::

## Stack technologique

| Composant | Technologie |
|-----------|-----------|
| Backend | Tauri 2, Rust |
| Frontend | Vue 3, TypeScript, Vite 6 |
| IPC | Protocole de commande Tauri |
| Barre système | Plugin de barre système Tauri |
| Bundler | Bundler Tauri (deb/AppImage/dmg/msi) |
| Liaisons API | `@tauri-apps/api` v2 |

## Étapes suivantes

- Installez PRX-SD en suivant le [Guide d'installation](../getting-started/installation)
- Apprenez à utiliser la [CLI](../cli/) pour les scripts et l'automatisation
- Configurez le moteur via la [Référence de configuration](../configuration/reference)
- Étendez la détection avec les [Plugins WASM](../plugins/)
