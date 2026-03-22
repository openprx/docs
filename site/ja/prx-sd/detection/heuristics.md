---
title: ヒューリスティック分析
description: PRX-SDのヒューリスティックエンジンはPE、ELF、Mach-O、Office、PDFファイルに対してファイルタイプ対応の動作分析を実行し、未知の脅威を検出します。
---

# ヒューリスティック分析

ヒューリスティック分析はPRX-SD検出パイプラインの第3レイヤーです。ハッシュマッチングとYARAルールが既知のシグネチャとパターンに依存するのに対し、ヒューリスティックはファイルの**構造的および動作的特性**を分析して、これまで見たことのない脅威（ゼロデイマルウェア、カスタムインプラント、高度に難読化されたサンプルを含む）を検出します。

## 仕組み

PRX-SDはまずマジックナンバー検出を使用してファイルタイプを識別し、そのファイル形式に固有のターゲットを絞ったヒューリスティックチェックセットを適用します。トリガーされた各チェックは累積スコアにポイントを追加します。最終スコアが判定を決定します。

### スコアリングメカニズム

| スコア範囲 | 判定 | 意味 |
|-------------|---------|---------|
| 0〜29 | **クリーン** | 重大な疑わしい指標なし |
| 30〜59 | **疑わしい** | いくつかの異常を検出；手動確認を推奨 |
| 60〜100 | **悪意あり** | 高確信度の脅威；複数の強い指標 |

スコアは加算的です。1つの軽微な異常（例：わずかに高いエントロピー）があるファイルは15をスコアするかもしれませんが、高いエントロピー、疑わしいAPIインポート、パッカーシグネチャを組み合わせたファイルは75以上をスコアします。

## PE（Windows実行可能ファイル）分析

PEヒューリスティックはWindows実行可能ファイル（.exe、.dll、.scr、.sys）をターゲットにします：

| チェック | ポイント | 説明 |
|-------|--------|-------------|
| 高いセクションエントロピー | 10〜25 | エントロピー> 7.0のセクションはパッキングまたは暗号化を示す |
| 疑わしいAPIインポート | 5〜20 | `VirtualAllocEx`、`WriteProcessMemory`、`CreateRemoteThread`などのAPI |
| 既知のパッカーシグネチャ | 15〜25 | UPX、Themida、VMProtect、ASPack、PECompactヘッダーを検出 |
| タイムスタンプ異常 | 5〜10 | 将来のまたは2000年以前のコンパイルタイムスタンプ |
| セクション名異常 | 5〜10 | 非標準セクション名（`.rsrc`の置き換え、ランダムな文字列） |
| リソース異常 | 5〜15 | リソースに埋め込まれたPEファイル、暗号化されたリソースセクション |
| インポートテーブル異常 | 10〜15 | インポートが非常に少ない（パック済み）、または疑わしいインポートの組み合わせ |
| デジタル署名 | -10 | 有効なAuthenticode署名はスコアを下げる |
| TLSコールバック | 10 | アンチデバッグTLSコールバックエントリ |
| オーバーレイデータ | 5〜10 | PE構造の後に追加された重要なデータ |

### PEの調査結果例

```
Heuristic Analysis: updater.exe
Score: 72/100 [MALICIOUS]

Findings:
  [+25] Section '.text' entropy: 7.91 (likely packed or encrypted)
  [+15] Packer detected: UPX 3.96
  [+12] Suspicious API imports: VirtualAllocEx, WriteProcessMemory,
        CreateRemoteThread, NtUnmapViewOfSection
  [+10] Section name anomaly: '.UPX0', '.UPX1' (non-standard)
  [+10] Compilation timestamp: 2089-01-01 (future date)
```

## ELF（Linux実行可能ファイル）分析

ELFヒューリスティックはLinuxバイナリと共有オブジェクトをターゲットにします：

| チェック | ポイント | 説明 |
|-------|--------|-------------|
| 高いセクションエントロピー | 10〜25 | エントロピー> 7.0のセクション |
| LD_PRELOAD参照 | 15〜20 | `LD_PRELOAD`または`/etc/ld.so.preload`を参照する文字列 |
| cron永続性 | 10〜15 | `/etc/crontab`、`/var/spool/cron`、cronディレクトリへの参照 |
| systemd永続性 | 10〜15 | systemdユニットパス、`systemctl enable`への参照 |
| SSHバックドア指標 | 15〜20 | 変更された`authorized_keys`パス、`sshd`設定文字列 |
| アンチデバッグ | 10〜15 | `ptrace(PTRACE_TRACEME)`、`/proc/self/status`チェック |
| ネットワーク操作 | 5〜10 | 生ソケット作成、疑わしいポートバインド |
| 自己削除 | 10 | 実行後の自身のバイナリパスの`unlink` |
| ストリップ済み + 高エントロピー | 10 | 高エントロピーのストリップされたバイナリはパックされたマルウェアを示唆 |
| `/dev/null`リダイレクト | 5 | `/dev/null`への出力リダイレクト（デーモン動作） |

### ELFの調査結果例

```
Heuristic Analysis: .cache/systemd-helper
Score: 65/100 [MALICIOUS]

Findings:
  [+20] LD_PRELOAD reference: /etc/ld.so.preload manipulation
  [+15] Cron persistence: writes to /var/spool/cron/root
  [+15] SSH backdoor: modifies /root/.ssh/authorized_keys
  [+10] Self-deletion: unlinks /tmp/.cache/systemd-helper
  [+5]  Network: creates raw socket
```

## Mach-O（macOS実行可能ファイル）分析

Mach-OヒューリスティックはmacOSバイナリ、バンドル、ユニバーサルバイナリをターゲットにします：

