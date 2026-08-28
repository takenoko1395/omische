import type { CalendarImage, CalendarImageGateway } from "@omische/usecase";
import { downloadCalendarPng } from "./calendar-image/download-calendar-png";

/** BrowserのCanvasを使って営業日カレンダー画像を保存します。 */
export class BrowserCalendarImageGateway implements CalendarImageGateway {
  public async downloadPng(image: CalendarImage): Promise<void> {
    await downloadCalendarPng(image);
  }
}
