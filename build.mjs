// Generates every derived Hearth theme from the two VS Code duotone base files.
// The accented VS Code variants repaint only callables, terminal cyan, and one
// bracket-pair level. Those six completed themes are then translated to Zed and
// Warp so every editor stays on the same palette. Run `node build.mjs` after
// editing a base theme or accent value and commit the generated files.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const themes = join(here, "themes");
const zedThemes = join(here, "zed", "themes");
const warpThemes = join(here, "warp");

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

const themePath = (mode, title) =>
  join(
    themes,
    `hearth-${mode}${title ? `-${title.toLowerCase()}` : ""}.json`,
  );

for (const mode of ["dark", "light"]) {
  const base = JSON.parse(
    readFileSync(themePath(mode), "utf8"),
  );

  for (const [title, palette] of Object.entries(ACCENTS)) {
    const { fn, type } = palette[mode];
    const theme = structuredClone(base);
    theme.name = `${base.name} ${title}`;

    for (const tc of theme.tokenColors) {
      if (hasScope(tc, "entity.name.function")) tc.settings.foreground = fn;
      if (hasScope(tc, "entity.name.type")) tc.settings.foreground = type;
    }
    theme.colors["terminal.ansiCyan"] = fn;
    theme.colors["terminal.ansiBrightCyan"] = type;
    theme.colors["editorBracketHighlight.foreground4"] = type;

    const out = themePath(mode, title);
    writeFileSync(out, JSON.stringify(theme, null, 2) + "\n");
    console.log(`wrote ${out.replace(here + "/", "")}`);
  }
}

const VARIANTS = [
  ["dark", null],
  ["dark", "Teal"],
  ["dark", "Azure"],
  ["light", null],
  ["light", "Teal"],
  ["light", "Azure"],
].map(([mode, title]) => ({
  mode,
  title,
  theme: JSON.parse(readFileSync(themePath(mode, title), "utf8")),
}));

const tokenSettings = (theme, scope) => {
  const token = theme.tokenColors.find((candidate) => hasScope(candidate, scope));
  if (!token) throw new Error(`Missing token scope: ${scope}`);
  return token.settings;
};

const toZedHighlight = (theme, scope) => {
  const source = tokenSettings(theme, scope);
  const highlight = { color: source.foreground };
  const fontStyles = source.fontStyle?.split(" ") ?? [];
  if (fontStyles.includes("italic")) highlight.font_style = "italic";
  if (fontStyles.includes("bold")) highlight.font_weight = 700;
  return highlight;
};

const ZED_SYNTAX_SCOPES = {
  attribute: "entity.other.attribute-name",
  boolean: "constant.language.boolean",
  comment: "comment",
  "comment.doc": "comment",
  constant: "constant.other",
  constructor: "entity.name.type",
  "diff.minus": "markup.deleted",
  "diff.plus": "markup.inserted",
  embedded: "variable",
  emphasis: "markup.italic",
  "emphasis.strong": "markup.bold",
  enum: "entity.name.type",
  function: "entity.name.function",
  hint: "comment",
  keyword: "keyword",
  label: "entity.name.tag",
  link_text: "markup.underline.link",
  link_uri: "markup.underline.link",
  namespace: "entity.name.namespace",
  number: "constant.numeric",
  operator: "keyword.operator",
  predictive: "comment",
  preproc: "meta.decorator",
  primary: "variable",
  property: "variable.other.property",
  punctuation: "punctuation",
  "punctuation.bracket": "punctuation",
  "punctuation.delimiter": "punctuation",
  "punctuation.list_marker": "punctuation.definition.list.begin.markdown",
  "punctuation.markup": "punctuation",
  "punctuation.special": "constant.character.escape",
  selector: "entity.other.attribute-name.class.css",
  "selector.pseudo": "entity.name.tag.css",
  string: "string",
  "string.escape": "constant.character.escape",
  "string.regex": "string.regexp",
  "string.special": "string",
  "string.special.symbol": "constant.other",
  tag: "entity.name.tag",
  "text.literal": "markup.inline.raw",
  title: "markup.heading",
  type: "entity.name.type",
  variable: "variable",
  "variable.parameter": "variable.parameter",
  "variable.special": "variable.language",
  variant: "constant.language",
};

const withAlpha = (color, alpha) => `${color.slice(0, 7)}${alpha}`;

