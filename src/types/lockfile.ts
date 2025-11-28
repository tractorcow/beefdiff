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

// Pipfile.lock structure (JSON)
export interface PipfileLockPackage {
  version: string;
  hashes?: string[];
  [key: string]: unknown;
}

export interface PipfileLock {
  _meta: {
    requires?: {
      python_version?: string;
      [key: string]: unknown;
    };
    sources?: unknown[];
    [key: string]: unknown;
  };
  default?: Record<string, PipfileLockPackage>;
  develop?: Record<string, PipfileLockPackage>;
  [key: string]: unknown;
}

// poetry.lock structure (TOML)
export interface PoetryLockPackage {
  name: string;
  version: string;
  category?: string;
  optional?: boolean;
  [key: string]: unknown;
}

export interface PoetryLock {
  package?: PoetryLockPackage[];
  [key: string]: unknown;
}

// pdm.lock structure (JSON)
export interface PdmLockPackage {
  name: string;
  version: string;
  groups?: string[];
  [key: string]: unknown;
}

export interface PdmLock {
  package?: PdmLockPackage[];
  [key: string]: unknown;
}

export enum PythonLockfileFormat {
  Requirements = "requirements",
  Pipfile = "pipfile",
  Poetry = "poetry",
  Pdm = "pdm",
}
