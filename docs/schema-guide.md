# スキーマ使用ガイド

## 概要

本ガイドは、AI協働UIデザインフレームワークにおける設計書スキーマの使用方法を説明します。

---

## 1. ファイル構成

### 画面単位（3ファイル）

| ファイル | 責務 |
|---------|------|
| `layout.yaml` | 画面構造（Screen → Area → Element階層） |
| `fields.yaml` | 項目仕様（型、バリデーション、選択肢等） |
| `events.yaml` | イベント定義（操作、遷移、API呼び出し） |

### サイト単位（1ファイル）

| ファイル | 責務 |
|---------|------|
| `interfaces.yaml` | サイト全体のAPI定義 |

---

## 2. スキーマの役割

### layout.schema.json

**責務**: 画面のレイアウト構造を定義

**カバー範囲**:
- Screen → Area → Element の階層構造
- 共通レイアウトの継承（extends）
- レスポンシブ対応（responsiveBehavior）
- 条件付き表示（conditional）

### fields.schema.json

**責務**: 画面項目の仕様を定義

**カバー範囲**:
- フィールドタイプ（text, select, button等）
- バリデーションルール
- 選択肢（静的/動的）
- デザインヒント

### events.schema.json

**責務**: 画面上のイベントとアクションを定義

**カバー範囲**:
- UI操作イベント（click, change, focus等）
- 画面遷移（navigate）
- API呼び出し（api）
- 状態変更（setState）

### interfaces.schema.json

**責務**: サイト全体のAPIエンドポイントを定義

**カバー範囲**:
- HTTPメソッド、パス
- 内部/外部API区分
- リクエスト/レスポンスモデル
- エラー定義

---

## 3. 基本的な使い方

### 3.1 レイアウト定義

```yaml
# screens/login/layout.yaml
screenId: login
title: "ログイン画面"
extends: "_shared/app-layout"  # 共通レイアウトを継承

mainContent:
  elements:
    - elementId: email-input
      fieldRef: emailField      # fields.yamlを参照
    - elementId: password-input
      fieldRef: passwordField
    - elementId: login-button
      fieldRef: loginButton
```

### 3.2 フィールド定義

```yaml
# screens/login/fields.yaml
- fieldId: emailField
  name: email
  type: email
  label: "メールアドレス"
  validation:
    required: true
    email: true
  accessibility:
    ariaLabel: "メールアドレスを入力"

- fieldId: loginButton
  name: login
  type: submit
  label: "ログイン"
  designHint: primary
```

### 3.3 イベント定義

```yaml
# screens/login/events.yaml
events:
  - eventId: evt_login_submit
    name: "ログインボタンクリック"
    trigger:
      element: login-button
      event: click
    actions:
      - type: validate
        targets: [emailField, passwordField]
        stopOnError: true
      - type: api
        interfaceRef: "login"    # interfaces.yamlを参照
        onSuccess:
          - type: navigate
            target: dashboard
```

### 3.4 インターフェース定義（サイト単位）

```yaml
# sites/viewer/interfaces.yaml

# フラットな構造、キーがインターフェースID
login:
  name: "ログインAPI"
  method: POST
  path: "/api/auth/login"
  input:
    type: object
    properties:
      email:
        type: string
      password:
        type: string
  output:
    type: object
    properties:
      token:
        type: string
      userId:
        type: string
  errors:
    - code: INVALID_CREDENTIALS
      message: "Invalid email or password"
      httpStatus: 401
      userMessage: "メールアドレスまたはパスワードが正しくありません"

logout:
  name: "ログアウトAPI"
  method: POST
  path: "/api/auth/logout"

# 外部API例
fetchWeather:
  name: "天気情報取得"
  method: GET
  path: "https://api.weather.com/v1/current"
  external: true  # 外部API（実装不要）
```

---

## 4. 重要な設計パターン

### 4.1 共通レイアウトの継承

**ユースケース**: 全画面で共通のHeader/Sidebarを使用

