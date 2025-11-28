import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { mkdtemp, rm, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { run } from "../app.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, "fixtures");

describe("run", () => {
  let originalArgv: string[];
  let originalProcessExit: typeof process.exit;
  let tempDir: string;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(async () => {
    originalArgv = process.argv;
    originalProcessExit = process.exit;
    tempDir = await mkdtemp(join(tmpdir(), "beefdiff-test-"));
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    process.argv = originalArgv;
    process.exit = originalProcessExit;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should output text report to stdout by default", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain("DEPENDENCIES");
    expect(output).toContain("express");
  });

  it("should write report to file when --output is specified", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    const outputFile = join(tempDir, "report.txt");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      "--output",
      outputFile,
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Report written to ${outputFile}`
    );
    const content = await readFile(outputFile, "utf-8");
    expect(content).toContain("DEPENDENCIES");
    expect(content).toContain("express");
  });

  it("should generate HTML report when --format html is specified", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      "--format",
      "html",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain("<!DOCTYPE html>");
    expect(output).toContain("<html>");
  });

  it("should generate markdown report when --format markdown is specified", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      "--format",
      "markdown",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain("# Dependencies");
    // The report should contain at least one section header
    expect(
      output.includes("## Added") ||
        output.includes("## Removed") ||
        output.includes("## Upgraded") ||
        output.includes("### Major") ||
        output.includes("### Minor") ||
        output.includes("### Patch")
    ).toBe(true);
  });

  it("should use specified resolver when --resolver is provided", async () => {
    const sourceFile = join(fixturesDir, "composer", "composer-basic.lock");
    const targetFile = join(fixturesDir, "composer", "composer-basic.lock");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "composer",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should work with npm resolver", async () => {
    const sourceFile = join(fixturesDir, "npm", "basic.json");
    const targetFile = join(fixturesDir, "npm", "basic.json");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should work with pnpm resolver", async () => {
    const sourceFile = join(fixturesDir, "pnpm", "basic.yaml");
    const targetFile = join(fixturesDir, "pnpm", "basic.yaml");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "pnpm",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should work with python resolver", async () => {
    const sourceFile = join(fixturesDir, "python", "requirements", "basic.txt");
    const targetFile = join(fixturesDir, "python", "requirements", "basic.txt");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "python",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should work with yarn resolver", async () => {
    const sourceFile = join(fixturesDir, "yarn", "basic.lock");
    const targetFile = join(fixturesDir, "yarn", "basic.lock");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "yarn",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should handle short format option -f", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      "-f",
      "html",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain("<!DOCTYPE html>");
  });

  it("should handle short resolver option -r", async () => {
    const sourceFile = join(fixturesDir, "composer", "composer-basic.lock");
    const targetFile = join(fixturesDir, "composer", "composer-basic.lock");
    process.argv = [
      "node",
      "beefdiff",
      "-r",
      "composer",
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
  });

  it("should handle short output option -o", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    const outputFile = join(tempDir, "report.md");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      "-o",
      outputFile,
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    const content = await readFile(outputFile, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("should combine multiple options", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    const outputFile = join(tempDir, "combined.html");
    process.argv = [
      "node",
      "beefdiff",
      "--format",
      "html",
      "--resolver",
      "npm",
      "--output",
      outputFile,
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    const content = await readFile(outputFile, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Report written to ${outputFile}`
    );
  });

  it("should detect resolver from file extension when not specified", async () => {
    // Create files with proper names that resolvers can detect
    const sourceFile = join(tempDir, "pnpm-lock.yaml");
    const targetFile = join(tempDir, "pnpm-lock-new.yaml");
    const sourceContent = await readFile(
      join(fixturesDir, "pnpm", "basic.yaml"),
      "utf-8"
    );
    const targetContent = await readFile(
      join(fixturesDir, "pnpm", "basic.yaml"),
      "utf-8"
    );
    await writeFile(sourceFile, sourceContent);
    await writeFile(targetFile, targetContent);
    process.argv = ["node", "beefdiff", sourceFile, targetFile];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should show help when --help is specified", async () => {
    process.argv = ["node", "beefdiff", "--help"];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toContain("beefdiff");
    expect(output).toContain("USAGE");
  });

  it("should show version when --version is specified", async () => {
    process.argv = ["node", "beefdiff", "--version"];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0] as string;
    expect(output).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("should handle short help option -h", async () => {
    process.argv = ["node", "beefdiff", "-h"];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should handle short version option -v", async () => {
    process.argv = ["node", "beefdiff", "-v"];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should throw error when source file is missing", async () => {
    process.argv = ["node", "beefdiff", "target.lock"];

    await expect(run()).rejects.toThrow("Missing required arguments");
  });

  it("should throw error when target file is missing", async () => {
    process.argv = ["node", "beefdiff", "source.lock"];

    await expect(run()).rejects.toThrow("Missing required arguments");
  });

  it("should throw error when invalid resolver is specified", async () => {
    const sourceFile = join(fixturesDir, "npm", "basic.json");
    const targetFile = join(fixturesDir, "npm", "basic.json");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "invalid",
      sourceFile,
      targetFile,
    ];

    await expect(run()).rejects.toThrow("Unknown resolver");
  });

  it("should throw error when file does not exist", async () => {
    process.argv = [
      "node",
      "beefdiff",
      "/nonexistent/source.json",
      "/nonexistent/target.json",
    ];

    await expect(run()).rejects.toThrow();
  });

  it("should throw error when no resolver can be found for files", async () => {
    // Create temporary files that don't match any resolver
    const sourceFile = join(tempDir, "unknown.lock");
    const targetFile = join(tempDir, "unknown2.lock");
    await writeFile(sourceFile, "test content");
    await writeFile(targetFile, "test content");
    process.argv = ["node", "beefdiff", sourceFile, targetFile];

    await expect(run()).rejects.toThrow("No resolver found");
  });

  it("should write HTML to output file when format is html", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    const outputFile = join(tempDir, "output.html");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      "--format",
      "html",
      "--output",
      outputFile,
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    const content = await readFile(outputFile, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain("<html>");
  });

  it("should write markdown to output file when format is markdown", async () => {
    const sourceFile = join(fixturesDir, "npm", "version-old.json");
    const targetFile = join(fixturesDir, "npm", "version-new.json");
    const outputFile = join(tempDir, "output.md");
    process.argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      "--format",
      "markdown",
      "--output",
      outputFile,
      sourceFile,
      targetFile,
    ];

    const exitCode = await run();

    expect(exitCode).toBe(0);
    const content = await readFile(outputFile, "utf-8");
    expect(content).toContain("# Dependencies");
  });
});
