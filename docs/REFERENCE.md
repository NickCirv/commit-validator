# commit-validator — implementation reference

Source revision: `b768765794d86a72584f1f619b8ca8a6366cf068`. This reference records source declarations; it is not a transcript of a successful run.

## Entrypoint and runtime

[package.json](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/package.json) declares `index.js`. Node.js `>=20` and npm; Git is also used by the implementation.

Executable mapping: `commit-validator` → `./index.js`, `cv` → `./index.js`.

## Supported workflow

Message parsing; configurable types/scopes; Git-range checks; commit-msg hook support.

A valid message does not verify the implementation or release classification. Installing/uninstalling a commit-msg hook changes repository behavior; inspect existing hooks first.

## Command reference

The commands below use the installed executable name. From the pinned checkout, replace it with the `node` entrypoint shown above. Options and command branches were cross-checked against captured source; examples are not execution transcripts.

| Flag | Description |
|------|-------------|
| `--file <path>` | Validate a message from file (commit-msg hook target) |
| `--range <range>` | Validate a git commit range |
| `--config <path>` | Path to `.commitlintrc.json` config |
| `--format <fmt>` | Output format: `text` (default), `json`, `github` |
| `--install` | Install `commit-msg` hook in current repo |
| `--uninstall` | Remove the hook |

## Package scripts

| Script | Exact command |
| --- | --- |
| `test` | `node --test` |

## Implementation sources

[index.js](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/index.js).

## Verification boundary

No repository code, tests, network operation, hook installer or migration was executed for this review. Source inspection supports the documented interface; runtime correctness and external-service compatibility remain unverified.
