#!/usr/bin/env node

import { basename } from "path";
import { findResolver, getResolverByName } from "./resolvers/index.js";
import { diffResolutions } from "./diff.js";
import { getReporter } from "./reporters/index.js";
import type { Resolver } from "./types.js";

let sourceFile: string | undefined;
let targetFile: string | undefined;
let format = "text";
let resolverName: string | undefined;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--format" || arg === "-f") {
    format = process.argv[++i] || "text";
  } else if (arg === "--resolver" || arg === "-r") {
    resolverName = process.argv[++i];
  } else if (!sourceFile) {
    sourceFile = arg;
  } else if (!targetFile) {
    targetFile = arg;
  }
}

if (!sourceFile || !targetFile) {
  console.error("Usage: beefdiff [--format <text|html|markdown>] [--resolver <npm|composer|pnpm>] <source-lockfile> <target-lockfile>");
  process.exit(1);
}

let sourceResolver: Resolver | null;
let targetResolver: Resolver | null;

if (resolverName) {
  const resolver = getResolverByName(resolverName);
  if (!resolver) {
    console.error(`Unknown resolver: ${resolverName}. Available: npm, composer, pnpm`);
    process.exit(1);
  }
  sourceResolver = resolver;
  targetResolver = resolver;
} else {
  sourceResolver = findResolver(basename(sourceFile));
  targetResolver = findResolver(basename(targetFile));
}

if (!sourceResolver) {
  console.error(`No resolver found for source file: ${sourceFile}`);
  process.exit(1);
}

if (!targetResolver) {
  console.error(`No resolver found for target file: ${targetFile}`);
  process.exit(1);
}

if (sourceResolver.constructor !== targetResolver.constructor) {
  console.error(
    `Source and target files must use the same lockfile format. Source: ${sourceFile}, Target: ${targetFile}`
  );
  process.exit(1);
}

async function main() {
  try {
    if (!sourceResolver || !targetResolver || !sourceFile || !targetFile) {
      process.exit(1);
    }

    const sourceResolution = await sourceResolver.resolve(sourceFile);
    const targetResolution = await targetResolver.resolve(targetFile);

    const diff = diffResolutions(sourceResolution, targetResolution);
    const reporter = getReporter(format);
    const report = reporter.report(diff);

    console.log(report);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
