---
name: chromium-password-manager-grouping
description: Investigate and fix Sol Chromium fork password-manager display/grouping issues after imported passwords appear as duplicate site rows or overly specific subdomain rows in chrome://password-manager. Use when deciding whether a password import symptom belongs in Sol client import code or Chromium fork password-manager UI/model support.
---

# Chromium Password Manager Grouping

## Purpose

Use this skill to hand off or investigate Sol/Chromium password-manager grouping bugs where imported credentials are stored correctly but `chrome://password-manager/passwords` displays duplicate visible site rows, such as two `account.ycombinator.com` rows, or where the UI shows an exact login subdomain instead of a Chrome-like grouped/domain presentation.

Keep the investigation privacy-preserving: inspect domains, realms, schema, counts, and distinct username counts only. Do not log or surface usernames, passwords, decrypted values, or password hashes.

## Current Findings

- Sol's client import patch can read both Chrome stores:
  - `Login Data For Account`
  - `Login Data`
- Sol client import can dedupe import candidates by normalized `signon_realm + username` and verify stored rows by `signon_realm + username`, avoiding false skipped-password warnings.
- Sol client import should only normalize to the exact origin realm, for example `https://account.ycombinator.com/`. It should not rewrite credentials to eTLD+1, for example `https://ycombinator.com/`, because that can broaden autofill scope and change security semantics.
- Electron's exposed password import API is intentionally narrow: `ImportedPassword` contains only `origin`, `username`, and `password`, and `session.importPasswords()` says credentials are deduped by normalized origin and username.
- The observed `account.ycombinator.com` issue was not caused by pathful import URLs. The local Sol profile had two stored rows with the same `origin_url` and `signon_realm`:
  - `https://account.ycombinator.com/` -> 2 credentials
  - `https://news.ycombinator.com/` -> 1 credential
- Therefore, rendering two visible `account.ycombinator.com` rows is likely in the Chromium password-manager UI/model grouping layer, not in Sol's TypeScript import conversion.
- Sol's Chromium fork is local-password-store-only for this path. Sync/account-store surfaces such as `GetAccountPasswordStore` are intentional shims; this issue is about local-store display/grouping after import, not adding Google account-store sync to Sol.

## Decision Boundary

Classify symptoms this way:

- **Sol client import issue:** missing account-store passwords, inflated skipped counts, duplicate imported rows with the same normalized realm and same username, or import availability not detecting `Login Data For Account`.
- **Chromium fork issue:** stored rows are already normalized to the same `origin_url`/`signon_realm`, but `chrome://password-manager/passwords` renders separate site rows instead of one site row with multiple credentials.
- **Do not implement client-side:** rewriting `account.domain.com` to `domain.com` as the stored credential origin. That is unsafe unless Chromium's own password-manager affiliation/grouping layer intentionally treats those realms as affiliated while preserving fill scoping.

## Reproduction Checks

From the Inspector repo root, inspect Sol profile password rows without revealing usernames:

```bash
sqlite3 -readonly "$HOME/Library/Application Support/Electron/Partitions/profile-michael/Login Data" \
  "SELECT origin_url, action_url, signon_realm, username_element, password_element, scheme,
          COUNT(*) AS n, COUNT(DISTINCT username_value) AS distinct_usernames
   FROM logins
   WHERE signon_realm LIKE '%ycombinator%' OR origin_url LIKE '%ycombinator%'
   GROUP BY origin_url, action_url, signon_realm, username_element, password_element, scheme
   ORDER BY signon_realm;"
```

Expected privacy-preserving evidence for the current bug:

```text
https://account.ycombinator.com/||https://account.ycombinator.com/|||0|2|2
https://news.ycombinator.com/||https://news.ycombinator.com/|||0|1|1
```

If rows differ only by username and share the same `origin_url` and `signon_realm`, the database is already normalized enough for autofill matching. Continue in Chromium password-manager display/grouping code.

## Fork Investigation Path

Search the fork for the password-manager WebUI/model boundaries:

```bash
rg -n "CredentialGroup|PasswordGroup|GetSavedPasswordList|GetPasswordList|PasswordUi|password_manager|password-manager|Affiliation" \
  vendor/electron-dev src components chrome
```

Also inspect Sol/Electron fork seams:

```bash
rg -n "ElectronPasswordManagerClient|PasswordStoreInterface|GetAccountPasswordStore|importPasswords|ImportedPassword" \
  vendor/electron-dev node_modules/.pnpm/@sandbox-technologies+electron*/node_modules/@sandbox-technologies/electron/electron.d.ts
```

Likely maintainer question:

Can the fork expose or restore the Chromium grouping path used by `chrome://password-manager/passwords` so multiple credentials with the same normalized realm render as one site row with multiple accounts, while still preserving exact-origin autofill semantics?

Secondary question:

If Chrome normally displays a branded/eTLD+1 grouping label for this case, identify whether that comes from affiliation/branding metadata, a Password Manager WebUI grouping model, or a Chrome-only service currently shimmed or not wired in Electron.

## Acceptance Criteria

- Imported credentials remain stored against exact, origin-safe realms such as `https://account.ycombinator.com/`.
- `chrome://password-manager/passwords` shows multiple credentials for the same normalized realm as one grouped site entry, or the fork maintainer documents the upstream Chromium condition that prevents grouping in Sol.
- No username or password values are logged in diagnostics.
- Account-store import support remains a Sol client import feature that converts Chrome-visible credentials into Sol's local profile password store; this change must not require Google sync/account-store support.
