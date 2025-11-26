import { readFile } from "fs/promises";
import { parse } from "yaml";
import type { Resolver, Package, Resolution } from "../types.js";

export class PnpmResolver implements Resolver {
  canResolve(filename: string): boolean {
    return filename === "pnpm-lock.yaml" || filename.endsWith("/pnpm-lock.yaml");
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    const lockfile = parse(content);

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    if (lockfile.packages) {
      for (const [name, pkg] of Object.entries(lockfile.packages)) {
        if (pkg && typeof pkg === "object" && "version" in pkg) {
          const packageInfo: Package = {
            name,
            version: (pkg as { version: string }).version,
          };

          const isDev = (pkg as { dev?: boolean }).dev === true;
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