const toZedTheme = ({ mode, theme }) => {
  const c = theme.colors;
  const accent = c["editorCursor.foreground"];
  const transparent = c["editor.lineHighlightBorder"];
  const muted = c.descriptionForeground;
  const statuses = {
    conflict: c["editorWarning.foreground"],
    created: c["gitDecoration.addedResourceForeground"],
    deleted: c["gitDecoration.deletedResourceForeground"],
    error: c["editorError.foreground"],
    hidden: c["gitDecoration.ignoredResourceForeground"],
    hint: c["editorInfo.foreground"],
    ignored: c["gitDecoration.ignoredResourceForeground"],
    info: c["editorInfo.foreground"],
    modified: c["gitDecoration.modifiedResourceForeground"],
    predictive: muted,
    renamed: c["editorLink.activeForeground"],
    success: c["gitDecoration.addedResourceForeground"],
    unreachable: muted,
    warning: c["editorWarning.foreground"],
  };
  const style = {
    border: c["editorHoverWidget.border"],
    "border.variant": c["editorGroup.border"],
    "border.focused": c.focusBorder,
    "border.selected": c["editorBracketMatch.border"],
    "border.transparent": transparent,
    "border.disabled": c["sideBar.border"],
    "elevated_surface.background": c["editorHoverWidget.background"],
    "surface.background": c["sideBar.background"],
    background: c["titleBar.activeBackground"],
    "element.background": c["input.background"],
    "element.hover": c["list.hoverBackground"],
    "element.active": c["list.activeSelectionBackground"],
    "element.selected": c["list.activeSelectionBackground"],
    "element.disabled": c["sideBar.background"],
    "drop_target.background": c["selection.background"],
    "ghost_element.background": transparent,
    "ghost_element.hover": c["list.hoverBackground"],
    "ghost_element.active": c["list.activeSelectionBackground"],
    "ghost_element.selected": c["list.activeSelectionBackground"],
    "ghost_element.disabled": transparent,
    text: c.foreground,
    "text.muted": muted,
    "text.placeholder": c["input.placeholderForeground"],
    "text.disabled": c["tab.inactiveForeground"],
    "text.accent": c["editorLink.activeForeground"],
    icon: c["icon.foreground"],
    "icon.muted": muted,
    "icon.disabled": c["activityBar.inactiveForeground"],
    "icon.placeholder": c["input.placeholderForeground"],
    "icon.accent": accent,
    "status_bar.background": c["statusBar.background"],
    "title_bar.background": c["titleBar.activeBackground"],
    "title_bar.inactive_background": c["titleBar.inactiveBackground"],
    "toolbar.background": c["editorGroupHeader.tabsBackground"],
    "tab_bar.background": c["editorGroupHeader.tabsBackground"],
    "tab.inactive_background": c["tab.inactiveBackground"],
    "tab.active_background": c["tab.activeBackground"],
    "search.match_background": c["editor.findMatchHighlightBackground"],
    "search.active_match_background": c["editor.findMatchBackground"],
    "panel.background": c["sideBar.background"],
    "panel.focused_border": c.focusBorder,
    "pane.focused_border": c.focusBorder,
    "pane_group.border": c["editorGroup.border"],
    "panel.indent_guide": c["tree.indentGuidesStroke"],
    "panel.indent_guide_active": c["editorIndentGuide.activeBackground1"],
    "panel.indent_guide_hover": c["editorIndentGuide.activeBackground1"],
    "scrollbar.thumb.background": c["scrollbarSlider.background"],
    "scrollbar.thumb.hover_background": c["scrollbarSlider.hoverBackground"],
    "scrollbar.thumb.border": transparent,
    "scrollbar.track.background": transparent,
    "scrollbar.track.border": c["editorGroup.border"],
    "editor.foreground": c["editor.foreground"],
    "editor.background": c["editor.background"],
    "editor.gutter.background": c["editorGutter.background"],
    "editor.subheader.background": c["editorGroupHeader.tabsBackground"],
    "editor.active_line.background": c["editor.lineHighlightBackground"],
    "editor.highlighted_line.background": c["editor.selectionHighlightBackground"],
    "editor.line_number": c["editorLineNumber.foreground"],
    "editor.active_line_number": c["editorLineNumber.activeForeground"],
    "editor.invisible": c["editorWhitespace.foreground"],
    "editor.wrap_guide": c["editorRuler.foreground"],
    "editor.active_wrap_guide": c["editorIndentGuide.activeBackground1"],
    "editor.indent_guide": c["editorIndentGuide.background1"],
    "editor.indent_guide_active": c["editorIndentGuide.activeBackground1"],
    "editor.document_highlight.bracket_background": c["editorBracketMatch.background"],
    "editor.document_highlight.read_background": c["editor.wordHighlightBackground"],
    "editor.document_highlight.write_background": c["editor.wordHighlightStrongBackground"],
    "terminal.background": c["terminal.background"],
    "terminal.foreground": c["terminal.foreground"],
    "terminal.bright_foreground": c["terminal.ansiBrightWhite"],
    "terminal.dim_foreground": muted,
    "terminal.ansi.background": c["terminal.background"],
    "link_text.hover": c["textLink.activeForeground"],
    "version_control.added": c["gitDecoration.addedResourceForeground"],
    "version_control.modified": c["gitDecoration.modifiedResourceForeground"],
    "version_control.word_added": c["diffEditor.insertedTextBackground"],
    "version_control.word_deleted": c["diffEditor.removedTextBackground"],
    "version_control.deleted": c["gitDecoration.deletedResourceForeground"],
    accents: [
      c["editorBracketHighlight.foreground2"],
      c["editorBracketHighlight.foreground3"],
      c["editorBracketHighlight.foreground4"],
      c["editorBracketHighlight.foreground5"],
      c["editorBracketHighlight.foreground6"],
    ],
    syntax: Object.fromEntries(
      Object.entries(ZED_SYNTAX_SCOPES).map(([capture, scope]) => [
        capture,
        toZedHighlight(theme, scope),
      ]),
    ),
  };

  for (const [name, color] of Object.entries(statuses)) {
    style[name] = color;
    style[`${name}.background`] = withAlpha(color, "1a");
    style[`${name}.border`] = withAlpha(color, "66");
  }

  const ansi = {
    black: "Black",
    red: "Red",
    green: "Green",
    yellow: "Yellow",
    blue: "Blue",
    magenta: "Magenta",
    cyan: "Cyan",
    white: "White",
  };
  for (const [zedName, vscodeName] of Object.entries(ansi)) {
    style[`terminal.ansi.${zedName}`] = c[`terminal.ansi${vscodeName}`];
    style[`terminal.ansi.bright_${zedName}`] =
      c[`terminal.ansiBright${vscodeName}`];
  }

  return { name: theme.name, appearance: mode, style };
};

