import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { readFile } from "fs/promises";
import { parse } from "yaml";
import { PnpmResolver } from "../../resolvers/pnpm.js";

jest.mock("fs/promises", () => ({
  readFile: jest.fn<typeof readFile>(),
}));

jest.mock("yaml", () => ({
  parse: jest.fn<typeof parse>(),
}));

describe("PnpmResolver", () => {
  let resolver: PnpmResolver;
  let mockReadFile: jest.MockedFunction<typeof readFile>;
  let mockParse: jest.MockedFunction<typeof parse>;

  beforeEach(() => {
    resolver = new PnpmResolver();
    mockReadFile = jest.mocked(readFile);
    mockParse = jest.mocked(parse);
    jest.clearAllMocks();
  });

  describe("canResolve", () => {
    it("should return true for pnpm-lock.yaml", () => {
      expect(resolver.canResolve("pnpm-lock.yaml")).toBe(true);
    });

    it("should return true for path ending with pnpm-lock.yaml", () => {
      expect(resolver.canResolve("/path/to/pnpm-lock.yaml")).toBe(true);
    });

    it("should return false for other filenames", () => {
      expect(resolver.canResolve("package-lock.json")).toBe(false);
      expect(resolver.canResolve("composer.lock")).toBe(false);
      expect(resolver.canResolve("yarn.lock")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("should parse pnpm lockfile and extract top-level dependencies", async () => {
      const mockLockfile = {
        packages: {
          express: { version: "4.18.0" },
          lodash: { version: "4.17.21", dev: true },
        },
      };

      mockReadFile.mockResolvedValue("mock yaml content");
      mockParse.mockReturnValue(mockLockfile);

      const result = await resolver.resolve("/path/to/pnpm-lock.yaml");

      expect(result).toEqual({
        dependencies: [{ name: "express", version: "4.18.0" }],
        devDependencies: [{ name: "lodash", version: "4.17.21" }],
      });
    });

    it("should handle scoped packages", async () => {
      const mockLockfile = {
        packages: {
          "@types/node": { version: "20.0.0" },
          "@tractorcow/beefdiff": { version: "1.1.1" },
        },
      };

      mockReadFile.mockResolvedValue("mock yaml content");
      mockParse.mockReturnValue(mockLockfile);

      const result = await resolver.resolve("/path/to/pnpm-lock.yaml");

      expect(result.dependencies).toContainEqual({
        name: "@types/node",
        version: "20.0.0",
      });
      expect(result.dependencies).toContainEqual({
        name: "@tractorcow/beefdiff",
        version: "1.1.1",
      });
    });

    it("should skip nested modules", async () => {
      const mockLockfile = {
        packages: {
          express: { version: "4.18.0" },
          "express/node_modules/debug": { version: "4.3.4" },
          "node_modules/lodash": { version: "4.17.21" },
        },
      };

      mockReadFile.mockResolvedValue("mock yaml content");
      mockParse.mockReturnValue(mockLockfile);

      const result = await resolver.resolve("/path/to/pnpm-lock.yaml");

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe("express");
    });

    it("should extract package name from versioned keys", async () => {
      const mockLockfile = {
        packages: {
          "express@4.18.0": { version: "4.18.0" },
          "lodash@4.17.21": { version: "4.17.21" },
        },
      };

      mockReadFile.mockResolvedValue("mock yaml content");
      mockParse.mockReturnValue(mockLockfile);

      const result = await resolver.resolve("/path/to/pnpm-lock.yaml");

      expect(result.dependencies[0].name).toBe("express");
      expect(result.dependencies[1].name).toBe("lodash");
    });

    it("should handle empty lockfile", async () => {
      const mockLockfile = {};

      mockReadFile.mockResolvedValue("mock yaml content");
      mockParse.mockReturnValue(mockLockfile);

      const result = await resolver.resolve("/path/to/pnpm-lock.yaml");

      expect(result).toEqual({
        dependencies: [],
        devDependencies: [],
      });
    });

    it("should handle packages without version field", async () => {
      const mockLockfile = {
        packages: {
          express: { dev: false },
          lodash: { version: "4.17.21" },
        },
      };

      mockReadFile.mockResolvedValue("mock yaml content");
      mockParse.mockReturnValue(mockLockfile);

      const result = await resolver.resolve("/path/to/pnpm-lock.yaml");

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe("lodash");
    });

    it("should handle null or invalid package entries", async () => {
      const mockLockfile = {
        packages: {
          express: null,
          lodash: { version: "4.17.21" },
          invalid: "not an object",
        },
      };

      mockReadFile.mockResolvedValue("mock yaml content");
      mockParse.mockReturnValue(mockLockfile);

      const result = await resolver.resolve("/path/to/pnpm-lock.yaml");

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe("lodash");
    });
  });
});
