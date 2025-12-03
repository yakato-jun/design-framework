# AI Collaborative UI Design Framework - AI向けガイドライン

このドキュメントは、AIが設計書を読み取り・編集する際に従うべきルールを定義します。

---

## 1. 基本原則

### 1.1 設計書の役割
- 設計書は**情報構造**であり、実装コードではない
- 画面の「何を」「どう配置」「どう動作」するかを定義
- 「どう実装するか」は含めない

### 1.2 技術スタック非依存
設計書には以下を**含めない**：
- HTMLタグ名やDOM構造
- CSSプロパティやピクセル値
- 特定フレームワークのコンポーネント名
- 状態管理の実装詳細

---

## 2. ディレクトリ構造

```
design/
├── project.yaml              # プロジェクト設定
├── infrastructure.md         # インフラ情報（参照のみ）
└── sites/
    └── {siteId}/
        ├── site.yaml         # サイト設定
        ├── interfaces.yaml   # サイト全体のAPI定義（1ファイル）
        ├── _shared/          # 共通定義
        │   ├── app-layout.yaml   # 共通レイアウト
        │   ├── app-fields.yaml   # 共通フィールド
        │   └── app-events.yaml   # 共通イベント（サイドバー等）
        └── screens/
            └── {screenId}/
                ├── layout.yaml   # 画面構造
                ├── fields.yaml   # 項目仕様
                └── events.yaml   # イベント定義
```

### 2.1 ファイル構成のポイント
- **画面単位: 3ファイル** (layout, fields, events)
- **サイト単位: 1ファイル** (interfaces.yaml)
- **共通定義は `_shared/` に配置** (layout, fields, events)
- 共通イベントは全画面から発生する遷移（サイドバーナビゲーション等）
- interfacesは画面ごとに作らない（重複防止）

---

## 3. 各ファイルの責務

| ファイル | スコープ | 責務 |
|---------|---------|------|
| `layout.yaml` | 画面 | 画面構造（Screen → Area → Element階層）|
| `fields.yaml` | 画面 | 項目の型・バリデーション・選択肢 |
| `events.yaml` | 画面 | ユーザー操作・画面遷移・API呼び出し |
| `interfaces.yaml` | サイト | API定義・エンドポイント・データモデル |
| `_shared/app-layout.yaml` | サイト共通 | Header/Sidebar等の共通レイアウト |
| `_shared/app-fields.yaml` | サイト共通 | 共通UI要素のフィールド定義 |
| `_shared/app-events.yaml` | サイト共通 | 全画面共通のイベント（サイドバー遷移等）|

---

## 4. スキーマ概要

### 4.1 layout.yaml
```yaml
screenId: login
title: "ログイン画面"
extends: "_shared/app-layout"  # 共通レイアウト継承（任意）

# extendsを使う場合
mainContent:
  children: ["$email-input", "$password-input", "$login-button"]

# extendsを使わない場合（レイアウト構造を明示）
areas:
  - areaId: root
    layout: grid
    gridAreas:
      - [header, header, header, header]
      - [sidebar, main-content, main-content, main-content]
    children: ["@header", "@sidebar", "@main-content"]
  - areaId: header
    layout: horizontal
    sizeHint: auto
    children: ["$app-title", "$header-nav"]
  - areaId: sidebar
    layout: vertical
    sizeHint: narrow
    children: ["$nav-item1", "$nav-item2"]
  - areaId: main-content
    sizeHint: fill
    children: []

elements:
  - elementId: app-title
    fieldRef: appTitleField
  - elementId: header-nav
    fieldRef: headerNavField
  - elementId: nav-item1
    fieldRef: navItem1Field
  - elementId: nav-item2
    fieldRef: navItem2Field
```

**ポイント:**
- `extends` で共通レイアウト継承（1段階のみ）
- `mainContent` は継承時の画面固有コンテンツ
- `fieldRef` で fields.yaml を参照

**レイアウト構造プロパティ:**
- `children`: 子ノード参照の配列（`@`=Area、`$`=Element）
- `layout`: 子の配置方向（`horizontal` / `vertical` / `grid`）
- `gridAreas`: グリッド配置（2次元配列、スパン表現可）
- `sizeHint`: サイズヒント（`auto` / `narrow` / `fill`）

**children の参照形式:**
- `@areaId` → Area への参照（例: `@header`, `@sidebar`）
- `$elementId` → Element への参照（例: `$app-title`, `$submit-button`）

**構造の原則:**
- Areas と Elements はフラット配列で定義
- 親子関係は `children` で表現
- Area は `@` 参照または `$` 参照のどちらかを持つ（混在可だがシンプルに保つ）

**レスポンシブ対応:**

ビューポートは `site.yaml` で定義し、`responsiveBehavior` でそのIDを参照します。

