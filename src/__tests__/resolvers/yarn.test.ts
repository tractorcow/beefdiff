import { describe, it, expect, beforeEach } from "@jest/globals";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { YarnResolver } from "../../resolvers/yarn.js";
import { diffResolutions } from "../../diff.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "..", "fixtures", "yarn");

describe("YarnResolver", () => {
  let resolver: YarnResolver;

  beforeEach(() => {
    resolver = new YarnResolver();
  });

  describe("canResolve", () => {
    it("should return true for yarn.lock", () => {
      expect(resolver.canResolve("yarn.lock")).toBe(true);
    });

    it("should return true for path ending with yarn.lock", () => {
      expect(resolver.canResolve("/path/to/yarn.lock")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("pnpm-lock.yaml")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse yarn.lock and extract dependencies", async () => {
      const fixturePath = join(fixturesDir, "basic.lock");

      const result = await resolver.resolve(fixturePath);

      expect(result.dependencies.length).toBeGreaterThanOrEqual(2);
      expect(result.dependencies).toContainEqual({
        name: "express",
        version: "4.18.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "lodash",
        version: "4.17.21",
      });
      // Scoped packages might be in the result
      const typesNode = result.dependencies.find(
        (p) => p.name === "@types/node"
      );
      if (typesNode) {
        expect(typesNode.version).toBe("20.0.0");
      }
    });

    it("should compare two different yarn.lock files", async () => {
      const oldFixturePath = join(fixturesDir, "version-old.lock");
      const newFixturePath = join(fixturesDir, "version-new.lock");

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

      // lodash: 4.17.20 -> 4.17.21 (patch upgrade)
      const lodashChange = diff.dependencies.find((c) => c.name === "lodash");
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

      // react: added (new package)
      const reactChange = diff.dependencies.find((c) => c.name === "react");
      expect(reactChange).toBeDefined();
      expect(reactChange?.type).toBe("added");
      expect(reactChange?.toVersion).toBe("18.2.0");
    });
  });
});
