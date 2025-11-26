import { readFile } from "fs/promises";
import type {
  Resolver,
  Package,
  Resolution,
  NpmLockfile,
  NpmLockfileV1,
  NpmLockfileV2,
  NpmLockfileV3,
  NpmLockfileDependency,
} from "../types/index.js";

export class NpmResolver implements Resolver {
  canResolve(filename: string): boolean {
    return (
      filename === "package-lock.json" ||
      filename.endsWith("/package-lock.json")
    );
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content) as NpmLockfile;

    const lockfileVersion = parsed.lockfileVersion ?? 1;

    switch (lockfileVersion) {
      case 1: {
        const lockfile = parsed as NpmLockfileV1;
        return this.resolveVersion1(lockfile);
      }
      case 2: {
        const lockfile = parsed as NpmLockfileV2;
        return this.resolveVersion2(lockfile);
      }
      case 3: {
        const lockfile = parsed as NpmLockfileV3;
        return this.resolveVersion3(lockfile);
      }
      default:
        throw new Error(
          `Unsupported lockfileVersion: ${lockfileVersion}. Only versions 1, 2, and 3 are supported.`
        );
    }
  }

  private resolveVersion1(lockfile: NpmLockfileV1): Resolution {
    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    // Version 1 uses dependencies and devDependencies at root level
    // Only extract top-level dependencies, not nested ones
    if (lockfile.dependencies) {
      this.extractDependencies(
        lockfile.dependencies,
        dependencies,
        devDependencies,
        false
      );
    }

    if (lockfile.devDependencies) {
      this.extractDependencies(
        lockfile.devDependencies,
        dependencies,
        devDependencies,
        true
      );
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private resolveVersion2(lockfile: NpmLockfileV2): Resolution {
    return this.resolveVersion2Or3(lockfile);
  }

  private resolveVersion3(lockfile: NpmLockfileV3): Resolution {
    return this.resolveVersion2Or3(lockfile);
  }

  private resolveVersion2Or3(
    lockfile: NpmLockfileV2 | NpmLockfileV3
  ): Resolution {
    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    // Version 2 and 3 use packages structure with dev flags
    if (lockfile.packages) {
      this.extractDependencies(
        lockfile.packages as Record<string, NpmLockfileDependency>,
        dependencies,
        devDependencies,
        false
      );
    }

    // Version 2 and 3 may also have dependencies field for backwards compatibility
    if (lockfile.dependencies) {
      this.extractDependencies(
        lockfile.dependencies,
        dependencies,
        devDependencies,
        false
      );
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private extractPackageName(key: string): string | null {
    // Skip the root package (empty key in packages structure)
    if (key === "") {
      return null;
    }

    // Detect structure: if key contains "node_modules", it's packages structure (v2/v3)
    // Otherwise, it's dependencies structure (v1) where key is the package name
    const parts = key.split("/");
    const nodeModulesIndex = parts.indexOf("node_modules");

    // For dependencies structure (v1), key is the package name
    if (nodeModulesIndex === -1) {
      return key;
    }

    // For packages structure (v2/v3), key is a path like "node_modules/express"
    // or in monorepos: "apps/my-app/node_modules/@scope/package"
    // Skip nested modules (only include top-level modules)
    const nodeModulesCount = parts.filter((p) => p === "node_modules").length;
    if (nodeModulesCount !== 1) {
      return null; // Skip nested modules (multiple node_modules segments)
    }
    // Extract package name (everything after "node_modules")
    // For scoped packages, include the scope
    return parts.slice(nodeModulesIndex + 1).join("/");
  }

  private extractDependencies(
    deps: Record<string, NpmLockfileDependency>,
    dependencies: Package[],
    devDependencies: Package[],
    forceDev = false
  ): void {
    // Only extract top-level dependencies, not nested ones
    for (const [key, dep] of Object.entries(deps)) {
      if (!dep || !("version" in dep)) {
        continue;
      }

      const packageName = this.extractPackageName(key);
      if (!packageName) {
        continue;
      }

      const packageInfo: Package = {
        name: packageName,
        version: dep.version,
      };

      // In lockfileVersion 1, devDependencies are in a separate field
      // In lockfileVersion 2+, dev flag is on the dependency itself
      const isDev = forceDev || dep.dev === true;
      if (isDev) {
        devDependencies.push(packageInfo);
        continue;
      }
      dependencies.push(packageInfo);
    }
  }
}
