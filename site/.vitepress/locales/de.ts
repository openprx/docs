import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Erste Schritte',
    collapsed: false,
    items: [
      { text: 'Ubersicht', link: '/de/prx/' },
      { text: 'Installation', link: '/de/prx/getting-started/installation' },
      { text: 'Schnellstart', link: '/de/prx/getting-started/quickstart' },
      { text: 'Einrichtungsassistent', link: '/de/prx/getting-started/onboarding' },
    ],
  },
  {
    text: 'Kanale',
    collapsed: false,
    items: [
      { text: 'Ubersicht', link: '/de/prx/channels/' },
      { text: 'Telegram', link: '/de/prx/channels/telegram' },
      { text: 'Discord', link: '/de/prx/channels/discord' },
      { text: 'Slack', link: '/de/prx/channels/slack' },
      { text: 'WhatsApp', link: '/de/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/de/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/de/prx/channels/signal' },
      { text: 'iMessage', link: '/de/prx/channels/imessage' },
      { text: 'Matrix', link: '/de/prx/channels/matrix' },
      { text: 'E-Mail', link: '/de/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/de/prx/channels/lark' },
      { text: 'DingTalk', link: '/de/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/de/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/de/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/de/prx/channels/irc' },
      { text: 'QQ', link: '/de/prx/channels/qq' },
      { text: 'LINQ', link: '/de/prx/channels/linq' },
      { text: 'CLI', link: '/de/prx/channels/cli' },
    ],
  },
  {
    text: 'LLM-Anbieter',
    collapsed: false,
    items: [
      { text: 'Ubersicht', link: '/de/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/de/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/de/prx/providers/openai' },
      { text: 'Google Gemini', link: '/de/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/de/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/de/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/de/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/de/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/de/prx/providers/glm' },
      { text: 'OpenRouter', link: '/de/prx/providers/openrouter' },
      { text: 'Benutzerdefiniert kompatibel', link: '/de/prx/providers/custom-compatible' },
    ],
  },
  {
    text: 'Werkzeuge',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/tools/' },
      { text: 'Shell-Ausfuhrung', link: '/de/prx/tools/shell' },
      { text: 'Dateioperationen', link: '/de/prx/tools/file-operations' },
      { text: 'Speicher-Werkzeuge', link: '/de/prx/tools/memory' },
      { text: 'Browser', link: '/de/prx/tools/browser' },
      { text: 'Websuche', link: '/de/prx/tools/web-search' },
      { text: 'HTTP-Anfragen', link: '/de/prx/tools/http-request' },
      { text: 'Sitzungen und Agenten', link: '/de/prx/tools/sessions' },
      { text: 'Cron-Werkzeuge', link: '/de/prx/tools/cron-tools' },
      { text: 'Git-Operationen', link: '/de/prx/tools/git' },
      { text: 'Nachrichtenversand', link: '/de/prx/tools/messaging' },
      { text: 'Remote-Knoten', link: '/de/prx/tools/nodes' },
      { text: 'Medien', link: '/de/prx/tools/media' },
      { text: 'MCP-Integration', link: '/de/prx/tools/mcp' },
      { text: 'SkillForge', link: '/de/prx/tools/skillforge' },
      { text: 'Hooks', link: '/de/prx/tools/hooks' },
    ],
  },
  {
    text: 'Agent-Laufzeit',
    collapsed: true,
    items: [
      { text: 'Architektur', link: '/de/prx/agent/runtime' },
      { text: 'Agent-Schleife', link: '/de/prx/agent/loop' },
      { text: 'Sub-Agenten', link: '/de/prx/agent/subagents' },
      { text: 'Sitzungs-Worker', link: '/de/prx/agent/session-worker' },
      { text: 'Laufzeit-Backends', link: '/de/prx/agent/runtime-backends' },
      { text: 'Multimodal', link: '/de/prx/agent/multimodal' },
    ],
  },
  {
    text: 'Speichersystem',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/memory/' },
      { text: 'Markdown-Backend', link: '/de/prx/memory/markdown' },
      { text: 'SQLite-Backend', link: '/de/prx/memory/sqlite' },
      { text: 'PostgreSQL-Backend', link: '/de/prx/memory/postgres' },
      { text: 'Vektor-Embeddings', link: '/de/prx/memory/embeddings' },
      { text: 'Speicher-Hygiene', link: '/de/prx/memory/hygiene' },
      { text: 'RAG', link: '/de/prx/memory/rag' },
      { text: 'Lucid.so', link: '/de/prx/memory/lucid' },
      { text: 'Vektorsuche', link: '/de/prx/memory/vector-search' },
    ],
  },
  {
    text: 'Selbst-Evolution',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/self-evolution/' },
      { text: 'L1: Speicher-Evolution', link: '/de/prx/self-evolution/l1-memory' },
      { text: 'L2: Prompt-Evolution', link: '/de/prx/self-evolution/l2-prompt' },
      { text: 'L3: Strategie-Evolution', link: '/de/prx/self-evolution/l3-strategy' },
      { text: 'Pipeline', link: '/de/prx/self-evolution/pipeline' },
      { text: 'Sicherheit', link: '/de/prx/self-evolution/safety' },
      { text: 'Entscheidungsprotokoll', link: '/de/prx/self-evolution/decision-log' },
      { text: 'Experimente', link: '/de/prx/self-evolution/experiments' },
    ],
  },
  {
    text: 'Konfiguration',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/config/' },
      { text: 'Vollstandige Referenz', link: '/de/prx/config/reference' },
      { text: 'Hot Reload', link: '/de/prx/config/hot-reload' },
      { text: 'Umgebungsvariablen', link: '/de/prx/config/environment' },
    ],
  },
  {
    text: 'Plugins (WASM)',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/plugins/' },
      { text: 'Architektur', link: '/de/prx/plugins/architecture' },
      { text: 'Entwicklerhandbuch', link: '/de/prx/plugins/developer-guide' },
      { text: 'Host-Funktionen', link: '/de/prx/plugins/host-functions' },
      { text: 'PDK', link: '/de/prx/plugins/pdk' },
      { text: 'Beispiele', link: '/de/prx/plugins/examples' },
      { text: 'Event-Bus', link: '/de/prx/plugins/event-bus' },
    ],
  },
  {
    text: 'Gateway',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/gateway/' },
      { text: 'HTTP API', link: '/de/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/de/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/de/prx/gateway/webhooks' },
      { text: 'Middleware', link: '/de/prx/gateway/middleware' },
      { text: 'API-Referenz', link: '/de/prx/gateway/api-reference' },
    ],
  },
  {
    text: 'Sicherheit',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/security/' },
      { text: 'Richtlinien-Engine', link: '/de/prx/security/policy-engine' },
      { text: 'Kopplung', link: '/de/prx/security/pairing' },
      { text: 'Sandbox', link: '/de/prx/security/sandbox' },
      { text: 'Geheimnis-Speicher', link: '/de/prx/security/secrets' },
      { text: 'Bedrohungsmodell', link: '/de/prx/security/threat-model' },
      { text: 'Genehmigungsworkflow', link: '/de/prx/security/approval' },
      { text: 'Audit-Protokoll', link: '/de/prx/security/audit' },
    ],
  },
  {
    text: 'LLM-Router',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/router/' },
      { text: 'Heuristisches Routing', link: '/de/prx/router/heuristic' },
      { text: 'KNN-Routing', link: '/de/prx/router/knn' },
      { text: 'Automix', link: '/de/prx/router/automix' },
    ],
  },
  {
    text: 'Kausale Baum-Engine',
    collapsed: true,
    items: [
      { text: 'Uberblick', link: '/de/prx/causal-tree/' },
      { text: 'Konfiguration', link: '/de/prx/causal-tree/configuration' },
    ],
  },
  {
    text: 'Zeitplanung (Xin)',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/cron/' },
      { text: 'Heartbeat', link: '/de/prx/cron/heartbeat' },
      { text: 'Cron-Aufgaben', link: '/de/prx/cron/tasks' },
    ],
  },
  {
    text: 'Remote-Knoten',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/nodes/' },
      { text: 'Kopplungsprotokoll', link: '/de/prx/nodes/pairing' },
      { text: 'JSON-RPC-Protokoll', link: '/de/prx/nodes/protocol' },
    ],
  },
  {
    text: 'Authentifizierung',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/auth/' },
      { text: 'OAuth2-Ablauf', link: '/de/prx/auth/oauth2' },
      { text: 'Auth-Profile', link: '/de/prx/auth/profiles' },
      { text: 'Identitatsverwaltung', link: '/de/prx/auth/identity' },
    ],
  },
  {
    text: 'CLI-Referenz',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/cli/' },
      { text: 'prx agent', link: '/de/prx/cli/agent' },
      { text: 'prx chat', link: '/de/prx/cli/chat' },
      { text: 'prx daemon', link: '/de/prx/cli/daemon' },
      { text: 'prx gateway', link: '/de/prx/cli/gateway' },
      { text: 'prx onboard', link: '/de/prx/cli/onboard' },
      { text: 'prx channel', link: '/de/prx/cli/channel' },
      { text: 'prx cron', link: '/de/prx/cli/cron' },
      { text: 'prx evolution', link: '/de/prx/cli/evolution' },
      { text: 'prx auth', link: '/de/prx/cli/auth' },
      { text: 'prx config', link: '/de/prx/cli/config' },
      { text: 'prx doctor', link: '/de/prx/cli/doctor' },
      { text: 'prx service', link: '/de/prx/cli/service' },
      { text: 'prx skills', link: '/de/prx/cli/skills' },
    ],
  },
  {
    text: 'Beobachtbarkeit',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/observability/' },
      { text: 'Prometheus', link: '/de/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/de/prx/observability/opentelemetry' },
      { text: 'Kostenverfolgung', link: '/de/prx/observability/cost-tracking' },
    ],
  },
  {
    text: 'Tunnel',
    collapsed: true,
    items: [
      { text: 'Ubersicht', link: '/de/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/de/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/de/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/de/prx/tunnel/ngrok' },
    ],
  },
  {
    text: 'Fehlerbehebung',
    collapsed: true,
    items: [
      { text: 'Haufige Fehler', link: '/de/prx/troubleshooting/' },
      { text: 'Diagnose', link: '/de/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Erste Schritte', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/prx-sd/' },
    { text: 'Installation', link: '/de/prx-sd/getting-started/installation' },
    { text: 'Schnellstart', link: '/de/prx-sd/getting-started/quickstart' },
  ] },
  { text: 'Scannen', collapsed: false, items: [
    { text: 'Datei- und Verzeichnis-Scan', link: '/de/prx-sd/scanning/file-scan' },
    { text: 'Speicher-Scan', link: '/de/prx-sd/scanning/memory-scan' },
    { text: 'Rootkit-Erkennung', link: '/de/prx-sd/scanning/rootkit' },
    { text: 'USB-Gerate-Scan', link: '/de/prx-sd/scanning/usb-scan' },
  ] },
  { text: 'Erkennungs-Engine', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/prx-sd/detection/' },
    { text: 'Hash-Abgleich', link: '/de/prx-sd/detection/hash-matching' },
    { text: 'YARA-Regeln', link: '/de/prx-sd/detection/yara-rules' },
    { text: 'Heuristische Analyse', link: '/de/prx-sd/detection/heuristics' },
    { text: 'Unterstutzte Dateitypen', link: '/de/prx-sd/detection/file-types' },
  ] },
  { text: 'Echtzeitschutz', collapsed: true, items: [
    { text: 'Dateiuberwachung', link: '/de/prx-sd/realtime/monitor' },
    { text: 'Daemon', link: '/de/prx-sd/realtime/daemon' },
    { text: 'Ransomware-Schutz', link: '/de/prx-sd/realtime/ransomware' },
  ] },
  { text: 'Bedrohungsintelligenz', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/prx-sd/signatures/' },
    { text: 'Signaturen aktualisieren', link: '/de/prx-sd/signatures/update' },
    { text: 'Intelligenzquellen', link: '/de/prx-sd/signatures/sources' },
    { text: 'Hashes importieren', link: '/de/prx-sd/signatures/import' },
    { text: 'Benutzerdefinierte YARA-Regeln', link: '/de/prx-sd/signatures/custom-rules' },
  ] },
  { text: 'Quarantane', collapsed: true, items: [
    { text: 'Quarantane-Verwaltung', link: '/de/prx-sd/quarantine/' },
  ] },
  { text: 'Bedrohungsreaktion', collapsed: true, items: [
    { text: 'Automatische Behebung', link: '/de/prx-sd/remediation/' },
  ] },
  { text: 'Warnungen und Zeitplanung', collapsed: true, items: [
    { text: 'Webhook-Warnungen', link: '/de/prx-sd/alerts/webhook' },
    { text: 'E-Mail-Warnungen', link: '/de/prx-sd/alerts/email' },
    { text: 'Geplante Scans', link: '/de/prx-sd/alerts/schedule' },
  ] },
  { text: 'Netzwerkschutz', collapsed: true, items: [
    { text: 'Werbung- und Malware-Blockierung', link: '/de/prx-sd/network/adblock' },
    { text: 'DNS-Proxy', link: '/de/prx-sd/network/dns-proxy' },
  ] },
  { text: 'Konfiguration', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/prx-sd/configuration/' },
    { text: 'Vollstandige Referenz', link: '/de/prx-sd/configuration/reference' },
  ] },
  { text: 'CLI-Referenz', collapsed: true, items: [
    { text: 'Befehlsubersicht', link: '/de/prx-sd/cli/' },
  ] },
  { text: 'Plugins (WASM)', collapsed: true, items: [
    { text: 'Plugin-Entwicklung', link: '/de/prx-sd/plugins/' },
  ] },
  { text: 'Desktop-App', collapsed: true, items: [
    { text: 'Tauri GUI', link: '/de/prx-sd/gui/' },
  ] },
  { text: 'Fehlerbehebung', collapsed: true, items: [
    { text: 'Haufige Probleme', link: '/de/prx-sd/troubleshooting/' },
  ] },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Erste Schritte', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/prx-waf/' },
    { text: 'Installation', link: '/de/prx-waf/getting-started/installation' },
    { text: 'Schnellstart', link: '/de/prx-waf/getting-started/quickstart' },
  ] },
  { text: 'Regel-Engine', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/prx-waf/rules/' },
    { text: 'YAML-Syntax', link: '/de/prx-waf/rules/yaml-syntax' },
    { text: 'Eingebaute Regeln', link: '/de/prx-waf/rules/builtin-rules' },
    { text: 'Benutzerdefinierte Regeln', link: '/de/prx-waf/rules/custom-rules' },
  ] },
  { text: 'Gateway', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/prx-waf/gateway/' },
    { text: 'Reverse Proxy', link: '/de/prx-waf/gateway/reverse-proxy' },
    { text: 'SSL / TLS', link: '/de/prx-waf/gateway/ssl-tls' },
  ] },
  { text: 'Cluster', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/prx-waf/cluster/' },
    { text: 'Bereitstellung', link: '/de/prx-waf/cluster/deployment' },
  ] },
  { text: 'CrowdSec', collapsed: true, items: [
    { text: 'Integration', link: '/de/prx-waf/crowdsec/' },
  ] },
  { text: 'Admin-UI', collapsed: true, items: [
    { text: 'Dashboard', link: '/de/prx-waf/admin-ui/' },
  ] },
  { text: 'Konfiguration', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/prx-waf/configuration/' },
    { text: 'Vollstandige Referenz', link: '/de/prx-waf/configuration/reference' },
  ] },
  { text: 'CLI-Referenz', collapsed: true, items: [
    { text: 'Befehlsubersicht', link: '/de/prx-waf/cli/' },
  ] },
  { text: 'Fehlerbehebung', collapsed: true, items: [
    { text: 'Haufige Probleme', link: '/de/prx-waf/troubleshooting/' },
  ] },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Erste Schritte', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/openpr/' },
    { text: 'Installation', link: '/de/openpr/getting-started/installation' },
    { text: 'Schnellstart', link: '/de/openpr/getting-started/quickstart' },
  ] },
  { text: 'Arbeitsbereich', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/openpr/workspace/' },
    { text: 'Projekte', link: '/de/openpr/workspace/projects' },
    { text: 'Mitglieder', link: '/de/openpr/workspace/members' },
  ] },
  { text: 'Arbeitselemente', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/openpr/issues/' },
    { text: 'Workflow', link: '/de/openpr/issues/workflow' },
    { text: 'Sprints', link: '/de/openpr/issues/sprints' },
    { text: 'Labels', link: '/de/openpr/issues/labels' },
  ] },
  { text: 'Governance', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/openpr/governance/' },
    { text: 'Vorschlage', link: '/de/openpr/governance/proposals' },
    { text: 'Abstimmung', link: '/de/openpr/governance/voting' },
    { text: 'Vertrauenswerte', link: '/de/openpr/governance/trust-scores' },
  ] },
  { text: 'API', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/openpr/api/' },
    { text: 'Authentifizierung', link: '/de/openpr/api/authentication' },
    { text: 'Endpunkte', link: '/de/openpr/api/endpoints' },
  ] },
  { text: 'MCP-Server', collapsed: true, items: [
    { text: 'Integration', link: '/de/openpr/mcp-server/' },
  ] },
  { text: 'Bereitstellung', collapsed: true, items: [
    { text: 'Docker', link: '/de/openpr/deployment/docker' },
    { text: 'Produktion', link: '/de/openpr/deployment/production' },
  ] },
  { text: 'CLI-Referenz', collapsed: true, items: [
    { text: 'Befehlsubersicht', link: '/de/openpr/cli/' },
  ] },
  { text: 'Konfiguration', collapsed: true, items: [
    { text: 'Referenz', link: '/de/openpr/configuration/' },
  ] },
  { text: 'Fehlerbehebung', collapsed: true, items: [
    { text: 'Haufige Probleme', link: '/de/openpr/troubleshooting/' },
  ] },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Erste Schritte', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/openpr-webhook/' },
    { text: 'Installation', link: '/de/openpr-webhook/getting-started/installation' },
    { text: 'Schnellstart', link: '/de/openpr-webhook/getting-started/quickstart' },
  ] },
  { text: 'Agenten', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/openpr-webhook/agents/' },
    { text: 'Ausfuhrer', link: '/de/openpr-webhook/agents/executors' },
  ] },
  { text: 'WSS-Tunnel', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/openpr-webhook/tunnel/' },
  ] },
  { text: 'Konfiguration', collapsed: true, items: [
    { text: 'Referenz', link: '/de/openpr-webhook/configuration/' },
  ] },
  { text: 'Fehlerbehebung', collapsed: true, items: [
    { text: 'Haufige Probleme', link: '/de/openpr-webhook/troubleshooting/' },
  ] },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Erste Schritte', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/prx-memory/' },
    { text: 'Installation', link: '/de/prx-memory/getting-started/installation' },
    { text: 'Schnellstart', link: '/de/prx-memory/getting-started/quickstart' },
  ] },
  { text: 'Vektor-Embeddings', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/prx-memory/embedding/' },
    { text: 'Modelle', link: '/de/prx-memory/embedding/models' },
    { text: 'Stapelverarbeitung', link: '/de/prx-memory/embedding/batch-processing' },
  ] },
  { text: 'Reranking', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/prx-memory/reranking/' },
    { text: 'Modelle', link: '/de/prx-memory/reranking/models' },
  ] },
  { text: 'Speicher', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/prx-memory/storage/' },
    { text: 'SQLite', link: '/de/prx-memory/storage/sqlite' },
    { text: 'Vektorsuche', link: '/de/prx-memory/storage/vector-search' },
  ] },
  { text: 'MCP-Protokoll', collapsed: true, items: [
    { text: 'Integration', link: '/de/prx-memory/mcp/' },
  ] },
  { text: 'API-Referenz', collapsed: true, items: [
    { text: 'Rust API', link: '/de/prx-memory/api/' },
  ] },
  { text: 'Konfiguration', collapsed: true, items: [
    { text: 'Referenz', link: '/de/prx-memory/configuration/' },
  ] },
  { text: 'Fehlerbehebung', collapsed: true, items: [
    { text: 'Haufige Probleme', link: '/de/prx-memory/troubleshooting/' },
  ] },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Erste Schritte', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/prx-email/' },
    { text: 'Installation', link: '/de/prx-email/getting-started/installation' },
    { text: 'Schnellstart', link: '/de/prx-email/getting-started/quickstart' },
  ] },
  { text: 'E-Mail-Konten', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/prx-email/accounts/' },
    { text: 'IMAP', link: '/de/prx-email/accounts/imap' },
    { text: 'SMTP', link: '/de/prx-email/accounts/smtp' },
    { text: 'OAuth', link: '/de/prx-email/accounts/oauth' },
  ] },
  { text: 'Speicher', collapsed: true, items: [
    { text: 'SQLite', link: '/de/prx-email/storage/' },
  ] },
  { text: 'Plugins', collapsed: true, items: [
    { text: 'WASM-Plugins', link: '/de/prx-email/plugins/' },
  ] },
  { text: 'Konfiguration', collapsed: true, items: [
    { text: 'Referenz', link: '/de/prx-email/configuration/' },
  ] },
  { text: 'Fehlerbehebung', collapsed: true, items: [
    { text: 'Haufige Probleme', link: '/de/prx-email/troubleshooting/' },
  ] },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Erste Schritte', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/fenfa/' },
    { text: 'Installation', link: '/de/fenfa/getting-started/installation' },
    { text: 'Schnellstart', link: '/de/fenfa/getting-started/quickstart' },
  ] },
  { text: 'Produktverwaltung', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/fenfa/products/' },
    { text: 'Varianten', link: '/de/fenfa/products/variants' },
    { text: 'Veroffentlichungen', link: '/de/fenfa/products/releases' },
  ] },
  { text: 'App-Verteilung', collapsed: false, items: [
    { text: 'Ubersicht', link: '/de/fenfa/distribution/' },
    { text: 'iOS', link: '/de/fenfa/distribution/ios' },
    { text: 'Android', link: '/de/fenfa/distribution/android' },
    { text: 'Desktop', link: '/de/fenfa/distribution/desktop' },
  ] },
  { text: 'API', collapsed: true, items: [
    { text: 'Ubersicht', link: '/de/fenfa/api/' },
    { text: 'Upload-API', link: '/de/fenfa/api/upload' },
    { text: 'Admin-API', link: '/de/fenfa/api/admin' },
  ] },
  { text: 'Bereitstellung', collapsed: true, items: [
    { text: 'Docker', link: '/de/fenfa/deployment/docker' },
    { text: 'Produktion', link: '/de/fenfa/deployment/production' },
  ] },
  { text: 'Konfiguration', collapsed: true, items: [
    { text: 'Referenz', link: '/de/fenfa/configuration/' },
  ] },
  { text: 'Fehlerbehebung', collapsed: true, items: [
    { text: 'Haufige Probleme', link: '/de/fenfa/troubleshooting/' },
  ] },
]

