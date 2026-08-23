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

const expectedThemes = [
  ["Hearth Dark", "themes/hearth-dark.json", "warp/hearth-dark.yaml"],
  [
    "Hearth Dark Teal",
    "themes/hearth-dark-teal.json",
    "warp/hearth-dark-teal.yaml",
  ],
  [
    "Hearth Dark Azure",
    "themes/hearth-dark-azure.json",
    "warp/hearth-dark-azure.yaml",
  ],
  ["Hearth Light", "themes/hearth-light.json", "warp/hearth-light.yaml"],
  [
    "Hearth Light Teal",
    "themes/hearth-light-teal.json",
    "warp/hearth-light-teal.yaml",
  ],
  [
    "Hearth Light Azure",
    "themes/hearth-light-azure.json",
    "warp/hearth-light-azure.yaml",
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
  const expectedWarpFiles = expectedThemes
    .map(([, , path]) => path.replace("warp/", ""))
    .sort();
  assert(
    JSON.stringify(actualWarpFiles) === JSON.stringify(expectedWarpFiles),
    "Warp directory does not contain exactly the six expected YAML files",
  );

  for (const [name, , warpPath] of expectedThemes) {
    const theme = parseYaml(await readText(warpPath));
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
      }
    }
  }

  console.log(
    `Release ${releaseVersion} is aligned across VS Code, Zed, and Warp.`,
  );
}

validate().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
