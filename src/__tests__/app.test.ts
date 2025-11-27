import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { errorHandler } from "../app.js";

describe("errorHandler", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("should return exit code 0 when function succeeds", async () => {
    const successFn = async () => 0;
    const wrapped = errorHandler(successFn);

    const result = await wrapped();

    expect(result).toBe(0);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("should return exit code 1 when function throws an Error", async () => {
    const errorFn = async () => {
      throw new Error("Test error");
    };
    const wrapped = errorHandler(errorFn);

    const result = await wrapped();

    expect(result).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Test error");
  });

  it("should return exit code 1 when function throws a non-Error", async () => {
    const errorFn = async () => {
      throw "String error";
    };
    const wrapped = errorHandler(errorFn);

    const result = await wrapped();

    expect(result).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", "String error");
  });

  it("should show help when error message includes 'Missing required arguments'", async () => {
    const consoleLogHelpSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const errorFn = async () => {
      throw new Error(
        "Missing required arguments: source-lockfile and target-lockfile are required"
      );
    };
    const wrapped = errorHandler(errorFn);

    const result = await wrapped();

    expect(result).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error: Missing required arguments: source-lockfile and target-lockfile are required"
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith("");
    expect(consoleLogHelpSpy).toHaveBeenCalled();
    consoleLogHelpSpy.mockRestore();
  });

  it("should not show help for other error messages", async () => {
    const consoleLogHelpSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const errorFn = async () => {
      throw new Error("Some other error");
    };
    const wrapped = errorHandler(errorFn);

    const result = await wrapped();

    expect(result).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Some other error");
    expect(consoleErrorSpy).not.toHaveBeenCalledWith("");
    expect(consoleLogHelpSpy).not.toHaveBeenCalled();
    consoleLogHelpSpy.mockRestore();
  });

  it("should preserve the return value from the wrapped function", async () => {
    const fn = async () => 42;
    const wrapped = errorHandler(fn);

    const result = await wrapped();

    expect(result).toBe(42);
  });

  it("should handle async errors correctly", async () => {
    const errorFn = async () => {
      await Promise.resolve();
      throw new Error("Async error");
    };
    const wrapped = errorHandler(errorFn);

    const result = await wrapped();

    expect(result).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Async error");
  });
});
