import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hash, active: true },
    create: {
      username: 'admin',
      fullName: 'System Administrator',
      passwordHash: hash,
      branchId: 1,
      active: true,
    },
  });
  console.log(`✅ Admin password reset for user ID ${user.id}`);
  await prisma.$disconnect();
}
main();
