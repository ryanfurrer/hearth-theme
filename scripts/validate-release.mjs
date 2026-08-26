import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import TOML from "@iarna/toml";
import Ajv from "ajv";
import { parse as parseYaml } from "yaml";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ZED_THEME_SCHEMA = "https://zed.dev/schema/themes/v0.2.0.json";
const COLOR_KEYS = [
  "black",
  "blue",
  "cyan",
  "green",
  "magenta",
  "red",
  "white",
  "yellow",
];
const ANSI_NAMES = [
  "Black",
  "Red",
  "Green",
  "Yellow",
  "Blue",
  "Magenta",
  "Cyan",
  "White",
];
const SEMANTIC_ANSI_NAMES = ANSI_NAMES.filter((name) => name !== "Black");

const expectedThemes = [
  ["Hearth Dark", "themes/hearth-dark.json"],
  ["Hearth Dark Teal", "themes/hearth-dark-teal.json"],
  ["Hearth Dark Azure", "themes/hearth-dark-azure.json"],
  ["Hearth Light", "themes/hearth-light.json"],
  ["Hearth Light Teal", "themes/hearth-light-teal.json"],
  ["Hearth Light Azure", "themes/hearth-light-azure.json"],
];

const expectedTerminalThemes = [
  [
    "Hearth Dark",
    "themes/hearth-dark.json",
    "warp/hearth-dark.yaml",
    "ghostty/hearth-dark",
  ],
  [
    "Hearth Light",
    "themes/hearth-light.json",
    "warp/hearth-light.yaml",
    "ghostty/hearth-light",
  ],
];

function fromRoot(path) {
  return join(ROOT, path);
}

