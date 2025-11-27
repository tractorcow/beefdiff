import { describe, it, expect } from "@jest/globals";
import { lookupResolvers } from "../../cli/resolver.js";
import { NpmResolver } from "../../resolvers/npm.js";
import { ComposerResolver } from "../../resolvers/composer.js";
import { PnpmResolver } from "../../resolvers/pnpm.js";

describe("lookupResolvers", () => {
  describe("with resolver name provided", () => {
    it("should return resolver when valid name is provided", () => {
      const result = lookupResolvers("source.lock", "target.lock", "npm");

      expect(result.sourceResolver).toBeInstanceOf(NpmResolver);
      expect(result.targetResolver).toBeInstanceOf(NpmResolver);
      expect(result.sourceResolver).toBe(result.targetResolver);
    });

    it("should throw when invalid resolver name is provided", () => {
      expect(() =>
        lookupResolvers("source.lock", "target.lock", "invalid")
      ).toThrow("Unknown resolver");
      expect(() =>
        lookupResolvers("source.lock", "target.lock", "invalid")
      ).toThrow("invalid");
    });

    it("should work with composer resolver", () => {
      const result = lookupResolvers("source.lock", "target.lock", "composer");

      expect(result.sourceResolver).toBeInstanceOf(ComposerResolver);
      expect(result.targetResolver).toBeInstanceOf(ComposerResolver);
      expect(result.sourceResolver).toBe(result.targetResolver);
    });

    it("should work with pnpm resolver", () => {
      const result = lookupResolvers("source.lock", "target.lock", "pnpm");

      expect(result.sourceResolver).toBeInstanceOf(PnpmResolver);
      expect(result.targetResolver).toBeInstanceOf(PnpmResolver);
      expect(result.sourceResolver).toBe(result.targetResolver);
    });
  });

  describe("without resolver name", () => {
    it("should use resolver from source file when found", () => {
      const result = lookupResolvers("package-lock.json", "target.lock");

      expect(result.sourceResolver).toBeInstanceOf(NpmResolver);
      expect(result.targetResolver).toBeInstanceOf(NpmResolver);
      expect(result.sourceResolver).toBe(result.targetResolver);
    });

    it("should use resolver from target file when source file doesn't match", () => {
      const result = lookupResolvers("unknown.lock", "composer.lock");

      expect(result.sourceResolver).toBeInstanceOf(ComposerResolver);
      expect(result.targetResolver).toBeInstanceOf(ComposerResolver);
      expect(result.sourceResolver).toBe(result.targetResolver);
    });

    it("should use same resolver for both files", () => {
      const result = lookupResolvers("pnpm-lock.yaml", "another.yaml");

      expect(result.sourceResolver).toBeInstanceOf(PnpmResolver);
      expect(result.targetResolver).toBeInstanceOf(PnpmResolver);
      expect(result.sourceResolver).toBe(result.targetResolver);
    });

    it("should throw when neither file matches a resolver", () => {
      expect(() => lookupResolvers("unknown1.lock", "unknown2.lock")).toThrow(
        "No resolver found"
      );
      expect(() => lookupResolvers("unknown1.lock", "unknown2.lock")).toThrow(
        "unknown1.lock"
      );
      expect(() => lookupResolvers("unknown1.lock", "unknown2.lock")).toThrow(
        "unknown2.lock"
      );
    });

    it("should prefer source file resolver over target file resolver", () => {
      const result = lookupResolvers("package-lock.json", "composer.lock");

      // Should use npm resolver from source file, not composer from target
      expect(result.sourceResolver).toBeInstanceOf(NpmResolver);
      expect(result.targetResolver).toBeInstanceOf(NpmResolver);
    });

    it("should handle scoped package lockfiles", () => {
      const result = lookupResolvers(
        "/path/to/package-lock.json",
        "another.lock"
      );

      expect(result.sourceResolver).toBeInstanceOf(NpmResolver);
    });

    it("should handle scoped composer lockfiles", () => {
      const result = lookupResolvers("unknown.lock", "/path/to/composer.lock");

      expect(result.sourceResolver).toBeInstanceOf(ComposerResolver);
    });

    it("should handle scoped pnpm lockfiles", () => {
      const result = lookupResolvers("/path/to/pnpm-lock.yaml", "unknown.lock");

      expect(result.sourceResolver).toBeInstanceOf(PnpmResolver);
    });
  });
});
