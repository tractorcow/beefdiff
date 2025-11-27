import { writeFile } from "fs/promises";
import { diffResolutions } from "./diff.js";
import { getReporter } from "./reporters/index.js";
import { parseArgs, validateArgs, showHelp } from "./cli/args.js";
import { lookupResolvers } from "./cli/resolver.js";
import { getVersion } from "./cli/version.js";

export function errorHandler(fn: () => Promise<number>): () => Promise<number> {
  return async () => {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
        if (error.message.includes("Missing required arguments")) {
          console.error("");
          showHelp();
        }
      } else {
        console.error("Error:", error);
      }
      return 1;
    }
  };
}

export async function run(): Promise<number> {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    return 0;
  }

  if (args.version) {
    console.log(getVersion());
    return 0;
  }

  validateArgs(args);

  const { sourceResolver, targetResolver } = lookupResolvers(
    args.sourceFile!,
    args.targetFile!,
    args.resolverName
  );

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

  return 0;
}

export const main = errorHandler(run);
