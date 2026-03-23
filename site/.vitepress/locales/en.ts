import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx/' },
      { text: 'Installation', link: '/en/prx/getting-started/installation' },
      { text: 'Quick Start', link: '/en/prx/getting-started/quickstart' },
      { text: 'Onboarding Wizard', link: '/en/prx/getting-started/onboarding' },
    ],
  },
  {
    text: 'Channels',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx/channels/' },
      { text: 'Telegram', link: '/en/prx/channels/telegram' },
      { text: 'Discord', link: '/en/prx/channels/discord' },
      { text: 'Slack', link: '/en/prx/channels/slack' },
      { text: 'WhatsApp', link: '/en/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/en/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/en/prx/channels/signal' },
      { text: 'iMessage', link: '/en/prx/channels/imessage' },
      { text: 'Matrix', link: '/en/prx/channels/matrix' },
      { text: 'Email', link: '/en/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/en/prx/channels/lark' },
      { text: 'DingTalk', link: '/en/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/en/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/en/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/en/prx/channels/irc' },
      { text: 'QQ', link: '/en/prx/channels/qq' },
      { text: 'LINQ', link: '/en/prx/channels/linq' },
      { text: 'CLI', link: '/en/prx/channels/cli' },
    ],
  },
  {
    text: 'Providers',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/en/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/en/prx/providers/openai' },
      { text: 'Google Gemini', link: '/en/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/en/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/en/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/en/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/en/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/en/prx/providers/glm' },
      { text: 'OpenRouter', link: '/en/prx/providers/openrouter' },
      { text: 'Custom Compatible', link: '/en/prx/providers/custom-compatible' },
    ],
  },
  {
    text: 'Tools',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/tools/' },
      { text: 'Shell Execution', link: '/en/prx/tools/shell' },
      { text: 'File Operations', link: '/en/prx/tools/file-operations' },
      { text: 'Memory Tools', link: '/en/prx/tools/memory' },
      { text: 'Browser', link: '/en/prx/tools/browser' },
      { text: 'Web Search', link: '/en/prx/tools/web-search' },
      { text: 'HTTP Requests', link: '/en/prx/tools/http-request' },
      { text: 'Sessions & Agents', link: '/en/prx/tools/sessions' },
      { text: 'Cron Tools', link: '/en/prx/tools/cron-tools' },
      { text: 'Git Operations', link: '/en/prx/tools/git' },
      { text: 'Messaging', link: '/en/prx/tools/messaging' },
      { text: 'Remote Nodes', link: '/en/prx/tools/nodes' },
      { text: 'Media', link: '/en/prx/tools/media' },
      { text: 'MCP Integration', link: '/en/prx/tools/mcp' },
      { text: 'SkillForge', link: '/en/prx/tools/skillforge' },
      { text: 'Hooks', link: '/en/prx/tools/hooks' },
    ],
  },
  {
    text: 'Agent Runtime',
    collapsed: true,
    items: [
      { text: 'Architecture', link: '/en/prx/agent/runtime' },
      { text: 'Agent Loop', link: '/en/prx/agent/loop' },
      { text: 'Sub-agents', link: '/en/prx/agent/subagents' },
      { text: 'Session Worker', link: '/en/prx/agent/session-worker' },
      { text: 'Runtime Backends', link: '/en/prx/agent/runtime-backends' },
      { text: 'Multimodal', link: '/en/prx/agent/multimodal' },
    ],
  },
  {
    text: 'Memory',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/memory/' },
      { text: 'Markdown Backend', link: '/en/prx/memory/markdown' },
      { text: 'SQLite Backend', link: '/en/prx/memory/sqlite' },
      { text: 'PostgreSQL Backend', link: '/en/prx/memory/postgres' },
      { text: 'Embeddings', link: '/en/prx/memory/embeddings' },
      { text: 'Memory Hygiene', link: '/en/prx/memory/hygiene' },
      { text: 'RAG', link: '/en/prx/memory/rag' },
      { text: 'Lucid.so', link: '/en/prx/memory/lucid' },
      { text: 'Vector Search', link: '/en/prx/memory/vector-search' },
    ],
  },
  {
    text: 'Self-Evolution',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/self-evolution/' },
      { text: 'L1: Memory Evolution', link: '/en/prx/self-evolution/l1-memory' },
      { text: 'L2: Prompt Evolution', link: '/en/prx/self-evolution/l2-prompt' },
      { text: 'L3: Strategy Evolution', link: '/en/prx/self-evolution/l3-strategy' },
      { text: 'Pipeline', link: '/en/prx/self-evolution/pipeline' },
      { text: 'Safety', link: '/en/prx/self-evolution/safety' },
      { text: 'Decision Log', link: '/en/prx/self-evolution/decision-log' },
      { text: 'Experiments', link: '/en/prx/self-evolution/experiments' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/config/' },
      { text: 'Full Reference', link: '/en/prx/config/reference' },
      { text: 'Hot Reload', link: '/en/prx/config/hot-reload' },
      { text: 'Environment Variables', link: '/en/prx/config/environment' },
    ],
  },
  {
    text: 'Plugins (WASM)',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/plugins/' },
      { text: 'Architecture', link: '/en/prx/plugins/architecture' },
      { text: 'Developer Guide', link: '/en/prx/plugins/developer-guide' },
      { text: 'Host Functions', link: '/en/prx/plugins/host-functions' },
      { text: 'PDK', link: '/en/prx/plugins/pdk' },
      { text: 'Examples', link: '/en/prx/plugins/examples' },
      { text: 'Event Bus', link: '/en/prx/plugins/event-bus' },
    ],
  },
  {
    text: 'Gateway',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/gateway/' },
      { text: 'HTTP API', link: '/en/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/en/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/en/prx/gateway/webhooks' },
      { text: 'Middleware', link: '/en/prx/gateway/middleware' },
      { text: 'API Reference', link: '/en/prx/gateway/api-reference' },
    ],
  },
  {
    text: 'Security',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/security/' },
      { text: 'Policy Engine', link: '/en/prx/security/policy-engine' },
      { text: 'Pairing', link: '/en/prx/security/pairing' },
      { text: 'Sandbox', link: '/en/prx/security/sandbox' },
      { text: 'Secrets Store', link: '/en/prx/security/secrets' },
      { text: 'Threat Model', link: '/en/prx/security/threat-model' },
      { text: 'Approval Workflow', link: '/en/prx/security/approval' },
      { text: 'Audit Logging', link: '/en/prx/security/audit' },
    ],
  },
  {
    text: 'LLM Router',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/router/' },
      { text: 'Heuristic Routing', link: '/en/prx/router/heuristic' },
      { text: 'KNN Routing', link: '/en/prx/router/knn' },
      { text: 'Automix', link: '/en/prx/router/automix' },
    ],
  },
  {
    text: 'Causal Tree Engine',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/causal-tree/' },
      { text: 'Configuration', link: '/en/prx/causal-tree/configuration' },
    ],
  },
  {
    text: 'Scheduling (Xin)',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/cron/' },
      { text: 'Heartbeat', link: '/en/prx/cron/heartbeat' },
      { text: 'Cron Tasks', link: '/en/prx/cron/tasks' },
    ],
  },
  {
    text: 'Remote Nodes',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/nodes/' },
      { text: 'Pairing Protocol', link: '/en/prx/nodes/pairing' },
      { text: 'JSON-RPC Protocol', link: '/en/prx/nodes/protocol' },
    ],
  },
  {
    text: 'Authentication',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/auth/' },
      { text: 'OAuth2 Flow', link: '/en/prx/auth/oauth2' },
      { text: 'Auth Profiles', link: '/en/prx/auth/profiles' },
      { text: 'Identity Management', link: '/en/prx/auth/identity' },
    ],
  },
  {
    text: 'CLI Reference',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/cli/' },
      { text: 'prx agent', link: '/en/prx/cli/agent' },
      { text: 'prx chat', link: '/en/prx/cli/chat' },
      { text: 'prx daemon', link: '/en/prx/cli/daemon' },
      { text: 'prx gateway', link: '/en/prx/cli/gateway' },
      { text: 'prx onboard', link: '/en/prx/cli/onboard' },
      { text: 'prx channel', link: '/en/prx/cli/channel' },
      { text: 'prx cron', link: '/en/prx/cli/cron' },
      { text: 'prx evolution', link: '/en/prx/cli/evolution' },
      { text: 'prx auth', link: '/en/prx/cli/auth' },
      { text: 'prx config', link: '/en/prx/cli/config' },
      { text: 'prx doctor', link: '/en/prx/cli/doctor' },
      { text: 'prx service', link: '/en/prx/cli/service' },
      { text: 'prx skills', link: '/en/prx/cli/skills' },
    ],
  },
  {
    text: 'Observability',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/observability/' },
      { text: 'Prometheus', link: '/en/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/en/prx/observability/opentelemetry' },
      { text: 'Cost Tracking', link: '/en/prx/observability/cost-tracking' },
    ],
  },
  {
    text: 'Tunnel',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/en/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/en/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/en/prx/tunnel/ngrok' },
    ],
  },
  {
    text: 'Troubleshooting',
    collapsed: true,
    items: [
      { text: 'Common Errors', link: '/en/prx/troubleshooting/' },
      { text: 'Diagnostics', link: '/en/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx-sd/' },
      { text: 'Installation', link: '/en/prx-sd/getting-started/installation' },
      { text: 'Quick Start', link: '/en/prx-sd/getting-started/quickstart' },
    ],
  },
  {
    text: 'Scanning',
    collapsed: false,
    items: [
      { text: 'File & Directory Scan', link: '/en/prx-sd/scanning/file-scan' },
      { text: 'Memory Scan', link: '/en/prx-sd/scanning/memory-scan' },
      { text: 'Rootkit Detection', link: '/en/prx-sd/scanning/rootkit' },
      { text: 'USB Device Scan', link: '/en/prx-sd/scanning/usb-scan' },
    ],
  },
  {
    text: 'Detection Engine',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx-sd/detection/' },
      { text: 'Hash Matching', link: '/en/prx-sd/detection/hash-matching' },
      { text: 'YARA Rules', link: '/en/prx-sd/detection/yara-rules' },
      { text: 'Heuristic Analysis', link: '/en/prx-sd/detection/heuristics' },
      { text: 'Supported File Types', link: '/en/prx-sd/detection/file-types' },
    ],
  },
  {
    text: 'Real-time Protection',
    collapsed: true,
    items: [
      { text: 'File Monitor', link: '/en/prx-sd/realtime/monitor' },
      { text: 'Daemon', link: '/en/prx-sd/realtime/daemon' },
      { text: 'Ransomware Protection', link: '/en/prx-sd/realtime/ransomware' },
    ],
  },
  {
    text: 'Threat Intelligence',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx-sd/signatures/' },
      { text: 'Updating Signatures', link: '/en/prx-sd/signatures/update' },
      { text: 'Intelligence Sources', link: '/en/prx-sd/signatures/sources' },
      { text: 'Importing Hashes', link: '/en/prx-sd/signatures/import' },
      { text: 'Custom YARA Rules', link: '/en/prx-sd/signatures/custom-rules' },
    ],
  },
  {
    text: 'Quarantine',
    collapsed: true,
    items: [
      { text: 'Managing Quarantine', link: '/en/prx-sd/quarantine/' },
    ],
  },
  {
    text: 'Remediation',
    collapsed: true,
    items: [
      { text: 'Threat Response', link: '/en/prx-sd/remediation/' },
    ],
  },
  {
    text: 'Alerts & Scheduling',
    collapsed: true,
    items: [
      { text: 'Webhook Alerts', link: '/en/prx-sd/alerts/webhook' },
      { text: 'Email Alerts', link: '/en/prx-sd/alerts/email' },
      { text: 'Scheduled Scans', link: '/en/prx-sd/alerts/schedule' },
    ],
  },
  {
    text: 'Network Protection',
    collapsed: true,
    items: [
      { text: 'Ad & Malware Blocking', link: '/en/prx-sd/network/adblock' },
      { text: 'DNS Proxy', link: '/en/prx-sd/network/dns-proxy' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx-sd/configuration/' },
      { text: 'Full Reference', link: '/en/prx-sd/configuration/reference' },
    ],
  },
  {
    text: 'CLI Reference',
    collapsed: true,
    items: [
      { text: 'Command Overview', link: '/en/prx-sd/cli/' },
    ],
  },
  {
    text: 'Plugins (WASM)',
    collapsed: true,
    items: [
      { text: 'Plugin Development', link: '/en/prx-sd/plugins/' },
    ],
  },
  {
    text: 'Desktop App',
    collapsed: true,
    items: [
      { text: 'Tauri GUI', link: '/en/prx-sd/gui/' },
    ],
  },
  {
    text: 'Troubleshooting',
    collapsed: true,
    items: [
      { text: 'Common Issues', link: '/en/prx-sd/troubleshooting/' },
    ],
  },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx-waf/' },
      { text: 'Installation', link: '/en/prx-waf/getting-started/installation' },
      { text: 'Quick Start', link: '/en/prx-waf/getting-started/quickstart' },
    ],
  },
  {
    text: 'Rules Engine',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx-waf/rules/' },
      { text: 'YAML Syntax', link: '/en/prx-waf/rules/yaml-syntax' },
      { text: 'Built-in Rules', link: '/en/prx-waf/rules/builtin-rules' },
      { text: 'Custom Rules', link: '/en/prx-waf/rules/custom-rules' },
    ],
  },
  {
    text: 'Gateway',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx-waf/gateway/' },
      { text: 'Reverse Proxy', link: '/en/prx-waf/gateway/reverse-proxy' },
      { text: 'SSL / TLS', link: '/en/prx-waf/gateway/ssl-tls' },
    ],
  },
  {
    text: 'Cluster',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx-waf/cluster/' },
      { text: 'Deployment', link: '/en/prx-waf/cluster/deployment' },
    ],
  },
  {
    text: 'CrowdSec',
    collapsed: true,
    items: [
      { text: 'Integration', link: '/en/prx-waf/crowdsec/' },
    ],
  },
  {
    text: 'Admin UI',
    collapsed: true,
    items: [
      { text: 'Dashboard', link: '/en/prx-waf/admin-ui/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx-waf/configuration/' },
      { text: 'Full Reference', link: '/en/prx-waf/configuration/reference' },
    ],
  },
  {
    text: 'CLI Reference',
    collapsed: true,
    items: [
      { text: 'Command Overview', link: '/en/prx-waf/cli/' },
    ],
  },
  {
    text: 'Troubleshooting',
    collapsed: true,
    items: [
      { text: 'Common Issues', link: '/en/prx-waf/troubleshooting/' },
    ],
  },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/openpr/' },
      { text: 'Installation', link: '/en/openpr/getting-started/installation' },
      { text: 'Quick Start', link: '/en/openpr/getting-started/quickstart' },
    ],
  },
  {
    text: 'Workspace',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/openpr/workspace/' },
      { text: 'Projects', link: '/en/openpr/workspace/projects' },
      { text: 'Members', link: '/en/openpr/workspace/members' },
    ],
  },
  {
    text: 'Issues',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/openpr/issues/' },
      { text: 'Workflow', link: '/en/openpr/issues/workflow' },
      { text: 'Sprints', link: '/en/openpr/issues/sprints' },
      { text: 'Labels', link: '/en/openpr/issues/labels' },
    ],
  },
  {
    text: 'Governance',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/openpr/governance/' },
      { text: 'Proposals', link: '/en/openpr/governance/proposals' },
      { text: 'Voting', link: '/en/openpr/governance/voting' },
      { text: 'Trust Scores', link: '/en/openpr/governance/trust-scores' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/openpr/api/' },
      { text: 'Authentication', link: '/en/openpr/api/authentication' },
      { text: 'Endpoints', link: '/en/openpr/api/endpoints' },
    ],
  },
  {
    text: 'MCP Server',
    collapsed: true,
    items: [
      { text: 'Integration', link: '/en/openpr/mcp-server/' },
    ],
  },
  {
    text: 'Deployment',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/en/openpr/deployment/docker' },
      { text: 'Production', link: '/en/openpr/deployment/production' },
    ],
  },
  {
    text: 'CLI Reference',
    collapsed: true,
    items: [
      { text: 'Command Overview', link: '/en/openpr/cli/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/en/openpr/configuration/' },
    ],
  },
  {
    text: 'Troubleshooting',
    collapsed: true,
    items: [
      { text: 'Common Issues', link: '/en/openpr/troubleshooting/' },
    ],
  },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/openpr-webhook/' },
      { text: 'Installation', link: '/en/openpr-webhook/getting-started/installation' },
      { text: 'Quick Start', link: '/en/openpr-webhook/getting-started/quickstart' },
    ],
  },
  {
    text: 'Agents',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/openpr-webhook/agents/' },
      { text: 'Executors', link: '/en/openpr-webhook/agents/executors' },
    ],
  },
  {
    text: 'WSS Tunnel',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/openpr-webhook/tunnel/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/en/openpr-webhook/configuration/' },
    ],
  },
  {
    text: 'Troubleshooting',
    collapsed: true,
    items: [
      { text: 'Common Issues', link: '/en/openpr-webhook/troubleshooting/' },
    ],
  },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx-memory/' },
      { text: 'Installation', link: '/en/prx-memory/getting-started/installation' },
      { text: 'Quick Start', link: '/en/prx-memory/getting-started/quickstart' },
    ],
  },
  {
    text: 'Embedding',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx-memory/embedding/' },
      { text: 'Models', link: '/en/prx-memory/embedding/models' },
      { text: 'Batch Processing', link: '/en/prx-memory/embedding/batch-processing' },
    ],
  },
  {
    text: 'Reranking',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx-memory/reranking/' },
      { text: 'Models', link: '/en/prx-memory/reranking/models' },
    ],
  },
  {
    text: 'Storage',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/prx-memory/storage/' },
      { text: 'SQLite', link: '/en/prx-memory/storage/sqlite' },
      { text: 'Vector Search', link: '/en/prx-memory/storage/vector-search' },
    ],
  },
  {
    text: 'MCP Protocol',
    collapsed: true,
    items: [
      { text: 'Integration', link: '/en/prx-memory/mcp/' },
    ],
  },
  {
    text: 'API Reference',
    collapsed: true,
    items: [
      { text: 'Rust API', link: '/en/prx-memory/api/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/en/prx-memory/configuration/' },
    ],
  },
  {
    text: 'Troubleshooting',
    collapsed: true,
    items: [
      { text: 'Common Issues', link: '/en/prx-memory/troubleshooting/' },
    ],
  },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx-email/' },
      { text: 'Installation', link: '/en/prx-email/getting-started/installation' },
      { text: 'Quick Start', link: '/en/prx-email/getting-started/quickstart' },
    ],
  },
  {
    text: 'Accounts',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/prx-email/accounts/' },
      { text: 'IMAP', link: '/en/prx-email/accounts/imap' },
      { text: 'SMTP', link: '/en/prx-email/accounts/smtp' },
      { text: 'OAuth', link: '/en/prx-email/accounts/oauth' },
    ],
  },
  {
    text: 'Storage',
    collapsed: true,
    items: [
      { text: 'SQLite', link: '/en/prx-email/storage/' },
    ],
  },
  {
    text: 'Plugins',
    collapsed: true,
    items: [
      { text: 'WASM Plugins', link: '/en/prx-email/plugins/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/en/prx-email/configuration/' },
    ],
  },
  {
    text: 'Troubleshooting',
    collapsed: true,
    items: [
      { text: 'Common Issues', link: '/en/prx-email/troubleshooting/' },
    ],
  },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/fenfa/' },
      { text: 'Installation', link: '/en/fenfa/getting-started/installation' },
      { text: 'Quick Start', link: '/en/fenfa/getting-started/quickstart' },
    ],
  },
  {
    text: 'Products',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/fenfa/products/' },
      { text: 'Variants', link: '/en/fenfa/products/variants' },
      { text: 'Releases', link: '/en/fenfa/products/releases' },
    ],
  },
  {
    text: 'Distribution',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/fenfa/distribution/' },
      { text: 'iOS', link: '/en/fenfa/distribution/ios' },
      { text: 'Android', link: '/en/fenfa/distribution/android' },
      { text: 'Desktop', link: '/en/fenfa/distribution/desktop' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/fenfa/api/' },
      { text: 'Upload API', link: '/en/fenfa/api/upload' },
      { text: 'Admin API', link: '/en/fenfa/api/admin' },
    ],
  },
  {
    text: 'Deployment',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/en/fenfa/deployment/docker' },
      { text: 'Production', link: '/en/fenfa/deployment/production' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/en/fenfa/configuration/' },
    ],
  },
  {
    text: 'Troubleshooting',
    collapsed: true,
    items: [
      { text: 'Common Issues', link: '/en/fenfa/troubleshooting/' },
    ],
  },
]

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'PRX',
    items: [
      { text: 'Getting Started', link: '/en/prx/' },
      { text: 'Channels', link: '/en/prx/channels/' },
      { text: 'Providers', link: '/en/prx/providers/' },
      { text: 'Tools', link: '/en/prx/tools/' },
      { text: 'Configuration', link: '/en/prx/config/' },
    ],
  },
  {
    text: 'PRX-SD',
    items: [
      { text: 'Getting Started', link: '/en/prx-sd/' },
      { text: 'Scanning', link: '/en/prx-sd/scanning/file-scan' },
      { text: 'Detection Engine', link: '/en/prx-sd/detection/' },
      { text: 'Threat Intelligence', link: '/en/prx-sd/signatures/' },
      { text: 'Configuration', link: '/en/prx-sd/configuration/' },
    ],
  },
  {
    text: 'PRX-WAF',
    items: [
      { text: 'Getting Started', link: '/en/prx-waf/' },
      { text: 'Rules Engine', link: '/en/prx-waf/rules/' },
      { text: 'Gateway', link: '/en/prx-waf/gateway/' },
      { text: 'Cluster', link: '/en/prx-waf/cluster/' },
      { text: 'Configuration', link: '/en/prx-waf/configuration/' },
    ],
  },
  {
    text: 'More',
    items: [
      { text: 'OpenPR', link: '/en/openpr/' },
      { text: 'OpenPR-Webhook', link: '/en/openpr-webhook/' },
      { text: 'PRX-Memory', link: '/en/prx-memory/' },
      { text: 'PRX-Email', link: '/en/prx-email/' },
      { text: 'Fenfa', link: '/en/fenfa/' },
    ],
  },
]

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/en/prx/': prxSidebar,
      '/en/prx-sd/': prxSdSidebar,
      '/en/prx-waf/': prxWafSidebar,
      '/en/openpr/': openprSidebar,
      '/en/openpr-webhook/': openprWebhookSidebar,
      '/en/prx-memory/': prxMemorySidebar,
      '/en/prx-email/': prxEmailSidebar,
      '/en/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'Edit this page on GitHub',
    },
    lastUpdated: {
      text: 'Last updated',
    },
    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
    outline: {
      label: 'On this page',
      level: [2, 3],
    },
  },
}
