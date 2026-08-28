import { useMemo, useState } from "react";
import type { IsoDate } from "@omische/model";
import { useCalendar } from "../../providers/calendar-provider";
import { CalendarCard } from "./components/calendar-card";
import { CalendarSettings } from "./components/calendar-settings";
import { CalendarWizard } from "./components/calendar-wizard";

const now = new Date();

export function CalendarPage() {
  const {
    calendar,
    update,
    interactor,
    setExceptionRange,
    exportMonth,
    exportState,
  } = useCalendar();
  const holidayDataRange = interactor.holidayDataRange();
  const [month, setMonth] = useState(() => {
    if (holidayDataRange === undefined)
      return new Date(now.getFullYear(), now.getMonth(), 1);
    if (now.getFullYear() < holidayDataRange.oldestYear)
      return new Date(holidayDataRange.oldestYear, 0, 1);
    if (now.getFullYear() > holidayDataRange.newestYear)
      return new Date(holidayDataRange.newestYear, 11, 1);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [wizard, setWizard] = useState(true);
  const [step, setStep] = useState(0);
  const [exceptionStart, setExceptionStart] = useState<IsoDate | "">("");
  const [exceptionEnd, setExceptionEnd] = useState<IsoDate | "">("");
  const days = useMemo(
    () => interactor.month(calendar, month.getFullYear(), month.getMonth() + 1),
    [calendar, interactor, month],
  );
  const substituteWarnings = useMemo(
    () => interactor.substituteClosureWarnings(calendar, now),
    [calendar, interactor],
  );
  const canMoveMonth = (offset: number) => {
    const target = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    return interactor.hasHolidayData(target.getFullYear());
  };
  const moveMonth = (offset: number) => {
    if (!canMoveMonth(offset)) return;
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  };
  const selectExceptionDate = (date: IsoDate) => {
    if (!exceptionStart || exceptionEnd) {
      setExceptionStart(date);
      setExceptionEnd("");
      return;
    }
    if (date < exceptionStart) {
      setExceptionEnd(exceptionStart);
      setExceptionStart(date);
      return;
    }
    setExceptionEnd(date);
  };
  const applyException = (kind: "open" | "closed") => {
    if (!exceptionStart || !exceptionEnd) return;
    setExceptionRange(kind, exceptionStart, exceptionEnd);
    clearExceptionRange();
  };
  const clearExceptionRange = () => {
    setExceptionStart("");
    setExceptionEnd("");
  };
  const restart = () => {
    clearExceptionRange();
    setStep(0);
    setWizard(true);
  };
  const download = () =>
    void exportMonth(month.getFullYear(), month.getMonth() + 1);

  return (
    <main className={`app theme-${calendar.theme}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">営</span>
          <div>
            <strong>Omise Calendar</strong>
            <small>営業日カレンダー</small>
          </div>
        </div>
        <div className="export-action">
          <button
            className="export"
            disabled={exportState.status === "loading"}
            onClick={download}
          >
            {exportState.status === "loading" ? "書き出し中…" : "PNGを書き出す"}
          </button>
          {exportState.status === "error" && (
            <small className="export-error" role="alert">
              {exportState.message}
            </small>
          )}
        </div>
      </header>
      <section className="workspace">
        <aside className="panel">
          {wizard ? (
            <CalendarWizard
              calendar={calendar}
              update={update}
              step={step}
              setStep={setStep}
              finish={() => setWizard(false)}
            />
          ) : (
            <CalendarSettings
              calendar={calendar}
              update={update}
              substituteWarnings={substituteWarnings}
              restart={restart}
            />
          )}
        </aside>
        <section className="preview">
          <div className="month-nav">
            <button
              disabled={!canMoveMonth(-1)}
              aria-label="前の月"
              onClick={() => moveMonth(-1)}
            >
              ‹
            </button>
            <span>
              {month.getFullYear()}年 {month.getMonth() + 1}月
            </span>
            <button
              disabled={!canMoveMonth(1)}
              aria-label="次の月"
              onClick={() => moveMonth(1)}
            >
              ›
            </button>
          </div>
          {!wizard && (
            <div className="preview-range-editor" aria-live="polite">
              <p>
                {exceptionStart
                  ? exceptionEnd
                    ? `${exceptionStart} 〜 ${exceptionEnd}`
                    : `${exceptionStart} からの終了日をタップ。同じ日だけなら、もう一度タップしてください。`
                  : "カレンダーを2回タップして、追加する営業日・休業日の期間を選択します。"}
              </p>
              {exceptionStart && exceptionEnd && (
                <div>
                  <button onClick={() => applyException("open")}>
                    臨時営業にする
                  </button>
                  <button onClick={() => applyException("closed")}>
                    臨時休業にする
                  </button>
                  <button className="clear-range" onClick={clearExceptionRange}>
                    選び直す
                  </button>
                </div>
              )}
            </div>
          )}
          <CalendarCard
            calendar={calendar}
            month={month}
            days={days}
            rangeStart={exceptionStart}
            rangeEnd={exceptionEnd}
            onDateSelect={wizard ? undefined : selectExceptionDate}
          />
        </section>
      </section>
    </main>
  );
}
