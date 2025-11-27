import { basename } from "path";
import { findResolver, getResolverByName } from "../resolvers/index.js";
import type { ResolverPair } from "../types/index.js";

export function lookupResolvers(
  sourceFile: string,
  targetFile: string,
  resolverName?: string
): ResolverPair {
  if (resolverName) {
    const resolver = getResolverByName(resolverName);
    if (!resolver) {
      throw new Error(
        `Unknown resolver: ${resolverName}. Available: npm, composer, pnpm`
      );
    }
    return {
      sourceResolver: resolver,
      targetResolver: resolver,
    };
  }

  // Use the first resolver that matches either source or target file
  let sourceResolver = findResolver(basename(sourceFile));
  if (!sourceResolver) {
    sourceResolver = findResolver(basename(targetFile));
  }

  if (!sourceResolver) {
    throw new Error(
      `No resolver found for source or target files. Source: ${sourceFile}, Target: ${targetFile}`
    );
  }

  // Use the same resolver for both files
  return {
    sourceResolver,
    targetResolver: sourceResolver,
  };
}
