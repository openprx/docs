---
title: Fuentes de Firmas
description: "Información detallada sobre cada fuente de inteligencia de amenazas integrada en PRX-SD, incluyendo frecuencia de actualización y cobertura."
---

# Fuentes de Firmas

PRX-SD agrega inteligencia de amenazas de más de 20 fuentes de código abierto y comunitarias. Esta página proporciona información detallada sobre cada fuente, su cobertura, frecuencia de actualización y tipo de datos.

## Fuentes de abuse.ch

El proyecto abuse.ch proporciona varios feeds de amenazas de alta calidad y disponibles libremente:

| Fuente | Tipo de Datos | Contenido | Frecuencia de Actualización | Licencia |
|--------|--------------|-----------|---------------------------|----------|
| **MalwareBazaar** | SHA-256 | Muestras de malware enviadas por investigadores de todo el mundo. Ventana de 48 horas de las últimas entregas. | Cada 5 minutos | CC0 |
| **URLhaus** | SHA-256 | Hashes de archivos asociados con URLs que distribuyen malware. Cubre descargas drive-by, cargas útiles de phishing y drops de kits de exploits. | Cada hora | CC0 |
| **Feodo Tracker** | SHA-256 | Troyanos bancarios y cargadores: Emotet, Dridex, TrickBot, QakBot, BazarLoader, IcedID. | Cada 5 minutos | CC0 |
| **ThreatFox** | SHA-256 | IOCs enviados por la comunidad que abarcan múltiples familias de malware. Incluye hashes de archivos, dominios e IPs. | Cada hora | CC0 |
| **SSL Blacklist** | SHA-1 (cert) | Huellas SHA-1 de certificados SSL usados por servidores C2 de botnets. Se usa para la coincidencia de IOC de red. | Diaria | CC0 |

::: tip
Todos los feeds de abuse.ch están disponibles sin registro ni claves API. PRX-SD los descarga directamente desde los endpoints de la API pública.
:::

## VirusShare

| Campo | Detalles |
|-------|----------|
| **Tipo de Datos** | Hashes MD5 |
| **Cantidad** | Más de 20.000.000 |
| **Contenido** | Uno de los repositorios de hashes de malware público más grandes. Contiene hashes MD5 organizados en archivos de lista numerados (VirusShare_00000.md5 hasta VirusShare_00500+.md5). |
| **Frecuencia de Actualización** | Nuevos archivos de lista añadidos periódicamente |
| **Acceso** | Gratuito (requiere el indicador `--full` debido al tamaño de la descarga) |
| **Licencia** | Gratuito para uso no comercial |

::: warning
La descarga completa de VirusShare es de aproximadamente 500 MB y tarda un tiempo significativo en importarse. Usa `sd update --full` para incluirlo, o `sd update` para actualizaciones estándar sin VirusShare.
:::

## Fuentes de Reglas YARA

| Fuente | Cantidad de Reglas | Área de Enfoque | Calidad |
|--------|-------------------|-----------------|---------|
| **Reglas Integradas** | 64 | Ransomware, troyanos, puertas traseras, rootkits, mineros, webshells en Linux, macOS, Windows | Seleccionadas por el equipo de PRX-SD |
| **Yara-Rules/rules** | Comunidad | Emotet, TrickBot, CobaltStrike, Mirai, LockBit, APTs | Mantenido por la comunidad |
| **Neo23x0/signature-base** | Alto volumen | APT29, Lazarus Group, minería de criptomonedas, webshells, familias de ransomware | Alta calidad, Florian Roth |
| **ReversingLabs YARA** | Calidad comercial | Troyanos, ransomware, puertas traseras, herramientas de hackeo, exploits | Profesional, código abierto |
| **Elastic Security** | Creciente | Reglas de detección de endpoints para amenazas en Windows, Linux, macOS | Equipo de investigación de Elastic |
| **Google GCTI** | Selectivo | Reglas de alta confianza de Google Cloud Threat Intelligence | Muy alta calidad |
| **ESET IOC** | Selectivo | Seguimiento de APTs: Turla, Interception, InvisiMole y otras amenazas avanzadas | Enfocado en APTs |
| **InQuest** | Especializado | Documentos maliciosos: exploits OLE, inyección DDE, malware basado en macros | Específico de documentos |

