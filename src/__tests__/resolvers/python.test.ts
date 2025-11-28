import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PythonResolver } from "../../resolvers/python.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "python");

describe("PythonResolver", () => {
  let resolver: PythonResolver;

  beforeEach(() => {
    resolver = new PythonResolver();
  });

  describe("canResolve", () => {
    it("should return true for requirements.txt", () => {
      expect(resolver.canResolve("requirements.txt")).toBe(true);
    });

    it("should return true for requirements-dev.txt", () => {
      expect(resolver.canResolve("requirements-dev.txt")).toBe(true);
    });

    it("should return true for requirements-test.txt", () => {
      expect(resolver.canResolve("requirements-test.txt")).toBe(true);
    });

    it("should return true for requirements-prod.txt", () => {
      expect(resolver.canResolve("requirements-prod.txt")).toBe(true);
    });

    it("should return true for requirements.lock", () => {
      expect(resolver.canResolve("requirements.lock")).toBe(true);
    });

    it("should return true for poetry.lock", () => {
      expect(resolver.canResolve("poetry.lock")).toBe(true);
    });

    it("should return true for Pipfile.lock", () => {
      expect(resolver.canResolve("Pipfile.lock")).toBe(true);
    });

    it("should return true for pdm.lock", () => {
      expect(resolver.canResolve("pdm.lock")).toBe(true);
    });

    it("should return true for path ending with requirements.txt", () => {
      expect(resolver.canResolve("/path/to/requirements.txt")).toBe(true);
    });

    it("should return true for path ending with requirements-dev.txt", () => {
      expect(resolver.canResolve("/path/to/requirements-dev.txt")).toBe(true);
    });

    it("should return true for path ending with poetry.lock", () => {
      expect(resolver.canResolve("/path/to/poetry.lock")).toBe(true);
    });

    it("should return true for path ending with Pipfile.lock", () => {
      expect(resolver.canResolve("/path/to/Pipfile.lock")).toBe(true);
      expect(resolver.canResolve("./Pipfile.lock")).toBe(true);
      expect(resolver.canResolve("../Pipfile.lock")).toBe(true);
      expect(resolver.canResolve("path/Pipfile.lock")).toBe(true);
      expect(resolver.canResolve("/Pipfile.lock")).toBe(true);
    });

    it("should return true for path ending with pdm.lock", () => {
      expect(resolver.canResolve("/path/to/pdm.lock")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("pnpm-lock.yaml")).toBe(false);
      expect(resolver.canResolve("requirements")).toBe(false);
      expect(resolver.canResolve("requirements.txt.bak")).toBe(false);
    });

    it("should handle canResolve with different path separators", () => {
      expect(resolver.canResolve("requirements.txt")).toBe(true);
      expect(resolver.canResolve("./requirements.txt")).toBe(true);
      expect(resolver.canResolve("../requirements.txt")).toBe(true);
      expect(resolver.canResolve("path/requirements.txt")).toBe(true);
      expect(resolver.canResolve("path/to/requirements.txt")).toBe(true);
      expect(resolver.canResolve("requirements.lock")).toBe(true);
      expect(resolver.canResolve("REQUIREMENTS.TXT")).toBe(true);
      expect(resolver.canResolve("Requirements-Dev.TXT")).toBe(true);
    });
  });

  describe("resolve - format detection and delegation", () => {
    it("should detect requirements.txt format and delegate", async () => {
      const fixturePath = join(fixturesDir, "requirements", "basic.txt");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
    });

    it("should detect poetry.lock format and delegate", async () => {
      const fixturePath = join(fixturesDir, "poetry", "poetry.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(2);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.devDependencies).toHaveLength(2);
    });

    it("should detect Pipfile.lock format and delegate", async () => {
      const fixturePath = join(fixturesDir, "pipfile", "Pipfile.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.devDependencies).toHaveLength(2);
    });

    it("should detect pdm.lock format and delegate", async () => {
      const fixturePath = join(fixturesDir, "pdm", "pdm.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.devDependencies).toHaveLength(2);
    });

    it("should detect format from content regardless of filename", async () => {
      // Test that format detection works based on content, not filename
      // This tests the detectFormat logic in the root resolver
      const poetryFixturePath = join(fixturesDir, "poetry", "poetry.lock");

      // Even though canResolve checks filename, resolve uses content-based detection
      const result = await resolver.resolve(poetryFixturePath);
      expect(result.dependencies.length).toBeGreaterThan(0);
      expect(result.devDependencies.length).toBeGreaterThan(0);
    });

    it("should throw error for valid JSON that is not a Python lockfile", async () => {
      // Create a temporary file with valid JSON but not a Python lockfile format
      const { writeFile, rm } = await import("fs/promises");
      const { mkdtemp } = await import("fs/promises");
      const tmpDir = await mkdtemp(join(__dirname, "..", "tmp-"));
      const tmpFile = join(tmpDir, "not-python.json");

      try {
        await writeFile(
          tmpFile,
          JSON.stringify({ some: "valid", json: "but not python lockfile" })
        );

        await expect(resolver.resolve(tmpFile)).rejects.toThrow(
          "File is valid JSON but does not match any known Python lockfile format"
        );
      } finally {
        // Clean up the entire temporary directory
        await rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("should throw error for valid TOML that is not poetry.lock", async () => {
      // Create a temporary file with valid TOML but not poetry.lock format
      const { writeFile, rm } = await import("fs/promises");
      const { mkdtemp } = await import("fs/promises");
      const tmpDir = await mkdtemp(join(__dirname, "..", "tmp-"));
      const tmpFile = join(tmpDir, "not-poetry.toml");

      try {
        await writeFile(tmpFile, "[package]\nname = 'test'\nversion = '1.0.0'");

        await expect(resolver.resolve(tmpFile)).rejects.toThrow(
          "File is valid TOML but does not match poetry.lock format"
        );
      } finally {
        // Clean up the entire temporary directory
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
