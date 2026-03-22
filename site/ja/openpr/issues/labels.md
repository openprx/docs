---
title: ラベル
description: "OpenPRでカラーコード付きラベルでイシューを整理・分類。ラベルはワークスペース全体またはプロジェクトスコープで使用できます。"
---

# ラベル

ラベルはイシューを分類・フィルタリングする柔軟な方法を提供します。各ラベルには名前、色、オプションの説明があります。

## ラベルの作成

### Web UIから

1. プロジェクトまたはワークスペース設定に移動。
2. **Labels（ラベル）**に移動。
3. **New Label（新規ラベル）**をクリック。
4. 名前を入力（例："bug"、"feature"、"documentation"）。
5. 色を選択（16進数フォーマット、例：赤は`#ef4444`）。
6. **Create（作成）**をクリック。

### APIから

```bash
curl -X POST http://localhost:8080/api/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "bug",
    "color": "#ef4444",
    "description": "Something is not working"
  }'
```

### MCPから

```json
{
  "method": "tools/call",
  "params": {
    "name": "labels.create",
    "arguments": {
      "name": "bug",
      "color": "#ef4444"
    }
  }
}
```

## 一般的なラベルスキーム

人気のあるラベル体系をいくつか紹介：

### タイプ別

| ラベル | 色 | 説明 |
|-------|-------|-------------|
| `bug` | `#ef4444`（赤） | 壊れているもの |
| `feature` | `#3b82f6`（青） | 新機能リクエスト |
| `enhancement` | `#8b5cf6`（紫） | 既存機能の改善 |
| `documentation` | `#06b6d4`（シアン） | ドキュメントの更新 |
| `refactor` | `#f59e0b`（アンバー） | コードリファクタリング |

### 優先度別

| ラベル | 色 | 説明 |
|-------|-------|-------------|
| `P0-critical` | `#dc2626`（赤） | 本番ダウン |
| `P1-high` | `#ea580c`（オレンジ） | 主要機能の障害 |
| `P2-medium` | `#eab308`（黄） | 非クリティカルな問題 |
| `P3-low` | `#22c55e`（緑） | あると良い |

## イシューにラベルを追加

### Web UIから

イシューを開き、**Labels（ラベル）**フィールドをクリックしてラベルを追加または削除します。

### APIから

```bash
# Add a label to an issue
curl -X POST http://localhost:8080/api/issues/<issue_id>/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label_id": "<label_uuid>"}'
```

### MCPから

| ツール | パラメータ | 説明 |
|------|--------|-------------|
| `work_items.add_label` | `work_item_id`, `label_id` | 1つのラベルを追加 |
| `work_items.add_labels` | `work_item_id`, `label_ids` | 複数のラベルを追加 |
| `work_items.remove_label` | `work_item_id`, `label_id` | ラベルを削除 |
| `work_items.list_labels` | `work_item_id` | イシューのラベルをリスト |

## ラベル管理MCPツール

| ツール | パラメータ | 説明 |
|------|--------|-------------|
| `labels.list` | -- | すべてのワークスペースラベルをリスト |
| `labels.list_by_project` | `project_id` | プロジェクトのラベルをリスト |
| `labels.create` | `name`, `color` | ラベルを作成 |
| `labels.update` | `label_id` | 名前、色、または説明を更新 |
| `labels.delete` | `label_id` | ラベルを削除 |

## 次のステップ

- [イシュー概要](./index) -- 完全なイシューフィールドリファレンス
- [ワークフロー状態](./workflow) -- イシューライフサイクル管理
- [スプリント計画](./sprints) -- ラベル付きイシューをスプリントに整理
