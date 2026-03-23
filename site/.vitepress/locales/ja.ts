import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'はじめに',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx/' },
      { text: 'インストール', link: '/ja/prx/getting-started/installation' },
      { text: 'クイックスタート', link: '/ja/prx/getting-started/quickstart' },
      { text: 'オンボーディングウィザード', link: '/ja/prx/getting-started/onboarding' },
    ],
  },
  {
    text: 'チャンネル',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx/channels/' },
      { text: 'Telegram', link: '/ja/prx/channels/telegram' },
      { text: 'Discord', link: '/ja/prx/channels/discord' },
      { text: 'Slack', link: '/ja/prx/channels/slack' },
      { text: 'WhatsApp', link: '/ja/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/ja/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/ja/prx/channels/signal' },
      { text: 'iMessage', link: '/ja/prx/channels/imessage' },
      { text: 'Matrix', link: '/ja/prx/channels/matrix' },
      { text: 'メール', link: '/ja/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/ja/prx/channels/lark' },
      { text: 'DingTalk', link: '/ja/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/ja/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/ja/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/ja/prx/channels/irc' },
      { text: 'QQ', link: '/ja/prx/channels/qq' },
      { text: 'LINQ', link: '/ja/prx/channels/linq' },
      { text: 'CLI', link: '/ja/prx/channels/cli' },
    ],
  },
  {
    text: 'LLM プロバイダー',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/ja/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/ja/prx/providers/openai' },
      { text: 'Google Gemini', link: '/ja/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/ja/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/ja/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/ja/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/ja/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/ja/prx/providers/glm' },
      { text: 'OpenRouter', link: '/ja/prx/providers/openrouter' },
      { text: 'カスタム互換', link: '/ja/prx/providers/custom-compatible' },
    ],
  },
  {
    text: 'ツール',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/tools/' },
      { text: 'シェル実行', link: '/ja/prx/tools/shell' },
      { text: 'ファイル操作', link: '/ja/prx/tools/file-operations' },
      { text: 'メモリツール', link: '/ja/prx/tools/memory' },
      { text: 'ブラウザ', link: '/ja/prx/tools/browser' },
      { text: 'Web検索', link: '/ja/prx/tools/web-search' },
      { text: 'HTTPリクエスト', link: '/ja/prx/tools/http-request' },
      { text: 'セッションとエージェント', link: '/ja/prx/tools/sessions' },
      { text: 'Cronツール', link: '/ja/prx/tools/cron-tools' },
      { text: 'Git操作', link: '/ja/prx/tools/git' },
      { text: 'メッセージング', link: '/ja/prx/tools/messaging' },
      { text: 'リモートノード', link: '/ja/prx/tools/nodes' },
      { text: 'メディア', link: '/ja/prx/tools/media' },
      { text: 'MCP統合', link: '/ja/prx/tools/mcp' },
      { text: 'SkillForge', link: '/ja/prx/tools/skillforge' },
      { text: 'Hooks', link: '/ja/prx/tools/hooks' },
    ],
  },
  {
    text: 'エージェントランタイム',
    collapsed: true,
    items: [
      { text: 'アーキテクチャ', link: '/ja/prx/agent/runtime' },
      { text: 'エージェントループ', link: '/ja/prx/agent/loop' },
      { text: 'サブエージェント', link: '/ja/prx/agent/subagents' },
      { text: 'セッションワーカー', link: '/ja/prx/agent/session-worker' },
      { text: 'ランタイムバックエンド', link: '/ja/prx/agent/runtime-backends' },
      { text: 'マルチモーダル', link: '/ja/prx/agent/multimodal' },
    ],
  },
  {
    text: 'メモリシステム',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/memory/' },
      { text: 'Markdownバックエンド', link: '/ja/prx/memory/markdown' },
      { text: 'SQLiteバックエンド', link: '/ja/prx/memory/sqlite' },
      { text: 'PostgreSQLバックエンド', link: '/ja/prx/memory/postgres' },
      { text: 'ベクトル埋め込み', link: '/ja/prx/memory/embeddings' },
      { text: 'メモリ整理', link: '/ja/prx/memory/hygiene' },
      { text: 'RAG', link: '/ja/prx/memory/rag' },
      { text: 'Lucid.so', link: '/ja/prx/memory/lucid' },
      { text: 'ベクトル検索', link: '/ja/prx/memory/vector-search' },
    ],
  },
  {
    text: '自己進化',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/self-evolution/' },
      { text: 'L1: メモリ進化', link: '/ja/prx/self-evolution/l1-memory' },
      { text: 'L2: プロンプト進化', link: '/ja/prx/self-evolution/l2-prompt' },
      { text: 'L3: 戦略進化', link: '/ja/prx/self-evolution/l3-strategy' },
      { text: 'パイプライン', link: '/ja/prx/self-evolution/pipeline' },
      { text: '安全機構', link: '/ja/prx/self-evolution/safety' },
      { text: '決定ログ', link: '/ja/prx/self-evolution/decision-log' },
      { text: '実験システム', link: '/ja/prx/self-evolution/experiments' },
    ],
  },
  {
    text: '設定',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/config/' },
      { text: '完全リファレンス', link: '/ja/prx/config/reference' },
      { text: 'ホットリロード', link: '/ja/prx/config/hot-reload' },
      { text: '環境変数', link: '/ja/prx/config/environment' },
    ],
  },
  {
    text: 'プラグイン (WASM)',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/plugins/' },
      { text: 'アーキテクチャ', link: '/ja/prx/plugins/architecture' },
      { text: '開発ガイド', link: '/ja/prx/plugins/developer-guide' },
      { text: 'ホスト関数', link: '/ja/prx/plugins/host-functions' },
      { text: 'PDK', link: '/ja/prx/plugins/pdk' },
      { text: 'サンプル', link: '/ja/prx/plugins/examples' },
      { text: 'イベントバス', link: '/ja/prx/plugins/event-bus' },
    ],
  },
  {
    text: 'ゲートウェイ',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/gateway/' },
      { text: 'HTTP API', link: '/ja/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/ja/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/ja/prx/gateway/webhooks' },
      { text: 'ミドルウェア', link: '/ja/prx/gateway/middleware' },
      { text: 'APIリファレンス', link: '/ja/prx/gateway/api-reference' },
    ],
  },
  {
    text: 'セキュリティ',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/security/' },
      { text: 'ポリシーエンジン', link: '/ja/prx/security/policy-engine' },
      { text: 'ペアリング認証', link: '/ja/prx/security/pairing' },
      { text: 'サンドボックス', link: '/ja/prx/security/sandbox' },
      { text: 'シークレットストア', link: '/ja/prx/security/secrets' },
      { text: '脅威モデル', link: '/ja/prx/security/threat-model' },
      { text: '承認ワークフロー', link: '/ja/prx/security/approval' },
      { text: '監査ログ', link: '/ja/prx/security/audit' },
    ],
  },
  {
    text: 'LLMルーター',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/router/' },
      { text: 'ヒューリスティックルーティング', link: '/ja/prx/router/heuristic' },
      { text: 'KNNルーティング', link: '/ja/prx/router/knn' },
      { text: 'Automix', link: '/ja/prx/router/automix' },
    ],
  },
  {
    text: '因果ツリーエンジン',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/causal-tree/' },
      { text: '設定リファレンス', link: '/ja/prx/causal-tree/configuration' },
    ],
  },
  {
    text: 'スケジューリング (Xin)',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/cron/' },
      { text: 'ハートビート', link: '/ja/prx/cron/heartbeat' },
      { text: 'Cronタスク', link: '/ja/prx/cron/tasks' },
    ],
  },
  {
    text: 'リモートノード',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/nodes/' },
      { text: 'ペアリングプロトコル', link: '/ja/prx/nodes/pairing' },
      { text: 'JSON-RPCプロトコル', link: '/ja/prx/nodes/protocol' },
    ],
  },
  {
    text: '認証',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/auth/' },
      { text: 'OAuth2フロー', link: '/ja/prx/auth/oauth2' },
      { text: '認証プロファイル', link: '/ja/prx/auth/profiles' },
      { text: 'ID管理', link: '/ja/prx/auth/identity' },
    ],
  },
  {
    text: 'CLIリファレンス',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/cli/' },
      { text: 'prx agent', link: '/ja/prx/cli/agent' },
      { text: 'prx chat', link: '/ja/prx/cli/chat' },
      { text: 'prx daemon', link: '/ja/prx/cli/daemon' },
      { text: 'prx gateway', link: '/ja/prx/cli/gateway' },
      { text: 'prx onboard', link: '/ja/prx/cli/onboard' },
      { text: 'prx channel', link: '/ja/prx/cli/channel' },
      { text: 'prx cron', link: '/ja/prx/cli/cron' },
      { text: 'prx evolution', link: '/ja/prx/cli/evolution' },
      { text: 'prx auth', link: '/ja/prx/cli/auth' },
      { text: 'prx config', link: '/ja/prx/cli/config' },
      { text: 'prx doctor', link: '/ja/prx/cli/doctor' },
      { text: 'prx service', link: '/ja/prx/cli/service' },
      { text: 'prx skills', link: '/ja/prx/cli/skills' },
    ],
  },
  {
    text: 'オブザーバビリティ',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/observability/' },
      { text: 'Prometheus', link: '/ja/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/ja/prx/observability/opentelemetry' },
      { text: 'コスト追跡', link: '/ja/prx/observability/cost-tracking' },
    ],
  },
  {
    text: 'トンネル',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/ja/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/ja/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/ja/prx/tunnel/ngrok' },
    ],
  },
  {
    text: 'トラブルシューティング',
    collapsed: true,
    items: [
      { text: 'よくあるエラー', link: '/ja/prx/troubleshooting/' },
      { text: '診断ツール', link: '/ja/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'はじめに',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx-sd/' },
      { text: 'インストール', link: '/ja/prx-sd/getting-started/installation' },
      { text: 'クイックスタート', link: '/ja/prx-sd/getting-started/quickstart' },
    ],
  },
  {
    text: 'スキャン',
    collapsed: false,
    items: [
      { text: 'ファイル・ディレクトリスキャン', link: '/ja/prx-sd/scanning/file-scan' },
      { text: 'メモリスキャン', link: '/ja/prx-sd/scanning/memory-scan' },
      { text: 'Rootkit検出', link: '/ja/prx-sd/scanning/rootkit' },
      { text: 'USBデバイススキャン', link: '/ja/prx-sd/scanning/usb-scan' },
    ],
  },
  {
    text: '検出エンジン',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx-sd/detection/' },
      { text: 'ハッシュマッチング', link: '/ja/prx-sd/detection/hash-matching' },
      { text: 'YARAルール', link: '/ja/prx-sd/detection/yara-rules' },
      { text: 'ヒューリスティック分析', link: '/ja/prx-sd/detection/heuristics' },
      { text: '対応ファイル形式', link: '/ja/prx-sd/detection/file-types' },
    ],
  },
  {
    text: 'リアルタイム保護',
    collapsed: true,
    items: [
      { text: 'ファイル監視', link: '/ja/prx-sd/realtime/monitor' },
      { text: 'デーモン', link: '/ja/prx-sd/realtime/daemon' },
      { text: 'ランサムウェア対策', link: '/ja/prx-sd/realtime/ransomware' },
    ],
  },
  {
    text: '脅威インテリジェンス',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx-sd/signatures/' },
      { text: 'シグネチャ更新', link: '/ja/prx-sd/signatures/update' },
      { text: 'インテリジェンスソース', link: '/ja/prx-sd/signatures/sources' },
      { text: 'ハッシュインポート', link: '/ja/prx-sd/signatures/import' },
      { text: 'カスタムYARAルール', link: '/ja/prx-sd/signatures/custom-rules' },
    ],
  },
  {
    text: '隔離',
    collapsed: true,
    items: [
      { text: '隔離管理', link: '/ja/prx-sd/quarantine/' },
    ],
  },
  {
    text: '脅威対応',
    collapsed: true,
    items: [
      { text: '自動修復', link: '/ja/prx-sd/remediation/' },
    ],
  },
  {
    text: 'アラートとスケジューリング',
    collapsed: true,
    items: [
      { text: 'Webhookアラート', link: '/ja/prx-sd/alerts/webhook' },
      { text: 'メールアラート', link: '/ja/prx-sd/alerts/email' },
      { text: 'スケジュールスキャン', link: '/ja/prx-sd/alerts/schedule' },
    ],
  },
  {
    text: 'ネットワーク保護',
    collapsed: true,
    items: [
      { text: '広告・マルウェアブロック', link: '/ja/prx-sd/network/adblock' },
      { text: 'DNSプロキシ', link: '/ja/prx-sd/network/dns-proxy' },
    ],
  },
  {
    text: '設定',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx-sd/configuration/' },
      { text: '完全リファレンス', link: '/ja/prx-sd/configuration/reference' },
    ],
  },
  {
    text: 'CLIリファレンス',
    collapsed: true,
    items: [
      { text: 'コマンド一覧', link: '/ja/prx-sd/cli/' },
    ],
  },
  {
    text: 'プラグイン (WASM)',
    collapsed: true,
    items: [
      { text: 'プラグイン開発', link: '/ja/prx-sd/plugins/' },
    ],
  },
  {
    text: 'デスクトップアプリ',
    collapsed: true,
    items: [
      { text: 'Tauri GUI', link: '/ja/prx-sd/gui/' },
    ],
  },
  {
    text: 'トラブルシューティング',
    collapsed: true,
    items: [
      { text: 'よくある問題', link: '/ja/prx-sd/troubleshooting/' },
    ],
  },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'はじめに',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx-waf/' },
      { text: 'インストール', link: '/ja/prx-waf/getting-started/installation' },
      { text: 'クイックスタート', link: '/ja/prx-waf/getting-started/quickstart' },
    ],
  },
  {
    text: 'ルールエンジン',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx-waf/rules/' },
      { text: 'YAML構文', link: '/ja/prx-waf/rules/yaml-syntax' },
      { text: '組み込みルール', link: '/ja/prx-waf/rules/builtin-rules' },
      { text: 'カスタムルール', link: '/ja/prx-waf/rules/custom-rules' },
    ],
  },
  {
    text: 'ゲートウェイ',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx-waf/gateway/' },
      { text: 'リバースプロキシ', link: '/ja/prx-waf/gateway/reverse-proxy' },
      { text: 'SSL / TLS', link: '/ja/prx-waf/gateway/ssl-tls' },
    ],
  },
  {
    text: 'クラスター',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx-waf/cluster/' },
      { text: 'デプロイメント', link: '/ja/prx-waf/cluster/deployment' },
    ],
  },
  {
    text: 'CrowdSec',
    collapsed: true,
    items: [
      { text: '統合', link: '/ja/prx-waf/crowdsec/' },
    ],
  },
  {
    text: '管理UI',
    collapsed: true,
    items: [
      { text: 'ダッシュボード', link: '/ja/prx-waf/admin-ui/' },
    ],
  },
  {
    text: '設定',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx-waf/configuration/' },
      { text: '完全リファレンス', link: '/ja/prx-waf/configuration/reference' },
    ],
  },
  {
    text: 'CLIリファレンス',
    collapsed: true,
    items: [
      { text: 'コマンド一覧', link: '/ja/prx-waf/cli/' },
    ],
  },
  {
    text: 'トラブルシューティング',
    collapsed: true,
    items: [
      { text: 'よくある問題', link: '/ja/prx-waf/troubleshooting/' },
    ],
  },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'はじめに',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/openpr/' },
      { text: 'インストール', link: '/ja/openpr/getting-started/installation' },
      { text: 'クイックスタート', link: '/ja/openpr/getting-started/quickstart' },
    ],
  },
  {
    text: 'ワークスペース',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/openpr/workspace/' },
      { text: 'プロジェクト', link: '/ja/openpr/workspace/projects' },
      { text: 'メンバー', link: '/ja/openpr/workspace/members' },
    ],
  },
  {
    text: '作業項目',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/openpr/issues/' },
      { text: 'ワークフロー', link: '/ja/openpr/issues/workflow' },
      { text: 'スプリント', link: '/ja/openpr/issues/sprints' },
      { text: 'ラベル', link: '/ja/openpr/issues/labels' },
    ],
  },
  {
    text: 'ガバナンス',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/openpr/governance/' },
      { text: '提案', link: '/ja/openpr/governance/proposals' },
      { text: '投票', link: '/ja/openpr/governance/voting' },
      { text: '信頼スコア', link: '/ja/openpr/governance/trust-scores' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/openpr/api/' },
      { text: '認証', link: '/ja/openpr/api/authentication' },
      { text: 'エンドポイント', link: '/ja/openpr/api/endpoints' },
    ],
  },
  {
    text: 'MCPサーバー',
    collapsed: true,
    items: [
      { text: '統合', link: '/ja/openpr/mcp-server/' },
    ],
  },
  {
    text: 'デプロイ',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/ja/openpr/deployment/docker' },
      { text: '本番環境', link: '/ja/openpr/deployment/production' },
    ],
  },
  {
    text: 'CLIリファレンス',
    collapsed: true,
    items: [
      { text: 'コマンド一覧', link: '/ja/openpr/cli/' },
    ],
  },
  {
    text: '設定',
    collapsed: true,
    items: [
      { text: 'リファレンス', link: '/ja/openpr/configuration/' },
    ],
  },
  {
    text: 'トラブルシューティング',
    collapsed: true,
    items: [
      { text: 'よくある問題', link: '/ja/openpr/troubleshooting/' },
    ],
  },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'はじめに',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/openpr-webhook/' },
      { text: 'インストール', link: '/ja/openpr-webhook/getting-started/installation' },
      { text: 'クイックスタート', link: '/ja/openpr-webhook/getting-started/quickstart' },
    ],
  },
  {
    text: 'エージェント',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/openpr-webhook/agents/' },
      { text: 'エグゼキューター', link: '/ja/openpr-webhook/agents/executors' },
    ],
  },
  {
    text: 'WSSトンネル',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/openpr-webhook/tunnel/' },
    ],
  },
  {
    text: '設定',
    collapsed: true,
    items: [
      { text: 'リファレンス', link: '/ja/openpr-webhook/configuration/' },
    ],
  },
  {
    text: 'トラブルシューティング',
    collapsed: true,
    items: [
      { text: 'よくある問題', link: '/ja/openpr-webhook/troubleshooting/' },
    ],
  },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'はじめに',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx-memory/' },
      { text: 'インストール', link: '/ja/prx-memory/getting-started/installation' },
      { text: 'クイックスタート', link: '/ja/prx-memory/getting-started/quickstart' },
    ],
  },
  {
    text: 'ベクトル埋め込み',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx-memory/embedding/' },
      { text: 'モデル', link: '/ja/prx-memory/embedding/models' },
      { text: 'バッチ処理', link: '/ja/prx-memory/embedding/batch-processing' },
    ],
  },
  {
    text: 'リランキング',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx-memory/reranking/' },
      { text: 'モデル', link: '/ja/prx-memory/reranking/models' },
    ],
  },
  {
    text: 'ストレージ',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/prx-memory/storage/' },
      { text: 'SQLite', link: '/ja/prx-memory/storage/sqlite' },
      { text: 'ベクトル検索', link: '/ja/prx-memory/storage/vector-search' },
    ],
  },
  {
    text: 'MCPプロトコル',
    collapsed: true,
    items: [
      { text: '統合', link: '/ja/prx-memory/mcp/' },
    ],
  },
  {
    text: 'APIリファレンス',
    collapsed: true,
    items: [
      { text: 'Rust API', link: '/ja/prx-memory/api/' },
    ],
  },
  {
    text: '設定',
    collapsed: true,
    items: [
      { text: 'リファレンス', link: '/ja/prx-memory/configuration/' },
    ],
  },
  {
    text: 'トラブルシューティング',
    collapsed: true,
    items: [
      { text: 'よくある問題', link: '/ja/prx-memory/troubleshooting/' },
    ],
  },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'はじめに',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx-email/' },
      { text: 'インストール', link: '/ja/prx-email/getting-started/installation' },
      { text: 'クイックスタート', link: '/ja/prx-email/getting-started/quickstart' },
    ],
  },
  {
    text: 'メールアカウント',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/prx-email/accounts/' },
      { text: 'IMAP', link: '/ja/prx-email/accounts/imap' },
      { text: 'SMTP', link: '/ja/prx-email/accounts/smtp' },
      { text: 'OAuth', link: '/ja/prx-email/accounts/oauth' },
    ],
  },
  {
    text: 'ストレージ',
    collapsed: true,
    items: [
      { text: 'SQLite', link: '/ja/prx-email/storage/' },
    ],
  },
  {
    text: 'プラグイン',
    collapsed: true,
    items: [
      { text: 'WASMプラグイン', link: '/ja/prx-email/plugins/' },
    ],
  },
  {
    text: '設定',
    collapsed: true,
    items: [
      { text: 'リファレンス', link: '/ja/prx-email/configuration/' },
    ],
  },
  {
    text: 'トラブルシューティング',
    collapsed: true,
    items: [
      { text: 'よくある問題', link: '/ja/prx-email/troubleshooting/' },
    ],
  },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'はじめに',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/fenfa/' },
      { text: 'インストール', link: '/ja/fenfa/getting-started/installation' },
      { text: 'クイックスタート', link: '/ja/fenfa/getting-started/quickstart' },
    ],
  },
  {
    text: 'プロダクト管理',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/fenfa/products/' },
      { text: 'バリアント', link: '/ja/fenfa/products/variants' },
      { text: 'リリース', link: '/ja/fenfa/products/releases' },
    ],
  },
  {
    text: 'アプリ配布',
    collapsed: false,
    items: [
      { text: '概要', link: '/ja/fenfa/distribution/' },
      { text: 'iOS', link: '/ja/fenfa/distribution/ios' },
      { text: 'Android', link: '/ja/fenfa/distribution/android' },
      { text: 'デスクトップ', link: '/ja/fenfa/distribution/desktop' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: '概要', link: '/ja/fenfa/api/' },
      { text: 'アップロードAPI', link: '/ja/fenfa/api/upload' },
      { text: '管理API', link: '/ja/fenfa/api/admin' },
    ],
  },
  {
    text: 'デプロイ',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/ja/fenfa/deployment/docker' },
      { text: '本番環境', link: '/ja/fenfa/deployment/production' },
    ],
  },
  {
    text: '設定',
    collapsed: true,
    items: [
      { text: 'リファレンス', link: '/ja/fenfa/configuration/' },
    ],
  },
  {
    text: 'トラブルシューティング',
    collapsed: true,
    items: [
      { text: 'よくある問題', link: '/ja/fenfa/troubleshooting/' },
    ],
  },
]

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'PRX',
    items: [
      { text: 'はじめに', link: '/ja/prx/' },
      { text: 'チャンネル', link: '/ja/prx/channels/' },
      { text: 'プロバイダー', link: '/ja/prx/providers/' },
      { text: 'ツール', link: '/ja/prx/tools/' },
      { text: '設定', link: '/ja/prx/config/' },
    ],
  },
  {
    text: 'PRX-SD',
    items: [
      { text: 'はじめに', link: '/ja/prx-sd/' },
      { text: 'スキャン', link: '/ja/prx-sd/scanning/file-scan' },
      { text: '検出エンジン', link: '/ja/prx-sd/detection/' },
      { text: '脅威インテリジェンス', link: '/ja/prx-sd/signatures/' },
      { text: '設定', link: '/ja/prx-sd/configuration/' },
    ],
  },
  {
    text: 'PRX-WAF',
    items: [
      { text: 'はじめに', link: '/ja/prx-waf/' },
      { text: 'ルールエンジン', link: '/ja/prx-waf/rules/' },
      { text: 'ゲートウェイ', link: '/ja/prx-waf/gateway/' },
      { text: 'クラスター', link: '/ja/prx-waf/cluster/' },
      { text: '設定', link: '/ja/prx-waf/configuration/' },
    ],
  },
  {
    text: 'その他',
    items: [
      { text: 'OpenPR', link: '/ja/openpr/' },
      { text: 'OpenPR-Webhook', link: '/ja/openpr-webhook/' },
      { text: 'PRX-Memory', link: '/ja/prx-memory/' },
      { text: 'PRX-Email', link: '/ja/prx-email/' },
      { text: 'Fenfa', link: '/ja/fenfa/' },
    ],
  },
]

export const jaConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/ja/prx/': prxSidebar,
      '/ja/prx-sd/': prxSdSidebar,
      '/ja/prx-waf/': prxWafSidebar,
      '/ja/openpr/': openprSidebar,
      '/ja/openpr-webhook/': openprWebhookSidebar,
      '/ja/prx-memory/': prxMemorySidebar,
      '/ja/prx-email/': prxEmailSidebar,
      '/ja/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'GitHubでこのページを編集',
    },
    lastUpdated: {
      text: '最終更新',
    },
    docFooter: {
      prev: '前のページ',
      next: '次のページ',
    },
    outline: {
      label: 'ページナビゲーション',
      level: [2, 3],
    },
  },
}
