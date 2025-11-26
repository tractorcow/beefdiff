import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { NpmResolver } from "../../resolvers/npm.js";
import { diffResolutions } from "../../diff.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "npm");

describe("NpmResolver", () => {
  let resolver: NpmResolver;

  beforeEach(() => {
    resolver = new NpmResolver();
  });

  describe("canResolve", () => {
    it("should return true for package-lock.json", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(true);
    });

    it("should return true for path ending with package-lock.json", () => {
      expect(resolver.canResolve("/path/to/package-lock.json")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("pnpm-lock.yaml")).toBe(false);
      expect(resolver.canResolve("package.json")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse npm lockfile and extract top-level dependencies", async () => {
      const fixturePath = join(fixturesDir, "basic.json");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [{ name: "express", version: "4.18.0" }],
        devDependencies: [{ name: "lodash", version: "4.17.21" }],
      });
    });

    it("should handle scoped packages", async () => {
      const fixturePath = join(fixturesDir, "scoped.json");

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

    it("should skip root package", async () => {
      const fixturePath = join(fixturesDir, "root-package.json");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).not.toContainEqual({
        name: "",
        version: "1.0.0",
      });
    });

    it("should skip nested modules", async () => {
      const fixturePath = join(fixturesDir, "nested-modules.json");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe("express");
      expect(result.dependencies).not.toContainEqual({
        name: "debug",
        version: "4.3.4",
      });
    });

    it("should handle empty lockfile", async () => {
      const fixturePath = join(fixturesDir, "empty.json");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [],
        devDependencies: [],
      });
    });

    it("should handle lockfile without packages field", async () => {
      const fixturePath = join(fixturesDir, "dependencies-only.json");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [{ name: "express", version: "4.18.0" }],
        devDependencies: [],
      });
    });

    it("should handle packages without version field", async () => {
      const fixturePath = join(fixturesDir, "no-version.json");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe("lodash");
    });

    it("should only extract top-level dependencies from lockfileVersion 1", async () => {
      const fixturePath = join(fixturesDir, "version1-nested.json");

      const result = await resolver.resolve(fixturePath);

      // Should only have top-level dependencies, not nested ones
      expect(result.dependencies).toHaveLength(2);
      expect(result.dependencies).toContainEqual({
        name: "express",
        version: "4.17.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "axios",
        version: "0.21.0",
      });
      // Should NOT include nested "debug" dependency
      expect(result.dependencies).not.toContainEqual({
        name: "express/debug",
        version: "4.3.4",
      });
      expect(result.dependencies).not.toContainEqual({
        name: "debug",
        version: "4.3.4",
      });
    });

    it("should parse lockfileVersion 2", async () => {
      const fixturePath = join(fixturesDir, "version2.json");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toContainEqual({
        name: "express",
        version: "4.18.0",
      });
      expect(result.devDependencies).toContainEqual({
        name: "lodash",
        version: "4.17.21",
      });
      expect(result.devDependencies).toContainEqual({
        name: "@types/node",
        version: "20.0.0",
      });
    });

    it("should compare two different lockfile versions", async () => {
      const oldFixturePath = join(fixturesDir, "version-old.json");
      const newFixturePath = join(fixturesDir, "version-new.json");

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

    it("should compare lockfileVersion 1 with lockfileVersion 2", async () => {
      const v1FixturePath = join(fixturesDir, "version-old.json");
      const v2FixturePath = join(fixturesDir, "version2.json");

      const v1Resolution = await resolver.resolve(v1FixturePath);
      const v2Resolution = await resolver.resolve(v2FixturePath);

      const diff = diffResolutions(v1Resolution, v2Resolution);

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

      // @types/node: 18.0.0 -> 20.0.0 (major upgrade, dev dependency)
      const typesNodeChange = diff.devDependencies.find(
        (c) => c.name === "@types/node"
      );
      expect(typesNodeChange).toBeDefined();
      expect(typesNodeChange?.type).toBe("upgraded");
      expect(typesNodeChange?.versionChange).toBe("major");
      expect(typesNodeChange?.fromVersion).toBe("18.0.0");
      expect(typesNodeChange?.toVersion).toBe("20.0.0");

      // axios: removed (not in v2 fixture)
      const axiosChange = diff.dependencies.find((c) => c.name === "axios");
      expect(axiosChange).toBeDefined();
      expect(axiosChange?.type).toBe("removed");
      expect(axiosChange?.fromVersion).toBe("0.21.0");

      // Verify total counts
      expect(diff.dependencies).toHaveLength(2); // express upgrade, axios removal
      expect(diff.devDependencies).toHaveLength(2); // lodash, @types/node upgrades
    });

    it("should compare lockfileVersion 2 with lockfileVersion 3", async () => {
      const v2FixturePath = join(fixturesDir, "version2.json");
      const v3FixturePath = join(fixturesDir, "version-new.json");

      const v2Resolution = await resolver.resolve(v2FixturePath);
      const v3Resolution = await resolver.resolve(v3FixturePath);

      const diff = diffResolutions(v2Resolution, v3Resolution);

      // react: added (new package in v3)
      const reactChange = diff.dependencies.find((c) => c.name === "react");
      expect(reactChange).toBeDefined();
      expect(reactChange?.type).toBe("added");
      expect(reactChange?.toVersion).toBe("18.2.0");

      // axios: added (not in v2, but in v3)
      const axiosChange = diff.dependencies.find((c) => c.name === "axios");
      expect(axiosChange).toBeDefined();
      expect(axiosChange?.type).toBe("added");
      expect(axiosChange?.toVersion).toBe("1.0.0");

      // Verify total counts
      expect(diff.dependencies).toHaveLength(2); // react, axios additions
      expect(diff.devDependencies).toHaveLength(0); // no changes in dev dependencies
    });
  });
});
