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
  'listIntroductions',
  `
  const db = getDbClient();
  const introductions = await db.query.businessIntroductions.findMany({
    with: INTRODUCTION_LIST_INCLUDE,
    orderBy: [desc(schema.businessIntroductions.created_at)],
  });
  return introductions.map(toAdminIntroductionListItem);
`,
);

replaceFunction(
  'getIntroductionDetail',
  `
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
    with: INTRODUCTION_LIST_INCLUDE,
  });
  if (!intro) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Introduction not found',
      status: 404,
    });
  }
  return toAdminIntroductionListItem(intro);
`,
);

replaceFunction(
  'approveIntroduction',
  `
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({ where: eq(schema.businessIntroductions.id, introductionId) });
  if (!intro) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Introduction not found',
      status: 404,
    });
  }

  const current = intro.status as IntroductionStatus;
  if (current !== 'SUBMITTED' && current !== 'IN_REVIEW') {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: \`Cannot approve introduction with status \${current}\`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessIntroductions)
    .set({ status: 'APPROVED' })
    .where(eq(schema.businessIntroductions.id, introductionId))
    .returning();

  await auditService.log(
    {
      action: 'INTRODUCTION_APPROVED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: current },
      after: { status: 'APPROVED' },
    },
    context,
  );

  return toIntroductionDto(updated);
`,
);

replaceFunction(
  'rejectIntroduction',
  `
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({ where: eq(schema.businessIntroductions.id, introductionId) });
  if (!intro) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Introduction not found',
      status: 404,
    });
  }

  const current = intro.status as IntroductionStatus;
  if (current !== 'SUBMITTED' && current !== 'IN_REVIEW') {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: \`Cannot reject introduction with status \${current}\`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessIntroductions)
    .set({ status: 'REJECTED', rejection_reason: input.reason })
    .where(eq(schema.businessIntroductions.id, introductionId))
    .returning();

  await auditService.log(
    {
      action: 'INTRODUCTION_REJECTED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: current },
      after: { status: 'REJECTED', reason: input.reason },
    },
    context,
  );

  return toIntroductionDto(updated);
`,
);

replaceFunction(
  'completeIntroduction',
  `
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({ where: eq(schema.businessIntroductions.id, introductionId) });
  if (!intro) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Introduction not found',
      status: 404,
    });
  }

  if (intro.status !== 'APPROVED') {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: \`Cannot complete introduction with status \${intro.status}\`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessIntroductions)
    .set({ status: 'COMPLETED' })
    .where(eq(schema.businessIntroductions.id, introductionId))
    .returning();

  await auditService.log(
    {
      action: 'INTRODUCTION_COMPLETED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: 'APPROVED' },
      after: { status: 'COMPLETED' },
    },
    context,
  );

  return toIntroductionDto(updated);
`,
);

replaceFunction(
  'listCategories',
  `
  const db = getDbClient();
  const categories = await db.query.categories.findMany({ orderBy: [asc(schema.categories.name)] });
  return categories.map(toCategoryDto);
`,
);

replaceFunction(
  'getCategory',
  `
  const db = getDbClient();
  const category = await db.query.categories.findFirst({ where: eq(schema.categories.id, categoryId) });
  if (!category) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Category not found', status: 404 });
  }
  return toCategoryDto(category);
`,
);

replaceFunction(
  'createCategory',
  `
  const db = getDbClient();
  const [category] = await db.insert(schema.categories).values({
    name: input.name,
    slug: input.slug,
    is_high_risk: input.isHighRisk ?? false,
    is_active: input.isActive ?? true,
  }).returning();
  revalidateTag('categories');
  return toCategoryDto(category);
`,
);

replaceFunction(
  'updateCategory',
  `
  const db = getDbClient();
  const existing = await db.query.categories.findFirst({ where: eq(schema.categories.id, categoryId) });
  if (!existing) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Category not found', status: 404 });
  }

  const [category] = await db.update(schema.categories).set({
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.isHighRisk !== undefined ? { is_high_risk: input.isHighRisk } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  }).where(eq(schema.categories.id, categoryId)).returning();
  revalidateTag('categories');
  return toCategoryDto(category);
`,
);

