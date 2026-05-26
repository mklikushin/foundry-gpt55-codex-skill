---
name: foundry-gpt55-codex
description: "Use this skill to help someone learn from and repeat a GPT-5.5 Foundry / Azure OpenAI setup for Codex, especially region/quota mismatches, missing deployments, placeholder Azure OpenAI endpoints, API-key auth, launchctl/env confusion, Chrome or Computer Use access to Foundry, and `/openai/v1/responses` failures."
---

# Foundry GPT-5.5 Codex

## Purpose

Use this as a reusable field guide based on a real GPT-5.5 Foundry setup incident. Teach the pattern first, then use the original experience as a case study. Do not assume the next user has the same Azure subscription, resource names, region, desktop paths, or Codex checkout.

## Live UI Access Order

When live Foundry/Azure UI evidence is needed, use the available browser/control tools in this order:

1. Use the Chrome plugin / `chrome:Chrome` skill first, especially for logged-in Foundry or Azure pages that depend on the user's Chrome profile, cookies, or existing tabs.
2. If Chrome is unavailable or cannot operate the needed UI, use the Computer Use plugin / `computer-use:computer-use` skill to drive the user's browser or desktop UI.
3. If neither plugin is available, pause and ask the user to enable one of them or provide screenshots/current details for the quota table, deployment page, endpoint, and key location. Clearly label anything based on user-provided screenshots as not independently verified.

## Reusable Workflow

1. Confirm the target stack: Foundry project, Azure OpenAI resource, deployment name, model, endpoint, and the client that will call it.
2. Check model availability and quota in the live Foundry/Azure UI before debugging the client.
3. If the current project/resource region has no GPT-5.5 quota or deploy support, create or switch to a resource in a supported region.
4. Confirm the GPT-5.5 deployment exists; a Foundry project by itself is not enough.
5. Use the Azure OpenAI endpoint shape `https://<resource>.openai.azure.com/openai/v1`, not a placeholder endpoint and not the Foundry project endpoint.
6. Configure Codex with a provider entry that uses the Responses API and non-secret auth.
7. Validate in layers: endpoint probe, `codex doctor`, then a tiny `codex exec` smoke test.

Read `references/debug-checklist.md` for the detailed checklist, generic config snippets, and the case study of what failed and what worked. Use `scripts/probe_azure_openai.mjs` when you want to test the Azure OpenAI endpoint independently of Codex without printing secrets.

## Core Lessons

- Model access is regional. A project can exist and still be unable to deploy GPT-5.5 in its region.
- Quota visibility matters. Foundry's quota page is often the fastest way to distinguish "bad client config" from "wrong region or no quota."
- Deployment existence matters. Creating a project/resource is separate from deploying a model.
- Endpoint shape matters. Calls to `https://your_resource_name.openai.azure.com/openai/v1/responses` mean the client is still using placeholder config.
- Secret handling matters. Do not paste, print, or store API keys in skill files or config; use `env_key` or command-backed auth.
- Shell environment and GUI/session environment can differ. `launchctl setenv` may not make a value visible to the current shell's `printenv`.
- Some warnings are not model-call failures. API-key auth can produce unrelated ChatGPT/plugin catalog warnings while the Azure OpenAI model call succeeds.

## Validation Pattern

After setup, run a layered check with the user's actual workspace:

```bash
codex doctor --summary
codex exec -C /path/to/workspace "Reply with exactly: pong"
```

Success means Codex is using the intended Azure OpenAI provider and the model returns `pong`. If the endpoint probe succeeds but Codex fails, focus on Codex provider config. If both fail, focus on Foundry resource, deployment, endpoint, or key.
