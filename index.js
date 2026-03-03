#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, chmodSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';
import { spawnSync } from 'child_process';

// ─── Default Config ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  types: ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
  maxHeaderLength: 100,
  maxDescriptionLength: 72,
  requireScope: false,
  descriptionLowercase: true,
};

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseCommit(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const header = lines[0] ?? '';
  const rest = lines.slice(1);

  // Find body and footer (separated by blank lines)
  let body = '';
  let footer = '';
  let inBody = false;
  let bodyLines = [];
  let footerLines = [];
  let blankFound = false;

  for (const line of rest) {
    if (!inBody && line.trim() === '') { inBody = true; continue; }
    if (!inBody) continue;
    if (inBody && line.trim() === '' && !blankFound) { blankFound = true; continue; }
    if (blankFound) {
      footerLines.push(line);
    } else {
      bodyLines.push(line);
    }
  }

  body = bodyLines.join('\n').trim();
  footer = footerLines.join('\n').trim();

  // Parse header: type(scope)!: description
  const headerMatch = header.match(/^([a-zA-Z]+)(?:\(([^)]*)\))?(!)?\s*:\s*(.*)$/);
  if (!headerMatch) {
    return { valid: false, raw, header, body, footer, parsed: null };
  }

  const [, type, scope, breaking, description] = headerMatch;
  return {
    valid: true,
    raw,
    header,
    body,
    footer,
    parsed: { type, scope: scope ?? null, breaking: breaking === '!', description },
  };
}

// ─── Validator ────────────────────────────────────────────────────────────────

