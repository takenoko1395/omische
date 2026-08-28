import type { StoreCalendar, Weekday } from "@omische/model";
import { WEEKDAYS } from "../calendar-format";
import { ScheduleQuestion } from "./schedule-question";

const updateRules = (
  calendar: StoreCalendar,
  changes: Partial<StoreCalendar["rules"]>,
): StoreCalendar => ({ ...calendar, rules: { ...calendar.rules, ...changes } });

/** 初期設定を順番に案内し、変更後の店舗カレンダーを通知します。 */
export function CalendarWizard({
  calendar,
  update,
  step,
  setStep,
  finish,
}: {
  calendar: StoreCalendar;
  update: (value: StoreCalendar) => void;
  step: number;
  setStep: (value: number) => void;
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
              onChange={(event) =>
                update({ ...calendar, storeName: event.target.value })
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
                    ? calendar.rules.weeklyClosures.filter(
                        (value) => value !== day,
                      )
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
            onChange={(value) =>
              update(
                updateRules(calendar, {
                  substituteClosure: value as "none" | "next-day",
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

function Choice({
  selected,
  options,
  descriptions,
  onChange,
}: {
  selected: string;
  options: readonly (readonly [string, string])[];
  descriptions?: Readonly<Record<string, string>>;
  onChange: (value: string) => void;
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
