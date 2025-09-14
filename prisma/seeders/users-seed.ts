import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface UserData {
  name: string;
  email: string;
  password: string;
  roleKey: string;
  firstName?: string;
}

interface UsersJsonData {
  data: UserData[];
}

export async function usersSeed() {
  const usersPath = path.resolve(__dirname, 'data', 'users.json');
  const usersRaw = fs.readFileSync(usersPath, 'utf-8');
  const usersJson = JSON.parse(usersRaw) as UsersJsonData;
  const users = usersJson.data;

  for (const user of users) {
    const role = await prisma.role.findFirst({
      where: { key: user.roleKey },
    });

    if (!role) {
      console.warn(
        `⚠️  Role with key "${user.roleKey}" not found. Skipping user "${user.firstName || user.name}" (${user.email}).`,
      );
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        roleId: role.id,
        isVerified: true,
      },
    });

    console.log(`✅ User for role "${user.roleKey}" seeded`);
  }
}

// For running directly
if (require.main === module) {
  usersSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
