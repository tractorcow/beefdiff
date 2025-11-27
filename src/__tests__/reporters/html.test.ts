import { describe, it, expect, beforeEach } from "@jest/globals";
import { HtmlReporter } from "../../reporters/html.js";
import type { ResolutionDiff } from "../../types/index.js";
import { PackageChangeType, VersionChangeType } from "../../types/index.js";

describe("HtmlReporter", () => {
  let reporter: HtmlReporter;

  beforeEach(() => {
    reporter = new HtmlReporter();
  });

  describe("report", () => {
    it("should generate HTML document structure", () => {
      const diff: ResolutionDiff = {
        dependencies: [],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("<html>");
      expect(result).toContain("<head>");
      expect(result).toContain("<body>");
      expect(result).toContain("</html>");
    });

    it("should include CSS styles", () => {
      const diff: ResolutionDiff = {
        dependencies: [],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("<style>");
      expect(result).toContain("font-family");
      expect(result).toContain(".major");
      expect(result).toContain(".minor");
      expect(result).toContain(".patch");
    });

    it("should format dependencies and devDependencies with h1 headings", () => {
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

      expect(result).toContain("<h1>Dependencies</h1>");
      expect(result).toContain("<h1>Dev Dependencies</h1>");
    });

    it("should group changes by version type with h2 headings", () => {
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

      expect(result).toContain("<h2 class='major'>Major Updates</h2>");
      expect(result).toContain("<h2 class='minor'>Minor Updates</h2>");
      expect(result).toContain("<h2 class='patch'>Patch Updates</h2>");
    });

    it("should format added packages with HTML", () => {
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

      expect(result).toContain("<span class='added'>");
      expect(result).toContain("new-package@1.0.0");
      expect(result).toContain("(added)");
    });

    it("should format removed packages with HTML", () => {
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

      expect(result).toContain("<span class='removed'>");
      expect(result).toContain("old-package@1.0.0");
      expect(result).toContain("(removed)");
    });

    it("should format upgraded packages with HTML", () => {
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

      expect(result).toContain("<span class='upgraded'>");
      expect(result).toContain("<code>1.0.0</code>");
      expect(result).toContain("<code>1.1.0</code>");
      expect(result).toContain("→");
    });

    it("should use ul/li format for changes", () => {
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

      expect(result).toContain("<ul>");
      expect(result).toMatch(/<li>.*package1.*<\/li>/);
      expect(result).toMatch(/<li>.*package2.*<\/li>/);
    });

    it("should handle empty diff", () => {
      const diff: ResolutionDiff = {
        dependencies: [],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("<!DOCTYPE html>");
      expect(result).not.toContain("<h1>Dependencies</h1>");
      expect(result).not.toContain("<h1>Dev Dependencies</h1>");
    });
  });
});
