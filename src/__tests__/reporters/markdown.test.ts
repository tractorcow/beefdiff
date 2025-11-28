import { describe, it, expect, beforeEach } from "@jest/globals";
import { MarkdownReporter } from "../../reporters/markdown.js";
import type { ResolutionDiff } from "../../types/index.js";
import { PackageChangeType, VersionChangeType } from "../../types/index.js";

describe("MarkdownReporter", () => {
  let reporter: MarkdownReporter;

  beforeEach(() => {
    reporter = new MarkdownReporter();
  });

  describe("report", () => {
    it("should format dependencies and devDependencies with markdown headings", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "express",
            type: PackageChangeType.Upgraded,
            versionChange: VersionChangeType.Major,
            fromVersion: "4.17.0",
            toVersion: "5.0.0",
          },
        ],
        devDependencies: [
          {
            name: "jest",
            type: PackageChangeType.Added,
            toVersion: "29.0.0",
          },
        ],
      };

      const result = reporter.report(diff);

      expect(result).toContain("## Dependencies");
      expect(result).toContain("## Dev Dependencies");
    });

    it("should group changes by version type with h3 headings", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "package1",
            type: PackageChangeType.Upgraded,
            versionChange: VersionChangeType.Major,
            fromVersion: "1.0.0",
            toVersion: "2.0.0",
          },
          {
            name: "package2",
            type: PackageChangeType.Upgraded,
            versionChange: VersionChangeType.Minor,
            fromVersion: "1.0.0",
            toVersion: "1.1.0",
          },
          {
            name: "package3",
            type: PackageChangeType.Upgraded,
            versionChange: VersionChangeType.Patch,
            fromVersion: "1.0.0",
            toVersion: "1.0.1",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("### Major Updates");
      expect(result).toContain("### Minor Updates");
      expect(result).toContain("### Patch Updates");
    });

    it("should format added packages with markdown table", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "new-package",
            type: PackageChangeType.Added,
            toVersion: "1.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("### Added Packages");
      expect(result).toContain("| Package | From Version | To Version |");
      expect(result).toContain("| **new-package** ➕ |");
      expect(result).toContain("| N/A |");
      expect(result).toContain("| `1.0.0` |");
    });

    it("should format removed packages with markdown table", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "old-package",
            type: PackageChangeType.Removed,
            fromVersion: "1.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("### Removed Packages");
      expect(result).toContain("| Package | From Version | To Version |");
      expect(result).toContain("| **old-package** ➖ |");
      expect(result).toContain("| `1.0.0` |");
      expect(result).toContain("| N/A |");
    });

    it("should format upgraded packages with markdown table", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "upgraded-package",
            type: PackageChangeType.Upgraded,
            versionChange: VersionChangeType.Minor,
            fromVersion: "1.0.0",
            toVersion: "1.1.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("| Package | From Version | To Version |");
      expect(result).toContain("| **upgraded-package** |");
      expect(result).toContain("| `1.0.0` |");
      expect(result).toContain("| `1.1.0` |");
    });

    it("should use table format for changes", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "package1",
            type: PackageChangeType.Added,
            toVersion: "1.0.0",
          },
          {
            name: "package2",
            type: PackageChangeType.Added,
            toVersion: "2.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("| Package | From Version | To Version |");
      expect(result).toContain("| **package1** ➕ |");
      expect(result).toContain("| **package2** ➕ |");
      expect(result).toContain("| N/A |");
    });

    it("should format downgraded packages with markdown table", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "downgraded-package",
            type: PackageChangeType.Downgraded,
            versionChange: VersionChangeType.Major,
            fromVersion: "2.0.0",
            toVersion: "1.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("### Downgraded Packages");
      expect(result).toContain("| Package | From Version | To Version |");
      expect(result).toContain("| **downgraded-package** ⬇️ |");
      expect(result).toContain("| `2.0.0` |");
      expect(result).toContain("| `1.0.0` |");
    });

    it("should handle empty diff", () => {
      const diff: ResolutionDiff = {
        dependencies: [],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toBe("");
    });
  });
});
