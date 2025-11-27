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

  // Parse versions to get base version numbers for comparison
  const fromParsed = parse(from);
  const toParsed = parse(to);

  if (!fromParsed || !toParsed) {
    return null;
  }

  // Compare base versions (major.minor.patch without prerelease/build metadata)
  // This handles edge cases where semver.diff() might return "major" for prerelease
  // transitions even when base versions are the same
  let versionChangeType: VersionChangeType;
  if (fromParsed.major !== toParsed.major) {
    versionChangeType = VersionChangeType.Major;
  } else if (fromParsed.minor !== toParsed.minor) {
    versionChangeType = VersionChangeType.Minor;
  } else if (fromParsed.patch !== toParsed.patch) {
    versionChangeType = VersionChangeType.Patch;
  } else {
    // Same base version (major.minor.patch), check if it's a prerelease change
    // Use semver.diff() to detect prerelease transitions
    const changeType = diff(from, to);
    if (changeType === "prerelease" || changeType === "major") {
      // Same base version but different prerelease identifiers or prerelease -> stable
      // Treat as patch change
      versionChangeType = VersionChangeType.Patch;
    } else if (changeType === "minor" || changeType === "patch") {
      // This shouldn't happen if base versions are the same, but handle it
      versionChangeType =
        changeType === "minor"
          ? VersionChangeType.Minor
          : VersionChangeType.Patch;
    } else {
      // No change or unknown, return null
      return null;
    }
  }

  // Determine direction using semver.gt() for safer comparison
  const isUpgrade = gt(to, from);
  const direction = isUpgrade
    ? PackageChangeType.Upgraded
    : PackageChangeType.Downgraded;

  return {
    type: versionChangeType,
    direction,
  };
}