### Categorías de Reglas YARA

El conjunto de reglas combinado cubre estas categorías de malware:

| Categoría | Familias de Ejemplo | Cobertura de Plataforma |
|-----------|--------------------|-----------------------|
| Ransomware | WannaCry, LockBit, Conti, REvil, Akira, BlackCat | Windows, Linux |
| Troyanos | Emotet, TrickBot, QakBot, Agent Tesla, RedLine | Windows |
| Puertas traseras | CobaltStrike, Metasploit, ShadowPad, PlugX | Multiplataforma |
| Rootkits | Reptile, Diamorphine, Horse Pill | Linux |
| Mineros | XMRig, variantes de CCMiner | Multiplataforma |
| Webshells | China Chopper, WSO, b374k, c99, r57 | Multiplataforma |
| APTs | APT29, Lazarus, Turla, Sandworm, OceanLotus | Multiplataforma |
| Exploits | EternalBlue, PrintNightmare, cargas útiles de Log4Shell | Multiplataforma |
| Herramientas de hackeo | Mimikatz, Rubeus, BloodHound, Impacket | Windows |
| Documentos | Macros maliciosas de Office, exploits PDF, exploits RTF | Multiplataforma |

## Fuentes de Feeds de IOC

| Fuente | Tipo de Indicador | Cantidad | Contenido | Frecuencia de Actualización |
|--------|------------------|----------|-----------|---------------------------|
| **IPsum** | Direcciones IP | 150.000+ | Reputación de IPs maliciosas agregada de más de 50 listas de bloqueo. Puntuación de múltiples niveles (nivel 1-8 según el número de listas que citan la IP). | Diaria |
| **FireHOL** | Direcciones IP | 200.000+ | Listas de bloqueo de IP seleccionadas organizadas por nivel de amenaza (nivel 1 hasta nivel 4). Los niveles más altos tienen criterios de inclusión más estrictos. | Cada 6 horas |
| **Emerging Threats** | Direcciones IP | 100.000+ | IPs extraídas de reglas IDS Suricata y Snort. Cubre C2 de botnets, escaneos, fuerza bruta, intentos de exploits. | Diaria |
| **SANS ISC** | Direcciones IP | 50.000+ | IPs sospechosas de la red de sensores DShield del Internet Storm Center. | Diaria |
| **URLhaus (URLs)** | URLs | 85.000+ | URLs maliciosas activas usadas para distribución de malware, phishing y entrega de exploits. | Cada hora |

## Base de Datos ClamAV

| Campo | Detalles |
|-------|----------|
| **Tipo de Datos** | Firmas en múltiples formatos (hash, bytecode, regex, lógico) |
| **Cantidad** | Más de 11.000.000 de firmas |
| **Archivos** | `main.cvd` (núcleo), `daily.cvd` (actualizaciones diarias), `bytecode.cvd` (reglas bytecode) |
| **Contenido** | La base de datos de firmas de virus de código abierto más grande. Cubre virus, troyanos, gusanos, phishing, PUAs. |
| **Frecuencia de Actualización** | Varias veces al día |
| **Acceso** | Gratuito vía freshclam o descarga directa |

Para habilitar la integración con ClamAV:

```bash
# Import ClamAV databases
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

Consulta [Importar Hashes](./import) para instrucciones detalladas de importación de ClamAV.

## Configuración de Fuentes

Habilita o deshabilita fuentes individuales en `config.toml`:

```toml
[signatures.sources]
malware_bazaar = true
urlhaus = true
feodo_tracker = true
threatfox = true
ssl_blacklist = true
virusshare = false          # Enable with sd update --full
builtin_rules = true
yara_community = true
neo23x0 = true
reversinglabs = true
elastic = true
gcti = true
eset = true
inquest = true
ipsum = true
firehol = true
emerging_threats = true
sans_isc = true
clamav = false              # Enable after importing ClamAV DBs
```

## Próximos Pasos

- [Actualizar Firmas](./update) -- descargar y actualizar todas las fuentes
- [Importar Hashes](./import) -- agregar hashes personalizados y bases de datos ClamAV
- [Reglas YARA Personalizadas](./custom-rules) -- escribir tus propias reglas de detección
- [Descripción General de la Inteligencia de Amenazas](./index) -- arquitectura y disposición del directorio de datos
