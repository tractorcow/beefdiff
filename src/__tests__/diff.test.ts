import { describe, it, expect } from "@jest/globals";
import { diffResolutions } from "../diff.js";
import type { Resolution } from "../types/index.js";
import { PackageChangeType, VersionChangeType } from "../types/index.js";

describe("diffResolutions", () => {
  it("should detect added packages", () => {
    const source: Resolution = {
      dependencies: [],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "new-package", version: "1.0.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toEqual({
      name: "new-package",
      type: PackageChangeType.Added,
      toVersion: "1.0.0",
    });
  });

  it("should detect removed packages", () => {
    const source: Resolution = {
      dependencies: [{ name: "old-package", version: "1.0.0" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toEqual({
      name: "old-package",
      type: PackageChangeType.Removed,
      fromVersion: "1.0.0",
    });
  });

  it("should detect major version upgrades", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "2.0.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toEqual({
      name: "package",
      type: PackageChangeType.Upgraded,
      versionChange: VersionChangeType.Major,
      fromVersion: "1.0.0",
      toVersion: "2.0.0",
    });
  });

  it("should detect minor version upgrades", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.1.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toEqual({
      name: "package",
      type: PackageChangeType.Upgraded,
      versionChange: VersionChangeType.Minor,
      fromVersion: "1.0.0",
      toVersion: "1.1.0",
    });
  });

  it("should detect patch version upgrades", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.1" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toEqual({
      name: "package",
      type: PackageChangeType.Upgraded,
      versionChange: VersionChangeType.Patch,
      fromVersion: "1.0.0",
      toVersion: "1.0.1",
    });
  });

  it("should detect major version downgrades", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "2.0.0" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toEqual({
      name: "package",
      type: PackageChangeType.Downgraded,
      versionChange: VersionChangeType.Major,
      fromVersion: "2.0.0",
      toVersion: "1.0.0",
    });
  });

  it("should detect minor version downgrades", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.1.0" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toEqual({
      name: "package",
      type: PackageChangeType.Downgraded,
      versionChange: VersionChangeType.Minor,
      fromVersion: "1.1.0",
      toVersion: "1.0.0",
    });
  });

  it("should detect patch version downgrades", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toEqual({
      name: "package",
      type: PackageChangeType.Downgraded,
      versionChange: VersionChangeType.Patch,
      fromVersion: "1.0.1",
      toVersion: "1.0.0",
    });
  });

  it("should not report unchanged packages", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(0);
  });

  it("should not report packages with same version but different build metadata", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0+build.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0+build.2" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    // Build metadata differences are ignored in semver, so should be treated as same version
    expect(result.dependencies).toHaveLength(0);
  });

  it("should not report packages with identical prerelease versions", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-alpha.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-alpha.1" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(0);
  });

  it("should not report packages with same version but different build metadata", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0+build.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0+build.2" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    // Build metadata differences are ignored in semver, so should be treated as same version
    expect(result.dependencies).toHaveLength(0);
  });

  it("should not report packages with identical prerelease versions", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-alpha.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-alpha.1" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(0);
  });

  it("should not report packages with same version and same build metadata", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0+build.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0+build.1" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(0);
  });

  it("should handle both dependencies and devDependencies", () => {
    const source: Resolution = {
      dependencies: [{ name: "dep", version: "1.0.0" }],
      devDependencies: [{ name: "dev-dep", version: "1.0.0" }],
    };

    const target: Resolution = {
      dependencies: [{ name: "dep", version: "2.0.0" }],
      devDependencies: [{ name: "dev-dep", version: "1.1.0" }],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0].versionChange).toBe(VersionChangeType.Major);
    expect(result.devDependencies).toHaveLength(1);
    expect(result.devDependencies[0].versionChange).toBe(
      VersionChangeType.Minor
    );
  });

  it("should handle multiple changes", () => {
    const source: Resolution = {
      dependencies: [
        { name: "package1", version: "1.0.0" },
        { name: "package2", version: "1.0.0" },
        { name: "package3", version: "1.0.0" },
      ],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [
        { name: "package1", version: "2.0.0" },
        { name: "package2", version: "1.1.0" },
        { name: "package4", version: "1.0.0" },
      ],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(4);
    expect(result.dependencies.find((c) => c.name === "package1")?.type).toBe(
      PackageChangeType.Upgraded
    );
    expect(result.dependencies.find((c) => c.name === "package2")?.type).toBe(
      PackageChangeType.Upgraded
    );
    expect(result.dependencies.find((c) => c.name === "package3")?.type).toBe(
      PackageChangeType.Removed
    );
    expect(result.dependencies.find((c) => c.name === "package4")?.type).toBe(
      PackageChangeType.Added
    );
  });

  it("should not report changes for invalid semver versions", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "invalid" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "also-invalid" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    // When semver parsing fails, getVersionChangeType returns null,
    // and the change is not added to the results
    expect(result.dependencies).toHaveLength(0);
  });

  it("should handle prerelease versions (beta to stable)", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-beta.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0].type).toBe(PackageChangeType.Upgraded);
    expect(result.dependencies[0].versionChange).toBe(VersionChangeType.Patch);
  });

  it("should handle prerelease versions (alpha to beta)", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-alpha.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-beta.1" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0].type).toBe(PackageChangeType.Upgraded);
    expect(result.dependencies[0].versionChange).toBe(VersionChangeType.Patch);
  });

  it("should handle prerelease versions across minor boundary", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-beta.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.1.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0].type).toBe(PackageChangeType.Upgraded);
    expect(result.dependencies[0].versionChange).toBe(VersionChangeType.Minor);
  });

  it("should handle prerelease versions across major boundary", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-beta.1" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "2.0.0" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0].type).toBe(PackageChangeType.Upgraded);
    expect(result.dependencies[0].versionChange).toBe(VersionChangeType.Major);
  });

  it("should handle downgrade from stable to prerelease", () => {
    const source: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0" }],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [{ name: "package", version: "1.0.0-beta.1" }],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0].type).toBe(PackageChangeType.Downgraded);
    expect(result.dependencies[0].versionChange).toBe(VersionChangeType.Patch);
  });

  it("should handle empty resolutions", () => {
    const source: Resolution = {
      dependencies: [],
      devDependencies: [],
    };

    const target: Resolution = {
      dependencies: [],
      devDependencies: [],
    };

    const result = diffResolutions(source, target);

    expect(result.dependencies).toHaveLength(0);
    expect(result.devDependencies).toHaveLength(0);
  });
});
