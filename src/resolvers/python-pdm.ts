import { readFile } from "fs/promises";
import type { Package, Resolution, Resolver, PdmLock } from "../types/index.js";
import { parseJson } from "./loader-utils.js";

export class PythonPdmResolver implements Resolver {
  canResolve(filename: string): boolean {
    return /(^|\/)pdm\.lock$/i.test(filename);
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    return this.parseContent(content);
  }

  private parseContent(content: string): Resolution {
    const lockfile = this.parseLockfile(content);

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    if (lockfile.package && Array.isArray(lockfile.package)) {
      for (const pkg of lockfile.package) {
        if (
          pkg &&
          typeof pkg === "object" &&
          "name" in pkg &&
          "version" in pkg
        ) {
          const packageInfo: Package = {
            name: String(pkg.name),
            version: String(pkg.version),
          };

          // Check if it's a dev dependency
          // In pdm.lock, dev dependencies are in groups array
          const isDev =
            ("groups" in pkg &&
              Array.isArray(pkg.groups) &&
              pkg.groups.includes("dev")) ||
            ("dev" in pkg && pkg.dev === true);

          if (isDev) {
            devDependencies.push(packageInfo);
          } else {
            dependencies.push(packageInfo);
          }
        }
      }
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private parseLockfile(content: string): PdmLock {
    try {
      return parseJson(content) as PdmLock;
    } catch (error) {
      throw new Error(
        `Failed to parse pdm.lock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
