import type {
  Reporter,
  ResolutionDiff,
  PackageChange,
} from "../types/index.js";

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

    if (byType.other.length > 0) {
      parts.push("### Other Changes");
      parts.push(this.formatChangeList(byType.other));
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
      case "added":
        return `**${change.name}**@\`${change.toVersion}\` (added)`;
      case "removed":
        return `**${change.name}**@\`${change.fromVersion}\` (removed)`;
      case "upgraded":
        return `**${change.name}**: \`${change.fromVersion}\` → \`${change.toVersion}\``;
    }
  }

  private groupByVersionChange(changes: PackageChange[]): {
    major: PackageChange[];
    minor: PackageChange[];
    patch: PackageChange[];
    other: PackageChange[];
  } {
    const result = {
      major: [] as PackageChange[],
      minor: [] as PackageChange[],
      patch: [] as PackageChange[],
      other: [] as PackageChange[],
    };

    for (const change of changes) {
      if (change.type === "upgraded" && change.versionChange) {
        result[change.versionChange].push(change);
      } else {
        result.other.push(change);
      }
    }

    return result;
  }
}
