#!/usr/bin/env node

import { writeFile } from "fs/promises";
import { diffResolutions } from "./diff.js";
import { getReporter } from "./reporters/index.js";
import { parseArgs, validateArgs, showHelp } from "./cli/args.js";
import { lookupResolvers } from "./cli/resolver.js";
import { getVersion } from "./cli/version.js";

const args = parseArgs(process.argv);

if (args.help) {
  showHelp();
  process.exit(0);
}

if (args.version) {
  console.log(getVersion());
  process.exit(0);
}

const validation = validateArgs(args);
if (!validation.valid) {
  console.error(`Error: ${validation.error}`);
  console.error("");
  showHelp();
  process.exit(1);
}

const resolverResult = lookupResolvers(
  args.sourceFile!,
  args.targetFile!,
  args.resolverName
);

if (!resolverResult.success) {
  console.error(resolverResult.error);
  process.exit(1);
}

const { sourceResolver, targetResolver } = resolverResult.resolvers;

async function main() {
  try {
    const sourceResolution = await sourceResolver.resolve(args.sourceFile!);
    const targetResolution = await targetResolver.resolve(args.targetFile!);

    const diff = diffResolutions(sourceResolution, targetResolution);
    const reporter = getReporter(args.format);
    const report = reporter.report(diff);

    if (args.outputFile) {
      await writeFile(args.outputFile, report, "utf-8");
      console.error(`Report written to ${args.outputFile}`);
    } else {
      console.log(report);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
