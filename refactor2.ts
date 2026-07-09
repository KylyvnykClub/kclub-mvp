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

// Replace the const INCLUDE definitions
const variables = sourceFile.getVariableStatements();
for (const v of variables) {
  const declarations = v.getDeclarations();
  for (const d of declarations) {
    const name = d.getName();
    if (
      ['BUSINESS_LIST_INCLUDE', 'BUSINESS_MUTATION_INCLUDE', 'BUSINESS_DETAIL_INCLUDE'].includes(
        name,
      )
    ) {
      d.setInitializer(`{
  category: true,
  country: true,
  city: true,
  user: {
    columns: { id: true, phone: true, display_name: true, status: true, membership_tier: true },
  },
  subscriptions: {
    where: eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
    orderBy: [desc(schema.subscriptions.created_at)],
    limit: 1,
  },
}`);
    } else if (name === 'INTRODUCTION_LIST_INCLUDE') {
      d.setInitializer(`{
  requesterUser: { columns: { id: true, phone: true, display_name: true } },
  requesterBusiness: { columns: { id: true, name: true, slug: true } },
  targetBusiness: { columns: { id: true, name: true, slug: true } },
}`);
    } else if (name === 'ADMIN_SUBSCRIPTION_INCLUDE') {
      d.setInitializer(`{
  user: { columns: { id: true, phone: true, display_name: true, membership_tier: true } },
  businessProfile: { columns: { name: true } },
}`);
    }
  }
  // Let's rename them if needed, but it's fine to keep the original constant names and pass them to "with".
}

replaceFunction(
  'listBusinesses',
  `
  const db = getDbClient();

  const conditions = [];
  if (params.status) {
    conditions.push(eq(schema.businessProfiles.status, params.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [businesses, total] = await Promise.all([
    db.query.businessProfiles.findMany({
      where: whereClause,
      with: BUSINESS_LIST_INCLUDE,
      orderBy: [desc(schema.businessProfiles.created_at)],
      offset: (params.page - 1) * params.limit,
      limit: params.limit,
    }),
    db.$count(schema.businessProfiles, whereClause),
  ]);

  return { data: businesses.map(toAdminBusinessListItem), total };
`,
);

replaceFunction(
  'getBusinessDetail',
  `
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_DETAIL_INCLUDE,
  });
  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const auditEntries = await db.query.auditLogs.findMany({
    where: and(
      eq(schema.auditLogs.entity_type, 'BusinessProfile'),
      eq(schema.auditLogs.entity_id, businessId)
    ),
    orderBy: [desc(schema.auditLogs.created_at)],
    limit: 50,
  });

  return toAdminBusinessDetail(business, auditEntries);
`,
);

replaceFunction(
  'adminUpdateBusiness',
  `
  const db = getDbClient();

  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    ...(input.name !== undefined && { name: input.name }),
    ...(input.representativeName !== undefined && { representative_name: input.representativeName }),
    ...(input.representativeEmail !== undefined && { representative_email: input.representativeEmail }),
    ...(input.representativePhone !== undefined && { representative_phone: input.representativePhone }),
    ...(input.websiteUrl !== undefined && { website_url: input.websiteUrl }),
    ...(input.socialUrl !== undefined && { social_url: input.socialUrl }),
    ...(input.briefDescription !== undefined && { brief_description: input.briefDescription }),
    updated_at: new Date(),
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  await auditService.log(
    {
      action: 'BUSINESS_UPDATED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        name: business.name,
        representativeEmail: business.representative_email,
      },
      after: { name: updated.name, representativeEmail: updated.representative_email },
    },
    context,
  );

  return toAdminBusinessDetail(updatedWithRelations!);
`,
);

replaceFunction(
  'approveBusiness',
  `
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'APPROVED')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: \`Cannot approve business with status \${business.status}\`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    status: 'APPROVED',
    approved_at: new Date(),
    internal_notes: input.notes ?? business.internal_notes,
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  await auditService.log(
    {
      action: 'BUSINESS_APPROVED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated.status },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  const auditEntries = await db.query.auditLogs.findMany({
    where: and(
      eq(schema.auditLogs.entity_type, 'BusinessProfile'),
      eq(schema.auditLogs.entity_id, businessId)
    ),
    orderBy: [desc(schema.auditLogs.created_at)],
    limit: 50,
  });

  return toAdminBusinessDetail(updatedWithRelations!, auditEntries);
`,
);

replaceFunction(
  'publishBusiness',
  `
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'PUBLISHED')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: \`Cannot publish business with status \${business.status}\`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    status: 'PUBLISHED',
    published_at: new Date(),
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  await auditService.log(
    {
      action: 'BUSINESS_PUBLISHED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated.status },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  const auditEntries = await db.query.auditLogs.findMany({
    where: and(
      eq(schema.auditLogs.entity_type, 'BusinessProfile'),
      eq(schema.auditLogs.entity_id, businessId)
    ),
    orderBy: [desc(schema.auditLogs.created_at)],
    limit: 50,
  });

  return toAdminBusinessDetail(updatedWithRelations!, auditEntries);
`,
);

