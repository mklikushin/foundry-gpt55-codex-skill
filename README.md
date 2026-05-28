# Codex Skills

Reusable Codex skills for local engineering workflows and handoffs.

## Available Skills

### `foundry-gpt55-codex`

A reusable field guide based on a real GPT-5.5 Microsoft Foundry / Azure OpenAI setup issue.

Use it when Codex needs to diagnose Foundry region/quota mismatches, missing GPT-5.5 deployments, Azure OpenAI endpoint shape, API-key auth, `launchctl`/environment confusion, or `/openai/v1/responses` failures.

### `chromium-password-manager-grouping`

A Chromium fork maintainer handoff for Sol password-manager display/grouping bugs after Chrome password import.

Use it when imported credentials are stored correctly but `chrome://password-manager/passwords` shows duplicate visible site rows, overly specific subdomain rows such as `account.domain.com`, or when deciding whether a password import symptom belongs in Sol client import code or Chromium fork password-manager UI/model support.

## Install

Run these from a machine with Codex installed.

### Install Foundry GPT-5.5 Codex

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo mklikushin/foundry-gpt55-codex-skill \
  --path skills/foundry-gpt55-codex
```

### Install Chromium Password Manager Grouping

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo mklikushin/foundry-gpt55-codex-skill \
  --path skills/chromium-password-manager-grouping
```

Restart Codex after installing so the new skill metadata is loaded.

## Use

Ask Codex:

```text
Use $foundry-gpt55-codex to help me wire Codex to GPT-5.5 in Foundry.
```

or:

```text
Use $chromium-password-manager-grouping to prepare the Sol/Chromium password-manager grouping handoff.
```

## Repository Layout

```text
skills/
├── chromium-password-manager-grouping/
│   ├── SKILL.md
│   └── agents/openai.yaml
└── foundry-gpt55-codex/
    ├── SKILL.md
    ├── agents/openai.yaml
    ├── references/debug-checklist.md
    └── scripts/probe_azure_openai.mjs
```

No API keys, private credentials, usernames, or password values are included.
