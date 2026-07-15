'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { FinanceRevenuePointDto } from '@kclub/contracts';

import { formatMoney, formatMoneyCompact } from '../format';

const chartConfig = {
  vip: { label: 'VIP Membership', color: 'var(--chart-1)' },
  businessPlacement: { label: 'Business Placement', color: 'var(--chart-2)' },
  other: { label: 'Other', color: 'var(--chart-3)' },
} satisfies ChartConfig;

function formatMonthTick(month: string): string {
  const [year, monthPart] = month.split('-');
  return new Date(Date.UTC(Number(year), Number(monthPart) - 1, 1)).toLocaleDateString('en-GB', {
    month: 'short',
    timeZone: 'UTC',
  });
}

export function RevenueChartCard({
  points,
  currency,
}: {
  points: FinanceRevenuePointDto[];
  currency: string;
}) {
  const hasRevenue = points.some((point) => point.total > 0);
  const hasOther = points.some((point) => point.other > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Monthly Revenue (12m)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasRevenue ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No revenue recorded yet.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatMonthTick}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value: number) => formatMoneyCompact(value, currency)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const month = payload?.[0]?.payload?.month as string | undefined;
                      return month ? formatMonthTick(month) : '';
                    }}
                    formatter={(value, name, item) => (
                      <>
                        <span
                          aria-hidden
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: item?.color }}
                        />
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="ml-auto font-mono font-medium tabular-nums">
                          {formatMoney(Number(value), currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="vip"
                stackId="revenue"
                fill="var(--color-vip)"
                stroke="var(--background)"
                strokeWidth={1}
              />
              <Bar
                dataKey="businessPlacement"
                stackId="revenue"
                fill="var(--color-businessPlacement)"
                stroke="var(--background)"
                strokeWidth={1}
                radius={hasOther ? 0 : [4, 4, 0, 0]}
              />
              {hasOther ? (
                <Bar
                  dataKey="other"
                  stackId="revenue"
                  fill="var(--color-other)"
                  stroke="var(--background)"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
              ) : null}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
