const xmlEscape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export function siteUrlFrom(value: string | undefined): URL | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("SITE_URLにはhttpまたはhttpsのURLを指定してください。");
  url.search = "";
  url.hash = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

export function absoluteUrlFrom(
  value: string | undefined,
  siteUrl: URL | undefined,
): string | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  if (siteUrl === undefined && value.startsWith("/"))
    throw new Error("相対OG_IMAGE_URLを使う場合はSITE_URLも指定してください。");
  return new URL(value, siteUrl).toString();
}

export function robotsText(siteUrl: URL | undefined): string {
  const lines = ["User-agent: *", "Allow: /"];
  if (siteUrl !== undefined) {
    lines.push("", `Sitemap: ${new URL("sitemap.xml", siteUrl)}`);
  }
  return `${lines.join("\n")}\n`;
}

export function sitemapXml(
  siteUrl: URL,
  paths: readonly string[] = [""],
): string {
  const urls = paths
    .map(
      (path) =>
        `  <url>\n    <loc>${xmlEscape(new URL(path, siteUrl).toString())}</loc>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
