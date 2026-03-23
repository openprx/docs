import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Demarrage',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/' },
      { text: 'Installation', link: '/fr/prx/getting-started/installation' },
      { text: 'Demarrage rapide', link: '/fr/prx/getting-started/quickstart' },
      { text: 'Assistant de configuration', link: '/fr/prx/getting-started/onboarding' },
    ],
  },
  {
    text: 'Canaux',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/channels/' },
      { text: 'Telegram', link: '/fr/prx/channels/telegram' },
      { text: 'Discord', link: '/fr/prx/channels/discord' },
      { text: 'Slack', link: '/fr/prx/channels/slack' },
      { text: 'WhatsApp', link: '/fr/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/fr/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/fr/prx/channels/signal' },
      { text: 'iMessage', link: '/fr/prx/channels/imessage' },
      { text: 'Matrix', link: '/fr/prx/channels/matrix' },
      { text: 'E-mail', link: '/fr/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/fr/prx/channels/lark' },
      { text: 'DingTalk', link: '/fr/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/fr/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/fr/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/fr/prx/channels/irc' },
      { text: 'QQ', link: '/fr/prx/channels/qq' },
      { text: 'LINQ', link: '/fr/prx/channels/linq' },
      { text: 'CLI', link: '/fr/prx/channels/cli' },
    ],
  },
  {
    text: 'Fournisseurs LLM',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/fr/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/fr/prx/providers/openai' },
      { text: 'Google Gemini', link: '/fr/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/fr/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/fr/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/fr/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/fr/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/fr/prx/providers/glm' },
      { text: 'OpenRouter', link: '/fr/prx/providers/openrouter' },
      { text: 'Compatible personnalise', link: '/fr/prx/providers/custom-compatible' },
    ],
  },
  {
    text: 'Outils',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/tools/' },
      { text: 'Execution Shell', link: '/fr/prx/tools/shell' },
      { text: 'Operations sur fichiers', link: '/fr/prx/tools/file-operations' },
      { text: 'Outils memoire', link: '/fr/prx/tools/memory' },
      { text: 'Navigateur', link: '/fr/prx/tools/browser' },
      { text: 'Recherche web', link: '/fr/prx/tools/web-search' },
      { text: 'Requetes HTTP', link: '/fr/prx/tools/http-request' },
      { text: 'Sessions et agents', link: '/fr/prx/tools/sessions' },
      { text: 'Outils Cron', link: '/fr/prx/tools/cron-tools' },
      { text: 'Operations Git', link: '/fr/prx/tools/git' },
      { text: 'Messagerie', link: '/fr/prx/tools/messaging' },
      { text: 'Noeuds distants', link: '/fr/prx/tools/nodes' },
      { text: 'Medias', link: '/fr/prx/tools/media' },
      { text: 'Integration MCP', link: '/fr/prx/tools/mcp' },
      { text: 'SkillForge', link: '/fr/prx/tools/skillforge' },
      { text: 'Hooks', link: '/fr/prx/tools/hooks' },
    ],
  },
  {
    text: 'Runtime de l\'agent',
    collapsed: true,
    items: [
      { text: 'Architecture', link: '/fr/prx/agent/runtime' },
      { text: 'Boucle de l\'agent', link: '/fr/prx/agent/loop' },
      { text: 'Sous-agents', link: '/fr/prx/agent/subagents' },
      { text: 'Worker de session', link: '/fr/prx/agent/session-worker' },
      { text: 'Backends runtime', link: '/fr/prx/agent/runtime-backends' },
      { text: 'Multimodal', link: '/fr/prx/agent/multimodal' },
    ],
  },
  {
    text: 'Systeme de memoire',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/memory/' },
      { text: 'Backend Markdown', link: '/fr/prx/memory/markdown' },
      { text: 'Backend SQLite', link: '/fr/prx/memory/sqlite' },
      { text: 'Backend PostgreSQL', link: '/fr/prx/memory/postgres' },
      { text: 'Embeddings vectoriels', link: '/fr/prx/memory/embeddings' },
      { text: 'Nettoyage memoire', link: '/fr/prx/memory/hygiene' },
      { text: 'RAG', link: '/fr/prx/memory/rag' },
      { text: 'Lucid.so', link: '/fr/prx/memory/lucid' },
      { text: 'Recherche vectorielle', link: '/fr/prx/memory/vector-search' },
    ],
  },
  {
    text: 'Auto-evolution',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/self-evolution/' },
      { text: 'L1: Evolution memoire', link: '/fr/prx/self-evolution/l1-memory' },
      { text: 'L2: Evolution prompts', link: '/fr/prx/self-evolution/l2-prompt' },
      { text: 'L3: Evolution strategie', link: '/fr/prx/self-evolution/l3-strategy' },
      { text: 'Pipeline', link: '/fr/prx/self-evolution/pipeline' },
      { text: 'Securite', link: '/fr/prx/self-evolution/safety' },
      { text: 'Journal des decisions', link: '/fr/prx/self-evolution/decision-log' },
      { text: 'Experiences', link: '/fr/prx/self-evolution/experiments' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/config/' },
      { text: 'Reference complete', link: '/fr/prx/config/reference' },
      { text: 'Rechargement a chaud', link: '/fr/prx/config/hot-reload' },
      { text: 'Variables d\'environnement', link: '/fr/prx/config/environment' },
    ],
  },
  {
    text: 'Plugins (WASM)',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/plugins/' },
      { text: 'Architecture', link: '/fr/prx/plugins/architecture' },
      { text: 'Guide du developpeur', link: '/fr/prx/plugins/developer-guide' },
      { text: 'Fonctions hote', link: '/fr/prx/plugins/host-functions' },
      { text: 'PDK', link: '/fr/prx/plugins/pdk' },
      { text: 'Exemples', link: '/fr/prx/plugins/examples' },
      { text: 'Bus d\'evenements', link: '/fr/prx/plugins/event-bus' },
    ],
  },
  {
    text: 'Passerelle',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/gateway/' },
      { text: 'HTTP API', link: '/fr/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/fr/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/fr/prx/gateway/webhooks' },
      { text: 'Middleware', link: '/fr/prx/gateway/middleware' },
      { text: 'Reference API', link: '/fr/prx/gateway/api-reference' },
    ],
  },
  {
    text: 'Securite',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/security/' },
      { text: 'Moteur de politiques', link: '/fr/prx/security/policy-engine' },
      { text: 'Appairage', link: '/fr/prx/security/pairing' },
      { text: 'Bac a sable', link: '/fr/prx/security/sandbox' },
      { text: 'Stockage des secrets', link: '/fr/prx/security/secrets' },
      { text: 'Modele de menaces', link: '/fr/prx/security/threat-model' },
      { text: 'Flux d\'approbation', link: '/fr/prx/security/approval' },
      { text: 'Journal d\'audit', link: '/fr/prx/security/audit' },
    ],
  },
  {
    text: 'Routeur LLM',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/router/' },
      { text: 'Routage heuristique', link: '/fr/prx/router/heuristic' },
      { text: 'Routage KNN', link: '/fr/prx/router/knn' },
      { text: 'Automix', link: '/fr/prx/router/automix' },
    ],
  },
  {
    text: 'Moteur d\'Arbre Causal',
    collapsed: true,
    items: [
      { text: 'Apercu', link: '/fr/prx/causal-tree/' },
      { text: 'Configuration', link: '/fr/prx/causal-tree/configuration' },
    ],
  },
  {
    text: 'Planification (Xin)',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/cron/' },
      { text: 'Heartbeat', link: '/fr/prx/cron/heartbeat' },
      { text: 'Taches Cron', link: '/fr/prx/cron/tasks' },
    ],
  },
  {
    text: 'Noeuds distants',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/nodes/' },
      { text: 'Protocole d\'appairage', link: '/fr/prx/nodes/pairing' },
      { text: 'Protocole JSON-RPC', link: '/fr/prx/nodes/protocol' },
    ],
  },
  {
    text: 'Authentification',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/auth/' },
      { text: 'Flux OAuth2', link: '/fr/prx/auth/oauth2' },
      { text: 'Profils d\'authentification', link: '/fr/prx/auth/profiles' },
      { text: 'Gestion des identites', link: '/fr/prx/auth/identity' },
    ],
  },
  {
    text: 'Reference CLI',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/cli/' },
      { text: 'prx agent', link: '/fr/prx/cli/agent' },
      { text: 'prx chat', link: '/fr/prx/cli/chat' },
      { text: 'prx daemon', link: '/fr/prx/cli/daemon' },
      { text: 'prx gateway', link: '/fr/prx/cli/gateway' },
      { text: 'prx onboard', link: '/fr/prx/cli/onboard' },
      { text: 'prx channel', link: '/fr/prx/cli/channel' },
      { text: 'prx cron', link: '/fr/prx/cli/cron' },
      { text: 'prx evolution', link: '/fr/prx/cli/evolution' },
      { text: 'prx auth', link: '/fr/prx/cli/auth' },
      { text: 'prx config', link: '/fr/prx/cli/config' },
      { text: 'prx doctor', link: '/fr/prx/cli/doctor' },
      { text: 'prx service', link: '/fr/prx/cli/service' },
      { text: 'prx skills', link: '/fr/prx/cli/skills' },
    ],
  },
  {
    text: 'Observabilite',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/observability/' },
      { text: 'Prometheus', link: '/fr/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/fr/prx/observability/opentelemetry' },
      { text: 'Suivi des couts', link: '/fr/prx/observability/cost-tracking' },
    ],
  },
  {
    text: 'Tunnel',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/fr/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/fr/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/fr/prx/tunnel/ngrok' },
    ],
  },
  {
    text: 'Depannage',
    collapsed: true,
    items: [
      { text: 'Erreurs courantes', link: '/fr/prx/troubleshooting/' },
      { text: 'Diagnostics', link: '/fr/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Demarrage',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-sd/' },
      { text: 'Installation', link: '/fr/prx-sd/getting-started/installation' },
      { text: 'Demarrage rapide', link: '/fr/prx-sd/getting-started/quickstart' },
    ],
  },
  {
    text: 'Analyse',
    collapsed: false,
    items: [
      { text: 'Analyse de fichiers et repertoires', link: '/fr/prx-sd/scanning/file-scan' },
      { text: 'Analyse memoire', link: '/fr/prx-sd/scanning/memory-scan' },
      { text: 'Detection de Rootkit', link: '/fr/prx-sd/scanning/rootkit' },
      { text: 'Analyse de peripheriques USB', link: '/fr/prx-sd/scanning/usb-scan' },
    ],
  },
  {
    text: 'Moteur de detection',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-sd/detection/' },
      { text: 'Correspondance de hash', link: '/fr/prx-sd/detection/hash-matching' },
      { text: 'Regles YARA', link: '/fr/prx-sd/detection/yara-rules' },
      { text: 'Analyse heuristique', link: '/fr/prx-sd/detection/heuristics' },
      { text: 'Types de fichiers supportes', link: '/fr/prx-sd/detection/file-types' },
    ],
  },
  {
    text: 'Protection en temps reel',
    collapsed: true,
    items: [
      { text: 'Surveillance de fichiers', link: '/fr/prx-sd/realtime/monitor' },
      { text: 'Daemon', link: '/fr/prx-sd/realtime/daemon' },
      { text: 'Protection anti-ransomware', link: '/fr/prx-sd/realtime/ransomware' },
    ],
  },
  {
    text: 'Renseignement sur les menaces',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-sd/signatures/' },
      { text: 'Mise a jour des signatures', link: '/fr/prx-sd/signatures/update' },
      { text: 'Sources de renseignement', link: '/fr/prx-sd/signatures/sources' },
      { text: 'Importer des hashes', link: '/fr/prx-sd/signatures/import' },
      { text: 'Regles YARA personnalisees', link: '/fr/prx-sd/signatures/custom-rules' },
    ],
  },
  {
    text: 'Quarantaine',
    collapsed: true,
    items: [
      { text: 'Gestion de la quarantaine', link: '/fr/prx-sd/quarantine/' },
    ],
  },
  {
    text: 'Reponse aux menaces',
    collapsed: true,
    items: [
      { text: 'Correction automatique', link: '/fr/prx-sd/remediation/' },
    ],
  },
  {
    text: 'Alertes et planification',
    collapsed: true,
    items: [
      { text: 'Alertes Webhook', link: '/fr/prx-sd/alerts/webhook' },
      { text: 'Alertes par e-mail', link: '/fr/prx-sd/alerts/email' },
      { text: 'Analyses planifiees', link: '/fr/prx-sd/alerts/schedule' },
    ],
  },
  {
    text: 'Protection reseau',
    collapsed: true,
    items: [
      { text: 'Blocage publicitaire et malware', link: '/fr/prx-sd/network/adblock' },
      { text: 'Proxy DNS', link: '/fr/prx-sd/network/dns-proxy' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-sd/configuration/' },
      { text: 'Reference complete', link: '/fr/prx-sd/configuration/reference' },
    ],
  },
  {
    text: 'Reference CLI',
    collapsed: true,
    items: [
      { text: 'Liste des commandes', link: '/fr/prx-sd/cli/' },
    ],
  },
  {
    text: 'Plugins (WASM)',
    collapsed: true,
    items: [
      { text: 'Developpement de plugins', link: '/fr/prx-sd/plugins/' },
    ],
  },
  {
    text: 'Application bureau',
    collapsed: true,
    items: [
      { text: 'Tauri GUI', link: '/fr/prx-sd/gui/' },
    ],
  },
  {
    text: 'Depannage',
    collapsed: true,
    items: [
      { text: 'Questions frequentes', link: '/fr/prx-sd/troubleshooting/' },
    ],
  },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Demarrage',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-waf/' },
      { text: 'Installation', link: '/fr/prx-waf/getting-started/installation' },
      { text: 'Demarrage rapide', link: '/fr/prx-waf/getting-started/quickstart' },
    ],
  },
  {
    text: 'Moteur de regles',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-waf/rules/' },
      { text: 'Syntaxe YAML', link: '/fr/prx-waf/rules/yaml-syntax' },
      { text: 'Regles integrees', link: '/fr/prx-waf/rules/builtin-rules' },
      { text: 'Regles personnalisees', link: '/fr/prx-waf/rules/custom-rules' },
    ],
  },
  {
    text: 'Passerelle',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-waf/gateway/' },
      { text: 'Proxy inverse', link: '/fr/prx-waf/gateway/reverse-proxy' },
      { text: 'SSL / TLS', link: '/fr/prx-waf/gateway/ssl-tls' },
    ],
  },
  {
    text: 'Cluster',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-waf/cluster/' },
      { text: 'Deploiement', link: '/fr/prx-waf/cluster/deployment' },
    ],
  },
  {
    text: 'CrowdSec',
    collapsed: true,
    items: [
      { text: 'Integration', link: '/fr/prx-waf/crowdsec/' },
    ],
  },
  {
    text: 'Interface d\'administration',
    collapsed: true,
    items: [
      { text: 'Tableau de bord', link: '/fr/prx-waf/admin-ui/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-waf/configuration/' },
      { text: 'Reference complete', link: '/fr/prx-waf/configuration/reference' },
    ],
  },
  {
    text: 'Reference CLI',
    collapsed: true,
    items: [
      { text: 'Liste des commandes', link: '/fr/prx-waf/cli/' },
    ],
  },
  {
    text: 'Depannage',
    collapsed: true,
    items: [
      { text: 'Questions frequentes', link: '/fr/prx-waf/troubleshooting/' },
    ],
  },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Demarrage',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/openpr/' },
      { text: 'Installation', link: '/fr/openpr/getting-started/installation' },
      { text: 'Demarrage rapide', link: '/fr/openpr/getting-started/quickstart' },
    ],
  },
  {
    text: 'Espace de travail',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/openpr/workspace/' },
      { text: 'Projets', link: '/fr/openpr/workspace/projects' },
      { text: 'Membres', link: '/fr/openpr/workspace/members' },
    ],
  },
  {
    text: 'Elements de travail',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/openpr/issues/' },
      { text: 'Flux de travail', link: '/fr/openpr/issues/workflow' },
      { text: 'Sprints', link: '/fr/openpr/issues/sprints' },
      { text: 'Etiquettes', link: '/fr/openpr/issues/labels' },
    ],
  },
  {
    text: 'Gouvernance',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/openpr/governance/' },
      { text: 'Propositions', link: '/fr/openpr/governance/proposals' },
      { text: 'Vote', link: '/fr/openpr/governance/voting' },
      { text: 'Scores de confiance', link: '/fr/openpr/governance/trust-scores' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/openpr/api/' },
      { text: 'Authentification', link: '/fr/openpr/api/authentication' },
      { text: 'Endpoints', link: '/fr/openpr/api/endpoints' },
    ],
  },
  {
    text: 'Serveur MCP',
    collapsed: true,
    items: [
      { text: 'Integration', link: '/fr/openpr/mcp-server/' },
    ],
  },
  {
    text: 'Deploiement',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/fr/openpr/deployment/docker' },
      { text: 'Production', link: '/fr/openpr/deployment/production' },
    ],
  },
  {
    text: 'Reference CLI',
    collapsed: true,
    items: [
      { text: 'Liste des commandes', link: '/fr/openpr/cli/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/fr/openpr/configuration/' },
    ],
  },
  {
    text: 'Depannage',
    collapsed: true,
    items: [
      { text: 'Questions frequentes', link: '/fr/openpr/troubleshooting/' },
    ],
  },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Demarrage',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/openpr-webhook/' },
      { text: 'Installation', link: '/fr/openpr-webhook/getting-started/installation' },
      { text: 'Demarrage rapide', link: '/fr/openpr-webhook/getting-started/quickstart' },
    ],
  },
  {
    text: 'Agents',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/openpr-webhook/agents/' },
      { text: 'Executeurs', link: '/fr/openpr-webhook/agents/executors' },
    ],
  },
  {
    text: 'Tunnel WSS',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/openpr-webhook/tunnel/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/fr/openpr-webhook/configuration/' },
    ],
  },
  {
    text: 'Depannage',
    collapsed: true,
    items: [
      { text: 'Questions frequentes', link: '/fr/openpr-webhook/troubleshooting/' },
    ],
  },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Demarrage',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-memory/' },
      { text: 'Installation', link: '/fr/prx-memory/getting-started/installation' },
      { text: 'Demarrage rapide', link: '/fr/prx-memory/getting-started/quickstart' },
    ],
  },
  {
    text: 'Embeddings vectoriels',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-memory/embedding/' },
      { text: 'Modeles', link: '/fr/prx-memory/embedding/models' },
      { text: 'Traitement par lots', link: '/fr/prx-memory/embedding/batch-processing' },
    ],
  },
  {
    text: 'Reranking',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-memory/reranking/' },
      { text: 'Modeles', link: '/fr/prx-memory/reranking/models' },
    ],
  },
  {
    text: 'Stockage',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-memory/storage/' },
      { text: 'SQLite', link: '/fr/prx-memory/storage/sqlite' },
      { text: 'Recherche vectorielle', link: '/fr/prx-memory/storage/vector-search' },
    ],
  },
  {
    text: 'Protocole MCP',
    collapsed: true,
    items: [
      { text: 'Integration', link: '/fr/prx-memory/mcp/' },
    ],
  },
  {
    text: 'Reference API',
    collapsed: true,
    items: [
      { text: 'Rust API', link: '/fr/prx-memory/api/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/fr/prx-memory/configuration/' },
    ],
  },
  {
    text: 'Depannage',
    collapsed: true,
    items: [
      { text: 'Questions frequentes', link: '/fr/prx-memory/troubleshooting/' },
    ],
  },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Demarrage',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-email/' },
      { text: 'Installation', link: '/fr/prx-email/getting-started/installation' },
      { text: 'Demarrage rapide', link: '/fr/prx-email/getting-started/quickstart' },
    ],
  },
  {
    text: 'Comptes e-mail',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/prx-email/accounts/' },
      { text: 'IMAP', link: '/fr/prx-email/accounts/imap' },
      { text: 'SMTP', link: '/fr/prx-email/accounts/smtp' },
      { text: 'OAuth', link: '/fr/prx-email/accounts/oauth' },
    ],
  },
  {
    text: 'Stockage',
    collapsed: true,
    items: [
      { text: 'SQLite', link: '/fr/prx-email/storage/' },
    ],
  },
  {
    text: 'Plugins',
    collapsed: true,
    items: [
      { text: 'Plugins WASM', link: '/fr/prx-email/plugins/' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/fr/prx-email/configuration/' },
    ],
  },
  {
    text: 'Depannage',
    collapsed: true,
    items: [
      { text: 'Questions frequentes', link: '/fr/prx-email/troubleshooting/' },
    ],
  },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Demarrage',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/fenfa/' },
      { text: 'Installation', link: '/fr/fenfa/getting-started/installation' },
      { text: 'Demarrage rapide', link: '/fr/fenfa/getting-started/quickstart' },
    ],
  },
  {
    text: 'Gestion des produits',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/fenfa/products/' },
      { text: 'Variantes', link: '/fr/fenfa/products/variants' },
      { text: 'Versions', link: '/fr/fenfa/products/releases' },
    ],
  },
  {
    text: 'Distribution d\'applications',
    collapsed: false,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/fenfa/distribution/' },
      { text: 'iOS', link: '/fr/fenfa/distribution/ios' },
      { text: 'Android', link: '/fr/fenfa/distribution/android' },
      { text: 'Bureau', link: '/fr/fenfa/distribution/desktop' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: 'Vue d\'ensemble', link: '/fr/fenfa/api/' },
      { text: 'API de telechargement', link: '/fr/fenfa/api/upload' },
      { text: 'API d\'administration', link: '/fr/fenfa/api/admin' },
    ],
  },
  {
    text: 'Deploiement',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/fr/fenfa/deployment/docker' },
      { text: 'Production', link: '/fr/fenfa/deployment/production' },
    ],
  },
  {
    text: 'Configuration',
    collapsed: true,
    items: [
      { text: 'Reference', link: '/fr/fenfa/configuration/' },
    ],
  },
  {
    text: 'Depannage',
    collapsed: true,
    items: [
      { text: 'Questions frequentes', link: '/fr/fenfa/troubleshooting/' },
    ],
  },
]

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'PRX',
    items: [
      { text: 'Demarrage', link: '/fr/prx/' },
      { text: 'Canaux', link: '/fr/prx/channels/' },
      { text: 'Fournisseurs', link: '/fr/prx/providers/' },
      { text: 'Outils', link: '/fr/prx/tools/' },
      { text: 'Configuration', link: '/fr/prx/config/' },
    ],
  },
  {
    text: 'PRX-SD',
    items: [
      { text: 'Demarrage', link: '/fr/prx-sd/' },
      { text: 'Analyse', link: '/fr/prx-sd/scanning/file-scan' },
      { text: 'Moteur de detection', link: '/fr/prx-sd/detection/' },
      { text: 'Renseignement sur les menaces', link: '/fr/prx-sd/signatures/' },
      { text: 'Configuration', link: '/fr/prx-sd/configuration/' },
    ],
  },
  {
    text: 'PRX-WAF',
    items: [
      { text: 'Demarrage', link: '/fr/prx-waf/' },
      { text: 'Moteur de regles', link: '/fr/prx-waf/rules/' },
      { text: 'Passerelle', link: '/fr/prx-waf/gateway/' },
      { text: 'Cluster', link: '/fr/prx-waf/cluster/' },
      { text: 'Configuration', link: '/fr/prx-waf/configuration/' },
    ],
  },
  {
    text: 'Plus',
    items: [
      { text: 'OpenPR', link: '/fr/openpr/' },
      { text: 'OpenPR-Webhook', link: '/fr/openpr-webhook/' },
      { text: 'PRX-Memory', link: '/fr/prx-memory/' },
      { text: 'PRX-Email', link: '/fr/prx-email/' },
      { text: 'Fenfa', link: '/fr/fenfa/' },
    ],
  },
]

export const frConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/fr/prx/': prxSidebar,
      '/fr/prx-sd/': prxSdSidebar,
      '/fr/prx-waf/': prxWafSidebar,
      '/fr/openpr/': openprSidebar,
      '/fr/openpr-webhook/': openprWebhookSidebar,
      '/fr/prx-memory/': prxMemorySidebar,
      '/fr/prx-email/': prxEmailSidebar,
      '/fr/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'Modifier cette page sur GitHub',
    },
    lastUpdated: {
      text: 'Derniere mise a jour',
    },
    docFooter: {
      prev: 'Page precedente',
      next: 'Page suivante',
    },
    outline: {
      label: 'Sur cette page',
      level: [2, 3],
    },
  },
}
