import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');

// A headless launch (killed-state MARK_DONE tap, background fetch) evaluates only the entry
// module graph — expo-router route modules never load, so a TaskManager.defineTask reachable
// only through the router tree never runs and the OS-invoked task is silently dropped.
// These assertions pin the wiring that keeps both background tasks defined in headless mode;
// defineTask itself is covered by NotificationScheduler.test.ts 6.9/6.10.
describe('background task entry wiring', () => {
  it('bundle entry is the root index.js, not expo-router/entry directly', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.main).toBe('index.js');
  });

  it('index.js imports the router entry and the scheduler module', () => {
    const entry = fs.readFileSync(path.join(ROOT, 'index.js'), 'utf8');
    expect(entry).toContain("import 'expo-router/entry'");
    expect(entry).toContain("import './src/services/NotificationScheduler'");
  });
});
