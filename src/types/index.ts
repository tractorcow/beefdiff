// Core types
export type { Package, Resolution, Resolver } from "./core.js";

// Lockfile types
export type {
  NpmLockfile,
  NpmLockfileV1,
  NpmLockfileV2,
  NpmLockfileV3,
  NpmLockfilePackage,
  NpmLockfileDependency,
  PnpmLockfile,
  PnpmLockfilePackage,
  ComposerLockfile,
  ComposerLockfilePackage,
  YarnLockfileEntry,
} from "./lockfile.js";

// Diff types
export type { PackageChange, ResolutionDiff, GroupedChanges } from "./diff.js";
export { PackageChangeType, VersionChangeType } from "./diff.js";

// Reporter types
export type { Reporter } from "./reporter.js";

// CLI types
export type { CliArgs, ResolverPair } from "./cli.js";
