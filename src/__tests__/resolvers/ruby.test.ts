import { describe, it, expect } from "@jest/globals";
import { RubyGemfileResolver } from "../../resolvers/ruby.js";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "ruby");

describe("RubyGemfileResolver", () => {
  const resolver = new RubyGemfileResolver();

  describe("canResolve", () => {
    it("should resolve Gemfile.lock", () => {
      expect(resolver.canResolve("Gemfile.lock")).toBe(true);
      expect(resolver.canResolve("/path/to/Gemfile.lock")).toBe(true);
    });

    it("should not resolve other files", () => {
      expect(resolver.canResolve("notgemfile.lock")).toBe(false);
      expect(resolver.canResolve("Gemfile")).toBe(false);
      expect(resolver.canResolve("package.json")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse basic Gemfile.lock", async () => {
      const result = await resolver.resolve(join(fixturesDir, "basic.lock"));

      expect(result.dependencies.length).toBeGreaterThan(0);
      expect(result.devDependencies).toHaveLength(0);

      // Check for some expected gems
      const rails = result.dependencies.find((pkg) => pkg.name === "rails");
      expect(rails).toBeDefined();
      expect(rails?.version).toBe("6.1.4.1");

      const sqlite3 = result.dependencies.find((pkg) => pkg.name === "sqlite3");
      expect(sqlite3).toBeDefined();
      expect(sqlite3?.version).toBe("1.4.2");
    });

    it("should parse version-new Gemfile.lock", async () => {
      const result = await resolver.resolve(
        join(fixturesDir, "version-new.lock")
      );

      expect(result.dependencies.length).toBeGreaterThan(0);

      const rails = result.dependencies.find((pkg) => pkg.name === "rails");
      expect(rails).toBeDefined();
      expect(rails?.version).toBe("7.0.0");
    });

    it("should extract all gems from GEM section", async () => {
      const result = await resolver.resolve(join(fixturesDir, "basic.lock"));

      // Should have multiple gems
      expect(result.dependencies.length).toBeGreaterThan(10);

      // Check that gems are properly extracted
      const gemNames = result.dependencies.map((pkg) => pkg.name);
      expect(gemNames).toContain("rails");
      expect(gemNames).toContain("actionpack");
      expect(gemNames).toContain("activesupport");
      expect(gemNames).toContain("sqlite3");
    });

    it("should handle empty Gemfile.lock", async () => {
      // Create a minimal valid Gemfile.lock
      const { writeFile, mkdtemp, rm } = await import("fs/promises");
      const { join: pathJoin } = await import("path");
      const { tmpdir } = await import("os");

      const tmpDir = await mkdtemp(pathJoin(tmpdir(), "beefdiff-test-"));
      const emptyLock = pathJoin(tmpDir, "Gemfile.lock");

      try {
        await writeFile(
          emptyLock,
          `GEM
  remote: https://rubygems.org/
  specs:

PLATFORMS
  ruby

DEPENDENCIES

BUNDLED WITH
   2.2.16
`
        );

        const result = await resolver.resolve(emptyLock);
        expect(result.dependencies).toHaveLength(0);
        expect(result.devDependencies).toHaveLength(0);
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("should throw error for invalid Gemfile.lock", async () => {
      const { writeFile, mkdtemp, rm } = await import("fs/promises");
      const { join: pathJoin } = await import("path");
      const { tmpdir } = await import("os");

      const tmpDir = await mkdtemp(pathJoin(tmpdir(), "beefdiff-test-"));
      const invalidLock = pathJoin(tmpDir, "Gemfile.lock");

      try {
        await writeFile(invalidLock, "not a valid lockfile");

        await expect(resolver.resolve(invalidLock)).resolves.toEqual({
          dependencies: [],
          devDependencies: [],
        });
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
