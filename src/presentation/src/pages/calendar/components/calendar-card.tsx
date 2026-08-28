import type { CalendarDay, IsoDate, StoreCalendar } from "@omische/model";
import { formatBusinessHours, WEEKDAYS } from "../calendar-format";

/** 指定月の営業日・休業日と選択中の臨時変更範囲を表示します。 */
export function CalendarCard({
  calendar,
  month,
  days,
  rangeStart,
  rangeEnd,
  onDateSelect,
}: {
  calendar: StoreCalendar;
  month: Date;
  days: readonly CalendarDay[];
  rangeStart: IsoDate | "";
  rangeEnd: IsoDate | "";
  onDateSelect?: ((date: IsoDate) => void) | undefined;
}) {
  return (
    <div
      className="calendar-card"
      style={{ "--accent": calendar.mainColor } as React.CSSProperties}
    >
      <div className="card-heading">
        <p>BUSINESS CALENDAR</p>
        <h2>{calendar.storeName}</h2>
        <span>
          {month.getFullYear()} /{" "}
          {String(month.getMonth() + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <b key={weekday}>{weekday}</b>
        ))}
        {Array.from(
          {
            length: new Date(month.getFullYear(), month.getMonth(), 1).getDay(),
          },
          (_, index) => (
            <i key={`empty-${index}`} />
          ),
        )}
        {days.map((day) => (
          <button
            type="button"
            key={day.date}
            className={`${day.isOpen ? "open" : "closed"} ${day.kind} ${day.isHoliday ? "holiday" : ""} ${day.date === rangeStart || day.date === rangeEnd ? "range-edge" : ""} ${rangeStart && rangeEnd && day.date > rangeStart && day.date < rangeEnd ? "in-range" : ""}`}
            title={day.reason}
            aria-pressed={
              onDateSelect
                ? day.date === rangeStart ||
                  day.date === rangeEnd ||
                  Boolean(
                    rangeStart &&
                    rangeEnd &&
                    day.date > rangeStart &&
                    day.date < rangeEnd,
                  )
                : undefined
            }
            onClick={() => onDateSelect?.(day.date)}
          >
            <span>{day.day}</span>
            {day.isHoliday && <small>{day.holidayName}</small>}
            {!day.isOpen && <small>休</small>}
            {day.kind === "special-open" && <small>営</small>}
          </button>
        ))}
      </div>
      <div className="legend">
        <span>
          <i />
          営業日
        </span>
        <span>
          <i className="closed-dot" />
          休業日
        </span>
        <span>
          <i className="special-dot" />
          臨時変更
        </span>
      </div>
      <div className="card-footer">
        <strong>
          平日 {formatBusinessHours(calendar.businessHours.weekday)}
          <br />
          土日祝 {formatBusinessHours(calendar.businessHours.weekendHoliday)}
        </strong>
        <span>{calendar.note}</span>
      </div>
    </div>
  );
}
