import { Project } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath(
  'apps/product-core/src/server/services/admin-service.ts',
);

const prismaImport = sourceFile.getImportDeclaration(
  (decl) => decl.getModuleSpecifierValue() === '@/server/db',
);
if (prismaImport) {
  prismaImport.remove();
}
sourceFile.addImportDeclaration({
  namedImports: ['getDbClient', 'schema'],
  moduleSpecifier: '@/server/db',
});
sourceFile.addImportDeclaration({
  namedImports: [
    'eq',
    'inArray',
    'or',
    'and',
    'ilike',
    'desc',
    'asc',
    'not',
    'isNull',
    'count',
    'sql',
    'exists',
  ],
  moduleSpecifier: 'drizzle-orm',
});

function replaceFunction(name: string, newBodyText: string) {
  const func = sourceFile.getFunction(name);
  if (func) {
    func.setBodyText(newBodyText);
  } else {
    console.warn('Function not found:', name);
  }
}

replaceFunction(
  'getDashboardMetrics',
  `
  const db = getDbClient();

  const [
    totalUsers,
    blockedUsers,
    activeSubs,
    pastDueSubs,
    expiredSubs,
    businessesReview,
    introductionsSubmitted,
    introductionsInReview,
  ] = await Promise.all([
    db.$count(schema.users),
    db.$count(schema.users, eq(schema.users.status, 'BLOCKED')),
    db.$count(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'ACTIVE')),
    db.$count(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'PAST_DUE')),
    db.$count(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'EXPIRED')),
    db.$count(schema.businessProfiles, eq(schema.businessProfiles.status, 'UNDER_REVIEW')),
    db.$count(schema.businessIntroductions, eq(schema.businessIntroductions.status, 'SUBMITTED')),
    db.$count(schema.businessIntroductions, eq(schema.businessIntroductions.status, 'IN_REVIEW')),
  ]);

  return {
    totalUsers,
    activeUsers: totalUsers - blockedUsers,
    blockedUsers,
    activeSubscriptions: activeSubs,
    pastDueSubscriptions: pastDueSubs,
    expiredSubscriptions: expiredSubs,
    businessesUnderReview: businessesReview,
    introductionsSubmitted,
    introductionsInReview,
  };
`,
);

replaceFunction(
  'listUsers',
  `
  const db = getDbClient();

  const conditions = [];

  if (params.search) {
    conditions.push(
      or(
        ilike(schema.users.phone, \`%\${params.search}%\`),
        ilike(schema.users.display_name, \`%\${params.search}%\`)
      )
    );
  }

  if (params.status) {
    conditions.push(eq(schema.users.status, params.status));
  }

  if (params.membershipTier) {
    conditions.push(eq(schema.users.membership_tier, params.membershipTier));
  }

  // Exclude users who own an active business profile
  conditions.push(
    not(
      exists(
        db.select()
          .from(schema.businessProfiles)
          .where(
            and(
              eq(schema.businessProfiles.user_id, schema.users.id),
              not(eq(schema.businessProfiles.status, 'REJECTED'))
            )
          )
      )
    )
  );

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, total] = await Promise.all([
    db.query.users.findMany({
      where: whereClause,
      orderBy: [desc(schema.users.created_at)],
      offset: (params.page - 1) * params.limit,
      limit: params.limit,
    }),
    db.$count(schema.users, whereClause),
  ]);

  return { data: users.map(toAdminUserListItem), total };
`,
);

replaceFunction(
  'getUserDetail',
  `
  const db = getDbClient();

  const [user, cards, subscriptions, auditEntries] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, userId) }),
    db.query.memberCards.findMany({
      where: eq(schema.memberCards.user_id, userId),
      orderBy: [desc(schema.memberCards.issued_at)],
    }),
    db.query.vipSubscriptions.findMany({
      where: eq(schema.vipSubscriptions.user_id, userId),
      orderBy: [desc(schema.vipSubscriptions.created_at)],
    }),
    db.query.auditLogs.findMany({
      where: eq(schema.auditLogs.entity_id, userId),
      orderBy: [desc(schema.auditLogs.created_at)],
      limit: 50,
    }),
  ]);

  if (!user) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'User not found',
      status: 404,
    });
  }

  return toAdminUserDetail(user, cards, subscriptions, auditEntries);
`,
);

