import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PythonRequirementsResolver } from "../../resolvers/python-requirements.js";
import { diffResolutions } from "../../diff.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "python", "requirements");

describe("PythonRequirementsResolver", () => {
  let resolver: PythonRequirementsResolver;

  beforeEach(() => {
    resolver = new PythonRequirementsResolver();
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

    it("should return true for path ending with requirements.txt", () => {
      expect(resolver.canResolve("/path/to/requirements.txt")).toBe(true);
      expect(resolver.canResolve("./requirements.txt")).toBe(true);
      expect(resolver.canResolve("../requirements.txt")).toBe(true);
      expect(resolver.canResolve("path/requirements.txt")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("poetry.lock")).toBe(false);
      expect(resolver.canResolve("requirements")).toBe(false);
      expect(resolver.canResolve("requirements.txt.bak")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse requirements.txt and extract dependencies", async () => {
      const fixturePath = join(fixturesDir, "basic.txt");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "flask",
        version: "3.0.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "numpy",
        version: "1.24.3",
      });
      expect(result.devDependencies).toHaveLength(0);
    });

    it("should handle comments in requirements.txt", async () => {
      const fixturePath = join(fixturesDir, "with-comments.txt");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
    });

    it("should handle version ranges by extracting first version", async () => {
      const fixturePath = join(fixturesDir, "with-ranges.txt");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      // For ranges, we extract the first version we find
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "flask",
        version: "3.0.0",
      });
    });

    it("should handle packages with extras", async () => {
      const fixturePath = join(fixturesDir, "with-extras.txt");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "django",
        version: "4.2.0",
      });
    });

    it("should handle empty requirements.txt", async () => {
      const fixturePath = join(fixturesDir, "empty.txt");

      const result = await resolver.resolve(fixturePath);

      expect(result).toEqual({
        dependencies: [],
        devDependencies: [],
      });
    });

    it("should handle --requirement flag", async () => {
      const fixturePath = join(fixturesDir, "with-requirement-flag.txt");

      const result = await resolver.resolve(fixturePath);

      // Should skip the -r line and parse other packages
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "flask",
        version: "3.0.0",
      });
      // Should not include packages from the included file
      expect(result.dependencies.length).toBe(2);
    });

    it("should handle --editable flag", async () => {
      const fixturePath = join(fixturesDir, "with-editable-flag.txt");

      const result = await resolver.resolve(fixturePath);

      // Should skip the -e and --editable lines
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "flask",
        version: "3.0.0",
      });
      expect(result.dependencies.length).toBe(2);
    });

    it("should skip URL-based installs", async () => {
      const fixturePath = join(fixturesDir, "with-url-installs.txt");

      const result = await resolver.resolve(fixturePath);

      // Should skip URL-based installs
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "flask",
        version: "3.0.0",
      });
      // Should not include URL-based packages
      expect(result.dependencies.length).toBe(2);
    });

    it("should handle inline comments", async () => {
      const fixturePath = join(fixturesDir, "with-inline-comments.txt");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "flask",
        version: "3.0.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "numpy",
        version: "1.24.3",
      });
      expect(result.dependencies).toContainEqual({
        name: "package",
        version: "1.0.0",
      });
    });

    it("should skip packages without version specifiers", async () => {
      const fixturePath = join(fixturesDir, "no-version-spec.txt");

      const result = await resolver.resolve(fixturePath);

      // Should include packages with versions
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "numpy",
        version: "1.24.3",
      });
      expect(result.dependencies).toContainEqual({
        name: "package-with-version",
        version: "1.0.0",
      });
      // Should skip packages without version (flask, django)
      expect(result.dependencies.length).toBe(3);
    });

    it("should handle version extraction fallbacks", async () => {
      const fixturePath = join(fixturesDir, "version-fallback.txt");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      // Should extract versions from ranges
      const package1 = result.dependencies.find(
        (p) => p.name === "package-range1"
      );
      expect(package1).toBeDefined();
      expect(package1?.version).toBe("1.0");

      const package2 = result.dependencies.find(
        (p) => p.name === "package-range2"
      );
      expect(package2).toBeDefined();
      expect(package2?.version).toBe("2.0");

      const package3 = result.dependencies.find(
        (p) => p.name === "package-short"
      );
      expect(package3).toBeDefined();
      expect(package3?.version).toBe("1.2");

      const package4 = result.dependencies.find(
        (p) => p.name === "package-long"
      );
      expect(package4).toBeDefined();
      // Version extraction includes the full version string including extra segments
      expect(package4?.version).toBe("1.2.3.4");

      const package5 = result.dependencies.find(
        (p) => p.name === "package-prerelease"
      );
      expect(package5).toBeDefined();
      // Version extraction includes prerelease identifiers
      expect(package5?.version).toBe("1.2.3-alpha.1");
    });

    it("should compare two different requirements.txt files", async () => {
      const oldFixturePath = join(fixturesDir, "version-old.txt");
      const newFixturePath = join(fixturesDir, "version-new.txt");

      const oldResolution = await resolver.resolve(oldFixturePath);
      const newResolution = await resolver.resolve(newFixturePath);

      const diff = diffResolutions(oldResolution, newResolution);

      // requests: 2.28.0 -> 2.31.0 (minor upgrade)
      const requestsChange = diff.dependencies.find(
        (c) => c.name === "requests"
      );
      expect(requestsChange).toBeDefined();
      expect(requestsChange?.type).toBe("upgraded");
      expect(requestsChange?.versionChange).toBe("minor");
      expect(requestsChange?.fromVersion).toBe("2.28.0");
      expect(requestsChange?.toVersion).toBe("2.31.0");

      // flask: 2.3.0 -> 3.0.0 (major upgrade)
      const flaskChange = diff.dependencies.find((c) => c.name === "flask");
      expect(flaskChange).toBeDefined();
      expect(flaskChange?.type).toBe("upgraded");
      expect(flaskChange?.versionChange).toBe("major");
      expect(flaskChange?.fromVersion).toBe("2.3.0");
      expect(flaskChange?.toVersion).toBe("3.0.0");

      // numpy: 1.23.0 -> 1.24.3 (minor upgrade)
      const numpyChange = diff.dependencies.find((c) => c.name === "numpy");
      expect(numpyChange).toBeDefined();
      expect(numpyChange?.type).toBe("upgraded");
      expect(numpyChange?.versionChange).toBe("minor");
      expect(numpyChange?.fromVersion).toBe("1.23.0");
      expect(numpyChange?.toVersion).toBe("1.24.3");

      // Verify total counts
      expect(diff.dependencies).toHaveLength(5); // 4 upgrades, 1 addition
    });

    it("should parse requirements.lock and extract dependencies", async () => {
      const fixturePath = join(fixturesDir, "requirements.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "flask",
        version: "3.0.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "numpy",
        version: "1.24.3",
      });
      expect(result.devDependencies).toHaveLength(0);
    });
  });
});
