// Ping IndexNow (Bing, Copilot, Yandex, Seznam, Naver) to immediately index all critical URLs
import https from "node:https";

const KEY = "e5b6d91f2c4a4a8ba920f789e9f906b3";
const HOST = "terravionproperties.in";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/projects`,
  `https://${HOST}/projects/sanctuary`,
  `https://${HOST}/projects/raghunath-county`,
  `https://${HOST}/projects/mansanpally`,
  `https://${HOST}/locations/shankarpally`,
  `https://${HOST}/locations/mokila`,
  `https://${HOST}/locations/kokapet`,
  `https://${HOST}/locations/tellapur`,
  `https://${HOST}/investment`,
  `https://${HOST}/guides`,
  `https://${HOST}/guides/hmda-guide`,
  `https://${HOST}/guides/legal-verification`,
  `https://${HOST}/guides/investment-checklist`,
  `https://${HOST}/blog`,
  `https://${HOST}/blog/why-invest-in-shankarpally`,
  `https://${HOST}/contact`,
  `https://${HOST}/site-visit`,
  `https://${HOST}/gis`,
  `https://${HOST}/te`,
  `https://${HOST}/te/projects/sanctuary`,
  `https://${HOST}/te/projects/raghunath-county`,
  `https://${HOST}/hi`,
  `https://${HOST}/hi/projects/sanctuary`,
  `https://${HOST}/hi/projects/raghunath-county`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`,
];

const payload = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: URLS,
});

const endpoints = [
  "api.indexnow.org",
  "www.bing.com",
];

for (const endpoint of endpoints) {
  const req = https.request(
    {
      hostname: endpoint,
      path: "/indexnow",
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(payload),
      },
    },
    (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        console.log(`[IndexNow] ${endpoint} response: ${res.statusCode} ${res.statusMessage}`);
        if (body) console.log(`[IndexNow] body:`, body);
      });
    }
  );

  req.on("error", (e) => {
    console.error(`[IndexNow] Error pinging ${endpoint}:`, e.message);
  });

  req.write(payload);
  req.end();
}
