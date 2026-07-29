import { NextResponse } from 'next/server';

export function GET(): Response {
  return NextResponse.json({ error: 'Flag endpoint retired' }, { status: 410 });
}
