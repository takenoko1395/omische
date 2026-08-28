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
│  └─ browser-calendar/      # Browser保存・祝日・PNG出力Gateway Package
├─ presentation/             # React UI Package
├─ wire/                     # Composition Root
└─ main.tsx                  # Vite entry

presentation ──> usecase ──> model
browser-calendar ──> usecase ──> model
```

PresentationはUsecaseの公開APIのみを呼び出し、UsecaseはDomain ModelとGateway
interfaceだけに依存します。Gatewayは外部形式とDomain Modelの相互変換を担当します。
PNG書き出しはPresentationから`CalendarInteractor`を呼び、Usecaseが対象月を判定したあと、
Browser GatewayがCanvas描画と端末への保存を行います。

## 開始方法

Node.js 24 LTSとnpm 11を用意してください。検証済みのバージョンは`.node-version`と
`packageManager`フィールドに記載しています。

```sh
make install
make check
make dev
```

初回セットアップでは、Node.jsとnpmのバージョン確認、依存関係の固定インストール、
一括検証をまとめて実行できます。

```sh
make setup
```

コンテナや開発環境の初期化スクリプトをカスタマイズできる場合は、RepositoryをCheckout
したあとに次のコマンドを実行するよう設定してください。

```sh
./scripts/setup-development.sh
```

このスクリプトはNode.js 24、npm 11を確認してから`npm ci`と`npm run check`を実行します。
Node.js自体のインストールは環境ごとに異なるため、`.node-version`を参照できる
バージョン管理ツールやコンテナイメージ側で用意してください。日常の開発では変更前後に
`npm run check`を実行し、CIはその結果を独立した環境でもう一度確認します。

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

## 継続的インテグレーション

Pull Request、および`main`または`master`へのPushでは`.github/workflows/ci.yml`が動作し、
`npm ci`、format、lint、依存関係検査、typecheck、test、Production buildを実行します。
ローカル検証は素早いフィードバックのため、CIは環境差や検証漏れを防ぐために、両方を
実行する方針です。Branch protectionを利用する場合は、CIの`check` jobを必須にします。

## Pull RequestのGitHub Pages公開

Pull Requestを作成・更新・再オープンすると、GitHub ActionsがProduction buildを作成し、
GitHub Pagesへ公開します。RepositoryのSettingsで、PagesのSourceを
**GitHub Actions**に設定してください。

canonical、OGPのURL、`robots.txt`、`sitemap.xml`には、GitHub PagesのURLが使用されます。
独自ドメインを使う場合はRepository Variableの`SITE_URL`へ、末尾のパスを含む公開URLを
設定してください。OG画像を用意したあとは、絶対URLまたはサイトルートからの相対パスを
`OG_IMAGE_URL`へ設定すると、OGPとTwitter/Xの画像タグが有効になります。

GitHub PagesはRepositoryにつき1サイトのため、新しいPull Requestのデプロイによって
現在公開されている内容が置き換わります。また、ForkからのPull Requestでは書き込み
権限が付与されないため、Pagesへのデプロイは実行できません。
