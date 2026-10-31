<!--
  README template for a rhussu-mods mod.
  - Replace every "mod-template" with the mod's name, and every TODO.
  - Keep the section order: Install always comes first.
  - Delete these HTML comments when done.
-->

<p align="center">
  <img src=".claude-plugin/icon.png" alt="mod-template icon" width="96">
</p>

<h1 align="center">mod-template</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-60a5fa" alt="Version 0.1.0">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/license-MIT-c084fc" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/Claude%20Code-%E2%89%A5%202.1.314-f472b6" alt="Claude Code 2.1.314 or newer">
  <img src="https://img.shields.io/badge/languages-English%20%C2%B7%20Espa%C3%B1ol-2dd4bf" alt="English and Spanish">
</p>

<p align="center">
  TODO: one sentence saying what the mod does for the person using it.
</p>

<p align="center">
  <img src="assets/preview.png" alt="TODO: describe what the preview shows" width="100%">
</p>

## 🚀 Install

1. Open Claude Code and type:

   ```
   /plugin install mod-template --marketplace Rhussu/claude-mods
   ```

2. Claude Code asks **Add marketplace?** and shows `github:Rhussu/claude-mods`. Check that it is this repository, then answer `y`.
3. Pick a scope:
   - **user**: the mod is on in every project;
   - **project**: only in the current project.

<!-- TODO: what the person sees right after installing, including the one-time notice. -->
The first time, a short notice explains what the mod reads:

```
✦ mod-template is on · TODO: what it reads · what it never does
```

Prefer a shell? `claude plugin install mod-template --marketplace Rhussu/claude-mods` (add `--config language=es` for Spanish).

| | Command |
|---|---|
| 🔄 Update | `claude plugin update mod-template@rhussu-mods` |
| ⚙️ Change options | `/plugin configure mod-template@rhussu-mods` |
| 🗑️ Uninstall | `claude plugin uninstall mod-template@rhussu-mods` |

> [!WARNING]
> A mod runs inside Claude Code **with your user's permissions**. Read [🔒 Security at a glance](#-security-at-a-glance) and [🔍 What it uses](#-what-it-uses) before installing.

## ✨ Features

<!-- One row per thing the person notices. Lead with an emoji or the glyph the mod draws. -->

| | |
|---|---|
| ✨ **TODO** | TODO |
| 🌐 **Bilingual** | English and Spanish. |

## 🔒 Security at a glance

<!--
  The short version of "What it uses", for someone deciding whether to install.
  ✅ = something it never does. ⚙️ = something it runs. 👁️ = something it reads.
  Every line must match "What it uses" and what `claude plugin validate` reports.
-->

| | |
|---|---|
| ✅ | **No network access.** Nothing leaves your machine. |
| ✅ | **Writes no files.** |
| ✅ | **Never touches your tools, prompts or Claude's requests.** |
| ⚙️ | TODO: commands it runs, or delete this row. |
| 👁️ | **Reads** TODO. |
| 👋 | **Says so the first time it runs**: a one-time notice explains what it reads. |

## 🌐 Language

The `language` option sets the language of the mod:

| Value | Language |
|---|---|
| `auto` *(default)* | Spanish if Claude Code's `language` setting or your system's `$LANG` is Spanish; English otherwise. |
| `en` | English |
| `es` | Spanish (Español) |

<!-- TODO: other options from userConfig, one row each, or delete this comment. -->

## 🔍 What it uses

<!--
  Copy this from `claude plugin validate mods/mod-template`:
  the "hooks:" line goes in the first table and the "calls:" line in the second.
  Say why for every row. If a change adds a hook or a call, update this section in the same PR.
-->

As reported by `claude plugin validate`.

<details open>
<summary><b>Events it listens to</b></summary>

| Event | Why |
|---|---|
| `session.start` | Pick the language and show the one-time notice. |
| TODO | TODO |

</details>

<details open>
<summary><b>What it runs and reads</b></summary>

| What | When |
|---|---|
| Claude Code setting `language` and the `LANG` environment variable | At session start, only when `language` is `auto`. |
| A plugin store key, `bienvenida` | At session start, to remember that the one-time notice was shown. |
| TODO | TODO |

</details>

## ⚠️ Risks and limitations

<!-- Be honest: what can go wrong, what it can't do, what it was tested with. -->

- **Early access API.** Claude Code mods may change between releases. Tested with Claude Code **2.1.314**.
- TODO

## 📄 License

[MIT](../../LICENSE) © 2026 Rhussu · [Changelog](CHANGELOG.md)