replaceFunction(
  'syncVipSubscriptionForUser',
  `
  const db = getDbClient();
  const stripe = getStripeClient();

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'User not found', status: 404 });
  }

  const existingLocal = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.user_id, userId),
    orderBy: [desc(schema.vipSubscriptions.created_at)],
  });

  if (!existingLocal?.stripe_subscription_id && !existingLocal?.stripe_customer_id) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'No Stripe identifiers found locally. Ask the user to revisit the checkout success page, or enter the subscription ID manually in Stripe dashboard.',
      status: 404,
    });
  }

  let stripeSub;
  if (existingLocal.stripe_subscription_id) {
    stripeSub = await stripe.subscriptions.retrieve(existingLocal.stripe_subscription_id);
  } else {
    const list = await stripe.subscriptions.list({
      customer: existingLocal.stripe_customer_id!,
      limit: 5,
    });
    stripeSub = list.data[0];
  }

  if (!stripeSub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'No Stripe subscription found for this user.',
      status: 404,
    });
  }

  const stripeSubPeriodEnd = (stripeSub as unknown as { current_period_end: number | null }).current_period_end;
  const newStatus = mapStripeStatusToLocal(stripeSub.status, stripeSubPeriodEnd) ?? 'ACTIVE';

  const resolvedCustomerId = existingLocal?.stripe_customer_id
    ?? (typeof stripeSub.customer === 'string' ? stripeSub.customer : null);

  let localSub;
  if (existingLocal) {
    const [updated] = await db.update(schema.vipSubscriptions)
      .set({
        status: newStatus,
        stripe_customer_id: resolvedCustomerId,
        stripe_subscription_id: stripeSub.id,
        current_period_end: stripeSubPeriodEnd ? new Date(stripeSubPeriodEnd * 1000) : undefined,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
      })
      .where(eq(schema.vipSubscriptions.id, existingLocal.id))
      .returning();
    localSub = updated;
  } else {
    const [created] = await db.insert(schema.vipSubscriptions)
      .values({
        user_id: userId,
        status: newStatus,
        stripe_customer_id: resolvedCustomerId,
        stripe_subscription_id: stripeSub.id,
        current_period_end: stripeSubPeriodEnd ? new Date(stripeSubPeriodEnd * 1000) : null,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
      })
      .returning();
    localSub = created;
  }

  await db.update(schema.users).set({ membership_tier: newStatus === 'ACTIVE' || newStatus === 'PAST_DUE' ? 'VIP' : 'MEMBER' }).where(eq(schema.users.id, userId));

  await auditService.log(
    {
      action: 'STRIPE_WEBHOOK_REPLAYED',
      entityType: 'VipSubscription',
      entityId: userId,
      after: { subscriptionId: localSub.id, status: newStatus },
    },
    context,
  );

  revalidateTag('users');

  return getUserDetail(userId);
`,
);

replaceFunction(
  'blockUser',
  `
  const db = getDbClient();

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'User not found',
      status: 404,
    });
  }

  if (user.status === 'BLOCKED') {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'User is already blocked',
      status: 409,
    });
  }

  const [updated] = await db.transaction(async (tx) => {
    await tx.update(schema.memberCards)
      .set({
        status: 'REVOKED',
        revoked_at: new Date(),
        revoked_reason: input.reason ?? 'User blocked',
      })
      .where(and(eq(schema.memberCards.user_id, userId), eq(schema.memberCards.status, 'ACTIVE')));

    const [u] = await tx.update(schema.users)
      .set({ status: 'BLOCKED' })
      .where(eq(schema.users.id, userId))
      .returning();

    return [u];
  });

  await auditService.log(
    {
      action: 'USER_BLOCKED',
      entityType: 'User',
      entityId: userId,
      before: { status: user.status },
      after: { status: updated.status },
    },
    context,
  );

  return toAdminUserDetail(updated);
`,
);

