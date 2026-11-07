#!/usr/bin/env node
/**
 * dockerfile-build-check.cjs — PostToolUse: lint a Dockerfile immediately after
 * it is written/edited, so a broken Dockerfile is caught before commit instead
 * of at CI. Best-effort: skips silently if hadolint isn't installed.
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

function hasHadolint() {
  try {
    execFileSync("hadolint", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const input = readHookInput();
  const filePath = input?.tool_input?.file_path || "";
  if (!/Dockerfile/.test(filePath.split("/").pop() || "")) process.exit(0);
  if (!hasHadolint()) process.exit(0);

  try {
    execFileSync("hadolint", [filePath], { stdio: "inherit" });
  } catch {
    // hadolint findings are advisory here; CI's hadolint job is authoritative.
  }
  process.exit(0);
}

main();
