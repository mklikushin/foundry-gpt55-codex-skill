# Foundry GPT-5.5 Codex Skill

A reusable Codex skill based on a real GPT-5.5 Microsoft Foundry / Azure OpenAI setup issue.

The short version of the lesson: before debugging Codex config, verify the Foundry project region, GPT-5.5 quota, model deployment, and Azure OpenAI endpoint shape. In the original case, the project existed but the region did not support the target deployment; moving the Azure OpenAI resource to a supported region fixed the cloud-side blocker.

## Install

Run this from a machine with Codex installed:

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo mklikushin/foundry-gpt55-codex-skill \
  --path skills/foundry-gpt55-codex
```

Then restart Codex so it loads the new skill.

## Use

Ask Codex:

```text
Use $foundry-gpt55-codex to help me wire Codex to GPT-5.5 in Foundry.
```

The skill tells Codex to use the Chrome plugin first for logged-in Foundry/Azure UI, then Computer Use if Chrome is unavailable, and to ask for access or current screenshots if neither is available.

## What It Covers

- GPT-5.5 region and quota checks in Foundry
- Missing model deployment vs missing project/resource
- Azure OpenAI endpoint shape for `/openai/v1/responses`
- Codex provider config examples
- API-key handling with `env_key` or `launchctl`
- A small endpoint probe script that redacts long token-like strings

## Included Files

```text
skills/foundry-gpt55-codex/
├── SKILL.md
├── agents/openai.yaml
├── references/debug-checklist.md
└── scripts/probe_azure_openai.mjs
```

No API keys or private credentials are included.
