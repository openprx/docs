---
title: Développement de plugins WASM
description: "Étendre PRX-SD avec une logique de détection personnalisée en utilisant des plugins WebAssembly. Écrire des plugins en Rust, Go, C ou tout langage qui compile en WASM."
---

# Développement de plugins WASM

PRX-SD inclut un système de plugins propulsé par [Wasmtime](https://wasmtime.dev/) qui vous permet d'étendre le moteur de détection avec des scanners personnalisés écrits dans n'importe quel langage qui compile en WebAssembly (Rust, Go, C, AssemblyScript, etc.). Les plugins s'exécutent dans un environnement WASM sandboxé avec des limites de ressources configurables.

## Architecture

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # Manifeste du plugin
    my_scanner.wasm      # Module WASM compilé
  another-plugin/
    plugin.json
    another_plugin.wasm
```

Lorsque le moteur d'analyse démarre, le `PluginRegistry` parcourt le répertoire des plugins, charge chaque sous-répertoire contenant un `plugin.json`, compile le module WASM et appelle l'export `on_load` du plugin. Lors d'une analyse, chaque plugin dont les `file_types` et `platforms` correspondent au fichier actuel est invoqué en séquence.

### Flux d'exécution

1. **Découverte** -- `PluginRegistry` trouve les fichiers `plugin.json` dans `~/.prx-sd/plugins/`
2. **Compilation** -- Wasmtime compile le module `.wasm` avec la mesure de carburant et les limites mémoire
3. **Initialisation** -- `on_load()` est appelé ; `plugin_name()` et `plugin_version()` sont lus
4. **Analyse** -- Pour chaque fichier, `scan(ptr, len) -> score` est appelé avec les données du fichier
5. **Rapport** -- Les plugins appellent `report_finding()` pour enregistrer des menaces, ou retournent un score non nul

## Manifeste du plugin (`plugin.json`)

Chaque répertoire de plugin doit contenir un `plugin.json` qui décrit le plugin et ses contraintes de sandbox :

```json
{
  "name": "Example Scanner",
  "version": "0.1.0",
  "author": "prx-sd",
  "description": "Example plugin that detects MALICIOUS_MARKER string",
  "wasm_file": "example_plugin.wasm",
  "platforms": ["all"],
  "file_types": ["all"],
  "min_engine_version": "0.1.0",
  "permissions": {
    "network": false,
    "filesystem": false,
    "max_memory_mb": 64,
    "max_exec_ms": 5000
  }
}
```

### Champs du manifeste

| Champ | Type | Requis | Description |
|-------|------|----------|-------------|
| `name` | `string` | Oui | Nom lisible par l'humain du plugin |
| `version` | `string` | Oui | Version sémantique du plugin |
| `author` | `string` | Oui | Auteur ou organisation du plugin |
| `description` | `string` | Oui | Brève description de ce que le plugin détecte |
| `wasm_file` | `string` | Oui | Nom du fichier du module WASM compilé (relatif au répertoire du plugin) |
| `platforms` | `string[]` | Oui | Plateformes cibles : `"linux"`, `"macos"`, `"windows"`, ou `"all"` |
| `file_types` | `string[]` | Oui | Types de fichiers à inspecter : `"pe"`, `"elf"`, `"macho"`, `"pdf"`, ou `"all"` |
| `min_engine_version` | `string` | Oui | Version minimale du moteur PRX-SD requise |
| `permissions.network` | `boolean` | Non | Si le plugin peut accéder au réseau (défaut : `false`) |
| `permissions.filesystem` | `boolean` | Non | Si le plugin peut accéder au système de fichiers hôte via WASI (défaut : `false`) |
| `permissions.max_memory_mb` | `integer` | Non | Mémoire linéaire maximale en MiO (défaut : `64`) |
| `permissions.max_exec_ms` | `integer` | Non | Temps d'exécution maximum en ms (défaut : `5000`) |

## Exports WASM requis

Votre module WASM doit exporter les fonctions suivantes :

### `scan(ptr: i32, len: i32) -> i32`

Le point d'entrée principal d'analyse. Reçoit un pointeur et une longueur vers les données du fichier dans la mémoire invitée. Retourne un score de menace de 0 à 100 :

- `0` = sain
- `1-29` = informatif
- `30-59` = suspect
- `60-100` = malveillant

### `memory`

Le module doit exporter sa mémoire linéaire sous le nom `memory` pour que l'hôte puisse écrire les données de fichier et lire les résultats.

## Exports WASM optionnels

| Export | Signature | Description |
|--------|-----------|-------------|
| `on_load() -> i32` | `() -> i32` | Appelé une fois après la compilation. Retourner `0` pour succès. |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Écrire le nom du plugin dans le tampon. Retourner la longueur réelle. |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Écrire la version du plugin dans le tampon. Retourner la longueur réelle. |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | Allouer `size` octets de mémoire invitée. Retourner le pointeur. |

## Fonctions hôtes disponibles pour les plugins

L'hôte fournit ces fonctions dans l'espace de noms `"env"` :

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

Signaler une découverte de menace. Peut être appelé plusieurs fois lors d'une seule analyse.

- `name_ptr` / `name_len` -- pointeur et longueur de la chaîne du nom de la menace (ex. `"Trojan.Marker"`)
- `score` -- score de menace (0-100, écrêté)
- `detail_ptr` / `detail_len` -- pointeur et longueur d'une chaîne de détails

### `log_message(level, msg_ptr, msg_len)`

Écrire un message de journal dans le système de traçage du moteur.

- `level` -- `0`=trace, `1`=debug, `2`=info, `3`=warn, `4`=error
- `msg_ptr` / `msg_len` -- pointeur et longueur de la chaîne du message

### `get_file_path(buf_ptr, buf_len) -> actual_len`

Lire le chemin du fichier en cours d'analyse dans un tampon invité.

### `get_file_type(buf_ptr, buf_len) -> actual_len`

Lire le type de fichier détecté (ex. `"pe"`, `"elf"`, `"pdf"`) dans un tampon invité.

## Structure PluginFinding

Lorsqu'un plugin signale une découverte (soit via `report_finding()` soit en retournant un score non nul), le moteur crée un `PluginFinding` :

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // Name of the plugin
    pub threat_name: String,   // e.g. "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // Free-form detail string
}
```

Si le plugin retourne un score non nul mais n'appelle pas `report_finding()`, le moteur synthétise automatiquement une découverte :

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## Flux de développement

### 1. Créer le répertoire du plugin

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. Écrire le manifeste

```bash
cat > ~/.prx-sd/plugins/my-scanner/plugin.json << 'EOF'
{
  "name": "My Custom Scanner",
  "version": "0.1.0",
  "author": "your-name",
  "description": "Detects custom threat patterns",
  "wasm_file": "my_scanner.wasm",
  "platforms": ["all"],
  "file_types": ["all"],
  "min_engine_version": "0.1.0",
  "permissions": {
    "network": false,
    "filesystem": false,
    "max_memory_mb": 64,
    "max_exec_ms": 5000
  }
}
EOF
```

### 3. Écrire le plugin (exemple Rust)

Créer un nouveau projet de bibliothèque Rust :

```bash
cargo new --lib my-scanner
cd my-scanner
```

Ajouter dans `Cargo.toml` :

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

Écrire `src/lib.rs` :

```rust
// Host function imports
extern "C" {
    fn report_finding(
        name_ptr: *const u8, name_len: u32,
        score: u32,
        detail_ptr: *const u8, detail_len: u32,
    );
    fn log_message(level: u32, msg_ptr: *const u8, msg_len: u32);
}

#[no_mangle]
pub extern "C" fn on_load() -> i32 {
    let msg = b"My Custom Scanner loaded";
    unsafe { log_message(2, msg.as_ptr(), msg.len() as u32) };
    0 // success
}

#[no_mangle]
pub extern "C" fn scan(ptr: *const u8, len: u32) -> i32 {
    let data = unsafe { core::slice::from_raw_parts(ptr, len as usize) };

    // Example: look for a known malicious marker
    let marker = b"MALICIOUS_MARKER";
    if data.windows(marker.len()).any(|w| w == marker) {
        let name = b"Custom.MaliciousMarker";
        let detail = b"Found MALICIOUS_MARKER string in file data";
        unsafe {
            report_finding(
                name.as_ptr(), name.len() as u32,
                85,
                detail.as_ptr(), detail.len() as u32,
            );
        }
        return 85;
    }

    0 // clean
}
```

### 4. Compiler en WASM

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. Tester le plugin

```bash
# Créer un fichier de test avec le marqueur
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# Analyser avec la journalisation de débogage pour voir l'activité du plugin
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
Utilisez `--log-level debug` pour voir les messages détaillés de chargement et d'exécution des plugins, y compris la consommation de carburant et l'utilisation mémoire.
:::

## Sécurité du sandbox

Les plugins s'exécutent dans un sandbox Wasmtime avec les contraintes suivantes :

| Contrainte | Application |
|-----------|-------------|
| **Limite mémoire** | `max_memory_mb` dans le manifeste ; Wasmtime applique la limite de mémoire linéaire |
| **Limite CPU** | `max_exec_ms` converti en unités de carburant ; l'exécution est arrêtée quand le carburant est épuisé |
| **Réseau** | Désactivé par défaut ; nécessite `permissions.network: true` |
| **Système de fichiers** | Désactivé par défaut ; nécessite `permissions.filesystem: true` (pré-ouvertures WASI) |
| **Vérification de plateforme** | Les plugins avec des `platforms` non correspondantes sont ignorés au chargement |
| **Filtre de type de fichier** | Les plugins avec des `file_types` non correspondants sont ignorés par fichier |

::: warning
Même avec `network: true` ou `filesystem: true`, le sandbox WASI restreint l'accès à des répertoires et points de terminaison spécifiques. Ces permissions sont une déclaration d'intention, pas des autorisations d'accès générales.
:::

## Rechargement à chaud

Déposez un nouveau répertoire de plugin dans `~/.prx-sd/plugins/` et le registre le récupérera à la prochaine analyse. Pour le démon, déclenchez un rechargement en appelant `sd update` ou en redémarrant le démon.

## Étapes suivantes

- Consultez le [plugin exemple](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin) dans le dépôt
- Apprenez le [moteur de détection](../detection/) pour comprendre comment les découvertes des plugins sont agrégées
- Consultez la [Référence CLI](../cli/) pour toutes les commandes disponibles
