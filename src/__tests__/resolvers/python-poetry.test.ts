import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PythonPoetryResolver } from "../../resolvers/python-poetry.js";
import { diffResolutions } from "../../diff.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "python", "poetry");

describe("PythonPoetryResolver", () => {
  let resolver: PythonPoetryResolver;

  beforeEach(() => {
    resolver = new PythonPoetryResolver();
  });

  describe("canResolve", () => {
    it("should return true for poetry.lock", () => {
      expect(resolver.canResolve("poetry.lock")).toBe(true);
    });

    it("should return true for path ending with poetry.lock", () => {
      expect(resolver.canResolve("/path/to/poetry.lock")).toBe(true);
      expect(resolver.canResolve("./poetry.lock")).toBe(true);
      expect(resolver.canResolve("../poetry.lock")).toBe(true);
      expect(resolver.canResolve("path/poetry.lock")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("requirements.txt")).toBe(false);
      expect(resolver.canResolve("Pipfile.lock")).toBe(false);
      expect(resolver.canResolve("pdm.lock")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse poetry.lock and extract dependencies", async () => {
      const fixturePath = join(fixturesDir, "poetry.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies).toHaveLength(2);
      expect(result.dependencies).toContainEqual({
        name: "requests",
        version: "2.31.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "flask",
        version: "3.0.0",
      });

      expect(result.devDependencies).toHaveLength(2);
      expect(result.devDependencies).toContainEqual({
        name: "pytest",
        version: "7.4.0",
      });
      expect(result.devDependencies).toContainEqual({
        name: "black",
        version: "23.7.0",
      });
    });

    it("should compare two poetry.lock files", async () => {
      const oldFixturePath = join(fixturesDir, "poetry-version-old.lock");
      const newFixturePath = join(fixturesDir, "poetry-version-new.lock");

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

      // scipy: added (new package)
      const scipyChange = diff.dependencies.find((c) => c.name === "scipy");
      expect(scipyChange).toBeDefined();
      expect(scipyChange?.type).toBe("added");
    });
  });
});
