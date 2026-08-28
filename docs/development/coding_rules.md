# コーディング・設計ルール

更新日: 2026-08-14

## レイヤー間の入力

基本の流れは次のとおり。

```text
Presentation Form
  ↓ Presentation Mapper
Value Objectを含むHogeInput
  ↓ Interactor
Domain Model
  ↓ Gateway Mapper
永続化・API DTO
```

Presentationは入力文字列をそのままInteractorへ渡さず、入力境界でValue Objectへ
変換する。入力型は`UpdateItemInput`のように`HogeInput`で統一し、利用するInteractor
メソッドの近くへ置く。

## Packageと依存方向

- `model`は外側のPackageへ依存しない。
- `usecase`は`model`とGateway interfaceだけに依存する。
- Gateway実装は`usecase`のGateway interfaceと`model`に依存する。
- `presentation`は`usecase`と表示に必要な`model`に依存する。
- テンプレートルートの`src/wire/`をComposition Rootとし、GatewayとInteractorを組み立てる。
- 別Packageの`src/`を相対importせず、`src/index.ts`の公開APIを利用する。

依存追加後は`make check-dependencies`を実行する。依存ルールを変更する場合は、実装だけで
なく検査スクリプトと構成図も同時に更新する。

## InteractorとProvider

Interactorはアプリケーションの操作単位を提供する。PresentationはInteractorを直接
組み立てず、`InteractorProvider`から取得する。ProviderはDI、非同期状態、画面間共有、
再読込などPresentation固有の状態管理に使う。

Interactorメソッドをそのまま呼び出すだけの専用Hookは増やさない。非同期状態は判別可能な
Unionで表し、loading・error・dataを区別する。エラーを空データや成功状態へ置き換えない。

ReactのEffectで非同期購読、Event Listener、Timerなどを開始した場合はcleanupする。
古いリクエストが新しい状態を上書きしないよう、競合条件も考慮する。Domain状態や業務判断を
Componentローカルへ閉じ込めず、InteractorとPresentation Providerへ置く。

## Usecaseの構成

Usecase Packageの`src/`直下は、外部境界を表す`gateway/`と、アプリケーション操作を表す
`interactor/`へ分ける。Gateway interfaceをInteractorフォルダへ混在させない。

```text
src/domain/usecase/src/
  gateway/
    item-gateway.ts
  interactor/
    item-interactor.ts
    item-interactor/
      list-items.ts
```

Interactor本体にはconstructor、依存、薄い公開メソッドだけを置く。操作の実処理は公開
メソッド単位のファイルへ分割する。GatewayとInteractorの公開メソッドには、取得する情報や
変更する状態を判断できる短いドキュメントコメントを付ける。

## PageとComponent

Page固有のComponentが他画面と混ざらないよう、Page単位のフォルダを使う。

```text
pages/
  item-list/
    item-list-page.tsx
    components/
      item-card.tsx
```

Pageはデータ購読とイベント配線を中心にし、表示のまとまりはComponentへ分割する。Form入力を
Domain型へ変換する関数はComponent外へ置き、JSXから検証と変換の詳細を追い出す。

Componentには「何を表示し、どの操作を受け持つか」を短いJSDocで記載する。Propsを持つ公開
Componentは各Propsの意味も型またはJSDocから判断できるようにする。一度しか使わないことだけを
理由にComponentや型を増やさず、不変条件を持つDomain概念は利用回数にかかわらず型で表す。

## Domain Model

Domain Modelは原則として1ファイルに1クラスを配置する。Value Objectのconstructorで入力を
検証し、無効な状態を生成できないようにする。同じ対象物や概念には全レイヤーで同じ名前を使い、
概念を変更した場合はDomain、Usecase、Gateway、Presentation、テスト、文書をまとめて更新する。

## DTOと保存形式

外部APIや永続化のDTOをDomain Modelとして流用しない。GatewayでDTOとDomain Modelを相互変換する。
明示的な要件がない限り、旧形式とのdual-readやmigrationを独自判断で追加しない。

DTO復元に失敗した場合はエラーをPresentationまで伝播させ、空データへの変換や保存値の自動上書きを
行わない。互換性が必要な場合は対象versionと移行方針を確認して実装する。

## エラー処理

想定外エラーはGatewayからUsecase、Presentationへ原則として伝播させる。Presentationは終端として
メッセージ表示や再試行導線へ変換してよいが、エラー状態を成功状態に変えない。

検索結果0件など仕様上の「存在しない」は、空Collectionや明示的なResult型で表現し、I/O失敗と
同じ`catch`へ混ぜない。新しいフォールバックが必要な場合は、発動条件、代替値、元データ、再試行、
ユーザーへの表示を確認してから実装する。

## テストの配置

テストは検証対象を所有するPackage内へ置く。Domain Modelのテストは`src/domain/model/test/`、
PresentationのComponentテストは`src/presentation/test/`へ配置する。ルートの`test/`はPackage間の
配線やComposition Rootなど、単一Packageに属さない検証だけに使う。

変更後は次を実行する。

```sh
make format
make check
make build
```
