import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseJapaneseHolidayCsv } from "./japanese-holiday-csv.mjs";

const sourcePath = resolve("resources/syukujitsu.csv");
const outputPath = resolve(
  "src/gateway/browser-calendar/src/data/japanese-holidays.json",
);
const generated = `${JSON.stringify(
  parseJapaneseHolidayCsv(await readFile(sourcePath)),
  null,
  2,
)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== generated)
    throw new Error(
      "生成済み祝日データがCSVと一致しません。npm run generate:holidaysを実行してください。",
    );
  console.log("Generated holiday data is up to date.");
} else {
  await writeFile(outputPath, generated, "utf8");
  console.log(`Generated ${outputPath}`);
}
