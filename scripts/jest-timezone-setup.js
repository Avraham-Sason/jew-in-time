// Assigning process.env.TZ inside the process re-resolves the timezone; a `TZ=...` prefix on the
// command line is ignored by Node on Windows, which silently made cross-timezone runs a no-op.
if (process.env.JEST_TZ) {
  process.env.TZ = process.env.JEST_TZ;
}
