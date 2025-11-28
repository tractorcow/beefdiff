import { readFile } from "fs/promises";
// @ts-expect-error - @yarnpkg/lockfile doesn't have TypeScript definitions
import lockfile from "@yarnpkg/lockfile";
import type {
  Resolver,
  Package,
  Resolution,
  YarnLockfileEntry,
} from "../types/index.js";

export class YarnResolver implements Resolver {
  canResolve(filename: string): boolean {
    return filename === "yarn.lock" || filename.endsWith("/yarn.lock");
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    let parsed;
    try {
      parsed = lockfile.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse yarn.lock file: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (parsed.type !== "success") {
      throw new Error("Failed to parse yarn.lock file");
    }

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    // The parsed object is a map where keys are like "package-name@version"
    // and values contain the resolved version and other metadata
    for (const [key, entry] of Object.entries(parsed.object)) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const yarnEntry = entry as YarnLockfileEntry;

      // Extract package name and version from the key
      // Format: "package-name@version" or "@scope/package-name@version"
      const packageInfo = this.extractPackageInfo(key, yarnEntry);
      if (!packageInfo) {
        continue;
      }

      // Check if this is a dev dependency
      // In yarn.lock, we can't directly tell if a package is dev or not
      // from the lockfile alone. We'll put everything in dependencies.
      // However, we can check the entry for any hints
      const isDev = yarnEntry.devDependency === true;
      if (isDev) {
        devDependencies.push(packageInfo);
      } else {
        dependencies.push(packageInfo);
      }
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private extractPackageInfo(
    key: string,
    entry: YarnLockfileEntry
  ): Package | null {
    // Key format: "package-name@version" or "@scope/package-name@version"
    // The version in the key might be a range, but entry.version has the resolved version
    const atIndex = key.lastIndexOf("@");
    if (atIndex === -1) {
      return null;
    }

    const packageName = key.substring(0, atIndex).trim();
    if (!packageName) {
      return null;
    }

    // Use the resolved version from the entry, fall back to extracting from key
    const version =
      entry.version && typeof entry.version === "string"
        ? entry.version
        : this.extractVersionFromKey(key);

    if (!version) {
      return null;
    }

    return {
      name: packageName,
      version,
    };
  }

  private extractVersionFromKey(key: string): string | null {
    // Extract version from key like "package-name@^1.0.0" or "package-name@npm:1.0.0"
    const atIndex = key.lastIndexOf("@");
    if (atIndex === -1) {
      return null;
    }

    const versionPart = key.substring(atIndex + 1).trim();
    if (!versionPart) {
      return null;
    }

    // Handle protocol prefixes like "npm:", "workspace:", etc.
    const protocolIndex = versionPart.indexOf(":");
    const version =
      protocolIndex >= 0
        ? versionPart.substring(protocolIndex + 1)
        : versionPart;

    // Remove version range operators (^, ~, >=, etc.) and take the base version
    // For simplicity, we'll try to extract a version number
    const versionMatch = version.match(/(\d+\.\d+\.\d+[^\s]*)/);
    if (versionMatch) {
      return versionMatch[1];
    }

    // If no version found, return the cleaned version part
    return version;
  }
}
