#!/usr/bin/env node
// Date fixtures are read through device-local getters, so a suite that is green in one zone can be
// wrong in another. Run the whole suite across the extremes rather than trusting one machine.
const { spawnSync } = require('child_process');

const zones = ['UTC', 'Asia/Jerusalem', 'America/Los_Angeles', 'Pacific/Kiritimati'];
let failed = false;

for (const tz of zones) {
  process.stdout.write(`\n=== ${tz} ===\n`);
  const run = spawnSync('npx', ['jest', '--silent'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, JEST_TZ: tz },
  });
  if (run.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
