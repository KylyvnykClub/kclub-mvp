'use client';

import { Globe, Users, Building2 } from 'lucide-react';

import type { DashboardCountryStatDto, DashboardMetricsDto } from '@kclub/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorldMap } from './world-map';

function emojiFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function CountryRow({ stat }: { stat: DashboardCountryStatDto }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">
            {stat.code2 ? emojiFlag(stat.code2) : '🌐'}
          </span>
          <span className="text-sm font-medium">{stat.country}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums">{stat.users}</td>
      <td className="py-3 pl-4 text-right text-sm tabular-nums">{stat.businesses}</td>
    </tr>
  );
}

export function TopCountriesCard({ data }: { data: DashboardMetricsDto }) {
  const countries = data.topCountries ?? [];

  if (countries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Members by Country
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3 sm:flex sm:gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Users</p>
              <p className="text-lg font-bold tabular-nums">{data.totalUsers.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Businesses</p>
              <p className="text-lg font-bold tabular-nums">
                {(data.totalBusinesses ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Countries</p>
              <p className="text-lg font-bold tabular-nums">{countries.length}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="min-h-[250px]">
            <WorldMap markers={countries} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4 text-left">Country</th>
                  <th className="px-4 pb-2 text-right">Users</th>
                  <th className="pb-2 pl-4 text-right">Businesses</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((stat) => (
                  <CountryRow key={stat.country} stat={stat} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
