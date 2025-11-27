import type {
  Reporter,
  ResolutionDiff,
  PackageChange,
} from "../types/index.js";
import { PackageChangeType } from "../types/index.js";
import { groupByVersionChange } from "./utils.js";

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
    const byType = groupByVersionChange(changes);
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

    if (byType.added.length > 0) {
      parts.push("Added Packages:");
      parts.push(...byType.added.map((c) => this.formatChange(c)));
      parts.push("");
    }

    if (byType.removed.length > 0) {
      parts.push("Removed Packages:");
      parts.push(...byType.removed.map((c) => this.formatChange(c)));
      parts.push("");
    }

    if (byType.downgraded.length > 0) {
      parts.push("Downgraded Packages:");
      parts.push(...byType.downgraded.map((c) => this.formatChange(c)));
    }

    return parts.join("\n");
  }

  private formatChange(change: PackageChange): string {
    switch (change.type) {
      case PackageChangeType.Added:
        return `  + ${change.name}@${change.toVersion}`;
      case PackageChangeType.Removed:
        return `  - ${change.name}@${change.fromVersion}`;
      case PackageChangeType.Upgraded:
        return `  ~ ${change.name}: ${change.fromVersion} → ${change.toVersion}`;
      case PackageChangeType.Downgraded:
        return `  ↓ ${change.name}: ${change.fromVersion} → ${change.toVersion} (downgraded)`;
    }
  }
}
