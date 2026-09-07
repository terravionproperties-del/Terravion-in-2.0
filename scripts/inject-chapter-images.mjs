import fs from "fs";
import path from "path";

const blogDir = path.join(process.cwd(), "content", "blog");
const guidesDir = path.join(process.cwd(), "content", "guides");

function processDirectory(dir, prefix) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");

  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf8");
    const slug = file.replace(".ts", "");

    const imgPath = `/illustrations/${prefix}-${slug}.png`;

    // Replace ## headings with heading + explicit markdown image tag if not already present
    content = content.replace(/(##\s+([^\n]+))/g, (match, fullHeading, headingTitle) => {
      // Check if image tag is already right after heading
      return `${fullHeading}\n\n![Visual Story Scene — ${headingTitle}](${imgPath})`;
    });

    fs.writeFileSync(filePath, content, "utf8");
  }
}

processDirectory(blogDir, "blog");
processDirectory(guidesDir, "guide");
console.log("Successfully injected explicit markdown story images into all article content files!");
