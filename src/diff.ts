import { diff, gt, parse, valid } from "semver";
import type {
  Package,
  Resolution,
  PackageChange,
  ResolutionDiff,
} from "./types/index.js";
import { PackageChangeType, VersionChangeType } from "./types/index.js";

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
  const sourceMap = new Map(source.map((pkg) => [pkg.name, pkg]));
  const targetMap = new Map(target.map((pkg) => [pkg.name, pkg]));

  const changes: PackageChange[] = [];

  for (const [name, sourcePkg] of sourceMap.entries()) {
    const targetPkg = targetMap.get(name);
    if (!targetPkg) {
      changes.push({
        name,
        type: PackageChangeType.Removed,
        fromVersion: sourcePkg.version,
      });
    } else if (sourcePkg.version !== targetPkg.version) {
      const versionInfo = getVersionChangeType(
        sourcePkg.version,
        targetPkg.version
      );
      if (versionInfo) {
        changes.push({
          name,
          type: versionInfo.direction,
          versionChange: versionInfo.type,
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
        type: PackageChangeType.Added,
        toVersion: targetPkg.version,
      });
    }
  }

  return changes;
}

interface VersionChangeInfo {
  type: VersionChangeType;
  direction: PackageChangeType.Upgraded | PackageChangeType.Downgraded;
}

function getVersionChangeType(
  from: string,
  to: string
): VersionChangeInfo | null {
  if (!valid(from) || !valid(to)) {
    return null;
  }

  const fromParsed = parse(from);
  const toParsed = parse(to);
  if (!fromParsed || !toParsed) {
    return null;
  }

  // Compare base versions (major.minor.patch)
  if (fromParsed.major !== toParsed.major) {
    return createVersionChangeInfo(VersionChangeType.Major, to, from);
  }
  if (fromParsed.minor !== toParsed.minor) {
    return createVersionChangeInfo(VersionChangeType.Minor, to, from);
  }
  if (fromParsed.patch !== toParsed.patch) {
    return createVersionChangeInfo(VersionChangeType.Patch, to, from);
  }

  // Base versions are the same - check for prerelease/build metadata differences
  const changeType = diff(from, to);
  if (!changeType) {
    // Versions are identical (including build metadata differences)
    return null;
  }

  // Any change type (prerelease or other) on same base version is treated as patch
  return createVersionChangeInfo(VersionChangeType.Patch, to, from);
}

function createVersionChangeInfo(
  type: VersionChangeType,
  to: string,
  from: string
): VersionChangeInfo {
  return {
    type,
    direction: gt(to, from)
      ? PackageChangeType.Upgraded
      : PackageChangeType.Downgraded,
  };
}
