import { Project } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath(
  'apps/product-core/src/server/services/admin-service.ts',
);

function replaceFunction(name: string, newBodyText: string) {
  const func = sourceFile.getFunction(name);
  if (func) {
    func.setBodyText(newBodyText);
  } else {
    console.warn('Function not found:', name);
  }
}

replaceFunction(
  'listSubscriptions',
  `
  const db = getDbClient();
  const subs = await db.query.vipSubscriptions.findMany({
    orderBy: [desc(schema.vipSubscriptions.created_at)],
  });
  return subs.map(toSubscriptionDto);
`,
);

replaceFunction(
  'listAdminSubscriptions',
  `
  const db = getDbClient();
  const subs = await db.query.subscriptions.findMany({
    with: ADMIN_SUBSCRIPTION_INCLUDE,
    orderBy: [desc(schema.subscriptions.created_at)],
  });
  return subs.map(toAdminSubscriptionListItem);
`,
);

replaceFunction(
  'getAdminSubscriptionDetail',
  `
  const db = getDbClient();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.id, subscriptionId),
    with: ADMIN_SUBSCRIPTION_INCLUDE,
  });
  if (!sub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Subscription not found',
      status: 404,
    });
  }
  return toAdminSubscriptionListItem(sub);
`,
);

replaceFunction(
  'getSubscriptionDetail',
  `
  const db = getDbClient();
  const sub = await db.query.vipSubscriptions.findFirst({ where: eq(schema.vipSubscriptions.id, subscriptionId) });
  if (!sub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Subscription not found',
      status: 404,
    });
  }
  return toSubscriptionDto(sub);
`,
);

replaceFunction(
  'adminCancelSubscription',
  `
  const db = getDbClient();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.id, subscriptionId),
    with: ADMIN_SUBSCRIPTION_INCLUDE,
  });
  if (!sub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Subscription not found',
      status: 404,
    });
  }

  const [updated] = await db.update(schema.subscriptions)
    .set({ cancel_at_period_end: true, canceled_at: new Date() })
    .where(eq(schema.subscriptions.id, subscriptionId))
    .returning();

  const updatedWithRelations = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.id, subscriptionId),
    with: ADMIN_SUBSCRIPTION_INCLUDE,
  });

  await auditService.log(
    {
      action: 'SUBSCRIPTION_CANCELED',
      entityType: 'Subscription',
      entityId: subscriptionId,
      before: { cancelAtPeriodEnd: sub.cancel_at_period_end },
      after: { cancelAtPeriodEnd: true },
    },
    context,
  );

  return toAdminSubscriptionListItem(updatedWithRelations!);
`,
);

replaceFunction(
  'listAuditLogs',
  `
  const db = getDbClient();
  const conditions = [];

  if (filters.action) conditions.push(eq(schema.auditLogs.action, filters.action));
  if (filters.actorRole) conditions.push(eq(schema.auditLogs.actor_role, filters.actorRole as any));
  if (filters.entityType) conditions.push(ilike(schema.auditLogs.entity_type, \`%\${filters.entityType}%\`));
  if (filters.dateFrom) conditions.push(sql\`\${schema.auditLogs.created_at} >= \${filters.dateFrom}\`);
  if (filters.dateTo) conditions.push(sql\`\${schema.auditLogs.created_at} <= \${filters.dateTo}\`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const [logs, total] = await Promise.all([
    db.query.auditLogs.findMany({
      where: whereClause,
      orderBy: [desc(schema.auditLogs.created_at)],
      offset: (page - 1) * limit,
      limit: limit,
    }),
    db.$count(schema.auditLogs, whereClause),
  ]);

  return {
    data: logs.map((log: any) => ({
      id: log.id,
      actorStaffId: log.actor_staff_id ?? null,
      actorRole: log.actor_role as any,
      action: log.action as any,
      entityType: log.entity_type,
      entityId: log.entity_id,
      before: log.before_data as Record<string, unknown> | null,
      after: log.after_data as Record<string, unknown> | null,
      ipAddress: log.ip_address ?? null,
      createdAt: log.created_at?.toISOString() ?? new Date().toISOString(),
    })),
    total,
  };
`,
);

