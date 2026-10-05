// Fails the run when JEST_TZ did not reach the clock. Setting TZ here cannot work: Jest hands
// setupFiles a copy of process.env, so the assignment never re-resolves the process zone.
const expected = process.env.JEST_TZ;
const actual = Intl.DateTimeFormat().resolvedOptions().timeZone;

if (expected && actual !== expected) {
  throw new Error(`JEST_TZ is ${expected} but tests run in ${actual}. Set TZ on the Jest process.`);
}
