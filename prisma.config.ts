import { defineConfig } from 'prisma/config'
import path from 'path'
import dotenv from 'dotenv'

// Carrega o .env.local ou .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

export default defineConfig({
  schema: path.join(process.cwd(), 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
})
