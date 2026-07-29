import { ERROR_CODES } from '@kclub/contracts';
import { cityListByCountryQuerySchema } from '@kclub/validation';
import { and, asc, eq } from 'drizzle-orm';
import type { NextRequest, NextResponse } from 'next/server';

import { jsonError, jsonErrorFromUnknown, jsonSuccess } from '@/server/api';
import { getDbClient, schema } from '@/server/db';

type CityOptionResponse = {
  id: string;
  name: string;
  countryId: string;
};

const PUBLIC_TAXONOMY_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = cityListByCountryQuerySchema.safeParse({
      countryId: request.nextUrl.searchParams.get('countryId'),
    });

    if (!parsed.success) {
      return jsonError(
        {
          code: ERROR_CODES.VALIDATION_INVALID_INPUT,
          message: 'Valid countryId query parameter is required',
        },
        undefined,
        { status: 400 },
      );
    }

    const db = getDbClient();
    const cities = await db.query.cities.findMany({
      where: and(
        eq(schema.cities.country_id, parsed.data.countryId),
        eq(schema.cities.is_active, true),
      ),
      orderBy: [asc(schema.cities.name)],
    });

    const data: CityOptionResponse[] = cities.map((city) => ({
      id: city.id,
      name: city.name,
      countryId: city.country_id,
    }));

    return jsonSuccess(data, undefined, {
      headers: { 'Cache-Control': PUBLIC_TAXONOMY_CACHE_CONTROL },
    });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
