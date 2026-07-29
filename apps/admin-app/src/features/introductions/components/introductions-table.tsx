'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AdminList,
  AdminTableCard,
  AdminTableDesktop,
  AdminTableMobile,
} from '@/components/admin-list-layout';
import type { AdminIntroductionListItemDto, StaffRole } from '@kclub/contracts';
import { IntroductionActions } from './introduction-action-dialogs';

type IntroductionsTableProps = {
  introductions: AdminIntroductionListItemDto[];
  staffRole: StaffRole;
};

export function IntroductionsTable({ introductions, staffRole }: IntroductionsTableProps) {
  const router = useRouter();

  const canMutate = staffRole === 'OWNER' || staffRole === 'ADMIN' || staffRole === 'MODERATOR';

  return (
    <AdminList>
      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Target Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {introductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No introductions found
                  </TableCell>
                </TableRow>
              ) : (
                introductions.map((intro) => (
                  <TableRow key={intro.id}>
                    <TableCell className="max-w-[200px] truncate">
                      <div className="text-sm font-medium">
                        {intro.requesterBusiness.name ||
                          intro.requesterUser.displayName ||
                          intro.requesterUser.phone}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {intro.requesterUser.displayName ?? intro.requesterUser.phone}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {intro.targetBusiness.name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={intro.status} />
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{intro.message ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(intro.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          render={<Link href={`/dashboard/introductions/${intro.id}`} />}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <IntroductionActions
                          id={intro.id}
                          status={intro.status}
                          canMutate={canMutate}
                          onAction={() => router.refresh()}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {introductions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No introductions found
            </div>
          ) : (
            introductions.map((intro) => (
              <div key={intro.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {intro.requesterBusiness.name ||
                        intro.requesterUser.displayName ||
                        intro.requesterUser.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">→ {intro.targetBusiness.name}</p>
                  </div>
                  <StatusBadge status={intro.status} />
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  {intro.message ? `"${intro.message}"` : 'No message'}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(intro.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      render={<Link href={`/dashboard/introductions/${intro.id}`} />}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <IntroductionActions
                      id={intro.id}
                      status={intro.status}
                      canMutate={canMutate}
                      onAction={() => router.refresh()}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </AdminTableMobile>
      </AdminTableCard>
    </AdminList>
  );
}
