import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const serverPath = path.resolve(root, "dist/server/server.js");
const clientDir = path.resolve(root, "dist/client");
const distDir = path.resolve(root, "dist");

async function generateStaticHtml() {
  console.log("Generating static index.html for Render Static Site...");
  try {
    const serverModule = await import(pathToFileURL(serverPath).href);
    const handler = serverModule.default;
    const response = await handler.fetch(new Request("http://localhost/"));
    const html = await response.text();

    // 1. Write to dist/client
    fs.writeFileSync(path.resolve(clientDir, "index.html"), html, "utf-8");
    fs.writeFileSync(path.resolve(clientDir, "200.html"), html, "utf-8");
    fs.writeFileSync(path.resolve(clientDir, "404.html"), html, "utf-8");
    console.log(`✅ Saved static index.html in dist/client/ (${html.length} bytes)`);

    // 2. Also copy everything from dist/client into dist/ so either publish dir works
    if (fs.existsSync(clientDir)) {
      fs.cpSync(clientDir, distDir, { recursive: true });
      console.log("✅ Synchronized client files into dist/ root for universal Render compatibility.");
    }

    console.log("🚀 Static build complete! Ready to deploy to Render Static Site.");
  } catch (err) {
    console.error("Failed to generate static html:", err);
    process.exit(1);
  }
}

generateStaticHtml();
