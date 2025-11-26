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
        if (!pkg || typeof pkg !== "object") {
          continue;
        }

        const nameAndVersion = this.extractPackageInfoFromName(name);
        if (!nameAndVersion) {
          continue;
        }

        const { name: packageName, version: versionFromKey } = nameAndVersion;

        // Version can be in the package object or in the key
        // Prefer version from package object, fall back to version from key
        const version =
          "version" in pkg && typeof pkg.version === "string"
            ? pkg.version
            : versionFromKey;

        if (!version) {
          continue; // Skip packages without a version
        }

        const packageInfo: Package = {
          name: packageName,
          version,
        };

        const isDev = pkg.dev === true;
        if (isDev) {
          devDependencies.push(packageInfo);
          continue;
        }
        dependencies.push(packageInfo);
      }
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private extractPackageInfoFromName(
    key: string
  ): { name: string; version: string | null } | null {
    const packageKey = this.cleanPackageName(key);
    if (!packageKey) {
      return null;
    }

    // Handle scoped packages (e.g., "@scope/package@1.0.0")
    if (packageKey.startsWith("@")) {
      const lastAtIndex = packageKey.lastIndexOf("@");
      if (lastAtIndex <= 0) {
        // No version suffix
        return { name: packageKey, version: null };
      }
      // Has version suffix: "@scope/package@1.0.0"
      return {
        name: packageKey.substring(0, lastAtIndex),
        version: packageKey.substring(lastAtIndex + 1),
      };
    }

    // For non-scoped packages, split on "@"
    const keyParts = packageKey.split("@");
    if (keyParts.length === 1) {
      return { name: packageKey, version: null };
    }

    return {
      name: keyParts[0],
      version: keyParts.slice(1).join("@"),
    };
  }

  private cleanPackageName(key: string): string | null {
    const parts = key.split("/");
    const nodeModulesIndex = parts.indexOf("node_modules");

    // If key contains "node_modules", it's a path structure (monorepo or nested)
    if (nodeModulesIndex !== -1) {
      // Skip nested modules (only include top-level modules)
      // Check that there's exactly one "node_modules" segment
      const nodeModulesCount = parts.filter((p) => p === "node_modules").length;
      if (nodeModulesCount !== 1) {
        return null; // Skip nested modules (multiple node_modules segments)
      }
      // If node_modules is at index 0, it's a root-level package (include)
      // If node_modules is at index > 0, it could be:
      //   - A monorepo workspace path (e.g., "apps/my-app/node_modules/...")
      //   - A nested dependency (e.g., "express/node_modules/debug")
      // Since it's ambiguous, we include it to avoid missing legitimate top-level packages
      // Extract package name (everything after "node_modules")
      // For scoped packages, include the scope
      return parts.slice(nodeModulesIndex + 1).join("/");
    }

    // Check if this is a nested path (e.g., "express/node_modules/debug")
    // These should be skipped as they're not top-level
    if (
      parts.length > 1 &&
      !key.startsWith("@") &&
      !key.match(/^@[^/]+\/[^/]+$/)
    ) {
      return null; // Skip nested paths that aren't scoped packages
    }

    return key;
  }
}
