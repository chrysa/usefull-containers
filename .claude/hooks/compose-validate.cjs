#!/usr/bin/env node
/**
 * compose-validate.cjs — PostToolUse: validate a docker-compose file immediately
 * after it is written/edited (`docker compose config -q`), shortening the
 * feedback loop for the CI "Validate docker-compose files" job. Best-effort:
 * skips silently if docker isn't available.
 */
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

function readHookInput() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

function hasDocker() {
  try {
    execFileSync("docker", ["compose", "version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const input = readHookInput();
  const filePath = input?.tool_input?.file_path || "";
  if (!/docker-compose.*\.ya?ml$/.test(filePath.split("/").pop() || "")) process.exit(0);
  if (!hasDocker()) process.exit(0);

  try {
    execFileSync("docker", ["compose", "-f", filePath, "config", "-q"], { stdio: "inherit" });
  } catch {
    process.stderr.write(`compose-validate: ${filePath} failed \`docker compose config\`\n`);
  }
  process.exit(0);
}

main();
