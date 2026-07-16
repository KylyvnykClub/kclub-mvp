import { handleStaffPasswordSignIn } from '@/server/staff-auth';

export async function POST(request: Request): Promise<Response> {
  return handleStaffPasswordSignIn(request);
}