```yaml
# site.yaml でビューポート定義
viewports:
  - id: mobile
    name: "モバイル"
    maxWidth: 767
  - id: desktop
    name: "デスクトップ"
    minWidth: 768
```

```yaml
# layout.yaml で参照
areas:
  - areaId: content-wrapper
    layout: horizontal           # デフォルト
    children: ["@sidebar", "@main"]
    responsiveBehavior:
      mobile:                    # ← site.yaml の viewports.id を参照
        layout: vertical
        hidden: false
      desktop:
        layout: horizontal
        gridAreas:
          - [sidebar, main, main]
```

**DeviceBehavior プロパティ:**
- `hidden`: 非表示にするか（boolean）
- `layout`: 子要素の配置方向を上書き（horizontal/vertical/grid）
- `sizeHint`: サイズヒントを上書き（auto/narrow/fill）
- `gridAreas`: グリッド配置を上書き（2次元配列）
- `layoutHint`: 配置ヒントを上書き
- `order`: 表示順序を上書き

**ビューポート定義（site.yaml）:**
- `id`: ビューポート識別子（responsiveBehaviorのキー）
- `name`: 表示名
- `minWidth`: 最小幅（px）- この値以上で適用
- `maxWidth`: 最大幅（px）- この値以下で適用

### 4.2 fields.yaml
```yaml
- fieldId: emailField
  name: email
  type: email
  label: "メールアドレス"
  validation:
    required: true
  designHint: primary
```

**主なtype:**
- 入力系: `text`, `email`, `password`, `number`, `textarea`, `select`
- ボタン系: `button`, `submit`
- 表示系: `display`, `heading`, `label`
- カスタム: `custom`, `toolbar`, `navigation`, `tree`

**designHint:**
意図を伝えるヒント。CSSではない。
- `primary`, `secondary`, `danger`, `warning`
- `heading`, `subtle`, `emphasized`
- `fill`, `fullWidth`, `compact`

### 4.3 events.yaml
```yaml
events:
  - eventId: evt_login_submit
    name: "ログイン送信"
    trigger:
      element: login-button
      event: click
    actions:
      - type: validate
        targets: [emailField, passwordField]
        stopOnError: true
      - type: api
        interfaceRef: login       # interfaces.yaml を参照
        onSuccess:
          - type: navigate
            target: dashboard     # screenId を参照
```

**アクションタイプ:**
- `navigate`: 画面遷移
- `api`: API呼び出し（interfaceRef で参照）
- `setState`: 状態変更
- `validate`: バリデーション実行
- `custom`: カスタムアクション

**トリガーイベント:**
- DOM標準: `click`, `change`, `submit`, `focus`, `blur`
- ライフサイクル: `mount`, `unmount`
- カスタム: `elementClick`, `nodeClick`, `backgroundClick`

### 4.4 interfaces.yaml（サイト単位）
```yaml
# フラットな構造。キーがインターフェースID。
login:
  name: "ログインAPI"
  method: POST
  path: "/api/auth/login"        # 相対パス = 内部API
  input:
    type: object
    properties:
      email: { type: string }
      password: { type: string }
  output:
    type: object
    properties:
      token: { type: string }
  errors:
    - code: INVALID_CREDENTIALS
      message: "Invalid credentials"
      httpStatus: 401
      userMessage: "認証に失敗しました"

fetchWeather:
  name: "天気取得"
  method: GET
  path: "https://api.weather.com/v1"  # 絶対URL = 外部API
  external: true                       # 実装不要
```

**内部/外部の判定:**
- `path` が相対パス → 内部API（実装が必要）
- `path` が絶対URL → 外部API
- `external: true` → 外部API（実装不要）

---

## 5. 参照関係

```
layout.yaml ──fieldRef──→ fields.yaml
     │
events.yaml ──interfaceRef──→ interfaces.yaml
     │
     └──target──→ 別画面の screenId
```

### 5.1 fieldRef（layout → fields）
```yaml
# layout.yaml
- elementId: email-input
  fieldRef: emailField    # fields.yaml の fieldId を参照

# fields.yaml
- fieldId: emailField     # ← 参照される
```

### 5.2 interfaceRef（events → interfaces）
```yaml
# events.yaml
- type: api
  interfaceRef: login     # interfaces.yaml のキーを参照

# interfaces.yaml
login:                    # ← 参照される
  method: POST
  path: "/api/auth/login"
```

### 5.3 target（events → screens）
```yaml
# events.yaml
- type: navigate
  target: dashboard       # screens/dashboard を参照
```

---

## 6. ID命名規則

| 対象 | 形式 | 例 |
|------|------|-----|
| screenId | kebab-case | `login`, `user-list`, `screen-detail` |
| areaId | kebab-case | `header`, `main-content`, `property-panel` |
| elementId | kebab-case | `email-input`, `submit-button` |
| fieldId | camelCase | `emailField`, `submitButton` |
| eventId | snake_case + evt_ | `evt_login_submit`, `evt_zoom_in` |
| interfaceRef | camelCase | `login`, `getUsers`, `createOrder` |

