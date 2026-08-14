import { useCallback, useEffect, useState } from "react";
import type { TemplateItem } from "@template/model";

import { useItemInteractor } from "./interactor-provider";

export type ItemsState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly error: unknown }
  | { readonly status: "data"; readonly items: readonly TemplateItem[] };

/** 項目一覧の非同期状態と再読込操作をPresentationで管理します。 */
export function useItems(): {
  readonly state: ItemsState;
  readonly reload: () => void;
} {
  const interactor = useItemInteractor();
  const [requestId, setRequestId] = useState(0);
  const [state, setState] = useState<ItemsState>({ status: "loading" });

  const reload = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    void interactor.listItems().then(
      (items) => {
        if (active) setState({ status: "data", items });
      },
      (error: unknown) => {
        if (active) setState({ status: "error", error });
      },
    );

    // 古いリクエストが新しい画面状態を上書きしないよう購読を無効化します。
    return () => {
      active = false;
    };
  }, [interactor, requestId]);

  return { state, reload };
}
