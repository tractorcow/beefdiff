import { readFile } from "fs/promises";
import type { Resolver, Resolution } from "../types/index.js";
import { PythonLockfileFormat } from "../types/index.js";
import { tryParseJson, tryParseToml } from "./python-utils.js";
import { PythonRequirementsResolver } from "./python-requirements.js";
import { PythonPipfileResolver } from "./python-pipfile.js";
import { PythonPoetryResolver } from "./python-poetry.js";
import { PythonPdmResolver } from "./python-pdm.js";

export class PythonResolver implements Resolver {
  canResolve(filename: string): boolean {
    // Accept any Python-related filename - we'll detect format from content
    const basename = filename.split("/").pop() || filename;
    return /^(requirements.*\.(txt|lock)|(poetry|Pipfile|pdm)\.lock)$/i.test(
      basename
    );
  }

  async resolve(filePath: string): Promise<Resolution> {
    const content = await readFile(filePath, "utf-8");
    const format = this.detectFormat(content);

    switch (format) {
      case PythonLockfileFormat.Requirements: {
        const resolver = new PythonRequirementsResolver();
        return resolver.resolve(filePath);
      }
      case PythonLockfileFormat.Pipfile: {
        const resolver = new PythonPipfileResolver();
        return resolver.resolve(filePath);
      }
      case PythonLockfileFormat.Poetry: {
        const resolver = new PythonPoetryResolver();
        return resolver.resolve(filePath);
      }
      case PythonLockfileFormat.Pdm: {
        const resolver = new PythonPdmResolver();
        return resolver.resolve(filePath);
      }
      default:
        throw new Error(`Unsupported Python lockfile format: ${format}`);
    }
  }

  private detectFormat(content: string): PythonLockfileFormat {
    const trimmed = content.trim();

    // Try JSON first (Pipfile.lock or pdm.lock)
    const json = tryParseJson(trimmed);
    if (json !== null) {
      // Skip empty JSON objects (allow fallback to requirements.txt)
      const keys = Object.keys(json);
      if (keys.length === 0) {
        // Empty JSON, continue to other formats
      } else {
        // Pipfile.lock has _meta key
        if ("_meta" in json) {
          return PythonLockfileFormat.Pipfile;
        }
        // pdm.lock has package array (required for parsing)
        // Check for package array first, then other PDM-specific keys
        if ("package" in json && Array.isArray(json.package)) {
          return PythonLockfileFormat.Pdm;
        }
        // If it has PDM-specific keys but no package array, it might be malformed
        // but we'll still try to detect it as PDM (parser will handle errors)
        if (
          ("metadata" in json || "content_hash" in json) &&
          !("_meta" in json)
        ) {
          return PythonLockfileFormat.Pdm;
        }
        // Valid JSON with content but doesn't match any known Python lockfile format
        throw new Error(
          "File is valid JSON but does not match any known Python lockfile format (Pipfile.lock, pdm.lock)"
        );
      }
    }

    // Try TOML (poetry.lock)
    const toml = tryParseToml(trimmed);
    if (toml !== null) {
      // Skip empty TOML objects (allow fallback to requirements.txt)
      const keys = Object.keys(toml);
      if (keys.length === 0) {
        // Empty TOML, continue to requirements.txt
      } else {
        // poetry.lock has [[package]] array sections
        if ("package" in toml && Array.isArray(toml.package)) {
          return PythonLockfileFormat.Poetry;
        }
        // Valid TOML with content but doesn't match poetry.lock format
        throw new Error(
          "File is valid TOML but does not match poetry.lock format"
        );
      }
    }

    // Fallback to requirements.txt format (plain text)
    return PythonLockfileFormat.Requirements;
  }
}
