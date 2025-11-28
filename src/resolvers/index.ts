import type { Resolver } from "../types/index.js";
import { NpmResolver } from "./npm.js";
import { ComposerResolver } from "./composer.js";
import { PnpmResolver } from "./pnpm.js";
import { PythonResolver } from "./python.js";
import { YarnResolver } from "./yarn.js";
import { RubyGemfileResolver } from "./ruby.js";

const resolverMap: Record<string, Resolver> = {
  npm: new NpmResolver(),
  composer: new ComposerResolver(),
  pnpm: new PnpmResolver(),
  python: new PythonResolver(),
  yarn: new YarnResolver(),
  ruby: new RubyGemfileResolver(),
};

export const resolvers: Resolver[] = Object.values(resolverMap);

export function findResolver(filename: string): Resolver | null {
  return resolvers.find((resolver) => resolver.canResolve(filename)) || null;
}

export function getResolverByName(name: string): Resolver | null {
  const normalizedName = name.toLowerCase();
  return resolverMap[normalizedName] || null;
}
