# Hearth

A warm-duotone editor theme: **cool near-monochrome neutrals** carry the
structure, **one ember-orange accent** carries the meaning, and an optional
**cool complement** (teal or azure) picks out the callables. Calm, restrained,
and built in [OKLCH](https://oklch.com) so every tone is tuned by lightness alone.

Ships **six themes** — light and dark, each in three flavors:

| Flavor      | Callables | Feel |
| ----------- | --------- | ---- |
| **Hearth**  | neutral (mono + orange only) | the purest read of the palette |
| **· Teal**  | teal `#39c6ae` — a split-complement of the orange | soft warm/cool split, design-forward |
| **· Azure** | azure `#10A5D6` — the orange's true complement | punchier, higher energy |

![Hearth — six variants, dark and light](./preview.png)

## The system

Three hue families — cool neutrals, ember orange, and (in the Teal/Azure flavors)
a cool accent — each differentiated internally by lightness only, never by adding
more hues.

| Role                                | Hearth Dark | Hearth Light |
| ----------------------------------- | ----------- | ------------ |
| Editor background                   | `#0a0a0b`   | `#ffffff`    |
| Plain text · variables · params     | `#d7d7db`   | `#2d2d33`    |
| Punctuation · operators · brackets  | `#808085`   | `#5d5d63`    |
| Comments (italic, recessive)        | `#626269`   | `#717178`    |
| **Keywords · storage · tags**       | `#f87c49`   | `#b23c00`    |
| **Constants · numbers · escapes**   | `#f66335`   | `#9f2e00`    |
| **Strings · attribute values**      | `#dfbda0`   | `#89552a`    |
| Cursor · accents · focus (ember)    | `#f05a29`   | `#f05a29`    |

The orange is split into three tiers per mode — a bright keyword tone, the deep
ember tone for constants, and a soft warm "sand" for strings — so code stays
scannable while every accent still belongs to one family. On light, the orange is
darkened (lightness only) because the raw ember is too light for text on white.

In the **Teal** and **Azure** flavors, callables (functions, methods, types) take
the cool accent so a warm/cool split does the heaviest scanning: orange marks
*meaning*, the cool accent marks *behavior*, neutrals stay *data*, sand stays
*literals*.

| Callable role       | Teal dark | Teal light | Azure dark | Azure light |
| ------------------- | --------- | ---------- | ---------- | ----------- |
| Functions · methods | `#4cd0b8` | `#008472`  | `#2eb3e5`  | `#007da3`   |
| Types · classes     | `#8bddcb` | `#007161`  | `#7dc9ec`  | `#006a8c`   |

Everything you read as code clears WCAG AA (4.5:1) in both modes; comments are
intentionally recessive (dark comments sit near 3.3:1 by design so they fade back).

## Install

**From within your editor** once published:

- **VS Code** → Extensions → search **Hearth** → Install
- **Cursor / VSCodium** → Extensions (Open VSX) → search **Hearth** → Install

Then `Cmd/Ctrl + K` `Cmd/Ctrl + T` and pick any of the six.

**From a `.vsix`** (before publishing, or to sideload):

```bash
code --install-extension hearth-0.1.0.vsix      # VS Code
cursor --install-extension hearth-0.1.0.vsix    # Cursor
```

…or in the editor: Extensions panel → `···` → **Install from VSIX…**.

## Develop

The two duotone files (`themes/hearth-dark.json`, `themes/hearth-light.json`) are
the single source of truth. The four accented files are **generated** by
`build.mjs`, which repaints only the callable roles — never hand-edit them.

```bash
node build.mjs            # regenerate the teal/azure variants
pnpm package              # build hearth-<version>.vsix (needs @vscode/vsce)
```

Publishing to the VS Code Marketplace and Open VSX is documented in
[`PUBLISHING.md`](./PUBLISHING.md).

## Credits

By [Ryan Furrer](https://ryanfurrer.com). Palette derived from
[ryanfurrer.com](https://ryanfurrer.com). MIT licensed.
