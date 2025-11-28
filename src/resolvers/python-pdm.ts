import { readFile } from "fs/promises";
import type { Package, Resolution, Resolver, PdmLock } from "../types/index.js";

export class PythonPdmResolver implements Resolver {
  canResolve(filename: string): boolean {
    const basename = filename.split("/").pop() || filename;
    return basename === "pdm.lock" || basename.endsWith("/pdm.lock");
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    return this.parseContent(content);
  }

  private parseContent(content: string): Resolution {
    const lockfile = JSON.parse(content) as PdmLock;

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
}
