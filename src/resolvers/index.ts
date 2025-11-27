import type { Resolver } from "../types/index.js";
import { NpmResolver } from "./npm.js";
import { ComposerResolver } from "./composer.js";
import { PnpmResolver } from "./pnpm.js";
import { PythonResolver } from "./python.js";
import { YarnResolver } from "./yarn.js";

export const resolvers: Resolver[] = [
  new NpmResolver(),
  new ComposerResolver(),
  new PnpmResolver(),
  new PythonResolver(),
  new YarnResolver(),
];

export function findResolver(filename: string): Resolver | null {
  return resolvers.find((resolver) => resolver.canResolve(filename)) || null;
}

export function getResolverByName(name: string): Resolver | null {
  const normalizedName = name.toLowerCase();
  switch (normalizedName) {
    case "npm":
      return new NpmResolver();
    case "composer":
      return new ComposerResolver();
    case "pnpm":
      return new PnpmResolver();
    case "python":
      return new PythonResolver();
    case "yarn":
      return new YarnResolver();
    default:
      return null;
  }
}