const nav: DefaultTheme.NavItem[] = [
  { text: 'PRX', items: [
    { text: 'Erste Schritte', link: '/de/prx/' },
    { text: 'Kanale', link: '/de/prx/channels/' },
    { text: 'Anbieter', link: '/de/prx/providers/' },
    { text: 'Werkzeuge', link: '/de/prx/tools/' },
    { text: 'Konfiguration', link: '/de/prx/config/' },
  ] },
  { text: 'PRX-SD', items: [
    { text: 'Erste Schritte', link: '/de/prx-sd/' },
    { text: 'Scannen', link: '/de/prx-sd/scanning/file-scan' },
    { text: 'Erkennungs-Engine', link: '/de/prx-sd/detection/' },
    { text: 'Bedrohungsintelligenz', link: '/de/prx-sd/signatures/' },
    { text: 'Konfiguration', link: '/de/prx-sd/configuration/' },
  ] },
  { text: 'PRX-WAF', items: [
    { text: 'Erste Schritte', link: '/de/prx-waf/' },
    { text: 'Regel-Engine', link: '/de/prx-waf/rules/' },
    { text: 'Gateway', link: '/de/prx-waf/gateway/' },
    { text: 'Cluster', link: '/de/prx-waf/cluster/' },
    { text: 'Konfiguration', link: '/de/prx-waf/configuration/' },
  ] },
  { text: 'Mehr', items: [
    { text: 'OpenPR', link: '/de/openpr/' },
    { text: 'OpenPR-Webhook', link: '/de/openpr-webhook/' },
    { text: 'PRX-Memory', link: '/de/prx-memory/' },
    { text: 'PRX-Email', link: '/de/prx-email/' },
    { text: 'Fenfa', link: '/de/fenfa/' },
  ] },
]

export const deConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/de/prx/': prxSidebar,
      '/de/prx-sd/': prxSdSidebar,
      '/de/prx-waf/': prxWafSidebar,
      '/de/openpr/': openprSidebar,
      '/de/openpr-webhook/': openprWebhookSidebar,
      '/de/prx-memory/': prxMemorySidebar,
      '/de/prx-email/': prxEmailSidebar,
      '/de/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'Diese Seite auf GitHub bearbeiten',
    },
    lastUpdated: {
      text: 'Zuletzt aktualisiert',
    },
    docFooter: {
      prev: 'Vorherige Seite',
      next: 'Nachste Seite',
    },
    outline: {
      label: 'Auf dieser Seite',
      level: [2, 3],
    },
  },
}
