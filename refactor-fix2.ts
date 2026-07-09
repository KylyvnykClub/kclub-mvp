import { Project } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath(
  'apps/product-core/src/server/services/admin-service.ts',
);

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
    where: (subs: any, { eq }: any) => eq(subs.kind, 'BUSINESS_PLACEMENT'),
    orderBy: (subs: any, { desc }: any) => [desc(subs.created_at)],
    limit: 1,
  },
}`);
    }
  }
}

project.saveSync();
console.log('Fixed include variables again');
