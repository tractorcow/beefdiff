import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PythonResolver } from "../../resolvers/python.js";
import { diffResolutions } from "../../diff.js";

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

    it("should return true for path ending with requirements.txt", () => {
      expect(resolver.canResolve("/path/to/requirements.txt")).toBe(true);
    });

    it("should return true for path ending with requirements-dev.txt", () => {
      expect(resolver.canResolve("/path/to/requirements-dev.txt")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("pnpm-lock.yaml")).toBe(false);
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

      // pandas: 1.5.0 -> 2.0.0 (major upgrade)
      const pandasChange = diff.dependencies.find((c) => c.name === "pandas");
      expect(pandasChange).toBeDefined();
      expect(pandasChange?.type).toBe("upgraded");
      expect(pandasChange?.versionChange).toBe("major");
      expect(pandasChange?.fromVersion).toBe("1.5.0");
      expect(pandasChange?.toVersion).toBe("2.0.0");

      // scipy: added (new package)
      const scipyChange = diff.dependencies.find((c) => c.name === "scipy");
      expect(scipyChange).toBeDefined();
      expect(scipyChange?.type).toBe("added");
      expect(scipyChange?.toVersion).toBe("1.11.0");

      // Verify total counts
      expect(diff.dependencies).toHaveLength(5); // 4 upgrades, 1 addition
    });
  });
});
