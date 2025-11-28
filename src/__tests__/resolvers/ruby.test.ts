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
      const result = await resolver.resolve(join(fixturesDir, "empty.lock"));
      expect(result.dependencies).toHaveLength(0);
      expect(result.devDependencies).toHaveLength(0);
    });

    it("should handle invalid Gemfile.lock gracefully", async () => {
      const result = await resolver.resolve(join(fixturesDir, "invalid.lock"));
      expect(result.dependencies).toHaveLength(0);
      expect(result.devDependencies).toHaveLength(0);
    });
  });
});
