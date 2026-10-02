// Runs once when the Node server starts: apply pending migrations before serving traffic.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./db/migrate');
    await runMigrations();
  }
}
