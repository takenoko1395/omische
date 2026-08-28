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
  const exportRef = useRef<HTMLDivElement>(null);
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
    setExceptionStart("");
    setExceptionEnd("");
  };
  const download = () =>
    void exportPng(exportRef.current, calendar, month, days);
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
  const holidayPolicy = getHolidayPolicy(calendar);
  const lastStep = holidayPolicy === "open" ? 5 : 4;
  const totalSteps = lastStep + 1;
  const next = () => (step === lastStep ? finish() : setStep(step + 1));
  return (
    <div className="wizard">
      <p className="eyebrow">
        はじめの設定 · {step + 1} / {totalSteps}
      </p>
      <div className="progress">
        <i style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>
      {step === 0 && (
        <>
          <h1>お店の営業日カレンダーを、かんたんに。</h1>
          <p>
            Omischeは、個人経営や小規模店舗向けの営業日カレンダー作成サービスです。定休日や第N曜日、祝日の営業・休業ルールから毎月の営業日と休業日を自動計算し、完成したカレンダーを画像として保存してInstagramなどSNSでの営業案内にも使えます。
          </p>
          <label className="store-name-field">
            お店のお名前
            <input
              autoFocus
              value={calendar.storeName}
              onChange={(e) =>
                update({ ...calendar, storeName: e.target.value })
              }
            />
          </label>
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
          <h1>祝日はどのように営業しますか？</h1>
          <p>祝日といつもの営業日・定休日が重なったときの扱いです。</p>
          <Choice
            selected={holidayPolicy}
            options={[
              ["usual", "いつもの曜日どおり"],
              ["open", "祝日は営業する"],
              ["closed", "祝日はお休みする"],
            ]}
            descriptions={{
              usual: "営業日なら営業し、定休日ならお休みします。",
              open: "定休日と重なっても、祝日は営業します。",
              closed: "営業日と重なっても、祝日はお休みします。",
            }}
            onChange={(value) =>
              update(updateHolidayPolicy(calendar, value as HolidayPolicy))
            }
          />
        </>
      )}
      {step === 5 && holidayPolicy === "open" && (
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
  descriptions,
  onChange,
}: {
  selected: string;
  options: readonly (readonly [string, string])[];
  descriptions?: Readonly<Record<string, string>>;
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
          <span className="choice-copy">
            <strong>{label}</strong>
            {descriptions?.[value] && <small>{descriptions[value]}</small>}
          </span>
        </button>
      ))}
    </div>
  );
}
type HolidayPolicy = "usual" | "open" | "closed";
function getHolidayPolicy(calendar: StoreCalendar): HolidayPolicy {
  if (calendar.rules.holidays === "closed") return "closed";
  return calendar.rules.regularClosureOnHoliday === "open" ? "open" : "usual";
}
function updateHolidayPolicy(
  calendar: StoreCalendar,
  policy: HolidayPolicy,
): StoreCalendar {
  return updateRules(calendar, {
    holidays: policy === "closed" ? "closed" : "open",
    regularClosureOnHoliday: policy === "open" ? "open" : "closed",
  });
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
    onDateSelect?: ((date: IsoDate) => void) | undefined;
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
const IMAGE_SIZE = 1080;
const HOLIDAY_COLOR = "#c43d3d";
const DEFAULT_BODY_FONT = '"Noto Sans JP", sans-serif';
const DEFAULT_HEADING_FONT = '"Shippori Mincho", serif';

export async function exportPng(
  source: HTMLDivElement | null,
  calendar: StoreCalendar,
  month: Date,
  days: readonly CalendarDay[],
) {
  const bodyFont = source
    ? getComputedStyle(source).fontFamily
    : DEFAULT_BODY_FONT;
  const heading = source?.querySelector<HTMLElement>(".card-heading h2");
  const headingFont = heading
    ? getComputedStyle(heading).fontFamily
    : DEFAULT_HEADING_FONT;
  await loadCalendarFonts(bodyFont, headingFont);

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const c = canvas.getContext("2d");
  if (!c) return;

  const background =
    calendar.theme === "minimal"
      ? "#ffffff"
      : calendar.theme === "japanese"
        ? "#f8f4eb"
        : "#fbf8f1";
  c.fillStyle = background;
  c.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  if (calendar.theme === "japanese") {
    c.strokeStyle = "#3f4439";
    c.lineWidth = 4;
    c.strokeRect(10, 10, IMAGE_SIZE - 20, IMAGE_SIZE - 20);
    c.lineWidth = 2;
    c.strokeRect(20, 20, IMAGE_SIZE - 40, IMAGE_SIZE - 40);
  }

  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = calendar.mainColor;
  c.font = `500 15px ${bodyFont}`;
  drawSpacedText(c, "BUSINESS CALENDAR", IMAGE_SIZE / 2, 65, 4);
  c.fillStyle = "#29251f";
  c.textAlign = "center";
  setFittedFont(c, calendar.storeName, 58, 600, headingFont, 720);
  c.fillText(calendar.storeName, IMAGE_SIZE / 2, 132);
  c.textAlign = "right";
  c.font = `400 21px ${bodyFont}`;
  c.fillText(
    `${month.getFullYear()} / ${String(month.getMonth() + 1).padStart(2, "0")}`,
    1015,
    190,
  );
  c.strokeStyle = "#d8d1c5";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(65, 218);
  c.lineTo(1015, 218);
  c.stroke();

  const gridLeft = 65;
  const gridRight = 1015;
  const gridTop = 285;
  const gridBottom = 850;
  const columnWidth = (gridRight - gridLeft) / 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const rowCount = Math.ceil((start + days.length) / 7);
  const rowHeight = (gridBottom - gridTop) / rowCount;
  WEEKDAYS.forEach((w, i) => {
    c.textAlign = "center";
    c.fillStyle = "#857b6e";
    c.font = `600 18px ${bodyFont}`;
    c.fillText(w, gridLeft + columnWidth * (i + 0.5), 252);
  });

  days.forEach((d) => {
    const cell = start + d.day - 1;
    const column = cell % 7;
    const row = Math.floor(cell / 7);
    const x = gridLeft + column * columnWidth + 6;
    const y = gridTop + row * rowHeight + 4;
    const width = columnWidth - 12;
    const height = rowHeight - 8;
    if (!d.isOpen) {
      c.fillStyle = mixWithWhite(calendar.mainColor, 0.12);
      roundedRect(c, x, y, width, height, 16);
      c.fill();
    }
    if (d.kind === "special-open") {
      c.strokeStyle = calendar.mainColor;
      c.lineWidth = 3;
      roundedRect(c, x, y, width, height, 16);
      c.stroke();
    }

    const labels = [
      ...(d.isHoliday && d.holidayName ? [d.holidayName] : []),
      ...(!d.isOpen ? ["休"] : []),
      ...(d.kind === "special-open" ? ["営"] : []),
    ];
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const dayY = labels.length === 0 ? centerY : centerY - 18;
    c.textAlign = "center";
    c.fillStyle = d.isHoliday
      ? HOLIDAY_COLOR
      : d.isOpen
        ? "#29251f"
        : calendar.mainColor;
    c.font = `600 30px ${bodyFont}`;
    c.fillText(String(d.day), centerX, dayY);
    labels.forEach((label, index) => {
      c.fillStyle =
        d.isHoliday && index === 0 ? HOLIDAY_COLOR : calendar.mainColor;
      setFittedFont(c, label, 14, 500, bodyFont, width - 10);
      c.fillText(label, centerX, dayY + 25 + index * 18);
    });
  });

  drawLegend(c, calendar.mainColor, bodyFont, 895);
  c.strokeStyle = "#d8d1c5";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(65, 930);
  c.lineTo(1015, 930);
  c.stroke();
  c.textBaseline = "top";
  c.textAlign = "left";
  c.fillStyle = "#776f65";
  const weekdayHours = `平日 ${formatBusinessHours(calendar.businessHours.weekday)}`;
  const weekendHours = `土日祝 ${formatBusinessHours(calendar.businessHours.weekendHoliday)}`;
  setFittedFont(c, weekdayHours, 16, 600, bodyFont, 480);
  c.fillText(weekdayHours, 65, 960);
  setFittedFont(c, weekendHours, 16, 600, bodyFont, 480);
  c.fillText(weekendHours, 65, 990);
  c.textAlign = "right";
  c.font = `400 16px ${bodyFont}`;
  drawRightAlignedLines(c, calendar.note, 1015, 960, 420, 24);

  const link = document.createElement("a");
  link.download = `business-calendar-${month.getFullYear()}-${month.getMonth() + 1}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function loadCalendarFonts(bodyFont: string, headingFont: string) {
  if (document.fonts === undefined) return;
  await Promise.allSettled([
    document.fonts.load(`600 30px ${bodyFont}`),
    document.fonts.load(`600 58px ${headingFont}`),
  ]);
  await document.fonts.ready;
}

function setFittedFont(
  c: CanvasRenderingContext2D,
  text: string,
  initialSize: number,
  weight: number,
  family: string,
  maxWidth: number,
) {
  let size = initialSize;
  c.font = `${weight} ${size}px ${family}`;
  while (size > 10 && c.measureText(text).width > maxWidth) {
    size -= 1;
    c.font = `${weight} ${size}px ${family}`;
  }
}

function drawSpacedText(
  c: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number,
) {
  const widths = [...text].map((character) => c.measureText(character).width);
  const totalWidth =
    widths.reduce((total, width) => total + width, 0) +
    spacing * (widths.length - 1);
  let x = centerX - totalWidth / 2;
  c.textAlign = "left";
  [...text].forEach((character, index) => {
    c.fillText(character, x, y);
    x += (widths[index] ?? 0) + spacing;
  });
}

function roundedRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  c.beginPath();
  c.roundRect(x, y, width, height, radius);
}

function mixWithWhite(color: string, ratio: number) {
  const normalized = color.replace("#", "");
  const expanded =
    normalized.length === 3
      ? [...normalized].map((value) => `${value}${value}`).join("")
      : normalized;
  const value = Number.parseInt(expanded, 16);
  if (expanded.length !== 6 || Number.isNaN(value)) return "#f4ebe7";
  const channel = (shift: number) =>
    Math.round(255 + (((value >> shift) & 0xff) - 255) * ratio);
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function drawLegend(
  c: CanvasRenderingContext2D,
  accent: string,
  font: string,
  y: number,
) {
  const items = [
    { label: "営業日", fill: "#aaaaaa", stroke: "#aaaaaa" },
    { label: "休業日", fill: accent, stroke: accent },
    { label: "臨時変更", fill: "#ffffff", stroke: accent },
  ];
  c.font = `400 14px ${font}`;
  const widths = items.map((item) => 16 + c.measureText(item.label).width);
  const gap = 28;
  const totalWidth =
    widths.reduce((total, width) => total + width, 0) + gap * 2;
  let x = (IMAGE_SIZE - totalWidth) / 2;
  c.textAlign = "left";
  c.textBaseline = "middle";
  for (const [index, item] of items.entries()) {
    c.beginPath();
    c.arc(x + 5, y, 5, 0, Math.PI * 2);
    c.fillStyle = item.fill;
    c.fill();
    c.strokeStyle = item.stroke;
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = "#776f65";
    c.fillText(item.label, x + 16, y);
    x += (widths[index] ?? 0) + gap;
  }
}

function drawRightAlignedLines(
  c: CanvasRenderingContext2D,
  text: string,
  right: number,
  top: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines: string[] = [];
  let current = "";
  for (const character of text) {
    const candidate = `${current}${character}`;
    if (current && c.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  lines
    .slice(0, 3)
    .forEach((line, index) =>
      c.fillText(line, right, top + index * lineHeight),
    );
}
function formatBusinessHours(hours: BusinessHours) {
  const base = `${hours.open}–${hours.close}`;
  return hours.breakTime
    ? `${base}（休 ${hours.breakTime.start}–${hours.breakTime.end}）`
    : base;
}
