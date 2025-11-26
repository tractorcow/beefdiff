import type { Reporter } from "./types.js";
import type { ResolutionDiff, PackageChange } from "../diff.js";

export class HtmlReporter implements Reporter {
  report(diff: ResolutionDiff): string {
    const parts: string[] = [
      "<!DOCTYPE html>",
      "<html>",
      "<head>",
      "<meta charset='utf-8'>",
      "<title>Package Changes</title>",
      "<style>",
      this.getStyles(),
      "</style>",
      "</head>",
      "<body>",
    ];

    if (diff.dependencies.length > 0) {
      parts.push("<h1>Dependencies</h1>");
      parts.push(this.formatChanges(diff.dependencies));
    }

    if (diff.devDependencies.length > 0) {
      parts.push("<h1>Dev Dependencies</h1>");
      parts.push(this.formatChanges(diff.devDependencies));
    }

    parts.push("</body>", "</html>");
    return parts.join("\n");
  }

  private formatChanges(changes: PackageChange[]): string {
    const byType = this.groupByVersionChange(changes);
    const parts: string[] = [];

    if (byType.major.length > 0) {
      parts.push("<h2 class='major'>Major Updates</h2>");
      parts.push("<ul>");
      parts.push(...byType.major.map((c) => `<li>${this.formatChange(c)}</li>`));
      parts.push("</ul>");
    }

    if (byType.minor.length > 0) {
      parts.push("<h2 class='minor'>Minor Updates</h2>");
      parts.push("<ul>");
      parts.push(...byType.minor.map((c) => `<li>${this.formatChange(c)}</li>`));
      parts.push("</ul>");
    }

    if (byType.patch.length > 0) {
      parts.push("<h2 class='patch'>Patch Updates</h2>");
      parts.push("<ul>");
      parts.push(...byType.patch.map((c) => `<li>${this.formatChange(c)}</li>`));
      parts.push("</ul>");
    }

    if (byType.other.length > 0) {
      parts.push("<h2>Other Changes</h2>");
      parts.push("<ul>");
      parts.push(...byType.other.map((c) => `<li>${this.formatChange(c)}</li>`));
      parts.push("</ul>");
    }

    return parts.join("\n");
  }

  private formatChange(change: PackageChange): string {
    switch (change.type) {
      case "added":
        return `<span class='added'>+ ${change.name}@${change.toVersion}</span> (added)`;
      case "removed":
        return `<span class='removed'>- ${change.name}@${change.fromVersion}</span> (removed)`;
      case "upgraded":
        return `<span class='upgraded'>${change.name}</span>: <code>${change.fromVersion}</code> → <code>${change.toVersion}</code>`;
    }
  }

  private getStyles(): string {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
      }
      h1 {
        color: #333;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      }
      h2.major {
        color: #d32f2f;
      }
      h2.minor {
        color: #f57c00;
      }
      h2.patch {
        color: #388e3c;
      }
      ul {
        list-style-type: none;
        padding-left: 0;
      }
      li {
        margin: 5px 0;
        padding: 5px;
        background: #f5f5f5;
        border-radius: 3px;
      }
      code {
        background: #e0e0e0;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
      }
      .added {
        color: #388e3c;
        font-weight: bold;
      }
      .removed {
        color: #d32f2f;
        font-weight: bold;
      }
      .upgraded {
        font-weight: bold;
      }
    `;
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
