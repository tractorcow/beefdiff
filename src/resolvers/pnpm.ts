import { readFile } from "fs/promises";
import { parse } from "yaml";
import type {
  Resolver,
  Package,
  Resolution,
  PnpmLockfile,
} from "../types/index.js";

export class PnpmResolver implements Resolver {
  canResolve(filename: string): boolean {
    return (
      filename === "pnpm-lock.yaml" || filename.endsWith("/pnpm-lock.yaml")
    );
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    const lockfile = parse(content) as PnpmLockfile;

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    if (lockfile.packages) {
      for (const [name, pkg] of Object.entries(lockfile.packages)) {
        if (pkg && typeof pkg === "object" && "version" in pkg) {
          // Skip nested modules (only include top-level modules)
          // In pnpm, nested modules typically have paths with "/" or "node_modules"
          const parts = name.split("/");
          const nodeModulesCount = parts.filter(
            (p) => p === "node_modules"
          ).length;
          // Skip if it contains node_modules (nested) or has multiple path segments indicating nesting
          if (
            nodeModulesCount > 0 ||
            (parts.length > 1 &&
              !name.includes("@") &&
              !name.match(/^@[^/]+\/[^/]+$/))
          ) {
            continue;
          }
          // Extract just the package name (remove version suffix if present)
          const packageName = name.split("@")[0];
          const packageInfo: Package = {
            name: packageName,
            version: pkg.version,
          };

          const isDev = pkg.dev === true;
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
