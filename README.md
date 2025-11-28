# @tractorcow/beefdiff

Compare lockfile dependencies between two versions. Supports multiple package managers across different ecosystems with detailed version change reports.

## Supported Lockfiles

### Node.js Ecosystem

- **npm**: `package-lock.json`
- **yarn**: `yarn.lock`
- **pnpm**: `pnpm-lock.yaml`

### Python Ecosystem

- **pip/requirements**: `requirements.txt`, `requirements-dev.txt`, `requirements*.txt`, `requirements.lock`
- **Poetry**: `poetry.lock`
- **Pipenv**: `Pipfile.lock`
- **PDM**: `pdm.lock`

### PHP Ecosystem

- **Composer**: `composer.lock`

### Ruby Ecosystem

- **Bundler**: `Gemfile.lock`

All Python lockfile formats are automatically detected based on file content, so the tool works even with non-standard filenames.

## Installation

```bash
npm install -g @tractorcow/beefdiff
# or
pnpm add -g @tractorcow/beefdiff
# or
yarn global add @tractorcow/beefdiff
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
- `-r, --resolver <name>` - Manually specify resolver: `npm`, `yarn`, `composer`, `pnpm`, `python`, or `ruby`
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

## GitHub Action

This repository includes a reusable GitHub Action that automatically posts lockfile diffs as comments on pull requests. See [`action/README.md`](action/README.md) for details.

**Quick start:**

```yaml
- name: Package lock diff
  uses: tractorcow/beefdiff/action@master
```

The action supports npm, yarn, pnpm, composer, Python, and Ruby lockfiles, and can be configured with custom filenames, resolvers, and output formats.

## Development

### Prerequisites

- Node.js 22 or higher
- pnpm (recommended) or npm

### Setup

```bash
pnpm install
```

### Build

```bash
pnpm run build
```

### Clean

```bash
pnpm run clean
```

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Code of Conduct

This project follows the [No Code of Conduct](CODE_OF_CONDUCT.md).