async function readText(path) {
  return readFile(fromRoot(path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertHex(value, location) {
  assert(
    typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value),
    `${location} must be a six-digit hex color`,
  );
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  return (lighter + 0.05) / (darker + 0.05);
}

async function validate() {
  const packageManifest = await readJson("package.json");
  const releaseVersion = (process.argv[2] ?? packageManifest.version).replace(
    /^v/,
    "",
  );

  assert(
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(releaseVersion),
    `Invalid release version: ${releaseVersion}`,
  );
  assert(
    packageManifest.version === releaseVersion,
    `package.json is ${packageManifest.version}, expected ${releaseVersion}`,
  );

  const changelog = await readText("CHANGELOG.md");
  assert(
    changelog.includes(`## [${releaseVersion}]`),
    `CHANGELOG.md has no ${releaseVersion} release entry`,
  );

  const expectedNames = expectedThemes.map(([name]) => name);
  const contributedThemes = packageManifest.contributes?.themes ?? [];
  assert(
    JSON.stringify(contributedThemes.map(({ label }) => label)) ===
      JSON.stringify(expectedNames),
    "VS Code manifest does not contribute the six expected variants",
  );

  for (const [name, themePath] of expectedThemes) {
    const contribution = contributedThemes.find(({ label }) => label === name);
    assert(
      contribution?.path?.replace(/^\.\//, "") === themePath,
      `${name} points to the wrong VS Code theme file`,
    );
    const theme = await readJson(themePath);
    assert(theme.name === name, `${themePath} has the wrong theme name`);
  }

  const baseTerminalThemes = {
    dark: await readJson("themes/hearth-dark.json"),
    light: await readJson("themes/hearth-light.json"),
  };
  for (const [name, themePath] of expectedThemes) {
    const mode = name.includes("Dark") ? "dark" : "light";
    const theme = await readJson(themePath);
    const base = baseTerminalThemes[mode];
    for (const ansiName of ANSI_NAMES) {
      for (const bright of [false, true]) {
        const key = `terminal.ansi${bright ? "Bright" : ""}${ansiName}`;
        assert(
          theme.colors[key] === base.colors[key],
          `${themePath}:${key} must match the shared ${mode} terminal palette`,
        );
      }
    }
  }

  for (const [mode, theme] of Object.entries(baseTerminalThemes)) {
    const background = theme.colors["terminal.background"];
    for (const ansiName of SEMANTIC_ANSI_NAMES) {
      for (const bright of [false, true]) {
        const key = `terminal.ansi${bright ? "Bright" : ""}${ansiName}`;
        const color = theme.colors[key];
        assert(
          contrastRatio(color, background) >= 4.5,
          `${mode}:${key} must have at least 4.5:1 contrast against ${background}`,
        );
      }
    }
  }

  const zedManifest = TOML.parse(await readText("zed/extension.toml"));
  assert(zedManifest.id === "hearth-theme", "Unexpected Zed extension ID");
  assert(
    zedManifest.version === releaseVersion,
    `Zed manifest is ${zedManifest.version}, expected ${releaseVersion}`,
  );

  const zedTheme = await readJson("zed/themes/hearth.json");
  assert(
    JSON.stringify(zedTheme.themes?.map(({ name }) => name)) ===
      JSON.stringify(expectedNames),
    "Zed theme family does not contain the six expected variants",
  );

  const schemaResponse = await fetch(ZED_THEME_SCHEMA);
  assert(
    schemaResponse.ok,
    `Unable to fetch Zed theme schema: ${schemaResponse.status}`,
  );
  const schema = await schemaResponse.json();
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validateZedTheme = ajv.compile(schema);
  assert(
    validateZedTheme(zedTheme),
    `Zed theme schema errors:\n${ajv.errorsText(validateZedTheme.errors, {
      separator: "\n",
    })}`,
  );

  const actualWarpFiles = (await readdir(fromRoot("warp")))
    .filter((file) => file.endsWith(".yaml"))
    .sort();
  const expectedWarpFiles = expectedTerminalThemes
    .map(([, , path]) => path.replace("warp/", ""))
    .sort();
  assert(
    JSON.stringify(actualWarpFiles) === JSON.stringify(expectedWarpFiles),
    "Warp directory does not contain exactly the two expected YAML files",
  );

  for (const [name, sourcePath, warpPath] of expectedTerminalThemes) {
    const theme = parseYaml(await readText(warpPath));
    const source = await readJson(sourcePath);
    assert(theme.name === name, `${warpPath} has the wrong theme name`);
    assert(
      theme.details === (name.includes("Dark") ? "darker" : "lighter"),
      `${warpPath} has the wrong details value`,
    );
    for (const key of ["accent", "cursor", "background", "foreground"]) {
      assertHex(theme[key], `${warpPath}:${key}`);
    }
    for (const group of ["normal", "bright"]) {
      for (const key of COLOR_KEYS) {
        assertHex(
          theme.terminal_colors?.[group]?.[key],
          `${warpPath}:terminal_colors.${group}.${key}`,
        );
        const ansiName = `${key[0].toUpperCase()}${key.slice(1)}`;
        const sourceKey =
          `terminal.ansi${group === "bright" ? "Bright" : ""}${ansiName}`;
        assert(
          theme.terminal_colors[group][key] === source.colors[sourceKey],
          `${warpPath}:terminal_colors.${group}.${key} does not match ${sourcePath}`,
        );
      }
    }
  }

  const actualGhosttyFiles = (await readdir(fromRoot("ghostty"))).sort();
  const expectedGhosttyFiles = expectedTerminalThemes
    .map(([, , , path]) => path.replace("ghostty/", ""))
    .sort();
  assert(
    JSON.stringify(actualGhosttyFiles) === JSON.stringify(expectedGhosttyFiles),
    "Ghostty directory does not contain exactly the two expected theme files",
  );

  for (const [, sourcePath, , ghosttyPath] of expectedTerminalThemes) {
    const source = await readJson(sourcePath);
    const lines = (await readText(ghosttyPath))
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    assert(
      lines.length === 22,
      `${ghosttyPath} must contain only the 16 palette and six color options`,
    );
    const palettes = lines.filter((line) => line.startsWith("palette = "));
    assert(
      palettes.length === 16,
      `${ghosttyPath} must contain all 16 palette entries`,
    );
    for (let index = 0; index < 16; index += 1) {
      const entry = palettes.find((line) =>
        line.startsWith(`palette = ${index}=`),
      );
      assert(entry, `${ghosttyPath} is missing palette ${index}`);
      assertHex(entry.split("=").at(-1), `${ghosttyPath}:palette.${index}`);
      const ansiName = ANSI_NAMES[index % 8];
      const sourceKey =
        `terminal.ansi${index >= 8 ? "Bright" : ""}${ansiName}`;
      assert(
        entry.split("=").at(-1) === source.colors[sourceKey],
        `${ghosttyPath}:palette.${index} does not match ${sourcePath}`,
      );
    }
    for (const key of [
      "background",
      "foreground",
      "cursor-color",
      "cursor-text",
      "selection-background",
      "selection-foreground",
    ]) {
      const entry = lines.find((line) => line.startsWith(`${key} = `));
      assert(entry, `${ghosttyPath} is missing ${key}`);
      assertHex(entry.split("=").at(-1).trim(), `${ghosttyPath}:${key}`);
    }
  }

  console.log(
    `Release ${releaseVersion} is aligned across VS Code, Zed, Warp, and Ghostty.`,
  );
}

validate().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
