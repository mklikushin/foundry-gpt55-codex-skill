#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function usage() {
  console.error(`Usage:
  probe_azure_openai.mjs --endpoint <https://resource.openai.azure.com/openai/v1> --model <deployment> [--key-source env|launchctl] [--env-var AZURE_OPENAI_API_KEY]

No secrets are printed. Defaults: --key-source env --env-var AZURE_OPENAI_API_KEY`);
}

function argValue(args, name, fallback = undefined) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  usage();
  process.exit(0);
}

const endpoint = argValue(args, "--endpoint");
const model = argValue(args, "--model");
const keySource = argValue(args, "--key-source", "env");
const envVar = argValue(args, "--env-var", "AZURE_OPENAI_API_KEY");

if (!endpoint || !model) {
  usage();
  process.exit(2);
}

function readKey() {
  if (keySource === "env") return process.env[envVar] || "";
  if (keySource === "launchctl") {
    return execFileSync("launchctl", ["getenv", envVar], { encoding: "utf8" }).trim();
  }
  throw new Error(`Unsupported --key-source ${keySource}`);
}

const key = readKey();
if (!key) {
  console.error(`${envVar} is not set via ${keySource}`);
  process.exit(3);
}

const base = endpoint.replace(/\/+$/, "");
const redact = (text) => text.replace(/[A-Za-z0-9_-]{40,}/g, "<redacted>");

async function probe(label, path, options = {}) {
  const res = await fetch(`${base}${path}`, options);
  const text = await res.text();
  console.log(`${label}: ${res.status} ${res.statusText}`);
  console.log(redact(text).slice(0, 700));
  return res.ok;
}

let ok = true;
ok = (await probe("models", "/models", {
  headers: { Authorization: `Bearer ${key}` },
})) && ok;

ok = (await probe("responses", "/responses", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    input: "Reply with exactly: pong",
    max_output_tokens: 20,
  }),
})) && ok;

process.exit(ok ? 0 : 1);
