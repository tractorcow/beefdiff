# @tractorcow/beefdiff

Compare lockfile dependencies between two versions. Supports npm (`package-lock.json`), composer (`composer.lock`), and pnpm (`pnpm-lock.yaml`) lockfiles with detailed version change reports.

## Installation

```bash
npm install -g @tractorcow/beefdiff
```

Or use with `npx`:

```bash
npx @tractorcow/beefdiff <source-lockfile> <target-lockfile>
```

## Usage

```bash
beefdiff [OPTIONS] <source-lockfile> <target-lockfile>
```

### Options

- `-f, --format <format>` - Output format: `text`, `html`, or `markdown` (default: `text`)
- `-r, --resolver <name>` - Manually specify resolver: `npm`, `composer`, or `pnpm`
- `-o, --output <file>` - Write output to file instead of stdout
- `-h, --help` - Show help message
- `-v, --version` - Show version number

### Examples

Compare two npm lockfiles:

```bash
beefdiff package-lock.json package-lock-new.json
```

Generate an HTML report:

```bash
beefdiff --format html --output report.html package-lock.json package-lock-new.json
```

Compare composer lockfiles with markdown output:

```bash
beefdiff --format markdown composer.lock composer-new.lock
```

Manually specify resolver for renamed files:

```bash
beefdiff --resolver npm --format markdown old.lock new.lock
```

### Output Formats

- **text**: Plain text format suitable for terminal output. Groups changes by version type (major, minor, patch) and other changes (added, removed, downgraded).
- **html**: HTML format with color-coded version changes (red for major, orange for minor, green for patch). Includes styling for added (green) and removed (red) packages.
- **markdown**: Markdown format suitable for documentation or GitHub. Organizes changes into separate sections for major updates, minor updates, patch updates, added packages, removed packages, and downgraded packages.

### Report Structure

Reports are organized by:

- **Dependencies** and **Dev Dependencies** (major headings)
- **Major Updates**, **Minor Updates**, **Patch Updates** (for upgraded packages)
- **Added Packages** and **Removed Packages** (for packages added or removed)
- **Downgraded Packages** (for packages that were downgraded)

Only packages with changes (added, removed, upgraded, or downgraded) are included in the report.

The tool uses semantic versioning (semver) to accurately detect version changes, including:
- Major, minor, and patch version changes
- Prerelease versions (alpha, beta, rc, etc.)
- Version downgrades (when a package version decreases)

## Development

### Prerequisites

- Node.js 22 or higher
- npm

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Clean

```bash
npm run clean
```

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Code of Conduct

This project follows the [No Code of Conduct](CODE_OF_CONDUCT.md).
