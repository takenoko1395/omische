import type { CalendarDay, StoreCalendar } from "@omische/model";

export type CalendarImage = Readonly<{
  calendar: StoreCalendar;
  year: number;
  month: number;
  days: readonly CalendarDay[];
}>;

export interface CalendarImageGateway {
  /** 営業日カレンダーを画像として利用者の端末へ保存します。 */
  downloadPng(image: CalendarImage): Promise<void>;
}
