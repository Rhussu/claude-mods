# 🧩 Mod template

A starting point for a new mod in this repository. [`mod-template/`](mod-template/) is a minimal working mod: it picks a language (English or Spanish) and shows a one-time notice. CI validates and tests it, so the template never goes stale.

## What's inside

| File | What to do with it |
|---|---|
| `.claude-plugin/plugin.json` | Set `name`, `description`, `homepage` and `keywords`. Start at `"version": "0.1.0"`. |
| `.claude-plugin/icon.png` | Add a square PNG icon, 512 px, in the Aurora style. |
| `hooks/hooks.json` | Leave as is. |
| `hooks/register.tsx` | The mod's code. Keep every text in both languages (`TEXTOS`) and keep the one-time notice. |
| `hooks/register.test.tsx` | Tests. Add one for each behavior. |
| `types/index.d.ts` | Add it only if the mod keeps values in `$.state`, and name it in `plugin.json` as `"types"`. |
| `assets/preview.png` | A preview image of the mod in use, shown at the top of its README. |
| `README.md` | Fill in every TODO. **Install** always comes first. |
| `CHANGELOG.md` | One entry per version. |
| `tsconfig.json` | Leave as is. Claude Code fills in the types when it loads the mod. |

## Creating a mod

```bash
git switch -c mod/<name>
cp -r templates/mod-template mods/<name>
grep -rl mod-template mods/<name> | xargs sed -i 's/mod-template/<name>/g'
```

Then:

1. Write the mod and its tests.
2. Fill in its README. Build **What it uses** from what `claude plugin validate mods/<name>` reports.
3. List the mod:
   - in `.claude-plugin/marketplace.json`, with the same `version` as its `plugin.json`;
   - in the **✨ Mods** table of the main README, with its preview and a **→ Install & details** link.
4. Check it:

   ```bash
   claude plugin validate .
   claude plugin validate mods/<name>
   claude plugin test mods/<name>
   ```

5. Open a pull request. Once CI is green, squash and merge.
6. Release it from an up-to-date `main`:

   ```bash
   claude plugin tag mods/<name> --push
   ```

## Changing a mod

- **Code or manifest:** bump `version` in its `plugin.json` **and** in `marketplace.json`, and add a `CHANGELOG.md` entry. CI checks both.
- **Only its README or images:** no version bump needed.
