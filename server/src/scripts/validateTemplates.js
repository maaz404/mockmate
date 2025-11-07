#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers, prefer-template */
/**
 * Validation script for questionTemplates.json ensuring each role has sufficient coverage.
 * Coverage rules (low risk, adjustable):
 *  - At least 1 technical question overall (any difficulty) per role
 *  - At least 1 behavioral question overall per role
 *  - Optional warning if total combined questions < MIN_TOTAL_THRESHOLD
 */

const path = require("path");
const fs = require("fs");

const TEMPLATE_PATH = path.join(
  __dirname,
  "..",
  "data",
  "questionTemplates.json"
);
const MIN_TOTAL_THRESHOLD = 6; // warn if fewer than this total across all difficulties
const ROLE_WIDTH = 28;
const PAD2 = 2;

function loadTemplates() {
  const raw = fs.readFileSync(TEMPLATE_PATH, "utf8");
  return JSON.parse(raw);
}

function aggregateRole(roleKey, roleData) {
  const difficulties = Object.keys(roleData);
  let technical = 0;
  let behavioral = 0;
  for (const diff of difficulties) {
    const level = roleData[diff];
    if (!level || typeof level !== "object") continue;
    for (const bucket of ["technical", "system-design"]) {
      if (Array.isArray(level[bucket])) technical += level[bucket].length;
    }
    if (Array.isArray(level["behavioral"]))
      behavioral += level["behavioral"].length;
  }
  return { technical, behavioral, total: technical + behavioral };
}

function main() {
  const templates = loadTemplates();
  const results = [];
  let failures = 0;
  let warnings = 0;

  Object.entries(templates).forEach(([roleKey, roleData]) => {
    const stats = aggregateRole(roleKey, roleData);
    const roleResult = { role: roleKey, ...stats, errors: [], warnings: [] };

    if (stats.technical < 1) {
      roleResult.errors.push("NO_TECHNICAL");
      failures += 1;
    }
    if (stats.behavioral < 1) {
      roleResult.errors.push("NO_BEHAVIORAL");
      failures += 1;
    }
    if (stats.total < MIN_TOTAL_THRESHOLD) {
      roleResult.warnings.push(`LOW_TOTAL(<${MIN_TOTAL_THRESHOLD})`);
      warnings += 1;
    }
    results.push(roleResult);
  });

  // Output summary
  console.log("Template Validation Summary");
  console.log("====================================");
  for (const r of results) {
    const status = r.errors.length ? "FAIL" : "PASS";
    const warnPart = r.warnings.length ? ` WARN(${r.warnings.join(",")})` : "";
    const errPart = r.errors.length ? ` ERR(${r.errors.join(",")})` : "";
    console.log(
      `${r.role.padEnd(ROLE_WIDTH)} tech=${r.technical
        .toString()
        .padStart(PAD2)} beh=${r.behavioral
        .toString()
        .padStart(PAD2)} total=${r.total
        .toString()
        .padStart(PAD2)} ${status}${warnPart}${errPart}`
    );
  }
  console.log("====================================");
  console.log(
    `Roles: ${results.length} | Failures: ${failures} | Warnings: ${warnings}`
  );

  if (failures > 0) {
    process.exitCode = 1; // non-zero for CI visibility
  }
}

if (require.main === module) {
  main();
}

module.exports = { loadTemplates, aggregateRole };
