#!/usr/bin/env node

import { basename } from "path";
import { writeFile } from "fs/promises";
import { findResolver, getResolverByName } from "./resolvers/index.js";
import { diffResolutions } from "./diff.js";
import { getReporter } from "./reporters/index.js";
import type { Resolver } from "./types.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    // Try multiple possible locations for package.json
    const possiblePaths = [
      join(__dirname, "..", "package.json"), // Development
      join(__dirname, "..", "..", "package.json"), // Built package
      join(process.cwd(), "package.json"), // Current directory
    ];

    for (const packageJsonPath of possiblePaths) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        if (packageJson.version) {
          return packageJson.version;
        }
      } catch {
        // Try next path
      }
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

function showHelp(): void {
  console.log(`beefdiff - Compare lockfile dependencies between two versions

USAGE:
    beefdiff [OPTIONS] <source-lockfile> <target-lockfile>

ARGUMENTS:
    <source-lockfile>    Path to the source (before) lockfile
    <target-lockfile>    Path to the target (after) lockfile

OPTIONS:
    -f, --format <format>     Output format: text, html, or markdown (default: text)
    -r, --resolver <name>     Manually specify resolver: npm, composer, or pnpm
    -o, --output <file>       Write output to file instead of stdout
    -h, --help                Show this help message
    -v, --version             Show version number

EXAMPLES:
    beefdiff package-lock.json package-lock-new.json
    beefdiff --format html --output report.html package-lock.json package-lock-new.json
    beefdiff --resolver npm --format markdown old.lock new.lock
    beefdiff -f markdown -o changes.md composer.lock composer-new.lock

SUPPORTED LOCKFILES:
    - npm: package-lock.json
    - composer: composer.lock
    - pnpm: pnpm-lock.yaml
`);
}

let sourceFile: string | undefined;
let targetFile: string | undefined;
let format = "text";
let resolverName: string | undefined;
let outputFile: string | undefined;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--format" || arg === "-f") {
    format = process.argv[++i] || "text";
  } else if (arg === "--resolver" || arg === "-r") {
    resolverName = process.argv[++i];
  } else if (arg === "--output" || arg === "-o") {
    outputFile = process.argv[++i];
  } else if (arg === "--help" || arg === "-h") {
    showHelp();
    process.exit(0);
  } else if (arg === "--version" || arg === "-v") {
    console.log(getVersion());
    process.exit(0);
  } else if (!sourceFile) {
    sourceFile = arg;
  } else if (!targetFile) {
    targetFile = arg;
  }
}

if (!sourceFile || !targetFile) {
  console.error("Error: Missing required arguments");
  console.error("");
  showHelp();
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

    if (outputFile) {
      await writeFile(outputFile, report, "utf-8");
      console.error(`Report written to ${outputFile}`);
    } else {
      console.log(report);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
