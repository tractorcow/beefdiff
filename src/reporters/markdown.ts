import type {
  Reporter,
  ResolutionDiff,
  PackageChange,
} from "../types/index.js";
import { PackageChangeType, VersionChangeType } from "../types/index.js";

export class MarkdownReporter implements Reporter {
  report(diff: ResolutionDiff): string {
    const parts: string[] = [];

    if (diff.dependencies.length > 0) {
      parts.push("## Dependencies");
      parts.push(this.formatChanges(diff.dependencies));
    }

    if (diff.devDependencies.length > 0) {
      parts.push("## Dev Dependencies");
      parts.push(this.formatChanges(diff.devDependencies));
    }

    return parts.join("\n\n");
  }

  private formatChanges(changes: PackageChange[]): string {
    const byType = this.groupByVersionChange(changes);
    const parts: string[] = [];

    if (byType.major.length > 0) {
      parts.push("### Major Updates");
      parts.push(this.formatChangeList(byType.major));
      parts.push("");
    }

    if (byType.minor.length > 0) {
      parts.push("### Minor Updates");
      parts.push(this.formatChangeList(byType.minor));
      parts.push("");
    }

    if (byType.patch.length > 0) {
      parts.push("### Patch Updates");
      parts.push(this.formatChangeList(byType.patch));
      parts.push("");
    }

    if (byType.added.length > 0) {
      parts.push("### Added Packages");
      parts.push(this.formatChangeList(byType.added));
      parts.push("");
    }

    if (byType.removed.length > 0) {
      parts.push("### Removed Packages");
      parts.push(this.formatChangeList(byType.removed));
      parts.push("");
    }

    if (byType.downgraded.length > 0) {
      parts.push("### Downgraded Packages");
      parts.push(this.formatChangeList(byType.downgraded));
    }

    return parts.join("\n");
  }

  private formatChangeList(changes: PackageChange[]): string {
    if (changes.length === 0) {
      return "";
    }

    const items = changes.map((c) => `- ${this.formatChange(c)}`);
    return items.join("\n");
  }

  private formatChange(change: PackageChange): string {
    switch (change.type) {
      case PackageChangeType.Added:
        return `**${change.name}**@\`${change.toVersion}\` (added)`;
      case PackageChangeType.Removed:
        return `**${change.name}**@\`${change.fromVersion}\` (removed)`;
      case PackageChangeType.Upgraded:
        return `**${change.name}**: \`${change.fromVersion}\` → \`${change.toVersion}\``;
      case PackageChangeType.Downgraded:
        return `**${change.name}**: \`${change.fromVersion}\` → \`${change.toVersion}\` (downgraded)`;
    }
  }

  private groupByVersionChange(changes: PackageChange[]): {
    major: PackageChange[];
    minor: PackageChange[];
    patch: PackageChange[];
    added: PackageChange[];
    removed: PackageChange[];
    downgraded: PackageChange[];
  } {
    const result = {
      major: [] as PackageChange[],
      minor: [] as PackageChange[],
      patch: [] as PackageChange[],
      added: [] as PackageChange[],
      removed: [] as PackageChange[],
      downgraded: [] as PackageChange[],
    };

    for (const change of changes) {
      if (change.type === PackageChangeType.Upgraded && change.versionChange) {
        if (change.versionChange === VersionChangeType.Major) {
          result.major.push(change);
        } else if (change.versionChange === VersionChangeType.Minor) {
          result.minor.push(change);
        } else if (change.versionChange === VersionChangeType.Patch) {
          result.patch.push(change);
        }
      } else if (change.type === PackageChangeType.Downgraded) {
        result.downgraded.push(change);
      } else if (change.type === PackageChangeType.Added) {
        result.added.push(change);
      } else if (change.type === PackageChangeType.Removed) {
        result.removed.push(change);
      }
    }

    return result;
  }
}
