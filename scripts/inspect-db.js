import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          medicines: true,
          sales: true,
          members: true,
          branches: true,
        },
      },
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  for (const o of orgs) {
    console.log(`Org: ${o.name} (${o.code}, id: ${o.id})`);
    console.log(`  Counts:`, o._count);
    console.log(
      `  Members:`,
      o.members.map((m) => `${m.user.name} (${m.user.email}) -> Role: ${m.role}`)
    );
  }

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
