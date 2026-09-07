import { posts } from "@/content/blog";
import { site } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const sorted = [...posts].sort((a, b) => (a.published < b.published ? 1 : -1));
  const items = sorted
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${site.domain}/blog/${p.slug}</link>
      <guid isPermaLink="true">${site.domain}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.published + "T09:00:00+05:30").toUTCString()}</pubDate>
      <category>${escapeXml(p.category)}</category>
      <description>${escapeXml(p.excerpt)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Terravion Journal</title>
    <link>${site.domain}/blog</link>
    <atom:link href="${site.domain}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Essays on land, corridors and villa-plot investment in Hyderabad West, from Terravion Properties.</description>
    <language>en-in</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
