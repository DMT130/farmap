import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../dist-electron");

mkdirSync(outDir, { recursive: true });
copyFileSync(resolve(__dirname, "../electron/main.js"), resolve(outDir, "main.js"));
copyFileSync(resolve(__dirname, "../electron/preload.js"), resolve(outDir, "preload.js"));
console.log("✅ Electron files copied to dist-electron/");
