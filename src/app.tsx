import { CalendarPage, CalendarProvider } from "@omische/presentation";
import { buildCalendarInteractor } from "./wire/interactor-factory";
const interactor = buildCalendarInteractor();
export function App() {
  return (
    <CalendarProvider interactor={interactor}>
      <CalendarPage />
    </CalendarProvider>
  );
}
