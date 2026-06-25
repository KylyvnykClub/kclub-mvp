'use client';

import { Badge } from '@/components/ui/badge';
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
import { accountContentClasses } from '../styles';
import type { AuditLogDto } from '@kclub/contracts';

type ActivityPanelProps = {
  logs: AuditLogDto[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function ActivityPanel({ logs }: ActivityPanelProps) {
  return (
    <div className={accountContentClasses}>
      <div className="mx-auto max-w-4xl">
        {logs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <AdminList>
            <AdminTableCard>
              <AdminTableDesktop>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{formatAction(log.action)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.entityType}
                          {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableDesktop>
              <AdminTableMobile>
                {logs.map((log) => (
                  <div key={log.id} className="space-y-1 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{formatAction(log.action)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.entityType}
                      {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                    </p>
                  </div>
                ))}
              </AdminTableMobile>
            </AdminTableCard>
          </AdminList>
        )}
      </div>
    </div>
  );
}
