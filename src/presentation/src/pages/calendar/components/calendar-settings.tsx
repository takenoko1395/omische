import type { StoreCalendar } from "@omische/model";
import type { SubstituteClosureWarning } from "@omische/usecase";
import { ScheduleQuestion } from "./schedule-question";

/** 完成後の店舗情報、営業時間、見た目の設定を編集します。 */
export function CalendarSettings({
  calendar,
  update,
  restart,
  substituteWarnings,
}: {
  calendar: StoreCalendar;
  update: (value: StoreCalendar) => void;
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
          onChange={(event) =>
            update({ ...calendar, storeName: event.target.value })
          }
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
          onChange={(event) =>
            update({ ...calendar, note: event.target.value })
          }
        />
      </label>
      <label>
        デザイン
        <select
          value={calendar.theme}
          onChange={(event) =>
            update({
              ...calendar,
              theme: event.target.value as StoreCalendar["theme"],
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
          onChange={(event) =>
            update({ ...calendar, mainColor: event.target.value })
          }
        />
      </label>
      <button className="restart" onClick={restart}>
        質問形式で設定し直す
      </button>
    </div>
  );
}
