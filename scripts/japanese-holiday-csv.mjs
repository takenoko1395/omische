const HEADER = "国民の祝日・休日月日,国民の祝日・休日名称";

const pad = (value) => String(value).padStart(2, "0");

const normalizeDate = (value, lineNumber) => {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value);
  if (match === null)
    throw new Error(`${lineNumber}行目の日付形式が不正です: ${value}`);

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  )
    throw new Error(`${lineNumber}行目の日付が不正です: ${value}`);

  return `${yearText}-${pad(month)}-${pad(day)}`;
};

/** CP932の内閣府祝日CSVを検証し、日付順のデータへ変換します。 */
export function parseJapaneseHolidayCsv(bytes) {
  const text = new TextDecoder("shift_jis", { fatal: true }).decode(bytes);
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  if (lines[0] !== HEADER)
    throw new Error(`CSVヘッダーが想定と異なります: ${lines[0] ?? ""}`);

  const holidays = new Map();
  for (const [index, line] of lines.slice(1).entries()) {
    const lineNumber = index + 2;
    const columns = line.split(",");
    if (columns.length !== 2)
      throw new Error(`${lineNumber}行目の列数が不正です。`);
    const [dateText = "", name = ""] = columns;
    if (name.trim() === "")
      throw new Error(`${lineNumber}行目の祝日名が空です。`);
    const date = normalizeDate(dateText, lineNumber);
    if (holidays.has(date))
      throw new Error(`${lineNumber}行目の日付が重複しています: ${date}`);
    holidays.set(date, name);
  }
  if (holidays.size === 0) throw new Error("祝日データがありません。");

  const sortedEntries = [...holidays].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const years = [
    ...new Set(sortedEntries.map(([date]) => Number(date.slice(0, 4)))),
  ];
  return { holidays: Object.fromEntries(sortedEntries), years };
}
