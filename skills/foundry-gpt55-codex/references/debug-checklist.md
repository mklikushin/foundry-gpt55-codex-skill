# Foundry GPT-5.5 Codex Debug Checklist

This checklist is written as a reusable lesson from one real setup: start with cloud-side truth, then debug the local client.

## 0. Live UI Access Order

When you need to inspect Foundry or Azure UI state, use the available tools in this order:

1. Chrome plugin / `chrome:Chrome`: preferred for logged-in Foundry/Azure pages, existing tabs, cookies, and account-scoped quota/deployment views.
2. Computer Use plugin / `computer-use:computer-use`: fallback when Chrome automation is unavailable or when the UI requires desktop-level interaction.
3. User prompt: if neither plugin is available, ask the user to enable one of them or provide current screenshots/details. Do not present the quota, region, deployment, or endpoint as verified unless you inspected it yourself.

## 1. Region And Quota

In Foundry, check `Operate > Quota > Token per minute`, enable `Show all`, and search for `gpt-5.5`.

General rule:

- If GPT-5.5 is not available in the project/resource region, client-side config will not fix it.
- Region availability can change, so always trust the live quota/deploy UI over old notes.
- If the desired SKU/model is unavailable, create or choose an Azure OpenAI resource in a region that does show quota.

Case study:

- The original projects were in `westus`.
- Foundry showed GPT-5.5 quota in regions including `East US 2`.
- A default deployment attempt from the `westus` project failed with a message that GPT-5.5 with the selected SKU was not available in the project's region.
- Creating a new Foundry project/resource in `East US 2` resolved the region mismatch.

## 2. Deployment Existence

A Foundry project and Azure OpenAI resource are not the same thing as a model deployment.

Check `Operate > Assets > Models`, or open the GPT-5.5 model page for the target project and use `Deploy > Default settings`. The deployment name is the value the client should pass as `model`.

Expected signs:

- The deployment appears under the target project's model assets.
- The playground can run a simple prompt against that deployment.
- `Endpoint and keys` are available for the backing Azure OpenAI resource.

## 3. Endpoint Shape

Use the Azure OpenAI endpoint for Responses API calls:

```text
https://<resource-name>.openai.azure.com/openai/v1
```

The Responses URL becomes:

```text
https://<resource-name>.openai.azure.com/openai/v1/responses
```

Case study:

```text
https://<east-us-2-resource-name>.openai.azure.com/openai/v1
```

Do not copy a placeholder like `https://your_resource_name.openai.azure.com/openai/v1`. Do not use the Foundry project endpoint when configuring Codex for Azure OpenAI Responses calls.

## 4. Codex Config

Provider routing should live in the user's Codex config, usually `~/.codex/config.toml`. Do not store API keys in that file.

Generic command-backed auth example:

```toml
model = "gpt-5.5"
model_provider = "azure-openai"
model_reasoning_effort = "xhigh"

[model_providers.azure-openai]
name = "Azure OpenAI"
base_url = "https://<resource-name>.openai.azure.com/openai/v1"
wire_api = "responses"

[model_providers.azure-openai.auth]
command = "launchctl"
args = ["getenv", "AZURE_OPENAI_API_KEY"]
```

Generic environment-variable auth example:

```toml
model = "gpt-5.5"
model_provider = "azure-openai"
model_reasoning_effort = "xhigh"

[model_providers.azure-openai]
name = "Azure OpenAI"
base_url = "https://<resource-name>.openai.azure.com/openai/v1"
wire_api = "responses"
env_key = "AZURE_OPENAI_API_KEY"
```

Use one auth style, not both. If the user's Codex build supports a static model catalog and Azure `/models` parsing is noisy, add the installation-specific `model_catalog_json` path only after confirming where that file lives on their machine.

## 5. Local Environment Checks

Use redacted checks. Never print full API keys in shared notes, transcripts, or screenshots.

```bash
launchctl getenv AZURE_OPENAI_API_KEY
printenv AZURE_OPENAI_API_KEY
rg -n "your_resource_name|AZURE_OPENAI|model_provider|model_providers|openai\\.azure|base_url|gpt-5\\.5" ~/.codex/config.toml
codex doctor --summary
```

If `launchctl getenv` is set but `printenv` is empty, command-backed auth is often the simplest path for a running macOS session.

## 6. Endpoint Probe

Run the bundled probe with the user's real endpoint and deployment name:

```bash
node ~/.codex/skills/foundry-gpt55-codex/scripts/probe_azure_openai.mjs \
  --endpoint https://<resource-name>.openai.azure.com/openai/v1 \
  --model <deployment-name> \
  --key-source launchctl
```

Use `--key-source env` if the key is present in the current shell environment. The script prints statuses and redacts long token-like strings.

## 7. Common Failure Interpretation

- `https://your_resource_name.openai.azure.com/openai/v1/responses`: placeholder endpoint is still in effect.
- GPT-5.5 unavailable in the current region: create or use a resource in a region with live quota/deploy support.
- Project exists but no model asset/deployment exists: deploy GPT-5.5 before debugging Codex.
- Endpoint probe works but `codex exec` fails: inspect `~/.codex/config.toml` provider routing and auth.
- `codex doctor` reaches the provider but unrelated plugin/catalog warnings appear: verify the actual model turn before treating warnings as fatal.
- Azure `/models` response does not match Codex's model catalog parser: use an installation-specific static catalog if supported, or ignore it if real Responses calls succeed.
