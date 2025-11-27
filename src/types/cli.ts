import type { Resolver } from "./core.js";

export interface CliArgs {
  sourceFile?: string;
  targetFile?: string;
  format: string;
  resolverName?: string;
  outputFile?: string;
  help: boolean;
  version: boolean;
}

export interface ResolverPair {
  sourceResolver: Resolver;
  targetResolver: Resolver;
}