function validate(message, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors = [];
  const warnings = [];

  const parsed = parseCommit(message.trim());

  // Rule 1: Format check
  if (!parsed.valid) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Expected format: type(scope): description or type(scope)!: description',
      hint: guessHint(message.trim(), cfg),
    });
    return { valid: false, errors, warnings };
  }

  const { type, scope, description } = parsed.parsed;
  const header = parsed.header;

  // Rule 2: Type must be allowed
  if (!cfg.types.includes(type)) {
    errors.push({
      code: 'INVALID_TYPE',
      message: `Type "${type}" is not allowed`,
      hint: `Valid types: ${cfg.types.join(', ')}`,
    });
  }

  // Rule 3: Scope must be lowercase alphanumeric+hyphens if present
  if (scope !== null && !/^[a-z0-9][a-z0-9-]*$/.test(scope)) {
    errors.push({
      code: 'INVALID_SCOPE',
      message: `Scope "${scope}" must be lowercase alphanumeric with hyphens only`,
      hint: `Example: feat(auth-service): ...`,
    });
  }

  // Rule 4: requireScope
  if (cfg.requireScope && !scope) {
    errors.push({
      code: 'SCOPE_REQUIRED',
      message: 'Scope is required by config',
      hint: `Example: ${type}(scope): ${description}`,
    });
  }

  // Rule 5: Description must not be empty
  if (!description || description.trim() === '') {
    errors.push({
      code: 'EMPTY_DESCRIPTION',
      message: 'Description must not be empty',
      hint: `Example: ${type}: add meaningful description`,
    });
    return { valid: errors.length === 0, errors, warnings };
  }

  // Rule 6: Description must not end with period
  if (description.trimEnd().endsWith('.')) {
    errors.push({
      code: 'TRAILING_PERIOD',
      message: 'Description must not end with a period',
      hint: `Remove the trailing period: "${description.trimEnd().slice(0, -1)}"`,
    });
  }

  // Rule 7: Description must start with lowercase (configurable)
  if (cfg.descriptionLowercase && /^[A-Z]/.test(description)) {
    errors.push({
      code: 'DESCRIPTION_CASE',
      message: 'Description must start with a lowercase letter',
      hint: `Change to: "${description[0].toLowerCase()}${description.slice(1)}"`,
    });
  }

  // Rule 8: Description max length
  if (description.length > cfg.maxDescriptionLength) {
    errors.push({
      code: 'DESCRIPTION_TOO_LONG',
      message: `Description is ${description.length} chars, max is ${cfg.maxDescriptionLength}`,
      hint: `Shorten: "${description.slice(0, cfg.maxDescriptionLength)}..."`,
    });
  }

  // Rule 9: Header max length
  if (header.length > cfg.maxHeaderLength) {
    errors.push({
      code: 'HEADER_TOO_LONG',
      message: `Header is ${header.length} chars, max is ${cfg.maxHeaderLength}`,
      hint: `Full header: "${header}"`,
    });
  }

  // Rule 10 & 11: Body/footer blank line separation — checked in parse
  // Rule 11: BREAKING CHANGE in footer
  if (parsed.footer) {
    const breakingMatch = parsed.footer.match(/^BREAKING[ -]CHANGE:\s*(.+)$/m);
    if (breakingMatch && !breakingMatch[1].trim()) {
      errors.push({
        code: 'EMPTY_BREAKING_CHANGE',
        message: 'BREAKING CHANGE footer must include a description',
        hint: 'Example: BREAKING CHANGE: API endpoint removed',
      });
    }
  }

  // Rule 12: Closes/Fixes footer format (warn only)
  const allText = [parsed.body, parsed.footer].join('\n');
  const closePattern = /\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\s+[^#\d]/gi;
  if (closePattern.test(allText)) {
    warnings.push({
      code: 'FOOTER_FORMAT',
      message: 'Issue reference should use format: Closes #123 or Fixes #456',
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

function guessHint(message, cfg) {
  const lower = message.toLowerCase();
  for (const t of cfg.types) {
    if (lower.startsWith(t)) {
      return `Did you mean "${t}: ${message.slice(t.length).replace(/^[\s:]+/, '')}"?`;
    }
  }
  return `Valid types: ${cfg.types.join(', ')}`;
}

// ─── Git helpers ──────────────────────────────────────────────────────────────

function gitLog(range) {
  const result = spawnSync('git', ['log', '--format=%H%n%B%n---COMMIT_END---', range], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`git log failed: ${result.stderr?.trim() ?? 'unknown error'}`);
  }
  const output = result.stdout ?? '';
  const commits = [];
  const blocks = output.split('\n---COMMIT_END---\n').filter(b => b.trim());
  for (const block of blocks) {
    const lines = block.split('\n');
    const hash = lines[0]?.trim();
    const msg = lines.slice(1).join('\n').trim();
    if (hash && msg) commits.push({ hash, message: msg });
  }
  return commits;
}

function findGitRoot() {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

// ─── Hook install/uninstall ───────────────────────────────────────────────────

const HOOK_CONTENT = `#!/bin/sh
# commit-validator hook — installed by cv --install
# Remove with: cv --uninstall
npx commit-validator --file "$1"
`;

function installHook() {
  const root = findGitRoot();
  if (!root) throw new Error('Not inside a git repository');
  const hookPath = join(root, '.git', 'hooks', 'commit-msg');
  writeFileSync(hookPath, HOOK_CONTENT, 'utf8');
  chmodSync(hookPath, 0o755);
  return hookPath;
}

function uninstallHook() {
  const root = findGitRoot();
  if (!root) throw new Error('Not inside a git repository');
  const hookPath = join(root, '.git', 'hooks', 'commit-msg');
  if (!existsSync(hookPath)) throw new Error('No commit-msg hook found');
  const content = readFileSync(hookPath, 'utf8');
  if (!content.includes('commit-validator hook')) {
    throw new Error('Hook was not installed by commit-validator — refusing to remove');
  }
  // unlinkSync imported at top via fs
  return hookPath;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatText(message, result, hash) {
  const prefix = hash ? `[${hash.slice(0, 7)}] ` : '';
  const preview = message.split('\n')[0];
  const lines = [];

  if (result.valid) {
    lines.push(`\u2713 ${prefix}"${preview}"`);
    if (result.warnings.length > 0) {
      for (const w of result.warnings) lines.push(`  \u26a0 ${w.message}`);
    }
  } else {
    lines.push(`\u2717 Invalid commit: ${prefix}"${preview}"`);
    for (const e of result.errors) {
      lines.push(`  ${e.message}`);
      if (e.hint) lines.push(`  Hint: ${e.hint}`);
    }
    for (const w of result.warnings) {
      lines.push(`  \u26a0 Warning: ${w.message}`);
    }
  }

  return lines.join('\n');
}

function formatGithub(message, result, hash) {
  const lines = [];
  const preview = message.split('\n')[0];
  const prefix = hash ? `${hash.slice(0, 7)}: ` : '';

  if (!result.valid) {
    lines.push(`::error::${prefix}${preview}`);
    for (const e of result.errors) {
      lines.push(`::error::  ${e.message}${e.hint ? ` — ${e.hint}` : ''}`);
    }
  }
  for (const w of result.warnings) {
    lines.push(`::warning::${prefix}${w.message}`);
  }

  return lines.join('\n');
}

function formatJson(message, result, hash) {
  return JSON.stringify({ hash, message, ...result }, null, 2);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    message: null,
    file: null,
    range: null,
    install: false,
    uninstall: false,
    config: null,
    format: 'text',
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help' || a === '-h') { opts.help = true; }
    else if (a === '--install') { opts.install = true; }
    else if (a === '--uninstall') { opts.uninstall = true; }
    else if (a === '--file' || a === '-f') { opts.file = args[++i]; }
    else if (a === '--range' || a === '-r') { opts.range = args[++i]; }
    else if (a === '--config' || a === '-c') { opts.config = args[++i]; }
    else if (a === '--format') { opts.format = args[++i]; }
    else if (!a.startsWith('-')) { opts.message = a; }
  }

  return opts;
}

function loadConfig(configPath) {
  if (!configPath) {
    // Auto-detect in cwd
    const candidates = ['.commitlintrc.json', '.commit-validator.json'];
    for (const name of candidates) {
      const p = resolve(process.cwd(), name);
      if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
    }
    return {};
  }
  const p = resolve(process.cwd(), configPath);
  if (!existsSync(p)) throw new Error(`Config file not found: ${p}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

function printHelp() {
  console.log(`
commit-validator — Validate Conventional Commits. Zero dependencies.

USAGE
  cv "type(scope): description"          Validate a message string
  cv --file .git/COMMIT_EDITMSG         Validate a file (use as git hook)
  cv --range HEAD~5..HEAD               Validate last 5 commits
  cv --range main..HEAD                 Validate commits vs main
  cv --install                          Install commit-msg git hook
  cv --uninstall                        Remove the git hook

OPTIONS
  --file, -f <path>       Validate message from file
  --range, -r <range>     Validate a git range
  --config, -c <path>     Path to config file
  --format <fmt>          Output format: text (default), json, github
  --install               Install commit-msg hook in current repo
  --uninstall             Remove commit-msg hook
  --help, -h              Show this help

CONFIG FILE (.commitlintrc.json)
  {
    "types": ["feat", "fix", "chore"],
    "maxHeaderLength": 100,
    "maxDescriptionLength": 72,
    "requireScope": false,
    "descriptionLowercase": true
  }

EXIT CODES
  0  All commits valid
  1  One or more commits invalid
  2  Error (bad args, missing file, etc.)

EXAMPLES
  cv "feat(auth): add JWT refresh"
  cv --file .git/COMMIT_EDITMSG
  cv --range HEAD~5..HEAD --format github
  cv --install
`.trim());
}

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  // Install / uninstall
  if (opts.install) {
    try {
      const hookPath = installHook();
      console.log(`\u2713 commit-msg hook installed at ${hookPath}`);
      console.log('  Every commit will now be validated automatically.');
      process.exit(0);
    } catch (err) {
      console.error(`\u2717 Install failed: ${err.message}`);
      process.exit(2);
    }
  }

  if (opts.uninstall) {
    try {
      const root = findGitRoot();
      if (!root) throw new Error('Not inside a git repository');
      const hookPath = join(root, '.git', 'hooks', 'commit-msg');
      if (!existsSync(hookPath)) throw new Error('No commit-msg hook found');
      const content = readFileSync(hookPath, 'utf8');
      if (!content.includes('commit-validator hook')) {
        throw new Error('Hook was not installed by commit-validator — refusing to remove');
      }
      unlinkSync(hookPath);
      console.log(`\u2713 commit-msg hook removed from ${hookPath}`);
      process.exit(0);
    } catch (err) {
      console.error(`\u2717 Uninstall failed: ${err.message}`);
      process.exit(2);
    }
  }

  // Load config
  let config;
  try {
    config = loadConfig(opts.config);
  } catch (err) {
    console.error(`\u2717 Config error: ${err.message}`);
    process.exit(2);
  }

  const fmt = opts.format;
  if (!['text', 'json', 'github'].includes(fmt)) {
    console.error(`\u2717 Unknown format "${fmt}". Use: text, json, github`);
    process.exit(2);
  }

  // Collect messages to validate
  const targets = []; // [{ message, hash }]

  if (opts.range) {
    try {
      const commits = gitLog(opts.range);
      if (commits.length === 0) {
        console.error('\u2717 No commits found in range');
        process.exit(2);
      }
      for (const c of commits) targets.push({ message: c.message, hash: c.hash });
    } catch (err) {
      console.error(`\u2717 git error: ${err.message}`);
      process.exit(2);
    }
  } else if (opts.file) {
    const p = resolve(process.cwd(), opts.file);
    if (!existsSync(p)) {
      console.error(`\u2717 File not found: ${p}`);
      process.exit(2);
    }
    const msg = readFileSync(p, 'utf8');
    targets.push({ message: msg, hash: null });
  } else if (opts.message) {
    targets.push({ message: opts.message, hash: null });
  } else {
    printHelp();
    process.exit(2);
  }

  // Validate all
  let anyInvalid = false;
  const jsonResults = [];

  for (const { message, hash } of targets) {
    const result = validate(message, config);
    if (!result.valid) anyInvalid = true;

    if (fmt === 'text') {
      console.log(formatText(message, result, hash));
    } else if (fmt === 'github') {
      const out = formatGithub(message, result, hash);
      if (out) console.log(out);
    } else if (fmt === 'json') {
      jsonResults.push({ hash, message, ...result });
    }
  }

  if (fmt === 'json') {
    if (targets.length === 1) {
      console.log(JSON.stringify(jsonResults[0], null, 2));
    } else {
      console.log(JSON.stringify(jsonResults, null, 2));
    }
  }

  process.exit(anyInvalid ? 1 : 0);
}

main().catch(err => {
  console.error(`\u2717 Unexpected error: ${err.message}`);
  process.exit(2);
});
