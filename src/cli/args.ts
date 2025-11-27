import type { CliArgs } from "../types/index.js";

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    format: "text",
    help: false,
    version: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--format" || arg === "-f") {
      args.format = argv[++i] || "text";
    } else if (arg === "--resolver" || arg === "-r") {
      args.resolverName = argv[++i];
    } else if (arg === "--output" || arg === "-o") {
      args.outputFile = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--version" || arg === "-v") {
      args.version = true;
    } else if (!args.sourceFile) {
      args.sourceFile = arg;
    } else if (!args.targetFile) {
      args.targetFile = arg;
    }
  }

  return args;
}

export function validateArgs(args: CliArgs): void {
  if (args.help || args.version) {
    return;
  }

  if (!args.sourceFile || !args.targetFile) {
    throw new Error(
      "Missing required arguments: source-lockfile and target-lockfile are required"
    );
  }
}

export function showHelp(): void {
  console.log(`beefdiff - Compare lockfile dependencies between two versions

USAGE:
    beefdiff [OPTIONS] <source-lockfile> <target-lockfile>

ARGUMENTS:
    <source-lockfile>    Path to the source (before) lockfile
    <target-lockfile>    Path to the target (after) lockfile

OPTIONS:
    -f, --format <format>     Output format: text, html, or markdown (default: text)
    -r, --resolver <name>     Manually specify resolver: npm, composer, pnpm, python, or yarn
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
    - python: requirements*.txt (e.g., requirements.txt, requirements-dev.txt)
    - yarn: yarn.lock
`);
}
