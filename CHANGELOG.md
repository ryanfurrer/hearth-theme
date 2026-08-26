# Changelog

All notable changes to Hearth are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] — 2026-08-26

### Added

- Added dedicated light and dark Ghostty themes, including automatic system
  appearance pairing instructions.

### Changed

- Rebuilt the shared terminal colors as a complete semantic ANSI palette for
  shell prompts and CLI tools, anchored by Hearth Azure and Teal.
- Consolidated Warp into dedicated light and dark terminal themes while keeping
  all six variants for editors. Existing Azure or Teal terminal users should
  switch to the corresponding `Hearth Dark` or `Hearth Light` theme.
- Added explicit shared workbench colors for top-mounted activity bars, command
  centers, and active or inactive window borders in Cursor and VS Code.
- Changed modified-file decorations to warm brown and moved the Hearth-orange
  active-tab indicator from the top edge to the bottom edge.

## [0.2.1] — 2026-08-23

### Changed

- Replaced the composite theme preview with one full-size Cursor screenshot for
  each variant, making the differences easier to compare in extension listings.

## [0.2.0] — 2026-08-23

### Added

- Added Zed and Warp versions of all six Hearth variants.
- Added a stable `hearth-latest.vsix` package name for Cursor and other
  sideloaded installations.

### Changed

- Removed the middle-dot separator from the Azure and Teal variant names.
- Updated the public description and installation documentation to reflect the
  full VS Code, Cursor, Zed, Warp, and Shiki family.

## [0.1.2] — 2026-08-17

### Changed

- Simplified the public README and Marketplace description.

## [0.1.1] — 2026-08-17

### Changed

- Updated installation documentation to link directly to the published VS Code
  Marketplace listing and clarify `.vsix` sideloading.

## [0.1.0] — 2026-08-17

### Added

- Initial release. Six themes: **Hearth Dark / Light**, each in **Duotone**,
  **Teal**, and **Azure** flavors.
- Warm-duotone palette in OKLCH — cool neutrals for structure, ember orange for
  meaning, optional teal/azure for callables.
- Full workbench theming (editor, sidebar, tabs, terminal ANSI, git decorations,
  diffs, bracket-pair colorization) plus complete `tokenColors`.
