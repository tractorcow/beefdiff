import { readFile } from "fs/promises";
import type { Resolver, Package, Resolution } from "../types/index.js";

export class RubyGemfileResolver implements Resolver {
  canResolve(filename: string): boolean {
    return /(^|\/)Gemfile\.lock$/i.test(filename);
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    const lockfile = this.parseLockfile(content);

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    // Extract all gems from the GEM section
    // Gemfile.lock doesn't distinguish dev dependencies in the lockfile itself
    // (that's in the Gemfile), so we'll treat all as regular dependencies
    for (const gem of lockfile.gems) {
      dependencies.push({
        name: gem.name,
        version: gem.version,
      });
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private parseLockfile(content: string): {
    gems: Array<{ name: string; version: string }>;
  } {
    const gems: Array<{ name: string; version: string }> = [];
    const lines = content.split("\n");
    let inGemSection = false;
    let inSpecs = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if we're entering the GEM section
      if (trimmed === "GEM") {
        inGemSection = true;
        continue;
      }

      // Check if we're entering the specs subsection (can be indented)
      if (inGemSection && trimmed === "specs:") {
        inSpecs = true;
        continue;
      }

      // If we hit a new top-level section (not indented), stop parsing GEM
      if (
        inGemSection &&
        trimmed &&
        !line.startsWith(" ") &&
        !line.startsWith("\t")
      ) {
        if (trimmed !== "specs:") {
          break;
        }
      }

      // Parse gem entries in the specs section
      if (inGemSection && inSpecs) {
        // Gem entries have format: "    gemname (version)"
        // They are indented with spaces or tabs
        const gemMatch = line.match(/^\s+([^\s(]+)\s+\(([^)]+)\)/);
        if (gemMatch) {
          const name = gemMatch[1];
          const version = gemMatch[2];
          gems.push({ name, version });
        }
      }
    }

    return { gems };
  }
}
