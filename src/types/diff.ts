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
