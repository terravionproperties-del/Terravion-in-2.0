import fs from "fs";
import path from "path";

const localesDir = path.join(process.cwd(), "locales");
const languages = ["en", "hi", "te"];

for (const lang of languages) {
  const dirPath = path.join(localesDir, lang);
  if (!fs.existsSync(dirPath)) continue;

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      JSON.parse(content);
    } catch (err) {
      console.error(`INVALID JSON IN: ${filePath}`);
      console.error(err.message);
    }
  }
}

console.log("JSON Validation Complete!");
