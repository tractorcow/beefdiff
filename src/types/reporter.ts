import type { ResolutionDiff } from "./diff.js";

export interface Reporter {
  report(diff: ResolutionDiff): string;
}
