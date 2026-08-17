// Generates the accented theme variants from the two duotone base themes so the
// shared 95% of each theme lives in exactly one file. The base JSONs are
// themselves the "no accent" variant; this stamps out the Teal and Azure ones by
// repainting only the callable roles (functions, types) plus the terminal cyan
// and one bracket-pair level that follow them. Run `node build.mjs` after editing
// a base theme or an accent value; commit the generated files (editors need them
// on disk). Values are per-mode because contrast is tuned by lightness only —
// dark tones are lifted, light tones darkened, hue and chroma held.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const themes = join(here, "themes");

const ACCENTS = {
  Teal: {
    dark: { fn: "#4cd0b8", type: "#8bddcb" },
    light: { fn: "#008472", type: "#007161" },
  },
  Azure: {
    dark: { fn: "#2eb3e5", type: "#7dc9ec" },
    light: { fn: "#007da3", type: "#006a8c" },
  },
};

const hasScope = (tc, scope) =>
  (Array.isArray(tc.scope) ? tc.scope : [tc.scope]).includes(scope);

for (const mode of ["dark", "light"]) {
  const base = JSON.parse(
    readFileSync(join(themes, `hearth-${mode}.json`), "utf8"),
  );

  for (const [title, palette] of Object.entries(ACCENTS)) {
    const { fn, type } = palette[mode];
    const theme = structuredClone(base);
    theme.name = `${base.name} · ${title}`;

    for (const tc of theme.tokenColors) {
      if (hasScope(tc, "entity.name.function")) tc.settings.foreground = fn;
      if (hasScope(tc, "entity.name.type")) tc.settings.foreground = type;
    }
    theme.colors["terminal.ansiCyan"] = fn;
    theme.colors["terminal.ansiBrightCyan"] = type;
    theme.colors["editorBracketHighlight.foreground4"] = type;

    const out = join(themes, `hearth-${mode}-${title.toLowerCase()}.json`);
    writeFileSync(out, JSON.stringify(theme, null, 2) + "\n");
    console.log(`wrote ${out.replace(here + "/", "")}`);
  }
}
