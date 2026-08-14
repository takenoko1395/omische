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
  interactor: CalendarInteractor;
};
const Context = createContext<ContextValue | undefined>(undefined);
export function CalendarProvider({
  children,
  interactor,
}: PropsWithChildren<{ interactor: CalendarInteractor }>) {
  const [calendar, setCalendar] = useState(() => interactor.load());
  const value = useMemo(
    () => ({
      calendar,
      interactor,
      update: (next: StoreCalendar) => {
        setCalendar(next);
        interactor.save(next);
      },
    }),
    [calendar, interactor],
  );
  return <Context value={value}>{children}</Context>;
}
export function useCalendar() {
  const value = useContext(Context);
  if (value === undefined)
    throw new Error("CalendarProviderが見つかりません。");
  return value;
}
