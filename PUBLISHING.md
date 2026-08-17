# Publishing Hearth

Hearth targets **two** registries. Publish to both so every editor can find it:

- **Visual Studio Marketplace** — what **VS Code** searches.
- **Open VSX** — what **Cursor**, **VSCodium**, **Gitpod**, and other non-Microsoft
  builds search. (Cursor does **not** read the VS Code Marketplace, so this one is
  what makes Hearth installable from inside Cursor.)

Both consume the same `.vsix`. Build it once:

```bash
pnpm install          # first time only, to get @vscode/vsce
pnpm build            # regenerate variants if you changed a base theme
pnpm package          # -> hearth-<version>.vsix
```

Bump `version` in `package.json` before each release (marketplaces reject a
re-published version). Keep `CHANGELOG.md` in step.

---

## 1 · Visual Studio Marketplace (VS Code)

### One-time setup

The Marketplace runs on Azure DevOps, so the account chain is:
**Microsoft account → Azure DevOps organization → Marketplace publisher → PAT.**

1. **Azure DevOps organization** — sign in at <https://dev.azure.com> with your
   Microsoft account and create an organization if you don't have one. You only
   need it once, and any organization name works; it is the tenant the token is
   scoped to.

2. **Personal Access Token (PAT)** — at <https://dev.azure.com>, top-right avatar →
   **Security** → **Personal access tokens** → **New Token**:
   - **Organization:** **All accessible organizations** (important — a token scoped
     to a single org often fails to publish).
   - **Scopes:** click **Show all scopes** → **Marketplace** → check **Manage**.
   - **Expiration:** up to 1 year. Copy the token now; it's shown only once.

3. **Create the publisher** — at <https://marketplace.visualstudio.com/manage>,
   create a publisher whose **ID** is exactly `ryanfurrer` (must match `publisher`
   in `package.json`). Set the display name and details there.

### Publish

```bash
npx @vscode/vsce login ryanfurrer     # paste the PAT when prompted
npx @vscode/vsce publish              # reads version from package.json
# or publish a specific bump in one step:
npx @vscode/vsce publish minor        # patch | minor | major
```

`vsce publish` re-packages and uploads. The listing goes live in a few minutes;
verification/indexing for search can take a little longer.

---

## 2 · Open VSX (Cursor / VSCodium)

### One-time setup

1. Sign in at <https://open-vsx.org> with **GitHub**.
2. Accept the **Publisher Agreement** (Eclipse Foundation): profile → **Log in with
   Eclipse**, sign the agreement. Required once before your first publish.
3. Create an **Access Token**: <https://open-vsx.org/user-settings/tokens> →
   **Generate New Token**. Copy it.
4. Your Open VSX **namespace** must match the `publisher` in `package.json`
   (`ryanfurrer`). Create it once:
   ```bash
   npx ovsx create-namespace ryanfurrer -p <OPEN_VSX_TOKEN>
   ```

### Publish

```bash
npx ovsx publish hearth-<version>.vsix -p <OPEN_VSX_TOKEN>
```

(Publishes the already-built `.vsix`. Run `pnpm package` first if you haven't.)

---

## Release checklist

1. `node build.mjs` — regenerate variants if a base theme changed.
2. Bump `version` in `package.json` + note it in `CHANGELOG.md`.
3. `pnpm package` — build the `.vsix`, sideload it, and confirm all six themes
   render (`Cmd/Ctrl+K Cmd/Ctrl+T`).
4. `git commit` + `git tag v<version>` + `git push --tags`.
5. `vsce publish` (VS Code Marketplace).
6. `ovsx publish hearth-<version>.vsix -p <token>` (Open VSX).

## Handy links

- VS Code publishing guide: <https://code.visualstudio.com/api/working-with-extensions/publishing-extension>
- Marketplace manage page: <https://marketplace.visualstudio.com/manage>
- Open VSX docs: <https://github.com/eclipse/openvsx/wiki/Publishing-Extensions>
- Azure DevOps PATs: <https://learn.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate>
