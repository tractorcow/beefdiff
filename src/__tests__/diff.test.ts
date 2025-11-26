import { describe, it, expect } from "@jest/globals";
import { diffResolutions } from "../diff.js";
import type { Resolution } from "../types/index.js";

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
      type: "added",
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
      type: "removed",
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
      type: "upgraded",
      versionChange: "major",
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
      type: "upgraded",
      versionChange: "minor",
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
      type: "upgraded",
      versionChange: "patch",
      fromVersion: "1.0.0",
      toVersion: "1.0.1",
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
    expect(result.dependencies[0].versionChange).toBe("major");
    expect(result.devDependencies).toHaveLength(1);
    expect(result.devDependencies[0].versionChange).toBe("minor");
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
      "upgraded"
    );
    expect(result.dependencies.find((c) => c.name === "package2")?.type).toBe(
      "upgraded"
    );
    expect(result.dependencies.find((c) => c.name === "package3")?.type).toBe(
      "removed"
    );
    expect(result.dependencies.find((c) => c.name === "package4")?.type).toBe(
      "added"
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
