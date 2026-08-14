import { InteractorProvider, ItemListPage } from "@template/presentation";

import { buildItemInteractor } from "./wire/interactor-factory";

const itemInteractor = buildItemInteractor();

/** InteractorをPresentationへ注入し、テンプレート一覧を表示します。 */
export function App() {
  return (
    <InteractorProvider itemInteractor={itemInteractor}>
      <ItemListPage />
    </InteractorProvider>
  );
}
