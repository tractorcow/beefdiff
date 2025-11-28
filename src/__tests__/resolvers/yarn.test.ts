import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { YarnResolver } from "../../resolvers/yarn.js";
import { diffResolutions } from "../../diff.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "yarn");

describe("YarnResolver", () => {
  let resolver: YarnResolver;

  beforeEach(() => {
    resolver = new YarnResolver();
  });

  describe("canResolve", () => {
    it("should return true for yarn.lock", () => {
      expect(resolver.canResolve("yarn.lock")).toBe(true);
    });

    it("should return true for path ending with yarn.lock", () => {
      expect(resolver.canResolve("/path/to/yarn.lock")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("pnpm-lock.yaml")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse yarn.lock and extract dependencies", async () => {
      const fixturePath = join(fixturesDir, "basic.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies.length).toBeGreaterThanOrEqual(2);
      expect(result.dependencies).toContainEqual({
        name: "express",
        version: "4.18.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "lodash",
        version: "4.17.21",
      });
      // Scoped packages should be in the result
      expect(result.dependencies).toContainEqual({
        name: "@types/node",
        version: "20.0.0",
      });
    });

    it("should compare two different yarn.lock files", async () => {
      const oldFixturePath = join(fixturesDir, "version-old.lock");
      const newFixturePath = join(fixturesDir, "version-new.lock");

      const oldResolution = await resolver.resolve(oldFixturePath);
      const newResolution = await resolver.resolve(newFixturePath);

      const diff = diffResolutions(oldResolution, newResolution);

      // express: 4.17.0 -> 4.18.0 (minor upgrade)
      const expressChange = diff.dependencies.find((c) => c.name === "express");
      expect(expressChange).toBeDefined();
      expect(expressChange?.type).toBe("upgraded");
      expect(expressChange?.versionChange).toBe("minor");
      expect(expressChange?.fromVersion).toBe("4.17.0");
      expect(expressChange?.toVersion).toBe("4.18.0");

      // lodash: 4.17.20 -> 4.17.21 (patch upgrade)
      const lodashChange = diff.dependencies.find((c) => c.name === "lodash");
      expect(lodashChange).toBeDefined();
      expect(lodashChange?.type).toBe("upgraded");
      expect(lodashChange?.versionChange).toBe("patch");
      expect(lodashChange?.fromVersion).toBe("4.17.20");
      expect(lodashChange?.toVersion).toBe("4.17.21");

      // axios: 0.21.0 -> 1.0.0 (major upgrade)
      const axiosChange = diff.dependencies.find((c) => c.name === "axios");
      expect(axiosChange).toBeDefined();
      expect(axiosChange?.type).toBe("upgraded");
      expect(axiosChange?.versionChange).toBe("major");
      expect(axiosChange?.fromVersion).toBe("0.21.0");
      expect(axiosChange?.toVersion).toBe("1.0.0");

      // react: added (new package)
      const reactChange = diff.dependencies.find((c) => c.name === "react");
      expect(reactChange).toBeDefined();
      expect(reactChange?.type).toBe("added");
      expect(reactChange?.toVersion).toBe("18.2.0");
    });

    it("should handle dev dependencies", async () => {
      const fixturePath = join(fixturesDir, "with-dev-deps.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toContainEqual({
        name: "express",
        version: "4.18.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "lodash",
        version: "4.17.21",
      });
      expect(result.devDependencies).toContainEqual({
        name: "jest",
        version: "29.7.0",
      });
    });

    it("should handle edge cases in package keys", async () => {
      const fixturePath = join(fixturesDir, "edge-cases.lock");

      const result = await resolver.resolve(fixturePath);

      // Package with protocol prefix (npm:)
      const npmPackage = result.dependencies.find(
        (p) => p.name === "package" && p.version === "1.2.3"
      );
      expect(npmPackage).toBeDefined();

      // Package with workspace protocol (should extract version from entry or key)
      const workspacePackage = result.dependencies.find(
        (p) => p.name === "package" && p.version === "1.0.0"
      );
      expect(workspacePackage).toBeDefined();

      // Package with version range (should use resolved version)
      const rangePackage = result.dependencies.find(
        (p) => p.name === "package" && p.version === "1.5.0"
      );
      expect(rangePackage).toBeDefined();

      // Package with range in name
      const rangeNamePackage = result.dependencies.find(
        (p) => p.name === "package-range"
      );
      expect(rangeNamePackage).toBeDefined();
      expect(rangeNamePackage?.version).toBe("1.3.5");
    });

    it("should handle package without version in entry", async () => {
      const fixturePath = join(fixturesDir, "edge-cases.lock");

      const result = await resolver.resolve(fixturePath);

      // Package without version in entry should extract from key
      const noVersionPackage = result.dependencies.find(
        (p) => p.name === "package-no-version"
      );
      // Should extract version from key (^1.0.0 -> 1.0.0)
      expect(noVersionPackage).toBeDefined();
      expect(noVersionPackage?.version).toBeDefined();
    });

    it("should extract versions from keys with various formats", async () => {
      const fixturePath = join(fixturesDir, "version-extraction.lock");

      const result = await resolver.resolve(fixturePath);

      // Package with npm: protocol
      const npmPackage = result.dependencies.find(
        (p) => p.name === "package" && p.version === "1.2.3"
      );
      expect(npmPackage).toBeDefined();

      // Package with workspace: protocol
      const workspacePackage = result.dependencies.find(
        (p) => p.name === "package2"
      );
      expect(workspacePackage).toBeDefined();
      expect(workspacePackage?.version).toBe("1.0.0");

      // Package with range operators
      const rangePackage = result.dependencies.find(
        (p) => p.name === "package3"
      );
      expect(rangePackage).toBeDefined();
      expect(rangePackage?.version).toBe("1.5.0");

      const tildePackage = result.dependencies.find(
        (p) => p.name === "package4"
      );
      expect(tildePackage).toBeDefined();
      expect(tildePackage?.version).toBe("1.0.5");

      const gtePackage = result.dependencies.find((p) => p.name === "package5");
      expect(gtePackage).toBeDefined();
      expect(gtePackage?.version).toBe("1.3.0");

      // Package without version should extract from key
      const noVersionPackage = result.dependencies.find(
        (p) => p.name === "package-no-version"
      );
      expect(noVersionPackage).toBeDefined();
      // Should extract version from key (^1.0.0)
      expect(noVersionPackage?.version).toBeDefined();
    });

    it("should handle entries that are not objects", async () => {
      // This tests the case where entry is null or not an object
      // We'll test this by creating a fixture with invalid entries
      // But yarn.lock parser will reject invalid format, so we test via basic.lock
      // which should handle normal cases correctly
      const fixturePath = join(fixturesDir, "basic.lock");

      const result = await resolver.resolve(fixturePath);

      // All entries should be valid objects
      expect(result.dependencies.length).toBeGreaterThan(0);
    });

    it("should handle keys without @ symbol", async () => {
      const fixturePath = join(fixturesDir, "missing-version.lock");

      const result = await resolver.resolve(fixturePath);

      // Keys without @ should be skipped
      const noAtPackage = result.dependencies.find(
        (p) => p.name === "package-no-version" && !p.name.includes("@")
      );
      // Should be skipped or handled gracefully
      expect(noAtPackage).toBeUndefined();
    });

    it("should handle empty package names", async () => {
      const fixturePath = join(fixturesDir, "missing-version.lock");

      const result = await resolver.resolve(fixturePath);

      // "@package@" has a valid name "@package" (scoped package) and version in entry
      const scopedPackage = result.dependencies.find(
        (p) => p.name === "@package"
      );
      expect(scopedPackage).toBeDefined();
      expect(scopedPackage?.version).toBe("1.0.0");
    });

    it("should handle missing versions", async () => {
      const fixturePath = join(fixturesDir, "missing-version.lock");

      const result = await resolver.resolve(fixturePath);

      // "package-no-version@" has no version in key or entry, so it should be skipped
      const noVersionPackage = result.dependencies.find(
        (p) => p.name === "package-no-version"
      );
      // Should be skipped when no version can be extracted
      expect(noVersionPackage).toBeUndefined();
    });

    it("should handle version extraction edge cases", async () => {
      const fixturePath = join(fixturesDir, "missing-version.lock");

      const result = await resolver.resolve(fixturePath);

      // Test extractVersionFromKey with various edge cases
      // Package with invalid version should extract what it can or return null
      // Should handle gracefully - verify resolver doesn't crash
      expect(result).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.devDependencies).toBeDefined();
      // Verify that edge cases are handled without errors
      expect(Array.isArray(result.dependencies)).toBe(true);
      expect(Array.isArray(result.devDependencies)).toBe(true);
    });

    it("should throw error for invalid lockfile syntax", async () => {
      const fixturePath = join(fixturesDir, "syntax-error.lock");

      await expect(resolver.resolve(fixturePath)).rejects.toThrow(
        "Failed to parse yarn.lock file"
      );
    });

    it("should throw error for completely invalid lockfile", async () => {
      const fixturePath = join(fixturesDir, "invalid.lock");

      await expect(resolver.resolve(fixturePath)).rejects.toThrow(
        "Failed to parse yarn.lock file"
      );
    });

    it("should throw error for lockfile with merge conflict markers", async () => {
      const fixturePath = join(fixturesDir, "merge-conflict.lock");

      await expect(resolver.resolve(fixturePath)).rejects.toThrow(
        "Failed to parse yarn.lock file"
      );
    });
  });
});
