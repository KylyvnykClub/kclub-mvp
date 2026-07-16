import { ERROR_CODES } from '@kclub/contracts';

export async function POST(): Promise<Response> {
  return Response.json(
    {
      data: null,
      error: {
        code: ERROR_CODES.RESOURCE_GONE,
        message: 'Staff TOTP verification has been replaced by password sign-in',
      },
    },
    { status: 410 },
  );
}
