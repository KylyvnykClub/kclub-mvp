import { handleStaffPasswordRegister } from '@/server/staff-auth';

export async function POST(request: Request): Promise<Response> {
  return handleStaffPasswordRegister(request);
}
