#!/usr/bin/env node
// Frees a TCP port before Metro starts. Cross-platform on purpose: the previous `pnpm web` shelled
// out to PowerShell, so on macOS/Linux/CI it exited 127 and Metro never started at all.
const { execFileSync } = require('child_process');

const port = Number(process.argv[2] || 8081);

function pidsOnPort() {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' });
      return out
        .split(/\r?\n/)
        .filter((line) => line.includes(`:${port} `) && line.includes('LISTENING'))
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && pid !== '0');
    }
    const out = execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return []; // nothing listening, or the tool is unavailable — either way there is nothing to free
  }
}

for (const pid of [...new Set(pidsOnPort())]) {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', pid, '/F']);
    else process.kill(Number(pid), 'SIGKILL');
    console.log(`[free-port] released ${port} (pid ${pid})`);
  } catch {
    console.warn(`[free-port] could not stop pid ${pid} on port ${port}`);
  }
}
