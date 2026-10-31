# 🔒 Security

## Reporting a problem

If you find a security problem in a mod (for example, it reads, runs or sends something it shouldn't), please **don't open a public issue**. Report it privately instead: go to **Security → Report a vulnerability** in this repository.

I'll answer as soon as I can. Fixes ship as a new version of the mod, and the changelog describes the problem once it is fixed.

## What is checked

- Every change reaches `main` only through a pull request that passes CI.
- CI runs `claude plugin validate`, which reports every hook a mod listens to and every engine call it makes, and then runs the mod's tests.
- CI scans the repository for leaked secrets with [gitleaks](https://github.com/gitleaks/gitleaks).
- Each mod's README lists what it uses, what it does **not** do, and its risks. A change that makes a mod use something new updates that list.

## Staying safe with any mod

- A mod runs inside Claude Code **with your user's permissions**. Treat it like any other program you install.
- Install mods only from sources you trust, and read what they do first.
- When Claude Code asks **Add marketplace?**, check that the source it shows is the one you expect.
- Keep mods up to date with `claude plugin update <mod>@rhussu-mods`, and uninstall the ones you don't use.
