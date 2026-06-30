'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MembershipPlanDto } from '@kclub/contracts';

type MembershipsViewProps = {
  plans: MembershipPlanDto[];
};

export function MembershipsView({ plans }: MembershipsViewProps) {
  if (!plans.length) {
    return <p className="py-8 text-center text-muted-foreground">No membership plan data found</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan Key</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.key}>
            <TableCell className="font-mono text-sm">{plan.key}</TableCell>
            <TableCell className="font-mono text-sm">{JSON.stringify(plan.value)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {plan.description ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
