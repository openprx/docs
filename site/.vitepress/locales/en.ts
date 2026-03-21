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
  { text: 'Changelog', link: 'https://github.com/openprx/prx/blob/main/CHANGELOG.md' },
]

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/en/prx/': prxSidebar,
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
