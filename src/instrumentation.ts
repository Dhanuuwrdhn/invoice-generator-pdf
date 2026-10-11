// Runs once when the Node server starts: apply pending migrations before serving traffic,
// then prune expired sessions, email tokens and rate-limit windows in the background.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./db/migrate');
    await runMigrations();
    const { startPruning } = await import('./lib/prune');
    startPruning();
  }
}
