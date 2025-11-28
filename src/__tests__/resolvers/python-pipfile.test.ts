import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PythonPipfileResolver } from "../../resolvers/python-pipfile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "python", "pipfile");

describe("PythonPipfileResolver", () => {
  let resolver: PythonPipfileResolver;

  beforeEach(() => {
    resolver = new PythonPipfileResolver();
  });

  describe("canResolve", () => {
    it("should return true for Pipfile.lock", () => {
      expect(resolver.canResolve("Pipfile.lock")).toBe(true);
    });

    it("should return true for path ending with Pipfile.lock", () => {
      expect(resolver.canResolve("/path/to/Pipfile.lock")).toBe(true);
      expect(resolver.canResolve("./Pipfile.lock")).toBe(true);
      expect(resolver.canResolve("../Pipfile.lock")).toBe(true);
      expect(resolver.canResolve("path/Pipfile.lock")).toBe(true);
      expect(resolver.canResolve("/Pipfile.lock")).toBe(true);
    });

    it("should handle edge cases in canResolve", () => {
      // Test with empty string (should use filename fallback)
      expect(resolver.canResolve("")).toBe(false);

      // Test with just "/"
      expect(resolver.canResolve("/")).toBe(false);

      // Test with filename that doesn't match (case-insensitive, so this matches)
      expect(resolver.canResolve("pipfile.lock")).toBe(true);
      expect(resolver.canResolve("Pipfile")).toBe(false);
      expect(resolver.canResolve("Pipfile.lock.bak")).toBe(false);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("requirements.txt")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse Pipfile.lock and extract dependencies", async () => {
      const fixturePath = join(fixturesDir, "Pipfile.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
    });

    it("should handle edge cases in Pipfile.lock", async () => {
      const fixturePath = join(fixturesDir, "Pipfile-edge-cases.lock");

      const result = await resolver.resolve(fixturePath);

      // Should include packages with valid versions
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });

      // Should handle short versions (1.2) - tests fallback regex
      const shortVersion = result.dependencies.find(
        (p) => p.name === "package-short-version"
      );
      expect(shortVersion).toBeDefined();
      expect(shortVersion?.version).toBe("1.2");

      // Should skip packages without version property
      const noVersion = result.dependencies.find(
        (p) => p.name === "package-no-version"
      );
      expect(noVersion).toBeUndefined();

      // Should skip packages that are not objects
      const nonObject = result.dependencies.find(
        (p) => p.name === "package-non-object"
      );
      expect(nonObject).toBeUndefined();

      // Should skip packages with non-string version (tests line 59)
      const nonStringVersion = result.dependencies.find(
        (p) => p.name === "package-non-string-version"
      );
      expect(nonStringVersion).toBeUndefined();

      // Should handle dev dependencies with version ranges
      expect(result.devDependencies).toContainEqual({
        name: "pytest",
        version: "7.0.0",
      });

      // Should skip dev packages without version
      const devNoVersion = result.devDependencies.find(
        (p) => p.name === "package-dev-no-version"
      );
      expect(devNoVersion).toBeUndefined();

      // Should skip dev packages that are not objects
      const devNonObject = result.devDependencies.find(
        (p) => p.name === "package-dev-non-object"
      );
      expect(devNonObject).toBeUndefined();

      // Should skip dev packages with non-string version
      const devNonStringVersion = result.devDependencies.find(
        (p) => p.name === "package-dev-non-string-version"
      );
      expect(devNonStringVersion).toBeUndefined();
    });

    it("should handle version extraction fallbacks", async () => {
      const fixturePath = join(fixturesDir, "Pipfile-edge-cases.lock");

      const result = await resolver.resolve(fixturePath);

      // Test fallback matching for versions without full semver (tests lines 70-77)
      // package-short-version has "==1.2" which should match fallback regex
      const shortVersion = result.dependencies.find(
        (p) => p.name === "package-short-version"
      );
      expect(shortVersion).toBeDefined();
      expect(shortVersion?.version).toBe("1.2");

      // package-invalid-version should be skipped (no valid version found)
      const invalidVersion = result.dependencies.find(
        (p) => p.name === "package-invalid-version"
      );
      expect(invalidVersion).toBeUndefined();
    });

    it("should handle Pipfile.lock without default or develop sections", async () => {
      const fixturePath = join(fixturesDir, "Pipfile-empty.lock");

      const result = await resolver.resolve(fixturePath);

      // Should return empty arrays when sections are missing
      expect(result.dependencies).toEqual([]);
      expect(result.devDependencies).toEqual([]);
    });
  });
});
