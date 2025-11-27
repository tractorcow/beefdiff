import { readFile } from "fs/promises";
import type { Resolver, Package, Resolution } from "../types/index.js";

export class PythonResolver implements Resolver {
  canResolve(filename: string): boolean {
    // Match requirements*.txt pattern (e.g., requirements.txt, requirements-dev.txt)
    const basename = filename.split("/").pop() || filename;
    return /^requirements.*\.txt$/.test(basename);
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Skip includes (-r, --requirement)
      if (trimmed.startsWith("-r ") || trimmed.startsWith("--requirement ")) {
        continue;
      }

      // Skip editable installs (-e, --editable)
      if (trimmed.startsWith("-e ") || trimmed.startsWith("--editable ")) {
        continue;
      }

      // Parse package line
      const packageInfo = this.parsePackageLine(trimmed);
      if (packageInfo) {
        // requirements.txt doesn't have a standard devDependencies concept,
        // but some projects use requirements-dev.txt or similar patterns
        // For now, we'll put everything in dependencies
        dependencies.push(packageInfo);
      }
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private parsePackageLine(line: string): Package | null {
    // Remove inline comments
    const commentIndex = line.indexOf("#");
    const cleanLine =
      commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line.trim();

    if (!cleanLine) {
      return null;
    }

    // Handle URL-based installs: package @ https://...
    const urlMatch = cleanLine.match(/^(.+?)\s*@\s*(https?|git\+|file\+)/);
    if (urlMatch) {
      // For now, we'll skip URL-based installs as they don't have clear versions
      return null;
    }

    // Handle package with extras: package[extra]==1.0.0
    const extrasMatch = cleanLine.match(/^(.+?)\[.+\]\s*(.+)$/);
    if (extrasMatch) {
      const packageName = extrasMatch[1].trim();
      const versionSpec = extrasMatch[2].trim();
      const version = this.extractVersion(versionSpec);
      if (version && packageName) {
        return { name: packageName, version };
      }
    }

    // Handle standard package specifiers: package==1.0.0, package>=1.0.0, etc.
    // Split on version specifiers: ==, >=, <=, >, <, ~=, !=
    const versionMatch = cleanLine.match(
      /^(.+?)\s*(==|>=|<=|>|<|~=|!=)\s*(.+)$/
    );
    if (versionMatch) {
      const packageName = versionMatch[1].trim();
      const operator = versionMatch[2];
      const versionSpec = versionMatch[3].trim();

      // For exact version (==), use it directly
      if (operator === "==") {
        // Handle multiple == (e.g., package==1.0.0==1.0.0 is invalid, but handle gracefully)
        const version = versionSpec.split("==")[0].trim();
        if (version && packageName) {
          return { name: packageName, version };
        }
      } else {
        // For other operators, try to extract a version
        // This is not ideal since it's not a lockfile, but we'll do our best
        const version = this.extractVersion(versionSpec);
        if (version && packageName) {
          return { name: packageName, version };
        }
      }
    } else {
      // No version specifier - just package name
      // This is valid in requirements.txt but we can't compare versions
      // Skip it for now
      return null;
    }

    return null;
  }

  private extractVersion(versionSpec: string): string | null {
    // Remove whitespace
    const cleaned = versionSpec.trim();

    // Handle version ranges: >=1.0.0,<2.0.0
    // For now, take the first version we find
    const firstVersionMatch = cleaned.match(/(\d+\.\d+\.\d+[^\s,]*)/);
    if (firstVersionMatch) {
      return firstVersionMatch[1];
    }

    // Try to match any version-like string
    const versionMatch = cleaned.match(
      /(\d+\.\d+(?:\.\d+)?(?:[a-zA-Z0-9.-]*)?)/
    );
    if (versionMatch) {
      return versionMatch[1];
    }

    return null;
  }
}
