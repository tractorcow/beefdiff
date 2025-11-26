import { describe, it, expect, beforeEach } from "@jest/globals";
import { MarkdownReporter } from "../../reporters/markdown.js";
import type { ResolutionDiff } from "../../types/index.js";

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
            type: "upgraded",
            versionChange: "major",
            fromVersion: "4.17.0",
            toVersion: "5.0.0",
          },
        ],
        devDependencies: [
          {
            name: "jest",
            type: "added",
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
            type: "upgraded",
            versionChange: "major",
            fromVersion: "1.0.0",
            toVersion: "2.0.0",
          },
          {
            name: "package2",
            type: "upgraded",
            versionChange: "minor",
            fromVersion: "1.0.0",
            toVersion: "1.1.0",
          },
          {
            name: "package3",
            type: "upgraded",
            versionChange: "patch",
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

    it("should format added packages with markdown", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "new-package",
            type: "added",
            toVersion: "1.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("**new-package**");
      expect(result).toContain("`1.0.0`");
      expect(result).toContain("(added)");
    });

    it("should format removed packages with markdown", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "old-package",
            type: "removed",
            fromVersion: "1.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("**old-package**");
      expect(result).toContain("`1.0.0`");
      expect(result).toContain("(removed)");
    });

    it("should format upgraded packages with markdown", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "upgraded-package",
            type: "upgraded",
            versionChange: "minor",
            fromVersion: "1.0.0",
            toVersion: "1.1.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("**upgraded-package**");
      expect(result).toContain("`1.0.0`");
      expect(result).toContain("`1.1.0`");
      expect(result).toContain("→");
    });

    it("should use list format for changes", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "package1",
            type: "added",
            toVersion: "1.0.0",
          },
          {
            name: "package2",
            type: "added",
            toVersion: "2.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toMatch(/^- \*\*package1\*\*/m);
      expect(result).toMatch(/^- \*\*package2\*\*/m);
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
