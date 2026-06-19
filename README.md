<div align="center">

# commit-validator

**Enforce Conventional Commits in git hooks or CI — zero dependencies**

[![License: MIT](https://img.shields.io/badge/License-MIT-0B0A09?labelColor=0B0A09&color=555)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-0B0A09?labelColor=0B0A09&color=555)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-0B0A09?labelColor=0B0A09&color=555)](package.json)

</div>

## Install

```bash
npx github:NickCirv/commit-validator --install
```

Writes a `commit-msg` hook to `.git/hooks/commit-msg`. Every commit is validated from that point on.

## Usage

```bash
# Validate a message string
npx github:NickCirv/commit-validator "feat(auth): add JWT refresh token support"

# Validate the last 5 commits
npx github:NickCirv/commit-validator --range HEAD~5..HEAD

# Validate commits on current branch vs main (GitHub Actions)
npx github:NickCirv/commit-validator --range main..HEAD --format github
```

| Flag | Description |
|------|-------------|
| `--file <path>` | Validate a message from file (commit-msg hook target) |
| `--range <range>` | Validate a git commit range |
| `--config <path>` | Path to `.commitlintrc.json` config |
| `--format <fmt>` | Output format: `text` (default), `json`, `github` |
| `--install` | Install `commit-msg` hook in current repo |
| `--uninstall` | Remove the hook |

## What it does

Parses and validates commit messages against the [Conventional Commits](https://www.conventionalcommits.org/) spec — type, scope, description casing, header length, breaking-change footers, and more (12 rules total). Outputs plain text, JSON, or GitHub Actions annotations. Supports a per-project `.commitlintrc.json` to override allowed types and length limits. Exit codes are CI-friendly: `0` valid, `1` invalid, `2` error.

---

<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
