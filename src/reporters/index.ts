import type { Reporter } from "../types/index.js";
import { TextReporter } from "./text.js";
import { HtmlReporter } from "./html.js";
import { MarkdownReporter } from "./markdown.js";

export function getReporter(format: string): Reporter {
  switch (format.toLowerCase()) {
    case "text":
      return new TextReporter();
    case "html":
      return new HtmlReporter();
    case "markdown":
      return new MarkdownReporter();
    default:
      return new TextReporter();
  }
}
