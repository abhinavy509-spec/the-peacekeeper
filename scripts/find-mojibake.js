const fs = require("fs");
const path = require("path");

const srcDir = "C:/Users/Shivam/Documents/hostel-hisaab/src";

function hasMojibake(line) {
  // These multi-byte sequences appear when UTF-8 is double-encoded or
  // read back as Latin-1. We check for the literal byte patterns.
  const patterns = [
    "\u00C3\u00A2", // â
    "\u00C3\u00A9", // é
    "\u00C3\u00A8", // è
    "\u00C3\u00B6", // ö
    "\u00C3\u00BC", // ü
    "\u00C3\u00A4", // ä
    "\u00C3\u00AF", // ï
    "\u00C3\u00A7", // ç
    "\u00C3\u00B1", // ñ
    "\u00C2\u00A0", // nbsp
    "\u00C2\u00A9", // ©
    "\u00C2\u00AB", // «
    "\u00C2\u00BB", // »
  ];
  for (const p of patterns) {
    if (line.includes(p)) return true;
  }
  return false;
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|css)$/.test(entry.name)) {
      const text = fs.readFileSync(full, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (hasMojibake(line)) {
          console.log(
            path.relative(srcDir, full) + ":" + (i + 1) + ": " + line.trim().substring(0, 150),
          );
        }
      });
    }
  }
}

walk(srcDir);
console.log("\n--- Done ---");
