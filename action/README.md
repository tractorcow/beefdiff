# Package Lock Diff Action

A reusable GitHub Action that automatically posts lockfile diffs as comments on pull requests using [@tractorcow/beefdiff](https://www.npmjs.com/package/@tractorcow/beefdiff).

## Features

- Automatically detects changes to lockfiles (npm, yarn, pnpm, composer, Python, Ruby)
- Generates detailed markdown diffs showing:
  - Major, minor, and patch version updates
  - Added packages
  - Removed packages
  - Downgraded packages
- Posts the diff as a comment on pull requests
- Automatically updates existing comments (deletes old, posts new)
- Supports custom working directories

## Usage

### Basic Usage

Add this to your `.github/workflows/package-lock-diff.yml`:

```yaml
name: Package Lock Diff

on:
  pull_request:
    paths:
      - "package-lock.json"
      - "**/package-lock.json"

jobs:
  package-lock-diff:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Package lock diff
        uses: tractorcow/beefdiff/action@master
```

### With Custom Working Directory

If your `package-lock.json` is in a subdirectory:

```yaml
- name: Package lock diff
  uses: tractorcow/beefdiff/action@master
  with:
    work-dir: "frontend"
```

### With Different Lockfile Format

For yarn, pnpm, or other lockfile formats:

```yaml
- name: Package lock diff
  uses: tractorcow/beefdiff/action@master
  with:
    filename: "yarn.lock"
    resolver: "yarn"
```

### With Different Output Format

For HTML or text output:

```yaml
- name: Package lock diff
  uses: tractorcow/beefdiff/action@master
  with:
    format: "html"
```

### Disable Node.js Setup

If Node.js is already set up in a previous step:

```yaml
- name: Package lock diff
  uses: tractorcow/beefdiff/action@master
  with:
    node_version: ""
```

## Inputs

| Input          | Description                                                      | Required | Default             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `github_token` | GitHub token for API calls (uses `github.token` if not provided) | No       | `''` (uses default) |
| `work-dir`     | Directory containing the lockfile                                | No       | `''` (root)         |
| `filename`     | Lockfile filename to diff                                        | No       | `package-lock.json` |
| `resolver`     | Resolver to use (npm, yarn, pnpm, composer, python, ruby)        | No       | `npm`               |
| `format`       | Output format (text, html, markdown)                             | No       | `markdown`          |
| `node_version` | Node.js version to setup (blank to disable)                      | No       | `24`                |

## Output

The action will:

1. Checkout the repository with full history
2. Extract the base version of the lockfile from the PR base branch
3. Compare it with the current version using `beefdiff`
4. Automatically create or update the "Package lock diff" comment (using a comment tag to identify and update existing comments)

## Example Output

The comment will look like:

```markdown
### Package lock diff

# Dependencies

## Major Updates

- express: 4.17.1 → 5.0.0

## Minor Updates

- lodash: 4.17.20 → 4.17.21

## Added Packages

- new-package: 1.0.0

## Removed Packages

- old-package: 2.0.0
```

## Supported Lockfiles

The action supports all lockfile formats supported by beefdiff:

- **Node.js**: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- **Python**: `requirements*.txt`, `poetry.lock`, `Pipfile.lock`, `pdm.lock`
- **PHP**: `composer.lock`
- **Ruby**: `Gemfile.lock`

## Permissions

The action requires the following permissions to create and delete comments on pull requests:

```yaml
permissions:
  contents: read # Required to read lockfile files
  pull-requests: write # Required to create and delete PR comments
```

**Important Notes:**

- The default `GITHUB_TOKEN` has read-only permissions, so you **must** explicitly set `pull-requests: write` in your workflow
- For pull requests from forks, the `GITHUB_TOKEN` is always read-only. Consider using `pull_request_target` event if you need to support forks (with appropriate security considerations)

## Requirements

- The repository must have lockfile files
- Pull requests must have the base branch available (uses `fetch-depth: 0`)
- The workflow must have `pull-requests: write` permission configured
