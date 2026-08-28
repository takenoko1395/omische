import {
  BrowserCalendarGateway,
  BrowserCalendarImageGateway,
} from "@omische/browser-calendar";
import { CalendarInteractor } from "@omische/usecase";
export const buildCalendarInteractor = (): CalendarInteractor =>
  new CalendarInteractor(
    new BrowserCalendarGateway(),
    new BrowserCalendarImageGateway(),
  );
