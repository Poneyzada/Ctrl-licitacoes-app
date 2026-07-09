import { defineConfig } from 'prisma/config'
import path from 'path'

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')

export default defineConfig({
  earlyAccess: true,
  schema: path.join(process.cwd(), 'prisma/schema.prisma'),
  datasource: {
    url: `file:${dbPath}`,
  },
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
})

