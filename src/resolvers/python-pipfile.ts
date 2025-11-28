import { readFile } from "fs/promises";
import type {
  Package,
  Resolution,
  Resolver,
  PipfileLock,
} from "../types/index.js";
import { parseJson } from "./loader-utils.js";

export class PythonPipfileResolver implements Resolver {
  canResolve(filename: string): boolean {
    return /(^|\/)Pipfile\.lock$/i.test(filename);
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    return this.parseContent(content);
  }

  private parseContent(content: string): Resolution {
    const lockfile = this.parseLockfile(content);

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    // Extract from default section (dependencies)
    if (lockfile.default) {
      for (const [name, pkg] of Object.entries(lockfile.default)) {
        if (pkg && typeof pkg === "object" && "version" in pkg) {
          // Version format in Pipfile.lock is like "==1.0.0"
          const version = this.extractVersionFromPipfile(pkg.version);
          if (version) {
            dependencies.push({ name, version });
          }
        }
      }
    }

    // Extract from develop section (devDependencies)
    if (lockfile.develop) {
      for (const [name, pkg] of Object.entries(lockfile.develop)) {
        if (pkg && typeof pkg === "object" && "version" in pkg) {
          const version = this.extractVersionFromPipfile(pkg.version);
          if (version) {
            devDependencies.push({ name, version });
          }
        }
      }
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private parseLockfile(content: string): PipfileLock {
    try {
      return parseJson(content) as PipfileLock;
    } catch (error) {
      throw new Error(
        `Failed to parse Pipfile.lock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private extractVersionFromPipfile(version: unknown): string | null {
    if (typeof version !== "string") {
      return null;
    }

    // Pipfile.lock version format is like "==1.0.0" or ">=1.0.0,<2.0.0"
    // Extract the first version number
    const versionMatch = version.match(/(\d+\.\d+\.\d+[^\s,]*)/);
    if (versionMatch) {
      return versionMatch[1];
    }

    // Try to match any version-like string
    const fallbackMatch = version.match(
      /(\d+\.\d+(?:\.\d+)?(?:[a-zA-Z0-9.-]*)?)/
    );
    if (fallbackMatch) {
      return fallbackMatch[1];
    }

    return null;
  }
}
