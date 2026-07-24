import * as fluentSyntax from "@fluent/syntax";
import type { Plugin } from "prettier";

const plugin: Plugin<fluentSyntax.Resource> = {
  languages: [
    {
      name: "Fluent",
      parsers: ["fluent"],
      extensions: [".ftl"],
      linguistLanguageId: 206353404, // see https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml
    },
  ],
  parsers: {
    fluent: {
      parse(text) {
        const resource = fluentSyntax.parse(text, { withSpans: true });
        const firstJunkEntry = resource.body.find(
          entry => entry instanceof fluentSyntax.Junk
        );
        if (firstJunkEntry) {
          throw createParseError(text, firstJunkEntry);
        }
        return resource;
      },
      astFormat: "fluent-ast",
      hasIgnorePragma(text) {
        return Boolean(
          text.trimStart().match(/^#{1,3}\s*(?:@noformat|@noprettier)\b/)
        );
      },
      locStart(node) {
        return node.span?.start ?? 0;
      },
      locEnd(node) {
        return node.span?.end ?? 0;
      },
    },
  },
  printers: {
    "fluent-ast": {
      print(path) {
        return fluentSyntax.serialize(sortResource(path.node), {});
      },
    },
  },
};
export default plugin;

function sortResource(resource: fluentSyntax.Resource): fluentSyntax.Resource {
  type SortableEntry = fluentSyntax.Message | fluentSyntax.Term;
  function compare(a: SortableEntry, b: SortableEntry): number {
    // Compare entry identifiers, ignoring letter case. For
    // deterministic results, this deliberately does not use
    // locale-aware comparisons (e.g. localeCompare()) and case
    // mappings (e.g. toLocaleLowercase()).
    const nameA = a.id.name.toLowerCase();
    const nameB = b.id.name.toLowerCase();
    if (nameA === nameB) return 0;
    return nameA > nameB ? 1 : -1;
  }
  const entries: fluentSyntax.Entry[] = [];
  const pending: SortableEntry[] = [];
  for (const entry of resource.body) {
    if (
      entry instanceof fluentSyntax.Message ||
      entry instanceof fluentSyntax.Term
    ) {
      pending.push(entry);
      continue;
    }
    if (pending.length) {
      entries.push(...pending.sort(compare));
      pending.length = 0;
    }
    entries.push(entry);
  }
  entries.push(...pending.sort(compare));
  return new fluentSyntax.Resource(entries);
}

type FluentParseError = Error & {
  // Optional, but Prettier gives nicer error messages when set.
  loc?: { start: { line: number; column: number } };
};

function createParseError(
  text: string,
  junk: fluentSyntax.Junk
): FluentParseError {
  const annotation = junk.annotations[0];
  const offset = annotation?.span?.start ?? junk.span?.start ?? 0;
  const line = fluentSyntax.lineOffset(text, offset) + 1;
  const column = fluentSyntax.columnOffset(text, offset) + 1;
  const details = annotation
    ? `${annotation.code}: ${annotation.message}`
    : "Invalid Fluent syntax";
  const error: FluentParseError = new Error(`${details} (${line}:${column})`);
  error.loc = { start: { line, column } };
  return error;
}