replaceFunction(
  'rejectBusiness',
  `
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'REJECTED')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: \`Cannot reject business with status \${business.status}\`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    status: 'REJECTED',
    rejection_reason: input.reason,
    rejected_at: new Date(),
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  await auditService.log(
    {
      action: 'BUSINESS_REJECTED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated.status, reason: input.reason },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return toAdminBusinessDetail(updatedWithRelations!);
`,
);

replaceFunction(
  'hideBusiness',
  `
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'HIDDEN')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: \`Cannot hide business with status \${business.status}\`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    status: 'HIDDEN',
    hidden_at: new Date(),
    featured_top: false,
    featured_recommended: false,
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  await auditService.log(
    {
      action: 'BUSINESS_HIDDEN',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        status: business.status,
        featuredTop: business.featured_top,
        featuredRecommended: business.featured_recommended,
      },
      after: { status: updated.status, featuredTop: false, featuredRecommended: false },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return toAdminBusinessDetail(updatedWithRelations!);
`,
);

replaceFunction(
  'updateBusinessFeatured',
  `
  const db = getDbClient();

  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canFeatureBusiness(business.status as BusinessStatus)) {
    throw new AppError({
      code: ERROR_CODES.FEATURED_BUSINESS_NOT_PUBLISHED,
      message: 'Only PUBLISHED businesses can be featured',
      status: 409,
    });
  }

  const setTop = input.featuredTop;
  const setRecommended = input.featuredRecommended;

  const [updated] = await db.transaction(async (tx) => {
    if (setTop !== undefined && setTop !== business.featured_top) {
      if (setTop) {
        const currentTopCount = await tx.$count(schema.businessProfiles, and(eq(schema.businessProfiles.featured_top, true), not(eq(schema.businessProfiles.id, businessId))));
        if (!canSetFeaturedFlag(business.status as BusinessStatus, true, currentTopCount, FEATURED_TOP_MAX)) {
          throw new AppError({
            code: ERROR_CODES.FEATURED_LIMIT_REACHED,
            message: \`Maximum \${FEATURED_TOP_MAX} featured_top businesses reached\`,
            status: 409,
          });
        }
      }
    }

    if (setRecommended !== undefined && setRecommended !== business.featured_recommended) {
      if (setRecommended) {
        const currentRecommendedCount = await tx.$count(schema.businessProfiles, and(eq(schema.businessProfiles.featured_recommended, true), not(eq(schema.businessProfiles.id, businessId))));
        if (!canSetFeaturedFlag(business.status as BusinessStatus, true, currentRecommendedCount, FEATURED_RECOMMENDED_MAX)) {
          throw new AppError({
            code: ERROR_CODES.FEATURED_LIMIT_REACHED,
            message: \`Maximum \${FEATURED_RECOMMENDED_MAX} featured_recommended businesses reached\`,
            status: 409,
          });
        }
      }
    }

    const [b] = await tx.update(schema.businessProfiles).set({
      featured_top: setTop !== undefined ? setTop : business.featured_top,
      featured_recommended: setRecommended !== undefined ? setRecommended : business.featured_recommended,
    }).where(eq(schema.businessProfiles.id, businessId)).returning();

    return [b];
  });

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE,
  });

  await auditService.log(
    {
      action: 'BUSINESS_FEATURED_UPDATED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        featuredTop: business.featured_top,
        featuredRecommended: business.featured_recommended,
      },
      after: {
        featuredTop: updated.featured_top,
        featuredRecommended: updated.featured_recommended,
      },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return toAdminBusinessDetail(updatedWithRelations!);
`,
);

// The "include" keyword needs to be replaced with "with" in the variable replacements as well
// But actually I just updated the variable initializer string, and when passing it down, I changed "include" to "with". Let's check:
// db.query.businessProfiles.findMany({ ..., with: BUSINESS_LIST_INCLUDE })
// So it is already passed to \`with\`.

// Also the parameter in DTO mappers might have \`requesterUser\` instead of \`requester_user\` because of relation names in Drizzle.
// But wait, the mapper function might expect \`requester_user\`. I'll fix that via string replace on the file.

const dtoMapperCode = sourceFile.getFunction('toAdminIntroductionListItem')?.getBodyText() || '';
if (dtoMapperCode) {
  sourceFile.getFunction('toAdminIntroductionListItem')?.setBodyText(
    dtoMapperCode
      .replace(/intro\\.requester_user/g, 'intro.requesterUser')
      .replace(/intro\\.requester_business/g, 'intro.requesterBusiness')
      .replace(/intro\\.target_business/g, 'intro.targetBusiness'),
  );
}
const toAdminSubscriptionListItemCode =
  sourceFile.getFunction('toAdminSubscriptionListItem')?.getBodyText() || '';
if (toAdminSubscriptionListItemCode) {
  sourceFile
    .getFunction('toAdminSubscriptionListItem')
    ?.setBodyText(
      toAdminSubscriptionListItemCode.replace(/sub\\.business_profile/g, 'sub.businessProfile'),
    );
}

project.saveSync();
console.log('Part 2 complete');
