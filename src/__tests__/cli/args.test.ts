import { describe, it, expect, jest } from "@jest/globals";
import { parseArgs, validateArgs, showHelp } from "../../cli/args.js";

describe("parseArgs", () => {
  it("should parse basic arguments", () => {
    const argv = ["node", "beefdiff", "source.lock", "target.lock"];
    const result = parseArgs(argv);

    expect(result.sourceFile).toBe("source.lock");
    expect(result.targetFile).toBe("target.lock");
    expect(result.format).toBe("text");
    expect(result.help).toBe(false);
    expect(result.version).toBe(false);
  });

  it("should parse format option", () => {
    const argv = [
      "node",
      "beefdiff",
      "--format",
      "html",
      "source.lock",
      "target.lock",
    ];
    const result = parseArgs(argv);

    expect(result.format).toBe("html");
  });

  it("should parse format short option", () => {
    const argv = [
      "node",
      "beefdiff",
      "-f",
      "markdown",
      "source.lock",
      "target.lock",
    ];
    const result = parseArgs(argv);

    expect(result.format).toBe("markdown");
  });

  it("should default format to text when not specified", () => {
    const argv = ["node", "beefdiff", "source.lock", "target.lock"];
    const result = parseArgs(argv);

    expect(result.format).toBe("text");
  });

  it("should parse resolver option", () => {
    const argv = [
      "node",
      "beefdiff",
      "--resolver",
      "npm",
      "source.lock",
      "target.lock",
    ];
    const result = parseArgs(argv);

    expect(result.resolverName).toBe("npm");
  });

  it("should parse resolver short option", () => {
    const argv = [
      "node",
      "beefdiff",
      "-r",
      "composer",
      "source.lock",
      "target.lock",
    ];
    const result = parseArgs(argv);

    expect(result.resolverName).toBe("composer");
  });

  it("should parse output option", () => {
    const argv = [
      "node",
      "beefdiff",
      "--output",
      "report.html",
      "source.lock",
      "target.lock",
    ];
    const result = parseArgs(argv);

    expect(result.outputFile).toBe("report.html");
  });

  it("should parse output short option", () => {
    const argv = [
      "node",
      "beefdiff",
      "-o",
      "report.md",
      "source.lock",
      "target.lock",
    ];
    const result = parseArgs(argv);

    expect(result.outputFile).toBe("report.md");
  });

  it("should parse help option", () => {
    const argv = ["node", "beefdiff", "--help"];
    const result = parseArgs(argv);

    expect(result.help).toBe(true);
  });

  it("should parse help short option", () => {
    const argv = ["node", "beefdiff", "-h"];
    const result = parseArgs(argv);

    expect(result.help).toBe(true);
  });

  it("should parse version option", () => {
    const argv = ["node", "beefdiff", "--version"];
    const result = parseArgs(argv);

    expect(result.version).toBe(true);
  });

  it("should parse version short option", () => {
    const argv = ["node", "beefdiff", "-v"];
    const result = parseArgs(argv);

    expect(result.version).toBe(true);
  });

  it("should handle multiple options", () => {
    const argv = [
      "node",
      "beefdiff",
      "--format",
      "html",
      "--resolver",
      "npm",
      "--output",
      "report.html",
      "source.lock",
      "target.lock",
    ];
    const result = parseArgs(argv);

    expect(result.format).toBe("html");
    expect(result.resolverName).toBe("npm");
    expect(result.outputFile).toBe("report.html");
    expect(result.sourceFile).toBe("source.lock");
    expect(result.targetFile).toBe("target.lock");
  });

  it("should handle options in different order", () => {
    const argv = [
      "node",
      "beefdiff",
      "source.lock",
      "--format",
      "markdown",
      "target.lock",
      "--output",
      "out.md",
    ];
    const result = parseArgs(argv);

    expect(result.sourceFile).toBe("source.lock");
    expect(result.targetFile).toBe("target.lock");
    expect(result.format).toBe("markdown");
    expect(result.outputFile).toBe("out.md");
  });

  it("should handle missing option values gracefully", () => {
    const argv = ["node", "beefdiff", "--format"];
    const result = parseArgs(argv);

    expect(result.format).toBe("text"); // Defaults to text
  });

  it("should ignore unknown arguments as positional", () => {
    const argv = ["node", "beefdiff", "source.lock", "target.lock", "extra"];
    const result = parseArgs(argv);

    expect(result.sourceFile).toBe("source.lock");
    expect(result.targetFile).toBe("target.lock");
  });
});

describe("validateArgs", () => {
  it("should validate when help is requested", () => {
    const args = {
      help: true,
      version: false,
      format: "text",
    };
    const result = validateArgs(args);

    expect(result.valid).toBe(true);
  });

  it("should validate when version is requested", () => {
    const args = {
      help: false,
      version: true,
      format: "text",
    };
    const result = validateArgs(args);

    expect(result.valid).toBe(true);
  });

  it("should validate when both source and target files are provided", () => {
    const args = {
      sourceFile: "source.lock",
      targetFile: "target.lock",
      format: "text",
      help: false,
      version: false,
    };
    const result = validateArgs(args);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject when source file is missing", () => {
    const args = {
      targetFile: "target.lock",
      format: "text",
      help: false,
      version: false,
    };
    const result = validateArgs(args);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing required arguments");
  });

  it("should reject when target file is missing", () => {
    const args = {
      sourceFile: "source.lock",
      format: "text",
      help: false,
      version: false,
    };
    const result = validateArgs(args);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing required arguments");
  });

  it("should reject when both files are missing", () => {
    const args = {
      format: "text",
      help: false,
      version: false,
    };
    const result = validateArgs(args);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing required arguments");
  });
});

describe("showHelp", () => {
  it("should output help text", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      showHelp();
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain("beefdiff");
      expect(consoleSpy.mock.calls[0][0]).toContain("USAGE");
      expect(consoleSpy.mock.calls[0][0]).toContain("OPTIONS");
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
