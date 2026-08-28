# 日本の祝日データをビルドへ埋め込む方針

## 目的

日本の祝日はアプリ内の計算式で推測せず、Repository内の内閣府祝日CSVを正として扱う。
ブラウザ実行時には外部APIへアクセスせず、同じコミットから常に同じ結果を得られるようにする。

## データフロー

```text
resources/syukujitsu.csv（CP932）
  ↓ npm run generate:holidays
文字コード変換・形式検証・日付正規化
  ↓
src/gateway/browser-calendar/src/data/japanese-holidays.json
  ↓ ViteのProduction buildへ同梱
BrowserCalendarGatewayがDomain形式へ変換
```

`npm run build`は最初に生成処理を実行する。通常のアプリビルドとブラウザRuntimeは
ネットワーク通信を行わない。

## 生成処理

生成スクリプトは次の処理を行う。

1. Repository内のCSVをCP932として読み込む。
2. ヘッダーと列数を確認する。
3. 各行の日付と祝日名を読み取る。
4. 日付を`YYYY-MM-DD`へ正規化する。
5. 不正な日付、空の名称、日付の重複を検出したら失敗する。
6. 日付順の祝日と、CSVに存在する対応年をJSONへ出力する。

CSVを更新した場合は`npm run generate:holidays`を実行する。`npm run check`はCSVと
生成済みJSONが一致することも検査するため、生成漏れを検出できる。

## GatewayとDomainの責務

- 生成スクリプトは、CSVという外部形式を安定したJSONへ変換する。
- `BrowserCalendarGateway`は、生成済みJSONを`ReadonlyMap<IsoDate, string>`へ変換する。
- GatewayはCSVに存在する対応年もUsecaseへ提供する。
- UsecaseとDomain Modelは、CSVの列や文字コードに依存しない。
- PresentationはUsecaseの公開APIから対応年を取得し、範囲外へ移動させない。

生成済みデータに対象年がない場合、Gatewayはその年の祝日を空として返し、計算式へ
フォールバックしない。

## テスト方針

- CP932のCSVと日本語祝日名を読み取れる。
- `YYYY/M/D`を`YYYY-MM-DD`へ正規化できる。
- 不正なヘッダー、日付、重複、空の名称を拒否する。
- CSVに含まれる年だけを対応年として扱う。
- CSV由来の祝日を既存の祝日営業・祝日休業ルールへ渡せる。
- Production build中とブラウザRuntimeに外部通信を必要としない。
