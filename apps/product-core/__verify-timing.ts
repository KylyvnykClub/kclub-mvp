// Temporary timing check for getDashboardMetrics — delete after use.
import { getDashboardMetrics } from './src/server/services/admin-service';

const t0 = Date.now();
const metrics = await getDashboardMetrics();
console.log(`getDashboardMetrics completed in ${Date.now() - t0}ms`);
console.log(`totalUsers=${metrics.totalUsers} recentActivity=${metrics.recentActivity?.length}`);
process.exit(0);
