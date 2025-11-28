import type {
  Reporter,
  ResolutionDiff,
  PackageChange,
} from "../types/index.js";
import { PackageChangeType } from "../types/index.js";
import { groupByVersionChange } from "./utils.js";

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
    const byType = groupByVersionChange(changes);
    const parts: string[] = [];

    if (byType.major.length > 0) {
      parts.push("### Major Updates");
      parts.push(this.formatChangeTable(byType.major));
      parts.push("");
    }

    if (byType.minor.length > 0) {
      parts.push("### Minor Updates");
      parts.push(this.formatChangeTable(byType.minor));
      parts.push("");
    }

    if (byType.patch.length > 0) {
      parts.push("### Patch Updates");
      parts.push(this.formatChangeTable(byType.patch));
      parts.push("");
    }

    if (byType.added.length > 0) {
      parts.push("### Added Packages");
      parts.push(this.formatChangeTable(byType.added));
      parts.push("");
    }

    if (byType.removed.length > 0) {
      parts.push("### Removed Packages");
      parts.push(this.formatChangeTable(byType.removed));
      parts.push("");
    }

    if (byType.downgraded.length > 0) {
      parts.push("### Downgraded Packages");
      parts.push(this.formatChangeTable(byType.downgraded));
    }

    return parts.join("\n");
  }

  private formatChangeTable(changes: PackageChange[]): string {
    if (changes.length === 0) {
      return "";
    }

    // Table with Package, From Version, To Version columns for all change types
    const rows = [
      "| Package | From Version | To Version |",
      "|---------|--------------|------------|",
    ];

    for (const change of changes) {
      if (change.type === PackageChangeType.Upgraded) {
        rows.push(
          `| **${change.name}** | \`${change.fromVersion}\` | \`${change.toVersion}\` |`
        );
      } else if (change.type === PackageChangeType.Downgraded) {
        rows.push(
          `| **${change.name}** ⬇️ | \`${change.fromVersion}\` | \`${change.toVersion}\` |`
        );
      } else if (change.type === PackageChangeType.Added) {
        rows.push(`| **${change.name}** ➕ | N/A | \`${change.toVersion}\` |`);
      } else if (change.type === PackageChangeType.Removed) {
        rows.push(
          `| **${change.name}** ➖ | \`${change.fromVersion}\` | N/A |`
        );
      }
    }

    return rows.join("\n");
  }
}
