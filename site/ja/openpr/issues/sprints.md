---
title: スプリント管理
description: "OpenPRのスプリントで時間制限のあるイテレーションで作業を計画・追跡。スプリントの作成、イシューの割り当て、進捗の監視。"
---

# スプリント管理

スプリントは作業を整理・追跡するための時間制限のあるイテレーションです。各スプリントはプロジェクトに属し、開始日、終了日、割り当てられたイシューのセットを持ちます。

## スプリントの作成

### Web UIから

1. プロジェクトに移動。
2. **Sprints（スプリント）**セクションに移動。
3. **New Sprint（新規スプリント）**をクリック。
4. スプリント名、開始日、終了日を入力。

### APIから

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sprint 1",
    "start_date": "2026-03-24",
    "end_date": "2026-04-07"
  }'
```

### MCPから

```json
{
  "method": "tools/call",
  "params": {
    "name": "sprints.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "name": "Sprint 1",
      "start_date": "2026-03-24",
      "end_date": "2026-04-07"
    }
  }
}
```

## スプリントフィールド

| フィールド | タイプ | 必須 | 説明 |
|-------|------|----------|-------------|
| 名前 | string | はい | スプリント名（例："Sprint 1"、"Q1 Week 3"） |
| 開始日 | date | いいえ | スプリント開始日 |
| 終了日 | date | いいえ | スプリント終了日 |
| ステータス | enum | 自動 | Active、completed、またはplanned |

## イシューをスプリントに割り当て

イシューの`sprint_id`を更新してスプリントに割り当て：

```bash
curl -X PATCH http://localhost:8080/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sprint_id": "<sprint_uuid>"}'
```

またはWeb UIから、スプリントセクションにイシューをドラッグするか、イシュー詳細パネルを使用します。

## スプリント計画ワークフロー

典型的なスプリント計画ワークフロー：

1. 開始日と終了日で**スプリントを作成**。
2. **バックログをレビュー** -- 含めるイシューを特定。
3. バックログ/To DoからスプリントにイシューをN**移動**。
4. スプリントイシューの**優先度と担当者を設定**。
5. **スプリントを開始** -- チームが作業を始める。
6. ボードとスプリントビューで**進捗を追跡**。
7. **スプリントを完了** -- 完了/残りのアイテムをレビュー。

## MCPツール

| ツール | パラメータ | 説明 |
|------|--------|-------------|
| `sprints.list` | `project_id` | プロジェクト内のスプリントをリスト |
| `sprints.create` | `project_id`, `name` | オプションの日付でスプリントを作成 |
| `sprints.update` | `sprint_id` | 名前、日付、またはステータスを更新 |
| `sprints.delete` | `sprint_id` | スプリントを削除 |

## 次のステップ

- [ワークフロー状態](./workflow) -- イシュー状態遷移を理解
- [ラベル](./labels) -- スプリントイシューを分類
- [イシュー概要](./index) -- 完全なイシューフィールドリファレンス
