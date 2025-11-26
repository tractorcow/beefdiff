import { basename } from "path";
import { findResolver, getResolverByName } from "../resolvers/index.js";
import type { Resolver } from "../types/index.js";

export interface ResolverPair {
  sourceResolver: Resolver;
  targetResolver: Resolver;
}

export function lookupResolvers(
  sourceFile: string,
  targetFile: string,
  resolverName?: string
):
  | { success: true; resolvers: ResolverPair }
  | { success: false; error: string } {
  if (resolverName) {
    const resolver = getResolverByName(resolverName);
    if (!resolver) {
      return {
        success: false,
        error: `Unknown resolver: ${resolverName}. Available: npm, composer, pnpm`,
      };
    }
    return {
      success: true,
      resolvers: {
        sourceResolver: resolver,
        targetResolver: resolver,
      },
    };
  }

  // Use the first resolver that matches either source or target file
  let sourceResolver = findResolver(basename(sourceFile));
  if (!sourceResolver) {
    sourceResolver = findResolver(basename(targetFile));
  }

  if (!sourceResolver) {
    return {
      success: false,
      error: `No resolver found for source or target files. Source: ${sourceFile}, Target: ${targetFile}`,
    };
  }

  // Use the same resolver for both files
  return {
    success: true,
    resolvers: {
      sourceResolver,
      targetResolver: sourceResolver,
    },
  };
}
