import type { StoreCalendar } from "@omische/model";
import type { CalendarGateway } from "../../gateway/calendar-gateway";
import { buildCalendarMonth } from "./build-calendar-month";

export type SubstituteClosureWarning = Readonly<{
  date: string;
  holidayNames: readonly string[];
  message: string;
}>;

export function getSubstituteClosureWarnings(
  gateway: CalendarGateway,
  calendar: StoreCalendar,
  from: Date,
  monthsAhead = 11,
): readonly SubstituteClosureWarning[] {
  if (calendar.rules.substituteClosure !== "next-day") return [];
  const toIsoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const startDate = toIsoDate(from);
  const endMonth = new Date(
    from.getFullYear(),
    from.getMonth() + monthsAhead,
    1,
  );
  const endDay = Math.min(
    from.getDate(),
    new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0).getDate(),
  );
  const endDate = toIsoDate(
    new Date(endMonth.getFullYear(), endMonth.getMonth(), endDay),
  );
  const warnings: SubstituteClosureWarning[] = [];
  for (let offset = 0; offset <= monthsAhead; offset += 1) {
    const target = new Date(from.getFullYear(), from.getMonth() + offset, 1);
    for (const day of buildCalendarMonth(
      gateway,
      calendar,
      target.getFullYear(),
      target.getMonth() + 1,
    )) {
      if (
        day.date >= startDate &&
        day.date <= endDate &&
        day.kind === "substitute-closed" &&
        day.substitutionFor &&
        day.deferredByHolidays?.length
      )
        warnings.push({
          date: day.date,
          holidayNames: day.deferredByHolidays,
          message: `${day.substitutionFor}の振替休業は、翌日も${day.deferredByHolidays.join("、")}のため${day.date}へ移動します。`,
        });
    }
  }
  return warnings;
}
