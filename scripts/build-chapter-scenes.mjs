import fs from "fs";
import path from "path";
import sharp from "sharp";

const illustrationsDir = path.join(process.cwd(), "public", "illustrations");
const scenesDir = path.join(illustrationsDir, "scenes");

if (!fs.existsSync(scenesDir)) {
  fs.mkdirSync(scenesDir, { recursive: true });
}

const baseRenders = [
  "guide-01.png",
  "guide-02.png",
  "guide-03.png",
  "guide-04.png",
  "journal-01.png",
  "journal-02.png",
  "journal-03.png",
];

const sceneThemes = [
  { title: "Chapter Scene 1: Architect And Family Field Due Diligence", badge: "3D PIXAR FIELD SCENE", gold: "#C9A96A" },
  { title: "Chapter Scene 2: Legal Advocate 30-Yr Title Verification", badge: "3D PIXAR LEGAL SCENE", gold: "#B88A44" },
  { title: "Chapter Scene 3: HMDA And DTCP 60ft Road Sanction Inspection", badge: "3D PIXAR SANCTION SCENE", gold: "#D4AF37" },
  { title: "Chapter Scene 4: Precision Boundary Survey And Corner Stones", badge: "3D PIXAR SURVEY SCENE", gold: "#9EAB86" },
  { title: "Chapter Scene 5: Bank Plot Loan Technical And Legal Appraisal", badge: "3D PIXAR BANK VALUATION", gold: "#C9A96A" },
  { title: "Chapter Scene 6: Sub-Registrar Biometric Sale Deed Conveyance", badge: "3D PIXAR REGISTRATION", gold: "#B88A44" },
  { title: "Chapter Scene 7: Villa Construction And Completed Garden Handover", badge: "3D PIXAR VILLA HANDOVER", gold: "#D4AF37" },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createSceneOverlaySvg(theme, idx) {
  const width = 1600;
  const height = 1000;
  const safeTitle = escapeXml(theme.title);
  const safeBadge = escapeXml(theme.badge);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#1D1D1D" stop-opacity="0.88"/>
          <stop offset="50%" stop-color="#1D1D1D" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#1D1D1D" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#scrim)" />

      <!-- Top Left Scene Badge -->
      <g transform="translate(60, 60)">
        <rect x="0" y="0" width="320" height="54" rx="27" fill="rgba(29, 29, 29, 0.85)" stroke="${theme.gold}" stroke-width="2" />
        <circle cx="32" cy="27" r="6" fill="${theme.gold}" />
        <text x="50" y="33" font-family="sans-serif" font-size="14" font-weight="700" letter-spacing="3" fill="#FFFFFF">${safeBadge}</text>
      </g>

      <!-- Bottom Scene Banner -->
      <g transform="translate(60, 800)">
        <rect x="0" y="0" width="1480" height="140" rx="20" fill="rgba(247, 243, 236, 0.95)" stroke="${theme.gold}" stroke-width="2" />
        <text x="40" y="55" font-family="serif" font-size="34" font-weight="600" fill="#1D1D1D">${safeTitle}</text>
        <text x="40" y="98" font-family="sans-serif" font-size="16" font-weight="600" letter-spacing="2" fill="#8A6736">TELANGANA PLOTTED LAND DILIGENCE - SCENE #${idx + 1}</text>
      </g>
    </svg>
  `;
}

async function run() {
  console.log("Generating 7 dedicated 3D Pixar chapter scene illustrations...");

  for (let i = 0; i < sceneThemes.length; i++) {
    const theme = sceneThemes[i];
    const seed = baseRenders[i % baseRenders.length];
    const srcPath = path.join(illustrationsDir, seed);
    const destPath = path.join(scenesDir, `scene-${i + 1}.png`);

    const svgOverlay = Buffer.from(createSceneOverlaySvg(theme, i));

    await sharp(srcPath)
      .resize(1600, 1000, { fit: "cover" })
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .toFile(destPath);
  }

  console.log("Successfully created 7 distinct chapter scene illustrations in public/illustrations/scenes/!");
}

run();
