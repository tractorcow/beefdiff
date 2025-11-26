export interface Package {
  name: string;
  version: string;
}

export interface Resolution {
  dependencies: Package[];
  devDependencies: Package[];
}

export interface Resolver {
  canResolve(filename: string): boolean;
  resolve(filePath: string): Promise<Resolution>;
}
