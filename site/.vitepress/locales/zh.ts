import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '快速入门',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx/' },
      { text: '安装', link: '/zh/prx/getting-started/installation' },
      { text: '快速开始', link: '/zh/prx/getting-started/quickstart' },
      { text: '引导向导', link: '/zh/prx/getting-started/onboarding' },
    ],
  },
  {
    text: '消息渠道',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx/channels/' },
      { text: 'Telegram', link: '/zh/prx/channels/telegram' },
      { text: 'Discord', link: '/zh/prx/channels/discord' },
      { text: 'Slack', link: '/zh/prx/channels/slack' },
      { text: 'WhatsApp', link: '/zh/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/zh/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/zh/prx/channels/signal' },
      { text: 'iMessage', link: '/zh/prx/channels/imessage' },
      { text: 'Matrix', link: '/zh/prx/channels/matrix' },
      { text: '邮件', link: '/zh/prx/channels/email' },
      { text: '飞书 / Lark', link: '/zh/prx/channels/lark' },
      { text: '钉钉', link: '/zh/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/zh/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/zh/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/zh/prx/channels/irc' },
      { text: 'QQ', link: '/zh/prx/channels/qq' },
      { text: 'LINQ', link: '/zh/prx/channels/linq' },
      { text: '命令行', link: '/zh/prx/channels/cli' },
    ],
  },
  {
    text: 'LLM 提供商',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/zh/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/zh/prx/providers/openai' },
      { text: 'Google Gemini', link: '/zh/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/zh/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/zh/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/zh/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/zh/prx/providers/aws-bedrock' },
      { text: 'GLM (智谱)', link: '/zh/prx/providers/glm' },
      { text: 'OpenRouter', link: '/zh/prx/providers/openrouter' },
      { text: '自定义兼容', link: '/zh/prx/providers/custom-compatible' },
    ],
  },
  {
    text: '工具',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/tools/' },
      { text: 'Shell 执行', link: '/zh/prx/tools/shell' },
      { text: '文件操作', link: '/zh/prx/tools/file-operations' },
      { text: '记忆工具', link: '/zh/prx/tools/memory' },
      { text: '浏览器', link: '/zh/prx/tools/browser' },
      { text: '网页搜索', link: '/zh/prx/tools/web-search' },
      { text: 'HTTP 请求', link: '/zh/prx/tools/http-request' },
      { text: '会话与代理', link: '/zh/prx/tools/sessions' },
      { text: '定时工具', link: '/zh/prx/tools/cron-tools' },
      { text: 'Git 操作', link: '/zh/prx/tools/git' },
      { text: '消息发送', link: '/zh/prx/tools/messaging' },
      { text: '远程节点', link: '/zh/prx/tools/nodes' },
      { text: '媒体', link: '/zh/prx/tools/media' },
      { text: 'MCP 集成', link: '/zh/prx/tools/mcp' },
      { text: 'SkillForge', link: '/zh/prx/tools/skillforge' },
      { text: 'Hooks', link: '/zh/prx/tools/hooks' },
    ],
  },
  {
    text: 'Agent 运行时',
    collapsed: true,
    items: [
      { text: '架构', link: '/zh/prx/agent/runtime' },
      { text: 'Agent 循环', link: '/zh/prx/agent/loop' },
      { text: '子代理', link: '/zh/prx/agent/subagents' },
      { text: '会话工作进程', link: '/zh/prx/agent/session-worker' },
      { text: '运行时后端', link: '/zh/prx/agent/runtime-backends' },
      { text: '多模态', link: '/zh/prx/agent/multimodal' },
    ],
  },
  {
    text: '记忆系统',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/memory/' },
      { text: 'Markdown 后端', link: '/zh/prx/memory/markdown' },
      { text: 'SQLite 后端', link: '/zh/prx/memory/sqlite' },
      { text: 'PostgreSQL 后端', link: '/zh/prx/memory/postgres' },
      { text: '向量嵌入', link: '/zh/prx/memory/embeddings' },
      { text: '记忆清理', link: '/zh/prx/memory/hygiene' },
      { text: 'RAG', link: '/zh/prx/memory/rag' },
      { text: 'Lucid.so', link: '/zh/prx/memory/lucid' },
      { text: '向量搜索', link: '/zh/prx/memory/vector-search' },
    ],
  },
  {
    text: '自进化',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/self-evolution/' },
      { text: 'L1: 记忆进化', link: '/zh/prx/self-evolution/l1-memory' },
      { text: 'L2: 提示词进化', link: '/zh/prx/self-evolution/l2-prompt' },
      { text: 'L3: 策略进化', link: '/zh/prx/self-evolution/l3-strategy' },
      { text: '流水线', link: '/zh/prx/self-evolution/pipeline' },
      { text: '安全机制', link: '/zh/prx/self-evolution/safety' },
      { text: '决策日志', link: '/zh/prx/self-evolution/decision-log' },
      { text: '实验系统', link: '/zh/prx/self-evolution/experiments' },
    ],
  },
  {
    text: '配置',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/config/' },
      { text: '完整参考', link: '/zh/prx/config/reference' },
      { text: '热重载', link: '/zh/prx/config/hot-reload' },
      { text: '环境变量', link: '/zh/prx/config/environment' },
    ],
  },
  {
    text: '插件 (WASM)',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/plugins/' },
      { text: '架构', link: '/zh/prx/plugins/architecture' },
      { text: '开发指南', link: '/zh/prx/plugins/developer-guide' },
      { text: '宿主函数', link: '/zh/prx/plugins/host-functions' },
      { text: 'PDK', link: '/zh/prx/plugins/pdk' },
      { text: '示例', link: '/zh/prx/plugins/examples' },
      { text: '事件总线', link: '/zh/prx/plugins/event-bus' },
    ],
  },
  {
    text: '网关',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/gateway/' },
      { text: 'HTTP API', link: '/zh/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/zh/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/zh/prx/gateway/webhooks' },
      { text: '中间件', link: '/zh/prx/gateway/middleware' },
      { text: 'API 参考', link: '/zh/prx/gateway/api-reference' },
    ],
  },
  {
    text: '安全',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/security/' },
      { text: '策略引擎', link: '/zh/prx/security/policy-engine' },
      { text: '配对认证', link: '/zh/prx/security/pairing' },
      { text: '沙箱', link: '/zh/prx/security/sandbox' },
      { text: '密钥存储', link: '/zh/prx/security/secrets' },
      { text: '威胁模型', link: '/zh/prx/security/threat-model' },
      { text: '审批工作流', link: '/zh/prx/security/approval' },
      { text: '审计日志', link: '/zh/prx/security/audit' },
    ],
  },
  {
    text: 'LLM 路由',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/router/' },
      { text: '启发式路由', link: '/zh/prx/router/heuristic' },
      { text: 'KNN 路由', link: '/zh/prx/router/knn' },
      { text: 'Automix', link: '/zh/prx/router/automix' },
    ],
  },
  {
    text: '定时调度 (Xin)',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/cron/' },
      { text: '心跳检测', link: '/zh/prx/cron/heartbeat' },
      { text: '定时任务', link: '/zh/prx/cron/tasks' },
    ],
  },
  {
    text: '远程节点',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/nodes/' },
      { text: '配对协议', link: '/zh/prx/nodes/pairing' },
      { text: 'JSON-RPC 协议', link: '/zh/prx/nodes/protocol' },
    ],
  },
  {
    text: '认证',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/auth/' },
      { text: 'OAuth2 流程', link: '/zh/prx/auth/oauth2' },
      { text: '认证配置', link: '/zh/prx/auth/profiles' },
      { text: '身份管理', link: '/zh/prx/auth/identity' },
    ],
  },
  {
    text: 'CLI 命令参考',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/cli/' },
      { text: 'prx agent', link: '/zh/prx/cli/agent' },
      { text: 'prx chat', link: '/zh/prx/cli/chat' },
      { text: 'prx daemon', link: '/zh/prx/cli/daemon' },
      { text: 'prx gateway', link: '/zh/prx/cli/gateway' },
      { text: 'prx onboard', link: '/zh/prx/cli/onboard' },
      { text: 'prx channel', link: '/zh/prx/cli/channel' },
      { text: 'prx cron', link: '/zh/prx/cli/cron' },
      { text: 'prx evolution', link: '/zh/prx/cli/evolution' },
      { text: 'prx auth', link: '/zh/prx/cli/auth' },
      { text: 'prx config', link: '/zh/prx/cli/config' },
      { text: 'prx doctor', link: '/zh/prx/cli/doctor' },
      { text: 'prx service', link: '/zh/prx/cli/service' },
      { text: 'prx skills', link: '/zh/prx/cli/skills' },
    ],
  },
  {
    text: '可观测性',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/observability/' },
      { text: 'Prometheus', link: '/zh/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/zh/prx/observability/opentelemetry' },
      { text: '费用追踪', link: '/zh/prx/observability/cost-tracking' },
    ],
  },
  {
    text: '隧道',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/zh/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/zh/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/zh/prx/tunnel/ngrok' },
    ],
  },
  {
    text: '故障排除',
    collapsed: true,
    items: [
      { text: '常见错误', link: '/zh/prx/troubleshooting/' },
      { text: '诊断工具', link: '/zh/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '快速入门',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx-sd/' },
      { text: '安装', link: '/zh/prx-sd/getting-started/installation' },
      { text: '快速开始', link: '/zh/prx-sd/getting-started/quickstart' },
    ],
  },
  {
    text: '扫描',
    collapsed: false,
    items: [
      { text: '文件与目录扫描', link: '/zh/prx-sd/scanning/file-scan' },
      { text: '进程内存扫描', link: '/zh/prx-sd/scanning/memory-scan' },
      { text: 'Rootkit 检测', link: '/zh/prx-sd/scanning/rootkit' },
      { text: 'USB 设备扫描', link: '/zh/prx-sd/scanning/usb-scan' },
    ],
  },
  {
    text: '检测引擎',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx-sd/detection/' },
      { text: '哈希匹配', link: '/zh/prx-sd/detection/hash-matching' },
      { text: 'YARA 规则', link: '/zh/prx-sd/detection/yara-rules' },
      { text: '启发式分析', link: '/zh/prx-sd/detection/heuristics' },
      { text: '支持的文件类型', link: '/zh/prx-sd/detection/file-types' },
    ],
  },
  {
    text: '实时防护',
    collapsed: true,
    items: [
      { text: '文件监控', link: '/zh/prx-sd/realtime/monitor' },
      { text: '守护进程', link: '/zh/prx-sd/realtime/daemon' },
      { text: '勒索软件防护', link: '/zh/prx-sd/realtime/ransomware' },
    ],
  },
  {
    text: '威胁情报',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx-sd/signatures/' },
      { text: '更新签名库', link: '/zh/prx-sd/signatures/update' },
      { text: '情报源', link: '/zh/prx-sd/signatures/sources' },
      { text: '导入哈希', link: '/zh/prx-sd/signatures/import' },
      { text: '自定义 YARA 规则', link: '/zh/prx-sd/signatures/custom-rules' },
    ],
  },
  {
    text: '隔离区',
    collapsed: true,
    items: [
      { text: '隔离管理', link: '/zh/prx-sd/quarantine/' },
    ],
  },
  {
    text: '威胁响应',
    collapsed: true,
    items: [
      { text: '自动修复', link: '/zh/prx-sd/remediation/' },
    ],
  },
  {
    text: '告警与调度',
    collapsed: true,
    items: [
      { text: 'Webhook 告警', link: '/zh/prx-sd/alerts/webhook' },
      { text: '邮件告警', link: '/zh/prx-sd/alerts/email' },
      { text: '定时扫描', link: '/zh/prx-sd/alerts/schedule' },
    ],
  },
  {
    text: '网络防护',
    collapsed: true,
    items: [
      { text: '广告与恶意域名拦截', link: '/zh/prx-sd/network/adblock' },
      { text: 'DNS 代理', link: '/zh/prx-sd/network/dns-proxy' },
    ],
  },
  {
    text: '配置',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx-sd/configuration/' },
      { text: '完整参考', link: '/zh/prx-sd/configuration/reference' },
    ],
  },
  {
    text: 'CLI 命令参考',
    collapsed: true,
    items: [
      { text: '命令总览', link: '/zh/prx-sd/cli/' },
    ],
  },
  {
    text: '插件 (WASM)',
    collapsed: true,
    items: [
      { text: '插件开发', link: '/zh/prx-sd/plugins/' },
    ],
  },
  {
    text: '桌面应用',
    collapsed: true,
    items: [
      { text: 'Tauri GUI', link: '/zh/prx-sd/gui/' },
    ],
  },
  {
    text: '故障排除',
    collapsed: true,
    items: [
      { text: '常见问题', link: '/zh/prx-sd/troubleshooting/' },
    ],
  },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '快速入门',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx-waf/' },
      { text: '安装', link: '/zh/prx-waf/getting-started/installation' },
      { text: '快速开始', link: '/zh/prx-waf/getting-started/quickstart' },
    ],
  },
  {
    text: '规则引擎',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx-waf/rules/' },
      { text: 'YAML 语法', link: '/zh/prx-waf/rules/yaml-syntax' },
      { text: '内置规则', link: '/zh/prx-waf/rules/builtin-rules' },
      { text: '自定义规则', link: '/zh/prx-waf/rules/custom-rules' },
    ],
  },
  {
    text: '网关',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx-waf/gateway/' },
      { text: '反向代理', link: '/zh/prx-waf/gateway/reverse-proxy' },
      { text: 'SSL / TLS', link: '/zh/prx-waf/gateway/ssl-tls' },
    ],
  },
  {
    text: '集群',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx-waf/cluster/' },
      { text: '部署', link: '/zh/prx-waf/cluster/deployment' },
    ],
  },
  {
    text: '管理界面',
    collapsed: true,
    items: [
      { text: '仪表盘', link: '/zh/prx-waf/admin-ui/' },
    ],
  },
  {
    text: '配置',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx-waf/configuration/' },
      { text: '完整参考', link: '/zh/prx-waf/configuration/reference' },
    ],
  },
  {
    text: 'CLI 命令参考',
    collapsed: true,
    items: [
      { text: '命令总览', link: '/zh/prx-waf/cli/' },
    ],
  },
  {
    text: '故障排除',
    collapsed: true,
    items: [
      { text: '常见问题', link: '/zh/prx-waf/troubleshooting/' },
    ],
  },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '快速入门',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/openpr/' },
      { text: '安装', link: '/zh/openpr/getting-started/installation' },
      { text: '快速开始', link: '/zh/openpr/getting-started/quickstart' },
    ],
  },
  {
    text: '工作区',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/openpr/workspace/' },
      { text: '项目', link: '/zh/openpr/workspace/projects' },
      { text: '成员', link: '/zh/openpr/workspace/members' },
    ],
  },
  {
    text: '工作项',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/openpr/issues/' },
      { text: '工作流', link: '/zh/openpr/issues/workflow' },
      { text: '冲刺', link: '/zh/openpr/issues/sprints' },
      { text: '标签', link: '/zh/openpr/issues/labels' },
    ],
  },
  {
    text: '治理',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/openpr/governance/' },
      { text: '提案', link: '/zh/openpr/governance/proposals' },
      { text: '投票', link: '/zh/openpr/governance/voting' },
      { text: '信任分', link: '/zh/openpr/governance/trust-scores' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/openpr/api/' },
      { text: '认证', link: '/zh/openpr/api/authentication' },
      { text: '端点', link: '/zh/openpr/api/endpoints' },
    ],
  },
  {
    text: 'MCP 服务',
    collapsed: true,
    items: [
      { text: '集成', link: '/zh/openpr/mcp-server/' },
    ],
  },
  {
    text: '部署',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/zh/openpr/deployment/docker' },
      { text: '生产环境', link: '/zh/openpr/deployment/production' },
    ],
  },
  {
    text: '配置',
    collapsed: true,
    items: [
      { text: '参考', link: '/zh/openpr/configuration/' },
    ],
  },
  {
    text: '故障排除',
    collapsed: true,
    items: [
      { text: '常见问题', link: '/zh/openpr/troubleshooting/' },
    ],
  },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '快速入门',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx-memory/' },
      { text: '安装', link: '/zh/prx-memory/getting-started/installation' },
      { text: '快速开始', link: '/zh/prx-memory/getting-started/quickstart' },
    ],
  },
  {
    text: '向量嵌入',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx-memory/embedding/' },
      { text: '模型', link: '/zh/prx-memory/embedding/models' },
      { text: '批处理', link: '/zh/prx-memory/embedding/batch-processing' },
    ],
  },
  {
    text: '重排序',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx-memory/reranking/' },
      { text: '模型', link: '/zh/prx-memory/reranking/models' },
    ],
  },
  {
    text: '存储',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/prx-memory/storage/' },
      { text: 'SQLite', link: '/zh/prx-memory/storage/sqlite' },
      { text: '向量搜索', link: '/zh/prx-memory/storage/vector-search' },
    ],
  },
  {
    text: 'MCP 协议',
    collapsed: true,
    items: [
      { text: '集成', link: '/zh/prx-memory/mcp/' },
    ],
  },
  {
    text: 'API 参考',
    collapsed: true,
    items: [
      { text: 'Rust API', link: '/zh/prx-memory/api/' },
    ],
  },
  {
    text: '配置',
    collapsed: true,
    items: [
      { text: '参考', link: '/zh/prx-memory/configuration/' },
    ],
  },
  {
    text: '故障排除',
    collapsed: true,
    items: [
      { text: '常见问题', link: '/zh/prx-memory/troubleshooting/' },
    ],
  },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '快速入门',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx-email/' },
      { text: '安装', link: '/zh/prx-email/getting-started/installation' },
      { text: '快速开始', link: '/zh/prx-email/getting-started/quickstart' },
    ],
  },
  {
    text: '邮箱账户',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/prx-email/accounts/' },
      { text: 'IMAP', link: '/zh/prx-email/accounts/imap' },
      { text: 'SMTP', link: '/zh/prx-email/accounts/smtp' },
      { text: 'OAuth', link: '/zh/prx-email/accounts/oauth' },
    ],
  },
  {
    text: '存储',
    collapsed: true,
    items: [
      { text: 'SQLite', link: '/zh/prx-email/storage/' },
    ],
  },
  {
    text: '插件',
    collapsed: true,
    items: [
      { text: 'WASM 插件', link: '/zh/prx-email/plugins/' },
    ],
  },
  {
    text: '配置',
    collapsed: true,
    items: [
      { text: '参考', link: '/zh/prx-email/configuration/' },
    ],
  },
  {
    text: '故障排除',
    collapsed: true,
    items: [
      { text: '常见问题', link: '/zh/prx-email/troubleshooting/' },
    ],
  },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '快速入门',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/fenfa/' },
      { text: '安装', link: '/zh/fenfa/getting-started/installation' },
      { text: '快速开始', link: '/zh/fenfa/getting-started/quickstart' },
    ],
  },
  {
    text: '产品管理',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/fenfa/products/' },
      { text: '变体', link: '/zh/fenfa/products/variants' },
      { text: '版本发布', link: '/zh/fenfa/products/releases' },
    ],
  },
  {
    text: '应用分发',
    collapsed: false,
    items: [
      { text: '概述', link: '/zh/fenfa/distribution/' },
      { text: 'iOS', link: '/zh/fenfa/distribution/ios' },
      { text: 'Android', link: '/zh/fenfa/distribution/android' },
      { text: '桌面端', link: '/zh/fenfa/distribution/desktop' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: '概述', link: '/zh/fenfa/api/' },
      { text: '上传 API', link: '/zh/fenfa/api/upload' },
      { text: '管理 API', link: '/zh/fenfa/api/admin' },
    ],
  },
  {
    text: '部署',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/zh/fenfa/deployment/docker' },
      { text: '生产环境', link: '/zh/fenfa/deployment/production' },
    ],
  },
  {
    text: '配置',
    collapsed: true,
    items: [
      { text: '参考', link: '/zh/fenfa/configuration/' },
    ],
  },
  {
    text: '故障排除',
    collapsed: true,
    items: [
      { text: '常见问题', link: '/zh/fenfa/troubleshooting/' },
    ],
  },
]

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'PRX',
    items: [
      { text: '快速入门', link: '/zh/prx/' },
      { text: '消息渠道', link: '/zh/prx/channels/' },
      { text: 'LLM 提供商', link: '/zh/prx/providers/' },
      { text: '工具', link: '/zh/prx/tools/' },
      { text: '配置', link: '/zh/prx/config/' },
    ],
  },
  {
    text: 'PRX-SD',
    items: [
      { text: '快速入门', link: '/zh/prx-sd/' },
      { text: '扫描', link: '/zh/prx-sd/scanning/file-scan' },
      { text: '检测引擎', link: '/zh/prx-sd/detection/' },
      { text: '威胁情报', link: '/zh/prx-sd/signatures/' },
      { text: '配置', link: '/zh/prx-sd/configuration/' },
    ],
  },
  {
    text: 'PRX-WAF',
    items: [
      { text: '快速入门', link: '/zh/prx-waf/' },
      { text: '规则引擎', link: '/zh/prx-waf/rules/' },
      { text: '网关', link: '/zh/prx-waf/gateway/' },
      { text: '集群', link: '/zh/prx-waf/cluster/' },
      { text: '配置', link: '/zh/prx-waf/configuration/' },
    ],
  },
  {
    text: '更多',
    items: [
      { text: 'OpenPR', link: '/zh/openpr/' },
      { text: 'PRX-Memory', link: '/zh/prx-memory/' },
      { text: 'PRX-Email', link: '/zh/prx-email/' },
      { text: 'Fenfa', link: '/zh/fenfa/' },
    ],
  },
  { text: '更新日志', link: 'https://github.com/openprx/prx/blob/main/CHANGELOG.md' },
]

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/zh/prx/': prxSidebar,
      '/zh/prx-sd/': prxSdSidebar,
      '/zh/prx-waf/': prxWafSidebar,
      '/zh/openpr/': openprSidebar,
      '/zh/prx-memory/': prxMemorySidebar,
      '/zh/prx-email/': prxEmailSidebar,
      '/zh/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: '在 GitHub 上编辑此页',
    },
    lastUpdated: {
      text: '最后更新于',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    outline: {
      label: '页面导航',
      level: [2, 3],
    },
  },
}
