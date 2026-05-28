import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
<<<<<<< HEAD
  schema: './src/database/drizzle/schema.ts',
  out: './src/database/drizzle/migrations',
=======
  schema: './shared/database/drizzle/schema.ts',
  out: './shared/database/drizzle/migrations',
>>>>>>> d8d4baa8b75c457da2acd9dbd014d9c3cc37ef56
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  migrations: {
    prefix: 'timestamp',
  },
});
