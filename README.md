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

- **text**: Plain text format suitable for terminal output
- **html**: HTML format with color-coded version changes (red for major, orange for minor, green for patch)
- **markdown**: Markdown format suitable for documentation or GitHub

### Report Structure

Reports are organized by:
- **Dependencies** and **Dev Dependencies** (major headings)
- **Major Updates**, **Minor Updates**, **Patch Updates**, and **Other Changes** (minor headings)

Only packages with changes (added, removed, or upgraded) are included in the report.

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
