import { createContext, useContext, type PropsWithChildren } from "react";
import type { ItemInteractor } from "@template/usecase";

const ItemInteractorContext = createContext<ItemInteractor | undefined>(
  undefined,
);

type InteractorProviderProps = PropsWithChildren<{
  itemInteractor: ItemInteractor;
}>;

/** [itemInteractor]をPresentation配下へ注入します。 */
export function InteractorProvider({
  children,
  itemInteractor,
}: InteractorProviderProps) {
  return (
    <ItemInteractorContext value={itemInteractor}>
      {children}
    </ItemInteractorContext>
  );
}

/** DIされたItemInteractorを取得します。 */
export function useItemInteractor(): ItemInteractor {
  const interactor = useContext(ItemInteractorContext);
  if (interactor === undefined) {
    throw new Error("InteractorProviderが見つかりません。");
  }
  return interactor;
}
