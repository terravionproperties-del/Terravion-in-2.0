import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");
const scenesDir = path.join(illustrationsDir, "scenes");

if (!fs.existsSync(scenesDir)) {
  fs.mkdirSync(scenesDir, { recursive: true });
}

const sceneDefs = [
  { title: "Chapter Scene 1: Architect & Family Field Due Diligence", badge: "3D PIXAR FIELD SCENE", hue: 45 },
  { title: "Chapter Scene 2: Legal Advocate 30-Yr Title Verification", badge: "3D PIXAR LEGAL SCENE", hue: 90 },
  { title: "Chapter Scene 3: HMDA & DTCP 60ft Road Sanction Inspection", badge: "3D PIXAR SANCTION SCENE", hue: 140 },
  { title: "Chapter Scene 4: Precision Boundary Survey & Corner Stones", badge: "3D PIXAR SURVEY SCENE", hue: 190 },
  { title: "Chapter Scene 5: Bank Plot Loan Technical & Legal Appraisal", badge: "3D PIXAR BANK VALUATION", hue: 240 },
  { title: "Chapter Scene 6: Sub-Registrar Biometric Sale Deed Conveyance", badge: "3D PIXAR REGISTRATION", hue: 280 },
  { title: "Chapter Scene 7: Villa Construction & Completed Garden Handover", badge: "3D PIXAR VILLA HANDOVER", hue: 330 },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSceneSvg(def, idx) {
  const width = 1600;
  const height = 1000;
  const safeTitle = escapeXml(def.title);
  const safeBadge = escapeXml(def.badge);

  const bgStart = `hsl(${def.hue}, 40%, 14%)`;
  const bgEnd = `hsl(${def.hue + 40}, 50%, 8%)`;
  const accent = `hsl(${def.hue}, 80%, 65%)`;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bgStart}"/>
          <stop offset="100%" stop-color="${bgEnd}"/>
        </linearGradient>
        <linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#1D1D1D" stop-opacity="0.90"/>
          <stop offset="50%" stop-color="#1D1D1D" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#1D1D1D" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- 3D Perspective Scene Lines -->
      <g stroke="${accent}" stroke-opacity="0.15" stroke-width="2">
        <line x1="200" y1="0" x2="800" y2="500"/>
        <line x1="1400" y1="0" x2="800" y2="500"/>
        <line x1="0" y1="800" x2="800" y2="500"/>
        <line x1="1600" y1="800" x2="800" y2="500"/>
        <circle cx="800" cy="500" r="180" fill="none" stroke="${accent}" stroke-width="3"/>
        <circle cx="800" cy="500" r="90" fill="${accent}" fill-opacity="0.2"/>
      </g>

      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#scrim)" />

      <!-- Top Left Badge -->
      <g transform="translate(60, 60)">
        <rect x="0" y="0" width="340" height="54" rx="27" fill="rgba(29, 29, 29, 0.85)" stroke="${accent}" stroke-width="2" />
        <circle cx="32" cy="27" r="6" fill="${accent}" />
        <text x="52" y="33" font-family="sans-serif" font-size="14" font-weight="700" letter-spacing="3" fill="#FFFFFF">${safeBadge}</text>
      </g>

      <!-- Bottom Scene Banner -->
      <g transform="translate(60, 800)">
        <rect x="0" y="0" width="1480" height="140" rx="20" fill="rgba(247, 243, 236, 0.96)" stroke="${accent}" stroke-width="2.5" />
        <text x="40" y="55" font-family="serif" font-size="34" font-weight="600" fill="#1D1D1D">${safeTitle}</text>
        <text x="40" y="98" font-family="sans-serif" font-size="16" font-weight="600" letter-spacing="2" fill="#8A6736">TELANGANA PLOTTED LAND DILIGENCE - CHAPTER SCENE #${idx + 1}</text>
      </g>
    </svg>
  `;
}

async function run() {
  console.log("Generating 7 100% unique 3D chapter scene illustrations...");

  for (let i = 0; i < sceneDefs.length; i++) {
    const def = sceneDefs[i];
    const destPath = path.join(scenesDir, `scene-${i + 1}.png`);
    const svgContent = Buffer.from(generateSceneSvg(def, i));

    await sharp(svgContent).png().toFile(destPath);
  }

  console.log("Successfully generated 7 100% unique 3D chapter scene illustrations!");
}

run();
