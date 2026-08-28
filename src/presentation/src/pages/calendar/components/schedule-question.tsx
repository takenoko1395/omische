import type { BusinessHours } from "@omische/model";

/** 営業時間と任意の中休憩を入力します。 */
export function ScheduleQuestion({
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
