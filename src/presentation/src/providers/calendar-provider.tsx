import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { CalendarInteractor } from "@omische/usecase";
import type { StoreCalendar } from "@omische/model";
type ContextValue = {
  calendar: StoreCalendar;
  update: (calendar: StoreCalendar) => void;
  setExceptionRange: (
    kind: "open" | "closed",
    start: string,
    end: string,
  ) => void;
  exportMonth: (year: number, month: number) => Promise<void>;
  exportState:
    | Readonly<{ status: "idle" }>
    | Readonly<{ status: "loading" }>
    | Readonly<{ status: "error"; message: string }>;
  interactor: CalendarInteractor;
};
const Context = createContext<ContextValue | undefined>(undefined);
export function CalendarProvider({
  children,
  interactor,
}: PropsWithChildren<{ interactor: CalendarInteractor }>) {
  const [calendar, setCalendar] = useState(() => interactor.load());
  const [exportState, setExportState] = useState<ContextValue["exportState"]>({
    status: "idle",
  });
  const value = useMemo(
    () => ({
      calendar,
      interactor,
      exportState,
      update: (next: StoreCalendar) => {
        setCalendar(next);
        interactor.save(next);
      },
      setExceptionRange: (
        kind: "open" | "closed",
        start: string,
        end: string,
      ) =>
        setCalendar(interactor.setExceptionRange(calendar, kind, start, end)),
      exportMonth: async (year: number, month: number) => {
        setExportState({ status: "loading" });
        try {
          await interactor.exportMonth({ calendar, year, month });
          setExportState({ status: "idle" });
        } catch (error) {
          setExportState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "画像を書き出せませんでした。",
          });
        }
      },
    }),
    [calendar, exportState, interactor],
  );
  return <Context value={value}>{children}</Context>;
}
export function useCalendar() {
  const value = useContext(Context);
  if (value === undefined)
    throw new Error("CalendarProviderが見つかりません。");
  return value;
}
