import { readFile } from "fs/promises";
import type {
  Resolver,
  Package,
  Resolution,
  ComposerLockfile,
} from "../types/index.js";
import { parseJson } from "./loader-utils.js";

export class ComposerResolver implements Resolver {
  canResolve(filename: string): boolean {
    return /(^|\/)composer\.lock$/i.test(filename);
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    const lockfile = this.parseLockfile(content);

    const dependencies: Package[] = [];
    const devDependencies: Package[] = [];

    if (lockfile.packages) {
      for (const pkg of lockfile.packages) {
        if (
          pkg &&
          typeof pkg === "object" &&
          "name" in pkg &&
          "version" in pkg
        ) {
          dependencies.push({
            name: pkg.name as string,
            version: pkg.version as string,
          });
        }
      }
    }

    if (lockfile["packages-dev"]) {
      for (const pkg of lockfile["packages-dev"]) {
        if (
          pkg &&
          typeof pkg === "object" &&
          "name" in pkg &&
          "version" in pkg
        ) {
          devDependencies.push({
            name: pkg.name as string,
            version: pkg.version as string,
          });
        }
      }
    }

    return {
      dependencies,
      devDependencies,
    };
  }

  private parseLockfile(content: string): ComposerLockfile {
    try {
      return parseJson(content) as ComposerLockfile;
    } catch (error) {
      throw new Error(
        `Failed to parse composer.lock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
