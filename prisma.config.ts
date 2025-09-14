import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  migrations: {
    seed: `npx ts-node prisma/seeders/seed.ts`,
  },
});
