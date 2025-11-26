import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ComposerResolver } from "../../resolvers/composer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "composer");

describe("ComposerResolver", () => {
  let resolver: ComposerResolver;

  beforeEach(() => {
    resolver = new ComposerResolver();
  });

  describe("canResolve", () => {
    it("should return true for composer.lock", () => {
      expect(resolver.canResolve("composer.lock")).toBe(true);
    });

    it("should return true for path ending with composer.lock", () => {
      expect(resolver.canResolve("/path/to/composer.lock")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("pnpm-lock.yaml")).toBe(false);
      expect(resolver.canResolve("composer.json")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse composer lockfile and extract dependencies", async () => {
      const fixturePath = join(fixturesDir, "composer-basic.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [
          { name: "vendor/package1", version: "1.0.0" },
          { name: "vendor/package2", version: "2.0.0" },
        ],
        devDependencies: [{ name: "vendor/dev-package", version: "1.0.0" }],
      });
    });

    it("should handle lockfile with only packages", async () => {
      const fixturePath = join(fixturesDir, "composer-packages-only.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [{ name: "vendor/package", version: "1.0.0" }],
        devDependencies: [],
      });
    });

    it("should handle lockfile with only packages-dev", async () => {
      const fixturePath = join(fixturesDir, "composer-dev-only.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [],
        devDependencies: [{ name: "vendor/dev-package", version: "1.0.0" }],
      });
    });

    it("should handle empty lockfile", async () => {
      const fixturePath = join(fixturesDir, "composer-empty.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [],
        devDependencies: [],
      });
    });

    it("should skip packages without name or version", async () => {
      const fixturePath = join(fixturesDir, "composer-invalid-packages.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe("vendor/package1");
    });
  });
});
