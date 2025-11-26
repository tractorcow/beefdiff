import { compare, valid } from "semver";
import type { Package, Resolution } from "./types/index.js";

export type PackageChangeType = "added" | "removed" | "upgraded";

export type VersionChangeType = "major" | "minor" | "patch";

export interface PackageChange {
  name: string;
  type: PackageChangeType;
  versionChange?: VersionChangeType;
  fromVersion?: string;
  toVersion?: string;
}

export interface ResolutionDiff {
  dependencies: PackageChange[];
  devDependencies: PackageChange[];
}

export function diffResolutions(
  source: Resolution,
  target: Resolution
): ResolutionDiff {
  return {
    dependencies: diffPackages(source.dependencies, target.dependencies),
    devDependencies: diffPackages(
      source.devDependencies,
      target.devDependencies
    ),
  };
}

function diffPackages(source: Package[], target: Package[]): PackageChange[] {
  const sourceMap = new Map<string, Package>();
  const targetMap = new Map<string, Package>();

  for (const pkg of source) {
    sourceMap.set(pkg.name, pkg);
  }

  for (const pkg of target) {
    targetMap.set(pkg.name, pkg);
  }

  const changes: PackageChange[] = [];

  for (const [name, sourcePkg] of sourceMap.entries()) {
    const targetPkg = targetMap.get(name);
    if (!targetPkg) {
      changes.push({
        name,
        type: "removed",
        fromVersion: sourcePkg.version,
      });
    } else if (sourcePkg.version !== targetPkg.version) {
      const versionChange = getVersionChangeType(
        sourcePkg.version,
        targetPkg.version
      );
      if (versionChange) {
        changes.push({
          name,
          type: "upgraded",
          versionChange,
          fromVersion: sourcePkg.version,
          toVersion: targetPkg.version,
        });
      }
    }
  }

  for (const [name, targetPkg] of targetMap.entries()) {
    if (!sourceMap.has(name)) {
      changes.push({
        name,
        type: "added",
        toVersion: targetPkg.version,
      });
    }
  }

  return changes;
}

function getVersionChangeType(
  from: string,
  to: string
): VersionChangeType | null {
  if (!valid(from) || !valid(to)) {
    return null;
  }

  const diff = compare(from, to);
  if (diff === 0) {
    return null;
  }

  const fromParts = from.split(".").map(Number);
  const toParts = to.split(".").map(Number);

  if (fromParts[0] !== toParts[0]) {
    return "major";
  }
  if (fromParts[1] !== toParts[1]) {
    return "minor";
  }
  return "patch";
}