---

## 7. 編集ルール

### 7.1 編集可能
- `design/sites/**/screens/**/*.yaml`
- `design/sites/**/interfaces.yaml`
- `design/sites/**/_shared/*.yaml`

### 7.2 編集不可
- `schemas/*.schema.json` - スキーマ定義
- `config.yaml` - フレームワーク設定
- `project.yaml` - プロジェクト設定（管理者のみ）

### 7.3 YAML記法
- インデント: 2スペース
- 文字列: ダブルクォート `"..."`
- コメント: `#`
- 日本語使用可

---

## 8. 禁止事項

1. **DOM/HTML構造の記述禁止**
   - `<div>`, `<span>` 等のタグ名を書かない

2. **CSS詳細の記述禁止**
   - 色コード、px値、フォントサイズを書かない
   - `designHint` で意図のみ伝える

3. **実装詳細の記述禁止**
   - React/Vue等のコンポーネント名を書かない
   - 状態管理の実装を書かない

4. **画面ごとのinterfaces.yaml作成禁止**
   - I/Fはサイト単位で1ファイル
   - 重複を避けるため

---

## 9. 実装者向け情報

### 9.1 設計書から実装への変換
設計書を読み取り、以下を実装する：
- `layout.yaml` → コンポーネント構造
- `fields.yaml` → フォーム/表示コンポーネント
- `events.yaml` → イベントハンドラ/API呼び出し
- `interfaces.yaml` → APIエンドポイント実装

### 9.2 APIレスポンス形式
`getScreenDetail` APIは以下を返す：
- layout/fields/events を統合
- `extends` を解決済み
- `fieldRef` を解決済み（field情報を埋め込み）
- element に紐づく events を埋め込み

これにより、フロントエンドは1回のAPI呼び出しで画面描画に必要な全情報を取得できる。

---

## 10. API詳細設計

### 10.1 外部設計と詳細設計の区別

| 設計種別 | ファイル | 内容 |
|---------|---------|------|
| 外部設計 | `interfaces.yaml` | APIの契約（入出力仕様、エラーコード）|
| 詳細設計 | `api-details/{interfaceId}.md` | 内部実装の設計（処理フロー、データソース）|

- **外部設計**: フロントエンド/外部システムとの契約
- **詳細設計**: バックエンド実装者向けの内部処理設計

### 10.2 詳細設計の対象

詳細設計は以下のAPIに必要：
- `interfaces.yaml` で `external: true` **でない**もの（内部API）
- 相対パスで定義されているもの

外部API（`external: true`）は詳細設計不要。

### 10.3 詳細設計ファイルの場所

```
design/sites/{siteId}/
├── api-details/              # API詳細設計（内部設計）
│   ├── getSites.md
│   ├── getTransitions.md
│   └── getScreenDetail.md
└── interfaces.yaml           # 外部設計
```

**注意:** `design/` ディレクトリは `.gitignore` 対象。設計書はプロジェクト固有のため。

### 10.4 詳細設計テンプレート

`templates/api-detailed-design.template.md` に標準テンプレートがある。

**必須セクション:**
1. **基本情報**: Interface ID、メソッド、パス、外部設計への参照
2. **概要**: 1-2文でAPIの目的を説明
3. **処理フロー**: 処理ステップを図示
4. **データソース**: 読み取るファイル・ディレクトリの一覧
5. **処理詳細**: 各ステップの入力・処理・出力を記述
6. **エラーハンドリング**: エラー条件と対応を表形式で
7. **補足**: 実装上の注意点

### 10.5 詳細設計の書き方

**処理フロー:**
```
1. {ステップ1}
   └─ {詳細説明}
2. {ステップ2}
   └─ {詳細説明}
```

**データソース:**
設計書ファイル（YAML）の読み込み元を明記する。

**処理詳細:**
各処理の入力→処理手順→出力を明確に記述。JSON例も含める。

**エラーハンドリング:**
| 条件 | エラーコード | 対応 |
|------|-------------|------|

---

## 11. 禁止事項（詳細設計）

1. **実装言語の詳細記述禁止**
   - TypeScript/JavaScript のコードを書かない
   - フレームワーク固有のAPI名を書かない

2. **ライブラリ固有の記述禁止**
   - NestJS のデコレータを書かない
   - 特定ORMのクエリを書かない

3. **SQL/データベーススキーマの記述禁止**
   - 本フレームワークはファイルベース
   - データソースは設計書ファイル（YAML）のみ

詳細設計は「何を」「どの順序で」行うかを記述し、「どう実装するか」は記述しない。
