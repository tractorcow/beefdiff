import { readFile } from "fs/promises";
import { parse as parseToml } from "@iarna/toml";
import type {
  Package,
  Resolution,
  Resolver,
  PoetryLock,
} from "../types/index.js";

export class PythonPoetryResolver implements Resolver {
  canResolve(filename: string): boolean {
    const basename = filename.split("/").pop() || filename;
    return basename === "poetry.lock" || basename.endsWith("/poetry.lock");
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    return this.parseContent(content);
  }

  private parseContent(content: string): Resolution {
    const lockfile = parseToml(content) as PoetryLock;

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
          const isDev =
            ("category" in pkg && pkg.category === "dev") ||
            ("optional" in pkg && pkg.optional === true);

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
