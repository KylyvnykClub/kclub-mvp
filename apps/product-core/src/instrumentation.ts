export async function register() {
  // Only run on the Node.js server runtime (skip the Edge runtime).
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateProductionEnv } = await import('@/server/env-validation');
    validateProductionEnv();
  }
}
