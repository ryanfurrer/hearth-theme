# Hearth release instructions

## Version source of truth

Releases use a `vMAJOR.MINOR.PATCH` Git tag. Keep these values aligned:

- `package.json` → `version`
- `zed/extension.toml` → `version`
- the matching release heading in `CHANGELOG.md`

The generated theme files must be regenerated with `npm run build`; do not edit
generated files by hand. `npm run validate:release -- <version>` checks the
release version, generated themes, Zed manifest, and Zed theme schema.

## Release checks

Before pushing a release tag, run:

```sh
npm ci
npm run build
npm run validate:release -- <version>
```

The `Release` GitHub Actions workflow repeats these checks for every `v*` tag,
packages the VS Code extension, and publishes the GitHub, VS Code Marketplace,
and Open VSX releases.

## Zed registry update

The release workflow's `zed-extension` job runs after the validation/package
job and uses `huacnlee/zed-extension-action@v2` to open an update PR against
`zed-industries/extensions`. It updates:

- the `extensions/hearth-theme` submodule to the release tag's commit;
- the `hearth-theme` `version` in `extensions.toml`.

The job requires the `COMMITTER_TOKEN` GitHub Actions secret. Do not put the
token in repository files, commit messages, or logs. The token must be able to
push to `ryanfurrer/extensions` and create the upstream PR.

If the automated job fails, update the registry manually from the root of an
`zed-industries/extensions` checkout:

```sh
git submodule update --remote extensions/hearth-theme
# Set [hearth-theme].version in extensions.toml to the version in
# extensions/hearth-theme/zed/extension.toml.
pnpm sort-extensions
git diff --check
```

The PR should contain only the submodule pointer and the matching registry
version change.
