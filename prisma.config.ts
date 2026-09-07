import dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from '@prisma/config';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