replaceFunction(
  'getStripePrices',
  `
  const db = getDbClient();
  const configs = await db.query.adminConfigs.findMany({
    where: inArray(schema.adminConfigs.key, STRIPE_PRICE_KEYS as unknown as string[]),
  });

  const result: StripePricesMap = {
    stripe_price_vip_membership_monthly: null,
    stripe_price_business_placement_monthly: null,
  };

  for (const config of configs) {
    result[config.key as StripePriceKey] = (config.value as { priceId?: string })?.priceId ?? null;
  }

  return result;
`,
);

replaceFunction(
  'updateStripePrices',
  `
  const db = getDbClient();

  for (const [key, priceId] of Object.entries(input)) {
    if (!STRIPE_PRICE_KEYS.includes(key as StripePriceKey)) continue;

    const existing = await db.query.adminConfigs.findFirst({ where: eq(schema.adminConfigs.key, key) });
    if (existing) {
      await db.update(schema.adminConfigs)
        .set({ value: { priceId } })
        .where(eq(schema.adminConfigs.key, key));
    } else {
      await db.insert(schema.adminConfigs)
        .values({
          key,
          value: { priceId },
          description: \`Stripe Price ID for \${key.replace('stripe_price_', '')}\`,
        });
    }
  }

  return getStripePrices();
`,
);

replaceFunction(
  'getAdminConfig',
  `
  const db = getDbClient();
  const config = await db.query.adminConfigs.findFirst({ where: eq(schema.adminConfigs.key, key) });
  if (!config) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Config not found',
      status: 404,
    });
  }
  return toAdminConfigEntry(config);
`,
);

replaceFunction(
  'updateAdminConfig',
  `
  const db = getDbClient();
  const existing = await db.query.adminConfigs.findFirst({ where: eq(schema.adminConfigs.key, key) });

  let result;
  if (existing) {
    const [updated] = await db.update(schema.adminConfigs).set({
      value: input.value,
      description: input.description ?? existing.description,
    }).where(eq(schema.adminConfigs.key, key)).returning();
    result = updated;
  } else {
    const [created] = await db.insert(schema.adminConfigs).values({
      key,
      value: input.value,
      description: input.description ?? null,
    }).returning();
    result = created;
  }
  return toAdminConfigEntry(result);
`,
);

replaceFunction(
  'getMembershipPlans',
  `
  const db = getDbClient();
  const configs = await db.query.adminConfigs.findMany({
    where: inArray(schema.adminConfigs.key, ['vip_membership_monthly', 'business_placement_monthly']),
  });
  return configs.map((c: any) => ({
    key: c.key,
    value: c.value,
    description: c.description,
  }));
`,
);

replaceFunction(
  'listStaff',
  `
  const db = getDbClient();
  const staff = await db.query.adminUsers.findMany({
    orderBy: [asc(schema.adminUsers.created_at)],
  });
  return staff.map(toAdminStaffListItem);
`,
);

replaceFunction(
  'getStaffDetail',
  `
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }
  return toAdminStaffListItem(staff);
`,
);

replaceFunction(
  'updateStaffRole',
  `
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }

  const [updated] = await db.update(schema.adminUsers)
    .set({ role: input.role as any })
    .where(eq(schema.adminUsers.id, staffId))
    .returning();

  await auditService.log(
    {
      action: 'STAFF_ROLE_UPDATED',
      entityType: 'AdminUser',
      entityId: staffId,
      before: { role: staff.role },
      after: { role: updated.role },
    },
    context,
  );

  return toAdminStaffListItem(updated);
`,
);

replaceFunction(
  'deactivateStaff',
  `
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }

  if (!staff.is_active) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'Staff is already inactive',
      status: 409,
    });
  }

  const [updated] = await db.update(schema.adminUsers)
    .set({ is_active: false })
    .where(eq(schema.adminUsers.id, staffId))
    .returning();

  await auditService.log(
    {
      action: 'STAFF_ROLE_UPDATED',
      entityType: 'AdminUser',
      entityId: staffId,
      before: { isActive: true },
      after: { isActive: false, reason: input.reason ?? null },
    },
    context,
  );

  return toAdminStaffListItem(updated);
`,
);

project.saveSync();
console.log('Part 4 complete');