replaceFunction(
  'deleteCategory',
  `
  const db = getDbClient();
  const existing = await db.query.categories.findFirst({ where: eq(schema.categories.id, categoryId) });
  if (!existing) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Category not found', status: 404 });
  }
  await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
  revalidateTag('categories');
`,
);

replaceFunction(
  'listCountries',
  `
  const db = getDbClient();
  const countries = await db.query.countries.findMany({ orderBy: [asc(schema.countries.name)] });
  return countries.map(toCountryDto);
`,
);

replaceFunction(
  'getCountry',
  `
  const db = getDbClient();
  const country = await db.query.countries.findFirst({ where: eq(schema.countries.id, countryId) });
  if (!country) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Country not found', status: 404 });
  }
  return toCountryDto(country);
`,
);

replaceFunction(
  'createCountry',
  `
  const db = getDbClient();
  const [country] = await db.insert(schema.countries).values({
    code2: input.code2,
    code3: input.code3 ?? null,
    name: input.name,
    slug: input.slug,
    is_active: input.isActive ?? true,
  }).returning();
  return toCountryDto(country);
`,
);

replaceFunction(
  'updateCountry',
  `
  const db = getDbClient();
  const existing = await db.query.countries.findFirst({ where: eq(schema.countries.id, countryId) });
  if (!existing) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Country not found', status: 404 });
  }

  const [country] = await db.update(schema.countries).set({
    ...(input.code2 !== undefined ? { code2: input.code2 } : {}),
    ...(input.code3 !== undefined ? { code3: input.code3 } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  }).where(eq(schema.countries.id, countryId)).returning();
  return toCountryDto(country);
`,
);

replaceFunction(
  'deleteCountry',
  `
  const db = getDbClient();
  const existing = await db.query.countries.findFirst({ where: eq(schema.countries.id, countryId) });
  if (!existing) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Country not found', status: 404 });
  }
  await db.delete(schema.countries).where(eq(schema.countries.id, countryId));
`,
);

replaceFunction(
  'listCities',
  `
  const db = getDbClient();
  const cities = await db.query.cities.findMany({
    with: { country: { columns: { id: true, name: true } } },
    orderBy: [asc(schema.cities.name)],
  });
  return cities.map(toCityDto);
`,
);

replaceFunction(
  'getCity',
  `
  const db = getDbClient();
  const city = await db.query.cities.findFirst({
    where: eq(schema.cities.id, cityId),
    with: { country: { columns: { id: true, name: true } } },
  });
  if (!city) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'City not found', status: 404 });
  }
  return toCityDto(city);
`,
);

replaceFunction(
  'createCity',
  `
  const db = getDbClient();
  const country = await db.query.countries.findFirst({ where: eq(schema.countries.id, input.countryId) });
  if (!country) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Country not found', status: 404 });
  }

  const [inserted] = await db.insert(schema.cities).values({
    country_id: input.countryId,
    name: input.name,
    slug: input.slug,
    is_active: input.isActive ?? true,
  }).returning();

  const city = await db.query.cities.findFirst({
    where: eq(schema.cities.id, inserted.id),
    with: { country: { columns: { id: true, name: true } } },
  });
  return toCityDto(city!);
`,
);

replaceFunction(
  'updateCity',
  `
  const db = getDbClient();
  const existing = await db.query.cities.findFirst({ where: eq(schema.cities.id, cityId) });
  if (!existing) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'City not found', status: 404 });
  }

  if (input.countryId !== undefined) {
    const country = await db.query.countries.findFirst({ where: eq(schema.countries.id, input.countryId) });
    if (!country) {
      throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Country not found', status: 404 });
    }
  }

  await db.update(schema.cities).set({
    ...(input.countryId !== undefined ? { country_id: input.countryId } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  }).where(eq(schema.cities.id, cityId));

  const city = await db.query.cities.findFirst({
    where: eq(schema.cities.id, cityId),
    with: { country: { columns: { id: true, name: true } } },
  });
  return toCityDto(city!);
`,
);

replaceFunction(
  'deleteCity',
  `
  const db = getDbClient();
  const existing = await db.query.cities.findFirst({ where: eq(schema.cities.id, cityId) });
  if (!existing) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'City not found', status: 404 });
  }
  await db.delete(schema.cities).where(eq(schema.cities.id, cityId));
`,
);

project.saveSync();
console.log('Part 3 complete');
