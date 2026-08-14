# React Clean Architecture Template

TypeScriptとReactをnpm workspacesで複数Packageに分割した、Clean Architectureの
最小構成テンプレートです。このディレクトリ内にアプリと全レイヤーが含まれ、外側の
ディレクトリや共通Packageへ依存せず単独で利用できます。

## 依存関係

```text
Presentation Form
  ↓ Presentation Mapper
Domain Modelを含むInput
  ↓ Interactor
Domain Model
  ↓ Gateway Mapper
External API / Storage DTO
```

```text
src/
├─ domain/
│  ├─ model/                 # Entity / Value Object Package
│  └─ usecase/               # Interactor / Gateway interface Package
├─ gateway/
│  └─ dummy-gateway/         # 開発・テスト用Gateway Package
├─ presentation/             # React UI Package
├─ wire/                     # Composition Root
└─ main.tsx                  # Vite entry

presentation ──> usecase ──> model
dummy-gateway ──> usecase ──> model
```

PresentationはUsecaseの公開APIのみを呼び出し、UsecaseはDomain ModelとGateway
interfaceだけに依存します。Gatewayは外部形式とDomain Modelの相互変換を担当します。

## 開始方法

Node.js 24 LTSとnpm 11を用意してください。検証済みのバージョンは`.node-version`と
`packageManager`フィールドに記載しています。

```sh
make install
make check
make dev
```

Windowsなどmakeがない環境では、対応する`npm run`コマンドを直接実行できます。

## 主なコマンド

- `make format`: Prettierで整形
- `make lint`: ESLintを実行
- `make check-dependencies`: Package間の依存方向を検査
- `make typecheck`: TypeScriptのProject Referencesで全Packageを検査
- `make test`: Vitestを実行
- `make build`: 型検査後にProduction buildを作成
- `make check`: format、lint、依存方向、型、テストを一括検査

詳細な規約は`docs/development/coding_rules.md`を参照してください。

## Pull RequestのGitHub Pages公開

Pull Requestを作成・更新・再オープンすると、GitHub ActionsがProduction buildを作成し、
GitHub Pagesへ公開します。RepositoryのSettingsで、PagesのSourceを
**GitHub Actions**に設定してください。

GitHub PagesはRepositoryにつき1サイトのため、新しいPull Requestのデプロイによって
現在公開されている内容が置き換わります。また、ForkからのPull Requestでは書き込み
権限が付与されないため、Pagesへのデプロイは実行できません。
