'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminFilterBar } from '@/components/admin-filter-bar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminPagination } from '@/components/admin-pagination';
import {
  AdminList,
  AdminTableCard,
  AdminTableDesktop,
  AdminTableMobile,
} from '@/components/admin-list-layout';
import type { AuditLogDto } from '@kclub/contracts';
import { AUDIT_ACTIONS, STAFF_ROLES } from '@kclub/contracts';
import type { AuditLogSearchParams } from '../api';

type AuditTableProps = {
  logs: AuditLogDto[];
  total: number;
  page: number;
  limit: number;
  filters: AuditLogSearchParams;
};

export function AuditTable({ logs, total, page, limit, filters: initialFilters }: AuditTableProps) {
  const router = useRouter();
  const [action, setAction] = useState(initialFilters.action ?? '');
  const [actorRole, setActorRole] = useState(initialFilters.actorRole ?? '');
  const [entityType, setEntityType] = useState(initialFilters.entityType ?? '');
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo ?? '');
  const activeFilterCount = [action, actorRole, entityType, dateFrom, dateTo].filter(
    Boolean,
  ).length;

  function applyFilters() {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (actorRole) params.set('actorRole', actorRole);
    if (entityType) params.set('entityType', entityType);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const qs = params.toString();
    router.push(`/dashboard/audit${qs ? '?' + qs : ''}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (actorRole) params.set('actorRole', actorRole);
    if (entityType) params.set('entityType', entityType);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    router.push(`/dashboard/audit${qs ? '?' + qs : ''}`);
  }

  return (
    <AdminList>
      <AdminFilterBar
        fields={[
          {
            id: 'audit-action-filter',
            kind: 'select',
            label: 'Action',
            value: action,
            placeholder: 'All actions',
            options: [
              { label: 'All actions', value: '' },
              ...AUDIT_ACTIONS.map((auditAction) => ({
                label: auditAction.replaceAll('_', ' '),
                value: auditAction,
              })),
            ],
            onValueChange: setAction,
          },
          {
            id: 'audit-role-filter',
            kind: 'select',
            label: 'Staff role',
            value: actorRole,
            placeholder: 'All roles',
            options: [
              { label: 'All roles', value: '' },
              ...STAFF_ROLES.map((role) => ({ label: role, value: role })),
            ],
            onValueChange: setActorRole,
          },
          {
            id: 'audit-entity-filter',
            kind: 'input',
            label: 'Entity type',
            value: entityType,
            placeholder: 'Entity type',
            onValueChange: setEntityType,
          },
          {
            id: 'audit-date-from-filter',
            kind: 'input',
            label: 'From date',
            type: 'date',
            value: dateFrom,
            onValueChange: setDateFrom,
          },
          {
            id: 'audit-date-to-filter',
            kind: 'input',
            label: 'To date',
            type: 'date',
            value: dateTo,
            onValueChange: setDateTo,
          },
        ]}
        activeFilterCount={activeFilterCount}
        onSubmit={applyFilters}
        onReset={() => {
          setAction('');
          setActorRole('');
          setEntityType('');
          setDateFrom('');
          setDateTo('');
          router.push('/dashboard/audit');
        }}
      />

      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{log.actorRole ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.actorStaffId ? `${log.actorStaffId.slice(0, 8)}...` : 'System'}
                      </div>
                    </TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell
                      className="max-w-[120px] truncate text-xs text-muted-foreground"
                      title={log.entityId}
                    >
                      {log.entityId.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{log.entityType}</p>
                    <p
                      className="truncate font-mono text-xs text-muted-foreground"
                      title={log.entityId}
                    >
                      {log.entityId}
                    </p>
                  </div>
                  <Badge variant="outline">{log.action}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    <span>{log.actorRole ?? 'System'}</span>
                    {log.actorStaffId && (
                      <span className="ml-1 opacity-70">({log.actorStaffId.slice(0, 8)}...)</span>
                    )}
                  </div>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </AdminTableMobile>
      </AdminTableCard>

      <AdminPagination page={page} total={total} limit={limit} onNavigate={goToPage} />
    </AdminList>
  );
}
