# 02. Wails IPC バインディング設計

> Wails フレームワークを介した Go バックエンドとフロントエンド（Lit）間の
> IPC（Inter-Process Communication）インターフェースを定義する。

---

## 1. アーキテクチャ概要

```text
[Lit フロントエンド (WebView)]
        │  window.go.MethodName(args)  （JS → Go）
        │  runtime.EventsOn(event, cb) （Go → JS）
        ↓
[Wails IPC ブリッジ]
        ↓
[Go バックエンド (App struct)]
        │
        ├── ClipboardMonitor
        ├── SearchClipsUseCase
        ├── PasteItemUseCase
        ├── TogglePinUseCase
        ├── DeleteItemUseCase
        └── AppConfigUseCase
```

- **JS → Go**: `window.go.<StructName>.<MethodName>(args)` で呼び出す。戻り値は `Promise` として返る。
- **Go → JS**: `runtime.EventsEmit(ctx, eventName, data)` でフロントエンドにプッシュ通知する。

---

## 2. バインドメソッド一覧

### 2.1 `App` struct にバインドするメソッド

| メソッド    | シグネチャ（Go）                                   | JS 呼び出し                        | 説明                         |
| :---------- | :------------------------------------------------- | :--------------------------------- | :--------------------------- |
| SearchClips | `SearchClips(query string) ([]ClipItemDTO, error)` | `window.go.App.SearchClips(query)` | FTS5 検索 / 空文字で最新50件 |
| PasteItem   | `PasteItem(id string) error`                       | `window.go.App.PasteItem(id)`      | ペースト実行                 |
| TogglePin   | `TogglePin(id string) error`                       | `window.go.App.TogglePin(id)`      | ピン留めトグル               |
| DeleteItem  | `DeleteItem(id string) error`                      | `window.go.App.DeleteItem(id)`     | アイテム物理削除             |
| GetConfig   | `GetConfig() (AppConfigDTO, error)`                | `window.go.App.GetConfig()`        | 現在の設定取得               |

---

## 3. データ転送オブジェクト（DTO）定義

### 3.1 `ClipItemDTO`

フロントエンドへの描画に必要な最小限のフィールドのみを含む。
内部ドメインオブジェクトはフロントエンドに露出しない。

```go
// Go 側定義
type ClipItemDTO struct {
    ID              string `json:"id"`
    Content         string `json:"content"`
    Type            string `json:"type"`             // "text" | "image" | "file"
    ImagePath       string `json:"imagePath,omitempty"`
    SourceAppBundle string `json:"sourceAppBundleId,omitempty"`
    SourceAppName   string `json:"sourceAppName,omitempty"`
    IsPinned        bool   `json:"isPinned"`
    IsTruncated     bool   `json:"isTruncated"`
    CreatedAt       int64  `json:"createdAt"`        // UNIX epoch 秒
    UpdatedAt       int64  `json:"updatedAt"`        // UNIX epoch 秒
}
```

```typescript
// フロントエンド側（TypeScript 型定義）
interface ClipItemDTO {
  id: string;
  content: string;
  type: "text" | "image" | "file";
  imagePath?: string;
  sourceAppBundleId?: string;
  sourceAppName?: string;
  isPinned: boolean;
  isTruncated: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### 3.2 `AppConfigDTO`

```go
type AppConfigDTO struct {
    BlockedBundleIds []string `json:"blockedBundleIds"`
    MaxHistoryCount  int      `json:"maxHistoryCount"`
    GlobalShortcut   string   `json:"globalShortcut"` // 例: "Cmd+Option+V"
}
```

---

## 4. Go → JS イベント一覧

バックグラウンドで発生した変化（クリップボード更新等）をフロントエンドにリアルタイムプッシュする。

| イベント名        | Payload 型                          | 発火タイミング         | フロントエンドの処理                 |
| :---------------- | :---------------------------------- | :--------------------- | :----------------------------------- |
| `clip:created`    | `ClipItemDTO`                       | 新規クリップ保存時     | ウィンドウ表示中ならリスト先頭に追加 |
| `clip:updated`    | `{ id: string, updatedAt: number }` | 重複コピー（UPSERT）時 | 該当アイテムをリスト先頭へ移動       |
| `clip:deleted`    | `{ id: string }`                    | アイテム削除時         | 該当アイテムをリストから除去         |
| `clip:pinToggled` | `{ id: string, isPinned: boolean }` | ピン留めトグル時       | 該当アイテムの表示を更新             |
| `config:reloaded` | `AppConfigDTO`                      | 設定ファイル変更検知時 | 設定を再反映                         |

### イベント購読（フロントエンド側）

```typescript
import { EventsOn } from "../wailsjs/runtime/runtime";

EventsOn("clip:created", (item: ClipItemDTO) => {
  // リスト先頭にアイテムを追加して再描画
  requestAnimationFrame(() => {
    clipList.unshift(item);
    renderList();
  });
});
```

---

## 5. エラーハンドリング

すべての IPC メソッドはエラーを Go の `error` 型で返し、Wails が自動的に JS の `Promise.reject` に変換する。

```typescript
try {
  await window.go.App.PasteItem(selectedId);
} catch (err) {
  console.error("PasteItem failed:", err);
  // ユーザーへのエラー表示（トースト通知等）
}
```

| エラーケース         | Go 側の error メッセージ              | フロントエンドの処理         |
| :------------------- | :------------------------------------ | :--------------------------- |
| アイテムが存在しない | `"clip item not found: <id>"`         | トースト通知を表示           |
| DB エラー            | `"database error: <detail>"`          | トースト通知を表示、ログ記録 |
| ペースト権限エラー   | `"accessibility permission required"` | システム設定への誘導を表示   |

---

## 6. パフォーマンス設計と最適化方針

- **同期 IPC の最小化**: UI ブロッキングを避けるため、Wails v2 ではフロントエンド→Go の呼び出しは Promise を返す非同期処理として扱われ、UI スレッドをブロックしない（内部の並行実装は変更され得る）。
- **過度な最適化の排除**:
  - ローカルの SQLite（FTS5）検索は 10ms 程度で完了するため、フロントエンドでの複雑なデバウンスや Go 側でのクエリキャンセル処理（`context.WithCancel`）は初期実装では行わない。シンプルに毎回クエリを実行する。
  - Wails IPC の転送速度はローカル通信のため非常に高速である。そのため、表示用スニペットのために `content` を 500 文字に切り詰めるような DTO の軽量化は初期では行わない。
- **今後の対応**:
  - データ量が膨大になった際や、テキストの全文転送が UI のレンダリングパフォーマンスに影響を与えた場合は、ベンチマークを取得した上で切り詰め等の最適化を後から検討する。
