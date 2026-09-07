import type { Locale } from "../config";

/**
 * Load exactly one language's fonts.
 *
 * The `switch` looks redundant next to a template-literal specifier, and it is
 * not. `import(\`./${locale}\`)` makes the bundler build a context module that
 * pulls all three font files into the same chunk — every visitor would then
 * download the CSS for Fraunces, Noto Serif Telugu *and* Noto Serif Devanagari,
 * which is precisely the outcome the brief rules out. Three literal specifiers
 * give three separate chunks, and a request only ever resolves one of them.
 *
 * These stay dynamic rather than becoming three static imports at the top of the
 * layout for the same reason: a static import is unconditional.
 */
export async function loadFonts(locale: Locale): Promise<string> {
  switch (locale) {
    case "te":
      return (await import("./te")).fontVariables;
    case "hi":
      return (await import("./hi")).fontVariables;
    case "en":
    default:
      return (await import("./en")).fontVariables;
  }
}
