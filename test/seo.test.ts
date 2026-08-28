import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  robotsText,
  sitemapXml,
  siteUrlFrom,
} from "../scripts/seo-metadata.ts";

describe("トップページSEO", () => {
  it("JavaScript実行前のHTMLにtitle、description、H1、サービス説明がある", async () => {
    const html = await readFile(resolve("index.html"), "utf8");

    expect(html).toContain(
      "<title>営業日カレンダーをかんたん自動作成 | Omische</title>",
    );
    expect(html).toMatch(/<meta\s+name="description"/);
    expect(html).toContain("<h1>お店の営業日カレンダーを、かんたんに。</h1>");
    expect(html).toContain("営業日と休業日を自動計算");
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:type"');
  });

  it("公開URLからrobotsとトップページを含むsitemapを生成する", () => {
    const siteUrl = siteUrlFrom("https://example.com/omische");
    expect(siteUrl).toBeDefined();
    if (siteUrl === undefined) return;

    expect(robotsText(siteUrl)).toContain(
      "Sitemap: https://example.com/omische/sitemap.xml",
    );
    expect(sitemapXml(siteUrl)).toContain(
      "<loc>https://example.com/omische/</loc>",
    );
  });
});