replaceFunction(
  'unblockUser',
  `
  const db = getDbClient();

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'User not found',
      status: 404,
    });
  }

  if (user.status !== 'BLOCKED') {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'User is not blocked',
      status: 409,
    });
  }

  const [updated] = await db.update(schema.users)
    .set({ status: 'ACTIVE' })
    .where(eq(schema.users.id, userId))
    .returning();

  await auditService.log(
    {
      action: 'USER_UNBLOCKED',
      entityType: 'User',
      entityId: userId,
      before: { status: user.status },
      after: { status: updated.status },
    },
    context,
  );

  return toAdminUserDetail(updated);
`,
);

replaceFunction(
  'listCards',
  `
  const db = getDbClient();

  const conditions = [];

  if (params.status) {
    conditions.push(eq(schema.memberCards.status, params.status));
  }

  if (params.membershipTier) {
    conditions.push(eq(schema.memberCards.membership_tier, params.membershipTier));
  }

  if (params.search) {
    // We need to join users to search by user phone or display_name
    // But we are using query API which filters on relations using the nested syntax in Prisma, but in Drizzle we can't easily filter by relation fields in query API without a join.
    // Instead, we will use a subquery or join.
    conditions.push(
      exists(
        db.select()
          .from(schema.users)
          .where(
            and(
              eq(schema.users.id, schema.memberCards.user_id),
              or(
                ilike(schema.users.phone, \`%\${params.search}%\`),
                ilike(schema.users.display_name, \`%\${params.search}%\`)
              )
            )
          )
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [cards, total] = await Promise.all([
    // Note: To use with: { user: true }, relations must be defined in relations.ts
    // We assume they are or will be added.
    db.query.memberCards.findMany({
      where: whereClause,
      with: { user: { columns: { phone: true, display_name: true } } },
      orderBy: [desc(schema.memberCards.issued_at)],
      offset: (params.page - 1) * params.limit,
      limit: params.limit,
    }),
    db.$count(schema.memberCards, whereClause),
  ]);

  return { data: cards.map(toAdminCardListItem), total };
`,
);

replaceFunction(
  'getCardDetail',
  `
  const db = getDbClient();
  const card = await db.query.memberCards.findFirst({ where: eq(schema.memberCards.id, cardId) });
  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }
  return toMemberCardDto(card);
`,
);

replaceFunction(
  'adminRevokeCard',
  `
  const db = getDbClient();
  const card = await db.query.memberCards.findFirst({ where: eq(schema.memberCards.id, cardId) });
  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }

  const updated = await revokeCard(cardId, input.reason);

  await auditService.log(
    {
      action: 'CARD_REVOKED',
      entityType: 'MemberCard',
      entityId: cardId,
      before: { status: card.status, userId: card.user_id },
      after: { status: updated.status },
    },
    context,
  );

  return toMemberCardDto(updated);
`,
);

replaceFunction(
  'adminReissueCard',
  `
  const db = getDbClient();
  const card = await db.query.memberCards.findFirst({ where: eq(schema.memberCards.id, cardId) });
  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }

  const newCard = await reissueCard(card.user_id, card.membership_tier, cardId, input.reason);

  await auditService.log(
    {
      action: 'CARD_ISSUED',
      entityType: 'MemberCard',
      entityId: newCard.id,
      before: { revokedCardId: cardId },
      after: { cardNumber: newCard.card_number, status: newCard.status },
    },
    context,
  );

  return toMemberCardDto(newCard);
`,
);

project.saveSync();
console.log('Part 1 complete');
