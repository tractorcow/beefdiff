import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getVersion(): string {
  try {
    // Try multiple possible locations for package.json
    const possiblePaths = [
      join(__dirname, "..", "..", "package.json"), // Development
      join(__dirname, "..", "..", "..", "package.json"), // Built package
      join(process.cwd(), "package.json"), // Current directory
    ];

    for (const packageJsonPath of possiblePaths) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        if (packageJson.version) {
          return packageJson.version;
        }
      } catch {
        // Try next path
      }
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}
