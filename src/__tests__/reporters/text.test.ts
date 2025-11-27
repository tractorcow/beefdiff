import { describe, it, expect, beforeEach } from "@jest/globals";
import { TextReporter } from "../../reporters/text.js";
import type { ResolutionDiff } from "../../types/index.js";
import { PackageChangeType, VersionChangeType } from "../../types/index.js";

describe("TextReporter", () => {
  let reporter: TextReporter;

  beforeEach(() => {
    reporter = new TextReporter();
  });

  describe("report", () => {
    it("should format dependencies and devDependencies", () => {
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

      expect(result).toContain("DEPENDENCIES");
      expect(result).toContain("DEV DEPENDENCIES");
      expect(result).toContain("express");
      expect(result).toContain("jest");
    });

    it("should group changes by version type", () => {
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

      expect(result).toContain("Major Updates:");
      expect(result).toContain("Minor Updates:");
      expect(result).toContain("Patch Updates:");
    });

    it("should format added packages", () => {
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

      expect(result).toContain("Added Packages:");
      expect(result).toContain("new-package@1.0.0");
      expect(result).toContain("+");
    });

    it("should format removed packages", () => {
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

      expect(result).toContain("Removed Packages:");
      expect(result).toContain("old-package@1.0.0");
      expect(result).toContain("-");
    });

    it("should format upgraded packages", () => {
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

      expect(result).toContain("upgraded-package");
      expect(result).toContain("1.0.0");
      expect(result).toContain("1.1.0");
      expect(result).toContain("→");
    });

    it("should handle empty diff", () => {
      const diff: ResolutionDiff = {
        dependencies: [],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toBe("");
    });

    it("should handle only dependencies", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "package",
            type: PackageChangeType.Added,
            toVersion: "1.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("DEPENDENCIES");
      expect(result).not.toContain("DEV DEPENDENCIES");
    });

    it("should handle only devDependencies", () => {
      const diff: ResolutionDiff = {
        dependencies: [],
        devDependencies: [
          {
            name: "dev-package",
            type: PackageChangeType.Added,
            toVersion: "1.0.0",
          },
        ],
      };

      const result = reporter.report(diff);

      expect(result).toContain("DEV DEPENDENCIES");
      // Check that it doesn't contain the dependencies section heading (not just "DEPENDENCIES" which is a substring of "DEV DEPENDENCIES")
      expect(result).not.toMatch(/^DEPENDENCIES\n/m);
    });

    it("should format downgraded packages", () => {
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

      expect(result).toContain("Downgraded Packages:");
      expect(result).toContain("downgraded-package");
      expect(result).toContain("2.0.0");
      expect(result).toContain("1.0.0");
      expect(result).toContain("↓");
      expect(result).toContain("(downgraded)");
    });

    it("should show all change types in correct sections", () => {
      const diff: ResolutionDiff = {
        dependencies: [
          {
            name: "major-upgrade",
            type: PackageChangeType.Upgraded,
            versionChange: VersionChangeType.Major,
            fromVersion: "1.0.0",
            toVersion: "2.0.0",
          },
          {
            name: "added-package",
            type: PackageChangeType.Added,
            toVersion: "1.0.0",
          },
          {
            name: "removed-package",
            type: PackageChangeType.Removed,
            fromVersion: "1.0.0",
          },
          {
            name: "downgraded-package",
            type: PackageChangeType.Downgraded,
            fromVersion: "2.0.0",
            toVersion: "1.0.0",
          },
        ],
        devDependencies: [],
      };

      const result = reporter.report(diff);

      expect(result).toContain("Major Updates:");
      expect(result).toContain("Added Packages:");
      expect(result).toContain("Removed Packages:");
      expect(result).toContain("Downgraded Packages:");
    });
  });
});
