# AI Collaborative UI Design Framework

AIと人間が協調してUI設計を行うためのフレームワーク。

## 概要

このフレームワークは、UI設計書を構造化データ（YAML/JSON）として管理し、
AIによる編集と人間による閲覧を可能にします。

## 特徴

- **設計と実装の分離**: 設計書はコードではなく情報構造
- **YAML/JSON二層構造**: YAMLで編集、JSONでバリデーション
- **AI協調編集**: AIが安全に設計書を編集できるルール体系
- **セルフホスティング**: フレームワーク自体の画面設計もこのフレームワークで管理

## ディレクトリ構造

```
design-framework/
├── viewer/          # Next.js（設計書ビューア）
├── api/             # NestJS（設計書API）
├── design/          # 設計書（デフォルト）
│   ├── sites/       # サイト別設計書
│   └── generated/   # 生成されたJSON
├── schemas/         # JSON Schema定義
├── ai-docs/         # AI向けドキュメント
├── templates/       # 設計書テンプレート
├── docs/            # ドキュメント
├── scripts/         # ユーティリティ
├── config.yaml      # 設定
└── docker-compose.yml
```

## クイックスタート

### Standalone

```bash
docker-compose up
```

### Submodule として利用

```bash
# 親プロジェクトに追加
git submodule add <repo-url> design-framework

# 起動
docker-compose \
  -f docker-compose.yml \
  -f design-framework/docker-compose.yml \
  -f docker-compose.framework-override.yml \
  up
```

## ドキュメント

- [コンセプト設計書](docs/concept.md)
- [スキーマガイド](docs/schema-guide.md)
- [AI向けガイドライン](ai-docs/framework-level.md)

## ライセンス

MIT
