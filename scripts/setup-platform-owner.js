import { loadEnvConfig } from '@next/env';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

loadEnvConfig(process.cwd());

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.env.PHARMA_PLATFORM_OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.PHARMA_PLATFORM_OWNER_PASSWORD;
  const name = process.env.PHARMA_PLATFORM_OWNER_NAME?.trim() || 'Platform Owner';

  if (!email || !password) {
    throw new Error(
      'Set PHARMA_PLATFORM_OWNER_EMAIL and PHARMA_PLATFORM_OWNER_PASSWORD in .env or the server environment.'
    );
  }

  if (!z.email().safeParse(email).success) {
    throw new Error('PHARMA_PLATFORM_OWNER_EMAIL must be a valid email address.');
  }

  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('PHARMA_PLATFORM_OWNER_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash },
    });
  } else {
    await prisma.user.create({
      data: { name, email, passwordHash },
    });
  }

  console.log(`Platform owner account is ready for ${email}.`);
}

main()
  .catch((error) => {
    console.error('Platform owner setup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
