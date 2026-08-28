import { defaultStoreCalendar, type StoreCalendar } from "@omische/model";
import type { CalendarGateway } from "../../gateway/calendar-gateway";

export const loadCalendar = (gateway: CalendarGateway): StoreCalendar =>
  gateway.load() ?? defaultStoreCalendar();
