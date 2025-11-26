import type { Reporter } from "./types.js";
import type { ResolutionDiff, PackageChange } from "../diff.js";

export class TextReporter implements Reporter {
  report(diff: ResolutionDiff): string {
    const parts: string[] = [];

    if (diff.dependencies.length > 0) {
      parts.push("DEPENDENCIES");
      parts.push(this.formatChanges(diff.dependencies));
    }

    if (diff.devDependencies.length > 0) {
      parts.push("DEV DEPENDENCIES");
      parts.push(this.formatChanges(diff.devDependencies));
    }

    return parts.join("\n\n");
  }

  private formatChanges(changes: PackageChange[]): string {
    const byType = this.groupByVersionChange(changes);
    const parts: string[] = [];

    if (byType.major.length > 0) {
      parts.push("Major Updates:");
      parts.push(...byType.major.map((c) => this.formatChange(c)));
      parts.push("");
    }

    if (byType.minor.length > 0) {
      parts.push("Minor Updates:");
      parts.push(...byType.minor.map((c) => this.formatChange(c)));
      parts.push("");
    }

    if (byType.patch.length > 0) {
      parts.push("Patch Updates:");
      parts.push(...byType.patch.map((c) => this.formatChange(c)));
      parts.push("");
    }

    if (byType.other.length > 0) {
      parts.push("Other Changes:");
      parts.push(...byType.other.map((c) => this.formatChange(c)));
    }

    return parts.join("\n");
  }

  private formatChange(change: PackageChange): string {
    switch (change.type) {
      case "added":
        return `  + ${change.name}@${change.toVersion}`;
      case "removed":
        return `  - ${change.name}@${change.fromVersion}`;
      case "upgraded":
        return `  ~ ${change.name}: ${change.fromVersion} → ${change.toVersion}`;
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
