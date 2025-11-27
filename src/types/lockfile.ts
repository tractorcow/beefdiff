export interface NpmLockfilePackage {
  version: string;
  dev?: boolean;
  dependencies?: Record<string, NpmLockfileDependency>;
}

export interface NpmLockfileDependency {
  version: string;
  dev?: boolean;
  dependencies?: Record<string, NpmLockfileDependency>;
}

export interface NpmLockfileV1 {
  lockfileVersion: 1;
  name?: string;
  version?: string;
  dependencies?: Record<string, NpmLockfileDependency>;
  devDependencies?: Record<string, NpmLockfileDependency>;
}

export interface NpmLockfileV2 {
  lockfileVersion: 2;
  name?: string;
  version?: string;
  packages?: Record<string, NpmLockfilePackage>;
  dependencies?: Record<string, NpmLockfileDependency>;
}

export interface NpmLockfileV3 {
  lockfileVersion: 3;
  name?: string;
  version?: string;
  packages?: Record<string, NpmLockfilePackage>;
  dependencies?: Record<string, NpmLockfileDependency>;
}

export type NpmLockfile = NpmLockfileV1 | NpmLockfileV2 | NpmLockfileV3;

export interface PnpmLockfilePackage {
  version: string;
  dev?: boolean;
}

export interface PnpmLockfile {
  packages?: Record<string, PnpmLockfilePackage>;
}

export interface ComposerLockfilePackage {
  name: string;
  version: string;
}

export interface ComposerLockfile {
  packages?: ComposerLockfilePackage[];
  "packages-dev"?: ComposerLockfilePackage[];
}

export interface YarnLockfileEntry {
  version?: string;
  devDependency?: boolean;
  [key: string]: unknown;
}