mkdirSync(zedThemes, { recursive: true });
const zedFamily = {
  $schema: "https://zed.dev/schema/themes/v0.2.0.json",
  name: "Hearth",
  author: "Ryan Furrer",
  themes: VARIANTS.map(toZedTheme),
};
const zedOut = join(zedThemes, "hearth.json");
writeFileSync(zedOut, JSON.stringify(zedFamily, null, 2) + "\n");
console.log(`wrote ${zedOut.replace(here + "/", "")}`);

const WARP_ANSI = {
  black: "Black",
  blue: "Blue",
  cyan: "Cyan",
  green: "Green",
  magenta: "Magenta",
  red: "Red",
  white: "White",
  yellow: "Yellow",
};

const toWarpYaml = ({ mode, theme }) => {
  const c = theme.colors;
  const quote = (value) => `'${value.replaceAll("'", "''")}'`;
  const line = (key, value, indent = 0) =>
    `${" ".repeat(indent)}${key}: ${quote(value)}`;
  const lines = [
    line("name", theme.name),
    line("accent", c["editorCursor.foreground"]),
    line("cursor", c["terminalCursor.foreground"]),
    line("background", c["terminal.background"]),
    line("foreground", c["terminal.foreground"]),
    `details: ${mode === "dark" ? "darker" : "lighter"}`,
    "terminal_colors:",
    "  bright:",
  ];
  for (const [warpName, vscodeName] of Object.entries(WARP_ANSI)) {
    lines.push(line(warpName, c[`terminal.ansiBright${vscodeName}`], 4));
  }
  lines.push("  normal:");
  for (const [warpName, vscodeName] of Object.entries(WARP_ANSI)) {
    lines.push(line(warpName, c[`terminal.ansi${vscodeName}`], 4));
  }
  return lines.join("\n") + "\n";
};

mkdirSync(warpThemes, { recursive: true });
for (const variant of VARIANTS) {
  const suffix = variant.title ? `-${variant.title.toLowerCase()}` : "";
  const out = join(warpThemes, `hearth-${variant.mode}${suffix}.yaml`);
  writeFileSync(out, toWarpYaml(variant));
  console.log(`wrote ${out.replace(here + "/", "")}`);
}
