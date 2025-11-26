import { describe, it, expect } from "@jest/globals";
import { lookupResolvers } from "../../cli/resolver.js";
import { NpmResolver } from "../../resolvers/npm.js";
import { ComposerResolver } from "../../resolvers/composer.js";
import { PnpmResolver } from "../../resolvers/pnpm.js";

describe("lookupResolvers", () => {
  describe("with resolver name provided", () => {
    it("should return resolver when valid name is provided", () => {
      const result = lookupResolvers("source.lock", "target.lock", "npm");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(NpmResolver);
        expect(result.resolvers.targetResolver).toBeInstanceOf(NpmResolver);
        expect(result.resolvers.sourceResolver).toBe(
          result.resolvers.targetResolver
        );
      }
    });

    it("should return error when invalid resolver name is provided", () => {
      const result = lookupResolvers("source.lock", "target.lock", "invalid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unknown resolver");
        expect(result.error).toContain("invalid");
      }
    });

    it("should work with composer resolver", () => {
      const result = lookupResolvers("source.lock", "target.lock", "composer");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(
          ComposerResolver
        );
        expect(result.resolvers.targetResolver).toBeInstanceOf(
          ComposerResolver
        );
        expect(result.resolvers.sourceResolver).toBe(
          result.resolvers.targetResolver
        );
      }
    });

    it("should work with pnpm resolver", () => {
      const result = lookupResolvers("source.lock", "target.lock", "pnpm");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(PnpmResolver);
        expect(result.resolvers.targetResolver).toBeInstanceOf(PnpmResolver);
        expect(result.resolvers.sourceResolver).toBe(
          result.resolvers.targetResolver
        );
      }
    });
  });

  describe("without resolver name", () => {
    it("should use resolver from source file when found", () => {
      const result = lookupResolvers("package-lock.json", "target.lock");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(NpmResolver);
        expect(result.resolvers.targetResolver).toBeInstanceOf(NpmResolver);
        expect(result.resolvers.sourceResolver).toBe(
          result.resolvers.targetResolver
        );
      }
    });

    it("should use resolver from target file when source file doesn't match", () => {
      const result = lookupResolvers("unknown.lock", "composer.lock");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(
          ComposerResolver
        );
        expect(result.resolvers.targetResolver).toBeInstanceOf(
          ComposerResolver
        );
        expect(result.resolvers.sourceResolver).toBe(
          result.resolvers.targetResolver
        );
      }
    });

    it("should use same resolver for both files", () => {
      const result = lookupResolvers("pnpm-lock.yaml", "another.yaml");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(PnpmResolver);
        expect(result.resolvers.targetResolver).toBeInstanceOf(PnpmResolver);
        expect(result.resolvers.sourceResolver).toBe(
          result.resolvers.targetResolver
        );
      }
    });

    it("should return error when neither file matches a resolver", () => {
      const result = lookupResolvers("unknown1.lock", "unknown2.lock");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("No resolver found");
        expect(result.error).toContain("unknown1.lock");
        expect(result.error).toContain("unknown2.lock");
      }
    });

    it("should prefer source file resolver over target file resolver", () => {
      const result = lookupResolvers("package-lock.json", "composer.lock");

      expect(result.success).toBe(true);
      if (result.success) {
        // Should use npm resolver from source file, not composer from target
        expect(result.resolvers.sourceResolver).toBeInstanceOf(NpmResolver);
        expect(result.resolvers.targetResolver).toBeInstanceOf(NpmResolver);
      }
    });

    it("should handle scoped package lockfiles", () => {
      const result = lookupResolvers(
        "/path/to/package-lock.json",
        "another.lock"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(NpmResolver);
      }
    });

    it("should handle scoped composer lockfiles", () => {
      const result = lookupResolvers("unknown.lock", "/path/to/composer.lock");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(
          ComposerResolver
        );
      }
    });

    it("should handle scoped pnpm lockfiles", () => {
      const result = lookupResolvers("/path/to/pnpm-lock.yaml", "unknown.lock");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resolvers.sourceResolver).toBeInstanceOf(PnpmResolver);
      }
    });
  });
});