```yaml
# _shared/app-layout.yaml
layoutId: app-layout
areas:
  - areaId: header
    elements:
      - elementId: app-title
        fieldRef: appTitleField
  - areaId: sidebar
    elements:
      - elementId: nav-menu
        fieldRef: navMenuField
  - areaId: main-content
    elements: []  # 各画面で置換

# screens/dashboard/layout.yaml
screenId: dashboard
extends: "_shared/app-layout"
mainContent:
  elements:
    - elementId: welcome
      fieldRef: welcomeField
```

**ポイント**:
- 継承は1段階のみ
- `mainContent`で画面固有の内容を定義
- 共通部分の変更が全画面に反映

### 4.2 イベント連鎖パターン

**ユースケース**: バリデーション → API → 成功時遷移

```yaml
events:
  - eventId: evt_submit
    trigger:
      element: submit-button
      event: click
    actions:
      # Step 1: バリデーション
      - type: validate
        targets: [emailField, passwordField]
        stopOnError: true

      # Step 2: API呼び出し
      - type: api
        interfaceRef: "login"
        onSuccess:
          # Step 3: 成功時遷移
          - type: navigate
            target: dashboard
        onError:
          - type: setState
            target: errorMessage
            value: "{error.userMessage}"
```

### 4.3 内部API vs 外部API

```yaml
# 内部API（実装が必要）
getUsers:
  method: GET
  path: "/api/users"          # 相対パス = 内部
  # external 省略 = false

# 外部API（呼び出すだけ）
getGeoLocation:
  method: GET
  path: "https://api.geo.com/locate"  # 絶対URL = 外部
  external: true              # 明示的に外部を指定
```

**判定ルール**:
- `path`が相対パス → 内部API（バックエンド実装が必要）
- `path`が絶対URL → 外部API
- `external: true` → 外部API（実装不要）

---

## 5. 命名規則

### 5.1 ID命名規則

| 対象 | 形式 | 例 |
|------|------|-----|
| screenId | kebab-case | `login`, `user-list` |
| areaId | kebab-case | `header`, `main-content` |
| elementId | kebab-case | `email-input`, `submit-button` |
| fieldId | camelCase | `emailField`, `submitButton` |
| eventId | snake_case + evt_ | `evt_login_submit` |
| interfaceRef | camelCase | `login`, `getUsers` |

### 5.2 インターフェースID

I/Fのキー名（interfaceRef で参照される名前）は、動詞＋名詞形式を推奨：

```yaml
# Good
login:           # 動詞
logout:
getUsers:        # 動詞 + 名詞
createUser:
updateUser:
deleteUser:

# Avoid
userApi:         # 曖昧
user:            # 何のアクションか不明
```

---

## 6. 画面遷移図の自動生成

`type: navigate` のアクションを抽出することで画面遷移図を自動生成できます。

```yaml
# events.yaml
events:
  - eventId: evt_login_success
    actions:
      - type: navigate
        target: dashboard

  - eventId: evt_logout
    actions:
      - type: navigate
        target: login
```

**生成される遷移情報**:
```
login → dashboard (evt_login_success)
dashboard → login (evt_logout)
```

---

## 7. ベストプラクティス

### ✅ 推奨

- 共通レイアウトは `_shared/` に配置
- I/Fはサイト単位で集約（`interfaces.yaml`）
- イベントからは `interfaceRef` で参照
- エラーには必ず `userMessage` を含める
- `external: true` で外部APIを明示

### ❌ 非推奨

- 画面ごとにI/Fを定義（重複の原因）
- 同じI/Fを複数箇所で定義
- エラーハンドリングの省略
- CSSやDOM構造の詳細を含める

---

## 8. サンプルファイル

`templates/` ディレクトリに以下のサンプルがあります：

1. **ログイン画面**: `login-screen-events.yaml`, `login-screen-interfaces.yaml`
2. **ユーザー一覧画面**: `user-list-events.yaml`, `user-list-interfaces.yaml`

---

## 9. まとめ

本スキーマの設計原則：

1. **画面単位3ファイル + サイト単位I/F** - 責務の明確な分離
2. **共通レイアウトの継承** - DRY原則の遵守
3. **技術スタック非依存** - 特定フレームワークに依存しない
4. **AI編集可能** - 構造化されており、AIが理解・編集しやすい
5. **自動生成対応** - 画面遷移図が自動生成可能
