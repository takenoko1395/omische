# Template development rules

- PresentationはUsecaseの公開APIを介して処理を呼び出す。
- UsecaseはDomain ModelとGateway interfaceにのみ依存する。
- Gatewayは外部API・永続化形式とDomainの相互変換を担当する。
- Packageの公開入口は各Packageの`src/index.ts`にまとめる。
- Package名、公開入口、workspace dependencyは同時に更新する。
- InteractorのDIと共有状態はPresentationのProviderを介する。
- 変更後はformat、lint、依存関係検査、typecheck、testを実行する。
- 詳細な規約は`docs/development/coding_rules.md`を参照する。
