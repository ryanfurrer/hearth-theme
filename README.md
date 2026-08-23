# Hearth

Hearth is a warm color theme that keeps the interface calm and lights the code
with a single ember. Six light and dark variants bring the same palette to VS
Code, Cursor, Zed, Warp, and Shiki.

[Explore Hearth, compare every variant, and find installation instructions](https://hearth.ryanfurrer.com/).

![Hearth themes in dark and light](./preview.png)

Backgrounds, text, and comments stay in calm neutrals; the warmth lives in the
code. Keywords carry a single orange ember. Azure and Teal add one cool hue to
functions and types, so structure stands out without turning into a rainbow.

## Themes

- **Hearth Dark and Hearth Light** — duotone, with orange keywords and neutral
  functions and types.
- **Hearth Dark Azure and Hearth Light Azure** — the same base, with clear blue
  functions and a lighter tint on types.
- **Hearth Dark Teal and Hearth Light Teal** — the same base, with teal
  functions and a lighter tint on types.

## Install

### Visual Studio Code

Install [Hearth from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=RyanFurrer.hearth),
search for **Hearth** in the Extensions panel, or run:

```sh
code --install-extension RyanFurrer.hearth
```

After installing, open the color theme picker with `Cmd/Ctrl + K`, then
`Cmd/Ctrl + T`, and choose a Hearth theme.

### Cursor

Download [hearth-latest.vsix](https://github.com/ryanfurrer/hearth-theme/releases/latest/download/hearth-latest.vsix),
open Cursor's Extensions panel, choose **Install from VSIX…** from the `…` menu,
and select the downloaded file. Then open the color theme picker and choose a
Hearth theme.

Hearth is also available from
[Open VSX](https://open-vsx.org/extension/ryanfurrer/hearth/changes).

### Zed

Copy `zed/themes/hearth.json` to Zed's local themes directory. On macOS and
Linux, that is `~/.config/zed/themes/`. You can also run
`zed: install dev extension` from the command palette and select the
repository's `zed/` directory. All six variants will appear in the theme
selector.

A Zed extension-store listing is planned.

### Warp

Copy the six files in `warp/` to your Warp custom themes directory. On macOS:

```sh
mkdir -p ~/.warp/themes/hearth
cp warp/*.yaml ~/.warp/themes/hearth/
```

Restart Warp if it does not discover the new themes immediately. Teal and Azure
change the terminal's cyan pair; Warp does not expose editor syntax scopes. A
listing in Warp's theme repository is in review.

## Shiki

The theme files in `themes/` can also be used directly with
[Shiki](https://shiki.style). Each file includes its VS Code theme name:

| Style | Light | Dark |
| ----- | ----- | ---- |
| Hearth | `hearth-light.json` | `hearth-dark.json` |
| Teal | `hearth-light-teal.json` | `hearth-dark-teal.json` |
| Azure | `hearth-light-azure.json` | `hearth-dark-azure.json` |

## Development

Run `npm run build` after changing either base theme or an accent value. The
build regenerates the accented VS Code themes, the Zed theme family, and all
Warp themes from the same source palettes.

Run `npm run package` to build the sideloadable VS Code extension as
`hearth-latest.vsix`.

Pushing a `v*` tag runs the release workflow. It verifies that the tag matches
the VS Code and Zed manifests, validates every generated theme, packages the
VSIX once, publishes it to GitHub Releases, the VS Code Marketplace, and Open
VSX, then triggers a fresh build of the Hearth landing page. The workflow can
also be rerun manually for an existing tag.

Maintainers configure `VSCE_PAT`, `OVSX_PAT`, and `PORTFOLIO_DEPLOY_HOOK` as
GitHub Actions secrets. The Marketplace credential will move from an Azure
DevOps PAT to Microsoft Entra workload identity before PAT retirement.

## License

Hearth was made by [Ryan Furrer](https://ryanfurrer.com) and is available under
the [MIT License](./LICENSE).
