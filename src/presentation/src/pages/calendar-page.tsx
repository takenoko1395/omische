import { useMemo, useRef, useState, forwardRef } from "react";
import type {
  CalendarDay,
  IsoDate,
  StoreCalendar,
  Weekday,
} from "@omische/model";
import { useCalendar } from "../providers/calendar-provider";
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const now = new Date();
const updateRules = (
  calendar: StoreCalendar,
  changes: Partial<StoreCalendar["rules"]>,
): StoreCalendar => ({ ...calendar, rules: { ...calendar.rules, ...changes } });
export function CalendarPage() {
  const { calendar, update, interactor } = useCalendar();
  const [month, setMonth] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [wizard, setWizard] = useState(true);
  const [step, setStep] = useState(0);
  const exportRef = useRef<HTMLDivElement>(null);
  const days = useMemo(
    () => interactor.month(calendar, month.getFullYear(), month.getMonth() + 1),
    [calendar, interactor, month],
  );
  const moveMonth = (offset: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
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
              restart={() => {
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
          <CalendarCard
            ref={exportRef}
            calendar={calendar}
            month={month}
            days={days}
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
  const next = () => (step === 4 ? finish() : setStep(step + 1));
  return (
    <div className="wizard">
      <p className="eyebrow">はじめの設定 · {step + 1} / 5</p>
      <div className="progress">
        <i style={{ width: `${(step + 1) * 20}%` }} />
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
      {step === 2 && (
        <>
          <h1>祝日は営業しますか？</h1>
          <p>定休日ではない祝日の営業について選びます。</p>
          <Choice
            selected={calendar.rules.holidays}
            options={[
              ["open", "営業する"],
              ["closed", "お休みする"],
            ]}
            onChange={(v) =>
              update(
                updateRules(calendar, { holidays: v as "open" | "closed" }),
              )
            }
          />
        </>
      )}
      {step === 3 && (
        <>
          <h1>
            定休日が祝日なら
            <br />
            どうしますか？
          </h1>
          <Choice
            selected={calendar.rules.regularClosureOnHoliday}
            options={[
              ["open", "祝日なので営業する"],
              ["closed", "そのまま休む"],
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
      {step === 4 && (
        <>
          <h1>
            祝日営業の翌日は
            <br />
            お休みにしますか？
          </h1>
          <Choice
            selected={calendar.rules.substituteClosure}
            options={[
              ["next-day", "翌日を振替休業にする"],
              ["none", "振替休業はなし"],
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
          {step === 4 ? "設定を完成する" : "次へ"}
        </button>
      </div>
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
}: {
  calendar: StoreCalendar;
  update: (v: StoreCalendar) => void;
  restart: () => void;
}) {
  const [exception, setException] = useState<IsoDate | "">("");
  const addException = (kind: "open" | "closed") => {
    if (!exception) return;
    update(
      updateRules(
        calendar,
        kind === "open"
          ? {
              specialOpenDates: [...calendar.rules.specialOpenDates, exception],
            }
          : {
              specialClosedDates: [
                ...calendar.rules.specialClosedDates,
                exception,
              ],
            },
      ),
    );
    setException("");
  };
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
      <label>
        営業時間
        <input
          value={calendar.businessHours}
          onChange={(e) =>
            update({ ...calendar, businessHours: e.target.value })
          }
        />
      </label>
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
      <label>
        臨時営業・休業
        <input
          type="date"
          value={exception}
          onChange={(e) => setException(e.target.value as IsoDate)}
        />
      </label>
      <div className="exception-buttons">
        <button onClick={() => addException("open")}>臨時営業に追加</button>
        <button onClick={() => addException("closed")}>臨時休業に追加</button>
      </div>
      <button className="restart" onClick={restart}>
        質問形式で設定し直す
      </button>
    </div>
  );
}
const CalendarCard = forwardRef<
  HTMLDivElement,
  { calendar: StoreCalendar; month: Date; days: readonly CalendarDay[] }
>(({ calendar, month, days }, ref) => (
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
          key={day.date}
          className={`${day.isOpen ? "open" : "closed"} ${day.kind}`}
          title={day.reason}
        >
          <span>{day.day}</span>
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
      <strong>{calendar.businessHours}</strong>
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
  c.font = "26px sans-serif";
  c.fillStyle = "#29251f";
  c.fillText(calendar.businessHours, 540, 1010);
  const link = document.createElement("a");
  link.download = `business-calendar-${month.getFullYear()}-${month.getMonth() + 1}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
