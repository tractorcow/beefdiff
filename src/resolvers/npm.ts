import { readFile } from "fs/promises";
import type { Resolver, Package, Resolution } from "../types.js";

export class NpmResolver implements Resolver {
  canResolve(filename: string): boolean {
    return filename === "package-lock.json" || filename.endsWith("/package-lock.json");
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    const lockfile = JSON.parse(content);

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    if (lockfile.packages) {
      for (const [path, pkg] of Object.entries(lockfile.packages)) {
        if (pkg && typeof pkg === "object" && "version" in pkg) {
          const packagePath = path === "" ? "root" : path;
          const packageInfo: Package = {
            name: packagePath,
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

    if (lockfile.dependencies) {
      this.extractDependencies(lockfile.dependencies, dependencies, devDependencies);
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private extractDependencies(
    deps: Record<string, any>,
    dependencies: Package[],
    devDependencies: Package[],
    prefix = ""
  ): void {
    for (const [name, dep] of Object.entries(deps)) {
      if (dep && typeof dep === "object") {
        if ("version" in dep) {
          const fullName = prefix ? `${prefix}/${name}` : name;
          const packageInfo: Package = {
            name: fullName,
            version: dep.version,
          };

          const isDev = dep.dev === true;
          if (isDev) {
            devDependencies.push(packageInfo);
          } else {
            dependencies.push(packageInfo);
          }
        }

        if ("dependencies" in dep) {
          const newPrefix = prefix ? `${prefix}/${name}` : name;
          this.extractDependencies(dep.dependencies, dependencies, devDependencies, newPrefix);
        }
      }
    }
  }
}
