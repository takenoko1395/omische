import { useMemo, useRef, useState, forwardRef } from "react";
import type {
  CalendarDay,
  BusinessHours,
  IsoDate,
  StoreCalendar,
  Weekday,
} from "@omische/model";
import type { SubstituteClosureWarning } from "@omische/usecase";
import { useCalendar } from "../providers/calendar-provider";
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const now = new Date();
const updateRules = (
  calendar: StoreCalendar,
  changes: Partial<StoreCalendar["rules"]>,
): StoreCalendar => ({ ...calendar, rules: { ...calendar.rules, ...changes } });
export function CalendarPage() {
  const { calendar, update, interactor, setExceptionRange } = useCalendar();
  const [month, setMonth] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [wizard, setWizard] = useState(true);
  const [step, setStep] = useState(0);
  const [exceptionStart, setExceptionStart] = useState<IsoDate | "">("");
  const [exceptionEnd, setExceptionEnd] = useState<IsoDate | "">("");
  const exportRef = useRef<HTMLDivElement>(null);
  const days = useMemo(
    () => interactor.month(calendar, month.getFullYear(), month.getMonth() + 1),
    [calendar, interactor, month],
  );
  const substituteWarnings = useMemo(
    () => interactor.substituteClosureWarnings(calendar, now),
    [calendar, interactor],
  );
  const moveMonth = (offset: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
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
    setExceptionStart("");
    setExceptionEnd("");
  };
  const download = () => exportPng(calendar, month, days);
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
        <button className="export" onClick={download}>
          PNGを書き出す
        </button>
      </header>
      <section className="workspace">
        <aside className="panel">
          {wizard ? (
            <Wizard
              calendar={calendar}
              update={update}
              step={step}
              setStep={setStep}
              finish={() => setWizard(false)}
            />
          ) : (
            <Settings
              calendar={calendar}
              update={update}
              substituteWarnings={substituteWarnings}
              restart={() => {
                setExceptionStart("");
                setExceptionEnd("");
                setStep(0);
                setWizard(true);
              }}
            />
          )}
        </aside>
        <section className="preview">
          <div className="month-nav">
            <button onClick={() => moveMonth(-1)}>‹</button>
            <span>
              {month.getFullYear()}年 {month.getMonth() + 1}月
            </span>
            <button onClick={() => moveMonth(1)}>›</button>
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
                    営業日にする
                  </button>
                  <button onClick={() => applyException("closed")}>
                    休業日にする
                  </button>
                  <button
                    className="clear-range"
                    onClick={() => {
                      setExceptionStart("");
                      setExceptionEnd("");
                    }}
                  >
                    選び直す
                  </button>
                </div>
              )}
            </div>
          )}
          <CalendarCard
            ref={exportRef}
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
function Wizard({
  calendar,
  update,
  step,
  setStep,
  finish,
}: {
  calendar: StoreCalendar;
  update: (v: StoreCalendar) => void;
  step: number;
  setStep: (v: number) => void;
  finish: () => void;
}) {
  const lastStep = 6;
  const next = () => (step === lastStep ? finish() : setStep(step + 1));
  return (
    <div className="wizard">
      <p className="eyebrow">はじめの設定 · {step + 1} / 7</p>
      <div className="progress">
        <i style={{ width: `${((step + 1) / 7) * 100}%` }} />
      </div>
      {step === 0 && (
        <>
          <h1>
            お店のお名前を
            <br />
            教えてください
          </h1>
          <p>カレンダーのタイトルに表示します。</p>
          <input
            autoFocus
            value={calendar.storeName}
            onChange={(e) => update({ ...calendar, storeName: e.target.value })}
          />
        </>
      )}
      {step === 1 && (
        <ScheduleQuestion
          title="平日の営業時間を教えてください"
          description="月〜金の営業日について設定します。"
          value={calendar.businessHours.weekday}
          onChange={(value) =>
            update({
              ...calendar,
              businessHours: { ...calendar.businessHours, weekday: value },
            })
          }
        />
      )}
      {step === 2 && (
        <ScheduleQuestion
          title="土日・祝日の営業時間は？"
          description="平日と同じ時間でも、そのまま次へ進めます。"
          value={calendar.businessHours.weekendHoliday}
          onChange={(value) =>
            update({
              ...calendar,
              businessHours: {
                ...calendar.businessHours,
                weekendHoliday: value,
              },
            })
          }
        />
      )}
      {step === 3 && (
        <>
          <h1>
            毎週のお休みは
            <br />
            何曜日ですか？
          </h1>
          <p>複数選べます。定休日がなければ選択せず進めます。</p>
          <div className="weekday-options">
            {WEEKDAYS.map((label, day) => (
              <button
                key={label}
                className={
                  calendar.rules.weeklyClosures.includes(day as Weekday)
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  const values = calendar.rules.weeklyClosures.includes(
                    day as Weekday,
                  )
                    ? calendar.rules.weeklyClosures.filter((v) => v !== day)
                    : [...calendar.rules.weeklyClosures, day as Weekday];
                  update(updateRules(calendar, { weeklyClosures: values }));
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      {step === 4 && (
        <>
          <h1>
            ふだんの営業日が
            <br />
            祝日なら？
          </h1>
          <p>例：ふだん営業する火曜日が、祝日だった場合について選びます。</p>
          <Choice
            selected={calendar.rules.holidays}
            options={[
              ["open", "祝日も営業する"],
              ["closed", "祝日はお休みする"],
            ]}
            onChange={(v) =>
              update(
                updateRules(calendar, { holidays: v as "open" | "closed" }),
              )
            }
          />
        </>
      )}
      {step === 5 && (
        <>
          <h1>
            いつもの定休日が
            <br />
            祝日なら？
          </h1>
          <p>
            例：毎週月曜日がお休みで、その月曜日が祝日だった場合について選びます。
          </p>
          <Choice
            selected={calendar.rules.regularClosureOnHoliday}
            options={[
              ["open", "祝日だけ特別に営業する"],
              ["closed", "定休日どおりお休みする"],
            ]}
            onChange={(v) =>
              update(
                updateRules(calendar, {
                  regularClosureOnHoliday: v as "open" | "closed",
                }),
              )
            }
          />
        </>
      )}
      {step === 6 && (
        <>
          <h1>
            特別営業したあとの
            <br />
            お休みはどうする？
          </h1>
          <p>
            連休にしたい場合は、完成後に「追加の休業日」として期間を指定できます。
          </p>
          <Choice
            selected={calendar.rules.substituteClosure}
            options={[
              ["none", "あとで休業期間を自分で設定する"],
              ["next-day", "翌日だけ自動でお休みにする"],
            ]}
            onChange={(v) =>
              update(
                updateRules(calendar, {
                  substituteClosure: v as "none" | "next-day",
                }),
              )
            }
          />
        </>
      )}
      <div className="actions">
        {step > 0 && (
          <button className="back" onClick={() => setStep(step - 1)}>
            戻る
          </button>
        )}
        <button className="next" onClick={next}>
          {step === lastStep ? "設定を完成する" : "次へ"}
        </button>
      </div>
    </div>
  );
}
function ScheduleQuestion({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description?: string;
  value: BusinessHours;
  onChange: (value: BusinessHours) => void;
}) {
  const hasBreak = value.breakTime !== undefined;
  const breakTime = value.breakTime;
  return (
    <div className="schedule-question">
      {title && <h1>{title}</h1>}
      {description && <p>{description}</p>}
      <div className="time-row">
        <label>
          開店
          <input
            type="time"
            value={value.open}
            onChange={(event) =>
              onChange({ ...value, open: event.target.value })
            }
          />
        </label>
        <span>〜</span>
        <label>
          閉店
          <input
            type="time"
            value={value.close}
            onChange={(event) =>
              onChange({ ...value, close: event.target.value })
            }
          />
        </label>
      </div>
      <label className="break-toggle">
        <input
          type="checkbox"
          checked={hasBreak}
          onChange={(event) =>
            onChange(
              event.target.checked
                ? { ...value, breakTime: { start: "14:00", end: "15:00" } }
                : { open: value.open, close: value.close },
            )
          }
        />
        中休憩がある
      </label>
      {breakTime && (
        <div className="time-row break-row">
          <label>
            休憩開始
            <input
              type="time"
              value={breakTime.start}
              onChange={(event) =>
                onChange({
                  ...value,
                  breakTime: { ...breakTime, start: event.target.value },
                })
              }
            />
          </label>
          <span>〜</span>
          <label>
            休憩終了
            <input
              type="time"
              value={breakTime.end}
              onChange={(event) =>
                onChange({
                  ...value,
                  breakTime: { ...breakTime, end: event.target.value },
                })
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
function Choice({
  selected,
  options,
  onChange,
}: {
  selected: string;
  options: readonly (readonly [string, string])[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="choices">
      {options.map(([value, label]) => (
        <button
          key={value}
          className={selected === value ? "selected" : ""}
          onClick={() => onChange(value)}
        >
          <span>{selected === value ? "●" : "○"}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
function Settings({
  calendar,
  update,
  restart,
  substituteWarnings,
}: {
  calendar: StoreCalendar;
  update: (v: StoreCalendar) => void;
  restart: () => void;
  substituteWarnings: readonly SubstituteClosureWarning[];
}) {
  return (
    <div className="settings">
      <p className="eyebrow">カレンダー設定</p>
      <h1>
        いつでも微調整
        <br />
        できます
      </h1>
      <label>
        店舗名
        <input
          value={calendar.storeName}
          onChange={(e) => update({ ...calendar, storeName: e.target.value })}
        />
      </label>
      <details className="schedule-details">
        <summary>営業時間を変更</summary>
        <h2>平日</h2>
        <ScheduleQuestion
          title=""
          value={calendar.businessHours.weekday}
          onChange={(value) =>
            update({
              ...calendar,
              businessHours: { ...calendar.businessHours, weekday: value },
            })
          }
        />
        <h2>土日・祝日</h2>
        <ScheduleQuestion
          title=""
          value={calendar.businessHours.weekendHoliday}
          onChange={(value) =>
            update({
              ...calendar,
              businessHours: {
                ...calendar.businessHours,
                weekendHoliday: value,
              },
            })
          }
        />
      </details>
      {substituteWarnings.length > 0 && (
        <aside className="rule-warnings" aria-labelledby="rule-warning-title">
          <strong id="rule-warning-title">このお休みで大丈夫ですか？</strong>
          <p>
            「翌日だけ自動でお休み」の設定と連続する祝日が重なり、振替休業が後ろへ移動する日があります。
          </p>
          <ul>
            {substituteWarnings.map((warning) => (
              <li key={warning.date}>
                <time dateTime={warning.date}>{warning.date}</time>
                {warning.message}
              </li>
            ))}
          </ul>
        </aside>
      )}
      <label>
        注記
        <input
          value={calendar.note}
          onChange={(e) => update({ ...calendar, note: e.target.value })}
        />
      </label>
      <label>
        デザイン
        <select
          value={calendar.theme}
          onChange={(e) =>
            update({
              ...calendar,
              theme: e.target.value as StoreCalendar["theme"],
            })
          }
        >
          <option value="minimal">Minimal</option>
          <option value="natural">Cafe / Natural</option>
          <option value="japanese">Japanese / Simple</option>
        </select>
      </label>
      <label>
        メインカラー
        <input
          type="color"
          value={calendar.mainColor}
          onChange={(e) => update({ ...calendar, mainColor: e.target.value })}
        />
      </label>
      <button className="restart" onClick={restart}>
        質問形式で設定し直す
      </button>
    </div>
  );
}
const CalendarCard = forwardRef<
  HTMLDivElement,
  {
    calendar: StoreCalendar;
    month: Date;
    days: readonly CalendarDay[];
    rangeStart: IsoDate | "";
    rangeEnd: IsoDate | "";
    onDateSelect?: (date: IsoDate) => void;
  }
>(({ calendar, month, days, rangeStart, rangeEnd, onDateSelect }, ref) => (
  <div
    className="calendar-card"
    ref={ref}
    style={{ "--accent": calendar.mainColor } as React.CSSProperties}
  >
    <div className="card-heading">
      <p>BUSINESS CALENDAR</p>
      <h2>{calendar.storeName}</h2>
      <span>
        {month.getFullYear()} / {String(month.getMonth() + 1).padStart(2, "0")}
      </span>
    </div>
    <div className="calendar-grid">
      {WEEKDAYS.map((v) => (
        <b key={v}>{v}</b>
      ))}
      {Array.from(
        { length: new Date(month.getFullYear(), month.getMonth(), 1).getDay() },
        (_, i) => (
          <i key={`empty-${i}`} />
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
));
function exportPng(
  calendar: StoreCalendar,
  month: Date,
  days: readonly CalendarDay[],
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const c = canvas.getContext("2d");
  if (!c) return;
  c.fillStyle = "#fbf8f1";
  c.fillRect(0, 0, 1080, 1080);
  c.textAlign = "center";
  c.fillStyle = calendar.mainColor;
  c.font = "28px sans-serif";
  c.fillText("BUSINESS CALENDAR", 540, 80);
  c.fillStyle = "#29251f";
  c.font = "bold 54px sans-serif";
  c.fillText(calendar.storeName, 540, 150);
  c.font = "32px sans-serif";
  c.fillText(
    `${month.getFullYear()} / ${String(month.getMonth() + 1).padStart(2, "0")}`,
    540,
    205,
  );
  const start = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  WEEKDAYS.forEach((w, i) => {
    c.font = "bold 22px sans-serif";
    c.fillText(w, 145 + i * 132, 280);
  });
  days.forEach((d) => {
    const cell = start + d.day - 1;
    const x = 82 + (cell % 7) * 132;
    const y = 310 + Math.floor(cell / 7) * 116;
    c.fillStyle = d.isOpen ? "#fff" : `${calendar.mainColor}22`;
    c.beginPath();
    c.roundRect(x, y, 112, 96, 16);
    c.fill();
    c.fillStyle = d.isOpen ? "#29251f" : calendar.mainColor;
    c.font = "bold 28px sans-serif";
    c.fillText(String(d.day), x + 56, y + 42);
    if (!d.isOpen) {
      c.font = "18px sans-serif";
      c.fillText("休", x + 56, y + 72);
    }
  });
  c.font = "20px sans-serif";
  c.fillStyle = "#29251f";
  c.fillText(
    `平日 ${formatBusinessHours(calendar.businessHours.weekday)}　土日祝 ${formatBusinessHours(calendar.businessHours.weekendHoliday)}`,
    540,
    1010,
  );
  const link = document.createElement("a");
  link.download = `business-calendar-${month.getFullYear()}-${month.getMonth() + 1}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
function formatBusinessHours(hours: BusinessHours) {
  const base = `${hours.open}–${hours.close}`;
  return hours.breakTime
    ? `${base}（休 ${hours.breakTime.start}–${hours.breakTime.end}）`
    : base;
}
