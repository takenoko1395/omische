import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  absoluteUrlFrom,
  robotsText,
  sitemapXml,
  siteUrlFrom,
} from "./scripts/seo-metadata.ts";

const seoAssets = (): Plugin => {
  const siteUrl = siteUrlFrom(process.env.SITE_URL);
  const ogImageUrl = absoluteUrlFrom(process.env.OG_IMAGE_URL, siteUrl);
  return {
    name: "omische-seo-assets",
    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [
        {
          tag: "meta",
          attrs: {
            name: "twitter:card",
            content:
              ogImageUrl === undefined ? "summary" : "summary_large_image",
          },
          injectTo: "head",
        },
      ];
      if (siteUrl !== undefined) {
        tags.push(
          {
            tag: "link",
            attrs: { rel: "canonical", href: siteUrl.toString() },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { property: "og:url", content: siteUrl.toString() },
            injectTo: "head",
          },
        );
      }
      if (ogImageUrl !== undefined) {
        tags.push(
          {
            tag: "meta",
            attrs: { property: "og:image", content: ogImageUrl },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { name: "twitter:image", content: ogImageUrl },
            injectTo: "head",
          },
        );
      }
      return tags;
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: robotsText(siteUrl),
      });
      if (siteUrl !== undefined) {
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: sitemapXml(siteUrl),
        });
      }
    },
  };
};

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), seoAssets()],
});
