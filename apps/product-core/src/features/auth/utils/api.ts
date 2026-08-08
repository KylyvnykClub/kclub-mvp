type ApiEnvelopeSuccess<T> = {
  data: T;
  error: null;
};

type ApiEnvelopeFailure = {
  data?: unknown;
  error?: {
    code?: string;
  } | null;
};

type ApiEnvelope<T> = ApiEnvelopeSuccess<T> | ApiEnvelopeFailure;

export type AuthResponse<T = unknown> = {
  success: boolean;
  data?: T;
  errorCode?: string;
};

export async function parseAuthResponse<T = unknown>(res: Response): Promise<AuthResponse<T>> {
  try {
    const body = (await res.json()) as ApiEnvelope<T>;

    // The shared API envelope: success is response.ok && body.error === null
    if (res.ok && body.error === null) {
      return { success: true, data: body.data as T };
    }

    // Failures read body.error.code
    const errorCode = body.error?.code || 'generic';
    return { success: false, errorCode };
  } catch {
    return { success: false, errorCode: 'generic' };
  }
}
