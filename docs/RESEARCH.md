# commit-validator — documentation research

Reviewed 21 September 2026. Public GitHub source only.

## Revision and scope

- Commit: [`b768765794d86a72584f1f619b8ca8a6366cf068`](https://github.com/NickCirv/commit-validator/commit/b768765794d86a72584f1f619b8ca8a6366cf068).
- Tree: `eea0eff4d8b9462c91206ce6b16659a7d8fc0dd8`; truncated: `false`.
- Capture: 6 of 6 eligible text files; all eligible text files.
- Method: package and entrypoint inspection, implementation-interface review, targeted behavior/limitation inspection, and test-source review. This is not an exhaustive correctness or security audit.
- Commands run against repository code: **none**. External services, deployment and npm publication were not verified.

## Claim and evidence map

| Documentation claim | Pinned evidence | Assessment |
| --- | --- | --- |
| Runtime, executable and development commands | [package.json](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/package.json) | Source declaration inspected; runtime unverified |
| Validates commit-message structure against configurable Conventional Commit rules. | [index.js](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/index.js) | Implementation interfaces inspected; behavior not executed |
| Message parsing; configurable types/scopes; Git-range checks; commit-msg hook support. | [index.js](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/index.js) | Source-backed scope, not a test result |
| A valid message does not verify the implementation or release classification. Installing/uninstalling a commit-msg hook changes repository behavior; inspect existing hooks first. | [index.js](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/index.js) | Material limits documented; service compatibility remains open |
| Existing checks | [test/smoke.test.js](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/test/smoke.test.js) | Test source read; no passing-run claim |

## Documentation inventory and disposition

| Existing document | Decision |
| --- | --- |
| [README.md](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/README.md) | Rewritten with source-specific purpose, direct checkout setup, limitations and verification status. Old section fragments retained where practical. |

Added `docs/REFERENCE.md` for the observed implementation and command surface, and this research record. Protected license and attribution files remain in their original locations without edits. No source or product UI was changed.

## Quality dimensions

| Dimension | Status | Evidence / next step |
| --- | --- | --- |
| Pinned provenance | Verified | Captured commit, tree and per-file hashes recorded below |
| Interface documentation | Partially verified | Source inspection only; run clean-checkout quickstart |
| Runtime behavior | Unverified | No repository execution in this review |
| Test results | Unverified | Existing tests were not run |
| Deployment / package availability | Unverified | No remote publish or live-service check |
| Visual / link checks | Unverified | Portfolio renderer and independent QA are separate from this authoring step |

## Unresolved issues

A valid message does not verify the implementation or release classification. Installing/uninstalling a commit-msg hook changes repository behavior; inspect existing hooks first.

## Captured source inventory

This lists captured provenance, not a claim that every line received a full audit. Binary/generated/excluded files are outside the eligible text capture.

| File | SHA-256 | Bytes |
| --- | --- | --- |
| [LICENSE](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/LICENSE) | `8edf13ba2a2e443fa49e42493414f6952a4a14b6c407983a7c95162ab37f6265` | 1065 |
| [README.md](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/README.md) | `37af0f2849f71c8eecc38dc9fc19d1e7beef92ba44d8079063a56a23d187a89e` | 1946 |
| [package.json](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/package.json) | `0f089df8b2716493cbc89d008954c54df806b6967a60a40be5287d8c32199a55` | 840 |
| [.github/workflows/ci.yml](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/.github/workflows/ci.yml) | `e818f4e6bd805f798665dbbf04964d02f12fc59dd7f18903ad63d26d374ae3f0` | 380 |
| [index.js](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/index.js) | `7a8dd4ff085a8eb604b951265a8a3ea14eabbf5ad4b8001142b3f13c79591418` | 16245 |
| [test/smoke.test.js](https://github.com/NickCirv/commit-validator/blob/b768765794d86a72584f1f619b8ca8a6366cf068/test/smoke.test.js) | `1a21876fce1d7148992311342c9114e36a5249adac865ad0988db7d997043aba` | 334 |
