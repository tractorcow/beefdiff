import { readFile } from "fs/promises";
import type {
  Package,
  Resolution,
  Resolver,
  PoetryLock,
} from "../types/index.js";
import { parseToml } from "./loader-utils.js";

export class PythonPoetryResolver implements Resolver {
  canResolve(filename: string): boolean {
    return /(^|\/)poetry\.lock$/i.test(filename);
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
          // In poetry.lock, dev dependencies have category === "dev"
          const isDev = "category" in pkg && pkg.category === "dev";

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

  private parseLockfile(content: string): PoetryLock {
    try {
      return parseToml(content) as PoetryLock;
    } catch (error) {
      throw new Error(
        `Failed to parse poetry.lock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
