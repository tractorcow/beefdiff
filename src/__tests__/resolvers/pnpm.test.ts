import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PnpmResolver } from "../../resolvers/pnpm.js";
import { diffResolutions } from "../../diff.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "pnpm");

describe("PnpmResolver", () => {
  let resolver: PnpmResolver;

  beforeEach(() => {
    resolver = new PnpmResolver();
  });

  describe("canResolve", () => {
    it("should return true for pnpm-lock.yaml", () => {
      expect(resolver.canResolve("pnpm-lock.yaml")).toBe(true);
    });

    it("should return true for path ending with pnpm-lock.yaml", () => {
      expect(resolver.canResolve("/path/to/pnpm-lock.yaml")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("yarn.lock")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse pnpm lockfile and extract top-level dependencies", async () => {
      const fixturePath = join(fixturesDir, "basic.yaml");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [{ name: "express", version: "4.18.0" }],
        devDependencies: [{ name: "lodash", version: "4.17.21" }],
      });
    });

    it("should handle scoped packages", async () => {
      const fixturePath = join(fixturesDir, "scoped.yaml");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toContainEqual({
        name: "@types/node",
        version: "20.0.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "@tractorcow/beefdiff",
        version: "1.1.1",
      });
    });

    it("should include ambiguous cases (may include some nested modules)", async () => {
      const fixturePath = join(fixturesDir, "nested-modules.yaml");

      const result = await resolver.resolve(fixturePath);

      // With inclusive logic, we include express and potentially nested modules
      // if the path structure is ambiguous
      expect(result.dependencies.length).toBeGreaterThanOrEqual(1);
      expect(result.dependencies).toContainEqual({
        name: "express",
        version: "4.18.0",
      });
    });

    it("should extract package name from versioned keys", async () => {
      const fixturePath = join(fixturesDir, "versioned-keys.yaml");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies[0].name).toBe("express");
      expect(result.dependencies[1].name).toBe("lodash");
    });

    it("should handle empty lockfile", async () => {
      const fixturePath = join(fixturesDir, "empty.yaml");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [],
        devDependencies: [],
      });
    });

    it("should handle packages without version field", async () => {
      const fixturePath = join(fixturesDir, "no-version.yaml");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe("lodash");
    });

    it("should handle null or invalid package entries", async () => {
      const fixturePath = join(fixturesDir, "invalid-entries.yaml");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe("lodash");
    });

    it("should compare two different lockfile versions", async () => {
      const oldFixturePath = join(fixturesDir, "version-old.yaml");
      const newFixturePath = join(fixturesDir, "version-new.yaml");

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

      // lodash: 4.17.20 -> 4.17.21 (patch upgrade, dev dependency)
      const lodashChange = diff.devDependencies.find((c) => c.name === "lodash");
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

      // @types/node: 18.0.0 -> 20.0.0 (major upgrade, dev dependency)
      const typesNodeChange = diff.devDependencies.find(
        (c) => c.name === "@types/node"
      );
      expect(typesNodeChange).toBeDefined();
      expect(typesNodeChange?.type).toBe("upgraded");
      expect(typesNodeChange?.versionChange).toBe("major");
      expect(typesNodeChange?.fromVersion).toBe("18.0.0");
      expect(typesNodeChange?.toVersion).toBe("20.0.0");

      // react: added (new package)
      const reactChange = diff.dependencies.find((c) => c.name === "react");
      expect(reactChange).toBeDefined();
      expect(reactChange?.type).toBe("added");
      expect(reactChange?.toVersion).toBe("18.2.0");

      // Verify total counts
      expect(diff.dependencies).toHaveLength(3); // express, axios upgrades, react addition
      expect(diff.devDependencies).toHaveLength(2); // lodash, @types/node upgrades
    });

    it("should handle monorepo paths with node_modules in the middle", async () => {
      const fixturePath = join(fixturesDir, "monorepo.yaml");

      const result = await resolver.resolve(fixturePath);

      // Should extract top-level packages even from monorepo paths
      expect(result.dependencies).toContainEqual({
        name: "express",
        version: "4.18.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "@scope/package",
        version: "1.0.0",
      });
      expect(result.devDependencies).toContainEqual({
        name: "lodash",
        version: "4.17.21",
      });
    });

    it("should extract version from package key when version is not in package object", async () => {
      const fixturePath = join(fixturesDir, "version-in-key.yaml");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toContainEqual({
        name: "@acemir/cssom",
        version: "0.9.23",
      });
      expect(result.dependencies).toContainEqual({
        name: "express",
        version: "4.18.0",
      });
    });
  });

  describe("extractPackageInfoFromName", () => {
    it("should extract name and version from scoped package with version in key", () => {
      const result = resolver["extractPackageInfoFromName"]("@scope/package@1.0.0");
      expect(result).toEqual({
        name: "@scope/package",
        version: "1.0.0",
      });
    });

    it("should extract name only from scoped package without version", () => {
      const result = resolver["extractPackageInfoFromName"]("@types/node");
      expect(result).toEqual({
        name: "@types/node",
        version: null,
      });
    });

    it("should extract name and version from non-scoped package with version in key", () => {
      const result = resolver["extractPackageInfoFromName"]("express@4.18.0");
      expect(result).toEqual({
        name: "express",
        version: "4.18.0",
      });
    });

    it("should extract name only from non-scoped package without version", () => {
      const result = resolver["extractPackageInfoFromName"]("lodash");
      expect(result).toEqual({
        name: "lodash",
        version: null,
      });
    });

    it("should handle package with version in node_modules path", () => {
      const result = resolver["extractPackageInfoFromName"](
        "node_modules/@acemir/cssom@0.9.23"
      );
      expect(result).toEqual({
        name: "@acemir/cssom",
        version: "0.9.23",
      });
    });

    it("should handle monorepo path with version in key", () => {
      const result = resolver["extractPackageInfoFromName"](
        "apps/my-app/node_modules/@scope/package@1.0.0"
      );
      expect(result).toEqual({
        name: "@scope/package",
        version: "1.0.0",
      });
    });

    it("should handle monorepo path without version", () => {
      const result = resolver["extractPackageInfoFromName"](
        "packages/shared/node_modules/lodash"
      );
      expect(result).toEqual({
        name: "lodash",
        version: null,
      });
    });

    it("should return null for nested modules with multiple node_modules segments", () => {
      const result = resolver["extractPackageInfoFromName"](
        "express/node_modules/debug/node_modules/something"
      );
      expect(result).toBeNull();
    });

    it("should return null for invalid nested paths", () => {
      const result = resolver["extractPackageInfoFromName"]("express/debug");
      expect(result).toBeNull();
    });

    it("should handle version with multiple @ symbols in scoped package", () => {
      const result = resolver["extractPackageInfoFromName"](
        "@scope/package@1.0.0-alpha.1"
      );
      expect(result).toEqual({
        name: "@scope/package",
        version: "1.0.0-alpha.1",
      });
    });

    it("should handle version with multiple @ symbols in non-scoped package", () => {
      const result = resolver["extractPackageInfoFromName"](
        "package@1.0.0@beta"
      );
      expect(result).toEqual({
        name: "package",
        version: "1.0.0@beta",
      });
    });

    it("should handle root package key", () => {
      const result = resolver["extractPackageInfoFromName"]("express");
      expect(result).toEqual({
        name: "express",
        version: null,
      });
    });

    it("should handle root scoped package key", () => {
      const result = resolver["extractPackageInfoFromName"]("@tractorcow/beefdiff");
      expect(result).toEqual({
        name: "@tractorcow/beefdiff",
        version: null,
      });
    });
  });
});
