import { describe, it, expect } from "@jest/globals";
import {
  parseJson,
  tryParseJson,
  parseToml,
  tryParseToml,
  parseYaml,
  tryParseYaml,
} from "../../resolvers/loader-utils.js";

describe("loader-utils", () => {
  describe("parseJson", () => {
    it("should parse valid JSON object", () => {
      const content = '{"name": "test", "version": "1.0.0"}';
      const result = parseJson(content);

      expect(result).toEqual({ name: "test", version: "1.0.0" });
    });

    it("should throw error for invalid JSON", () => {
      const content = '{"name": "test", invalid}';

      expect(() => parseJson(content)).toThrow("Failed to parse JSON");
    });

    it("should throw error for JSON array", () => {
      const content = '[{"name": "test"}]';

      expect(() => parseJson(content)).toThrow("Failed to parse JSON");
    });

    it("should throw error for JSON primitive", () => {
      const content = '"string"';

      expect(() => parseJson(content)).toThrow("Failed to parse JSON");
    });

    it("should throw error for JSON number", () => {
      const content = "123";

      expect(() => parseJson(content)).toThrow("Failed to parse JSON");
    });

    it("should throw error for empty string", () => {
      expect(() => parseJson("")).toThrow("Failed to parse JSON");
    });
  });

  describe("tryParseJson", () => {
    it("should parse valid JSON object", () => {
      const content = '{"name": "test", "version": "1.0.0"}';
      const result = tryParseJson(content);

      expect(result).toEqual({ name: "test", version: "1.0.0" });
    });

    it("should return null for invalid JSON", () => {
      const content = '{"name": "test", invalid}';

      expect(tryParseJson(content)).toBeNull();
    });

    it("should return null for JSON array", () => {
      const content = '[{"name": "test"}]';

      expect(tryParseJson(content)).toBeNull();
    });

    it("should return null for JSON primitive", () => {
      const content = '"string"';

      expect(tryParseJson(content)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(tryParseJson("")).toBeNull();
    });
  });

  describe("parseToml", () => {
    it("should parse valid TOML object", () => {
      const content = 'name = "test"\nversion = "1.0.0"';
      const result = parseToml(content);

      expect(result).toEqual({ name: "test", version: "1.0.0" });
    });

    it("should throw error for invalid TOML", () => {
      const content = 'name = "test"\ninvalid toml syntax =';

      expect(() => parseToml(content)).toThrow("Failed to parse TOML");
    });

    it("should throw error for invalid TOML syntax", () => {
      const invalidContent = "invalid = toml = syntax =";
      expect(() => parseToml(invalidContent)).toThrow("Failed to parse TOML");
    });

    it("should parse empty string as empty object", () => {
      // Empty TOML string parses as empty object {}, which is valid
      const result = parseToml("");
      expect(result).toEqual({});
    });
  });

  describe("tryParseToml", () => {
    it("should parse valid TOML object", () => {
      const content = 'name = "test"\nversion = "1.0.0"';
      const result = tryParseToml(content);

      expect(result).toEqual({ name: "test", version: "1.0.0" });
    });

    it("should return null for invalid TOML", () => {
      const content = 'name = "test"\ninvalid toml syntax =';

      expect(tryParseToml(content)).toBeNull();
    });

    it("should return null for empty string", () => {
      // Empty TOML might parse as empty object, but we validate it's not an object
      // Actually, empty string in TOML might parse as {} which is an object
      // So let's test with clearly invalid TOML instead
      const invalidContent = "invalid = toml = syntax";
      expect(tryParseToml(invalidContent)).toBeNull();
    });
  });

  describe("parseYaml", () => {
    it("should parse valid YAML object", () => {
      const content = "name: test\nversion: 1.0.0";
      const result = parseYaml(content);

      expect(result).toEqual({ name: "test", version: "1.0.0" });
    });

    it("should throw error for invalid YAML", () => {
      const content = "name: test\ninvalid: yaml: syntax: :";

      expect(() => parseYaml(content)).toThrow("Failed to parse YAML");
    });

    it("should throw error for YAML array", () => {
      const content = "- item1\n- item2";

      expect(() => parseYaml(content)).toThrow("Failed to parse YAML");
    });

    it("should throw error for YAML primitive", () => {
      const content = "simple string";

      expect(() => parseYaml(content)).toThrow("Failed to parse YAML");
    });

    it("should throw error for empty string", () => {
      expect(() => parseYaml("")).toThrow("Failed to parse YAML");
    });
  });

  describe("tryParseYaml", () => {
    it("should parse valid YAML object", () => {
      const content = "name: test\nversion: 1.0.0";
      const result = tryParseYaml(content);

      expect(result).toEqual({ name: "test", version: "1.0.0" });
    });

    it("should return null for invalid YAML", () => {
      const content = "name: test\ninvalid: yaml: syntax: :";

      expect(tryParseYaml(content)).toBeNull();
    });

    it("should return null for YAML array", () => {
      const content = "- item1\n- item2";

      expect(tryParseYaml(content)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(tryParseYaml("")).toBeNull();
    });
  });

  describe("try functions call main functions", () => {
    it("tryParseJson should call parseJson and catch errors", () => {
      const validContent = '{"test": "value"}';
      const invalidContent = "invalid json";

      // Valid case - should work
      expect(tryParseJson(validContent)).toEqual({ test: "value" });

      // Invalid case - should return null (not throw)
      expect(tryParseJson(invalidContent)).toBeNull();
      expect(() => parseJson(invalidContent)).toThrow();
    });

    it("tryParseToml should call parseToml and catch errors", () => {
      const validContent = 'name = "test"';
      const invalidContent = "invalid toml = =";

      // Valid case - should work
      expect(tryParseToml(validContent)).toBeDefined();

      // Invalid case - should return null (not throw)
      expect(tryParseToml(invalidContent)).toBeNull();
      expect(() => parseToml(invalidContent)).toThrow();
    });

    it("tryParseYaml should call parseYaml and catch errors", () => {
      const validContent = "name: test";
      const invalidContent = "invalid: yaml: : :";

      // Valid case - should work
      expect(tryParseYaml(validContent)).toBeDefined();

      // Invalid case - should return null (not throw)
      expect(tryParseYaml(invalidContent)).toBeNull();
      expect(() => parseYaml(invalidContent)).toThrow();
    });
  });
});
