import { parse as parseTomlFromLib } from "@iarna/toml";
import { parse as parseYamlFromLib } from "yaml";

/**
 * Parse JSON content, throwing an error if parsing fails.
 */
export function parseJson(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("Parsed JSON is not an object");
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Try to parse JSON content. Returns null if parsing fails or result is not an object.
 */
export function tryParseJson(content: string): Record<string, unknown> | null {
  try {
    return parseJson(content);
  } catch {
    return null;
  }
}

/**
 * Parse TOML content, throwing an error if parsing fails.
 */
export function parseToml(content: string): Record<string, unknown> {
  try {
    const parsed = parseTomlFromLib(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("Parsed TOML is not an object");
  } catch (error) {
    throw new Error(
      `Failed to parse TOML: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Try to parse TOML content. Returns null if parsing fails or result is not an object.
 */
export function tryParseToml(content: string): Record<string, unknown> | null {
  try {
    return parseToml(content);
  } catch {
    return null;
  }
}

/**
 * Parse YAML content, throwing an error if parsing fails.
 */
export function parseYaml(content: string): Record<string, unknown> {
  try {
    const parsed = parseYamlFromLib(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("Parsed YAML is not an object");
  } catch (error) {
    throw new Error(
      `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Try to parse YAML content. Returns null if parsing fails or result is not an object.
 */
export function tryParseYaml(content: string): Record<string, unknown> | null {
  try {
    return parseYaml(content);
  } catch {
    return null;
  }
}