| チェック | ポイント | 説明 |
|-------|--------|-------------|
| 高いセクションエントロピー | 10〜25 | エントロピー> 7.0のセクション |
| Dylib注入 | 15〜20 | `DYLD_INSERT_LIBRARIES`参照、疑わしいdylibローディング |
| LaunchAgent/Daemon永続性 | 10〜15 | `~/Library/LaunchAgents`、`/Library/LaunchDaemons`への参照 |
| Keychainアクセス | 10〜15 | Keychain API呼び出し、`security`コマンド使用 |
| Gatekeeperバイパス | 10〜15 | `xattr -d com.apple.quarantine`文字列 |
| プライバシーTCCバイパス | 10〜15 | TCCデータベースへの参照、アクセシビリティAPIの悪用 |
| アンチ分析 | 10 | デバッガーの`sysctl`チェック、VM検出文字列 |
| コード署名異常 | 5〜10 | アドホック署名または署名なしのバイナリ |

### Mach-Oの調査結果例

```
Heuristic Analysis: com.apple.helper
Score: 55/100 [SUSPICIOUS]

Findings:
  [+20] Dylib injection: DYLD_INSERT_LIBRARIES manipulation
  [+15] LaunchAgent persistence: writes to ~/Library/LaunchAgents/
  [+10] Keychain access: SecKeychainFindGenericPassword calls
  [+10] Unsigned binary: no code signature present
```

## Officeドキュメント分析

OfficeヒューリスティックはMicrosoft Office形式（.doc、.docx、.xls、.xlsx、.ppt）をターゲットにします：

| チェック | ポイント | 説明 |
|-------|--------|-------------|
| VBAマクロの存在 | 10〜15 | 自動実行マクロ（`AutoOpen`、`Document_Open`、`Workbook_Open`） |
| シェル実行を伴うマクロ | 20〜30 | マクロ内の`Shell()`、`WScript.Shell`、`PowerShell`呼び出し |
| DDEフィールド | 15〜20 | コマンドを実行するダイナミックデータエクスチェンジフィールド |
| 外部テンプレートリンク | 10〜15 | `attachedTemplate`を介したリモートテンプレートインジェクション |
| 難読化されたVBA | 10〜20 | 高度に難読化されたマクロコード（Chr()、文字列連結の乱用） |
| 埋め込まれたOLEオブジェクト | 5〜10 | OLEオブジェクトとして埋め込まれた実行可能ファイルまたはスクリプト |
| 疑わしいメタデータ | 5 | Base64文字列または異常なパターンを持つ作成者フィールド |

### Officeの調査結果例

```
Heuristic Analysis: Q3_Report.xlsm
Score: 60/100 [MALICIOUS]

Findings:
  [+15] VBA macro with AutoOpen trigger
  [+25] Macro executes: Shell("powershell -enc JABjAGwA...")
  [+10] Obfuscated VBA: 47 Chr() calls, string concatenation abuse
  [+10] External template: https://evil.example.com/template.dotm
```

## PDF分析

PDFヒューリスティックはPDFドキュメントをターゲットにします：

| チェック | ポイント | 説明 |
|-------|--------|-------------|
| 埋め込みJavaScript | 15〜25 | `/JS`または`/JavaScript`アクションのJavaScript |
| Launch操作 | 20〜25 | システムコマンドを実行する`/Launch`操作 |
| URI操作 | 5〜10 | 既知の悪意のあるパターンを指す疑わしいURI操作 |
| 難読化されたストリーム | 10〜15 | 複数のエンコードレイヤー（FlateDecode + ASCII85 + hex） |
| 埋め込みファイル | 5〜10 | 添付ファイルとして埋め込まれた実行可能ファイル |
| フォーム送信 | 5〜10 | 外部URLにデータを送信するフォーム |
| JavaScriptを持つAcroForm | 15 | 埋め込みJavaScriptを持つインタラクティブフォーム |

### PDFの調査結果例

```
Heuristic Analysis: shipping_label.pdf
Score: 45/100 [SUSPICIOUS]

Findings:
  [+20] Embedded JavaScript: 3 /JS actions found
  [+15] Obfuscated stream: triple-encoded FlateDecode chain
  [+10] Embedded file: invoice.exe (PE executable)
```

## 一般的な調査結果リファレンス

以下の表はすべてのファイルタイプで最も頻繁にトリガーされるヒューリスティック調査結果を一覧表示します：

| 調査結果 | 重大度 | ファイルタイプ | 誤検知率 |
|---------|----------|------------|---------------------|
| 高エントロピーセクション | 中 | PE、ELF、Mach-O | 低〜中（ゲームアセット、圧縮データ） |
| パッカー検出 | 高 | PE | 非常に低い |
| 自動実行マクロ | 高 | Office | 低（一部の正規マクロ） |
| LD_PRELOAD操作 | 高 | ELF | 非常に低い |
| 埋め込みJavaScript | 中〜高 | PDF | 低 |
| 疑わしいAPIインポート | 中 | PE | 中（セキュリティツールがこれをトリガーする） |
| 自己削除 | 高 | ELF | 非常に低い |

::: tip 誤検知の削減
正規のファイルがヒューリスティックアラートをトリガーした場合、SHA-256ハッシュでアローリストに追加できます：
```bash
sd allowlist add /path/to/legitimate/file
```
アローリストに追加されたファイルはヒューリスティック分析をスキップしますが、ハッシュとYARAデータベースに対してはチェックされます。
:::

## 次のステップ

- [対応ファイルタイプ](./file-types) -- 完全なファイルタイプマトリックスとマジック検出の詳細
- [YARAルール](./yara-rules) -- ヒューリスティックを補完するパターンベースの検出
- [ハッシュマッチング](./hash-matching) -- 最も高速な検出レイヤー
- [検出エンジン概要](./index) -- すべてのレイヤーが連携する仕組み
