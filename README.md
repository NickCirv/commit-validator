![Banner](banner.svg)

# commit-validator

> Validate Conventional Commits. Use as a git hook or in CI. Configurable. Zero dependencies.

```
$ cv "Fix the bug"
✗ Invalid commit: "Fix the bug"
  Expected format: type(scope): description
  Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
  Hint: Did you mean "fix: fix the bug"?

$ cv "feat(auth): add JWT refresh token support"
✓ "feat(auth): add JWT refresh token support"
```

## Install

As a git hook (recommended):

```sh
npx commit-validator --install
```

Or globally:

```sh
npm install -g commit-validator
```

## Quick Start

```sh
# Validate a message string
cv "feat(auth): add JWT refresh"

# Validate from a file (commit-msg hook target)
cv --file .git/COMMIT_EDITMSG

# Validate the last 5 commits
cv --range HEAD~5..HEAD

# Validate all commits on current branch vs main
cv --range main..HEAD

# Install as commit-msg git hook
cv --install

# Remove the hook
cv --uninstall

# Use a custom config
cv --config .commitlintrc.json "fix: correct timeout handling"

# Output as JSON (for scripting)
cv --format json "feat: add dark mode"

# Output GitHub Actions annotations
cv --format github --range main..HEAD
```

## Rules

All 12 Conventional Commits rules enforced:

| # | Rule | Severity |
|---|------|----------|
| 1 | Format: `type(scope)!: description` | Error |
| 2 | Type must be in allowed list | Error |
| 3 | Scope must be lowercase alphanumeric + hyphens | Error |
| 4 | Scope required (if `requireScope: true`) | Error |
| 5 | Description must not be empty | Error |
| 6 | Description must not end with period | Error |
| 7 | Description must start with lowercase | Error |
| 8 | Description max 72 chars | Error |
| 9 | Header max 100 chars | Error |
| 10 | Body/footer separated by blank lines | Parsed |
| 11 | `BREAKING CHANGE:` footer must have description | Error |
| 12 | `Closes #123` / `Fixes #456` footer format | Warning |

### Valid types (default)

`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

## Config

Create `.commitlintrc.json` in your project root:

```json
{
  "types": ["feat", "fix", "chore"],
  "maxHeaderLength": 100,
  "maxDescriptionLength": 72,
  "requireScope": false,
  "descriptionLowercase": true
}
```

Pass a custom config path with `--config`:

```sh
cv --config path/to/my-config.json "feat: something"
```

Config is auto-detected if `.commitlintrc.json` or `.commit-validator.json` exists in the current directory.

## Output Formats

| Format | Use case |
|--------|----------|
| `text` (default) | Human-readable terminal output |
| `json` | Scripting and tooling integration |
| `github` | GitHub Actions annotations |

```sh
cv --format github --range main..HEAD
# ::error::abc1234: Fix the bug
# ::error::  Expected format: type(scope): description — Valid types: feat, fix, ...
```

## Git Hook

`cv --install` writes a `commit-msg` hook to `.git/hooks/commit-msg`:

```sh
#!/bin/sh
# commit-validator hook
npx commit-validator --file "$1"
```

Remove it with `cv --uninstall`.

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All commits valid |
| `1` | One or more commits invalid |
| `2` | Error (bad args, missing file, git failure, etc.) |

## CI Usage

```yaml
# GitHub Actions
- name: Validate commit messages
  run: npx commit-validator --range ${{ github.event.before }}..${{ github.sha }} --format github
```

## Examples

```sh
# Valid
cv "feat: add user authentication"
cv "fix(api): handle null response from upstream"
cv "refactor(db)!: migrate from MySQL to PostgreSQL"
cv "chore: update dependencies"

# Invalid
cv "Fixed the bug"          # no type
cv "feat: Fixed the bug."   # uppercase + trailing period
cv "feat: "                 # empty description
cv "FEAT: add thing"        # uppercase type
```

---

Built with Node.js · Zero dependencies · MIT License
