import fs from "fs";
import path from "path";

const blogDir = path.join(process.cwd(), "content", "blog");
const guidesDir = path.join(process.cwd(), "content", "guides");

function cleanDirectory(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");

  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf8");

    // Remove any injected markdown image tags like ![Visual Story Scene...](/illustrations/...)
    content = content.replace(/\n*!\[Visual Story Scene[^\]]*\]\([^)]+\)/g, "");

    fs.writeFileSync(filePath, content, "utf8");
  }
}

cleanDirectory(blogDir);
cleanDirectory(guidesDir);
console.log("Successfully cleaned all body markdown files of raw image tags!");
