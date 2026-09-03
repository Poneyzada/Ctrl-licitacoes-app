import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const usersToSync = [
  { name: 'Operador', email: 'operador@ctrl.com', password: 'Operador@2026', role: UserRole.OPERADOR },
  { name: 'Coordenador', email: 'coordenador@ctrl.com', password: 'Coordenador@2026', role: UserRole.COORDENADOR },
  { name: 'Diretor', email: 'diretor@ctrl.com', password: 'Diretor@2026', role: UserRole.DIRETOR },
  { name: 'Manutenção Master', email: 'manutencao@ctrl.com', password: 'Master@2026', role: UserRole.MANUTENCAO_MASTER },
  { name: 'Luciano Ferraz', email: 'luciano@ctrl.com', password: 'l.ferraz', role: UserRole.DIRETOR },
  { name: 'Lucicleide', email: 'lucy@ctrl.com', password: 'L.246810', role: UserRole.DIRETOR },
  { name: 'Elaine', email: 'elaine@ctrl.com', password: 'elaine5968', role: UserRole.COORDENADOR },
  { name: 'Hugo', email: 'hugo@ctrl.com', password: 'Maia_comercial', role: UserRole.DIRETOR },
  { name: 'Gustavo Lima', email: 'lima@ctrl.com', password: 'gustavoL', role: UserRole.COORDENADOR },
  { name: 'Geiseany', email: 'geiseany@ctrl.com', password: 'Sao_Paulo', role: UserRole.OPERADOR },
  { name: 'Felipe Dias', email: 'felipe@ctrl.com', password: 'Felipe_0105', role: UserRole.OPERADOR },
  // Manter compatibilidade com credenciais antigas caso alguem use
  { name: 'Diretoria Geral', email: 'diretoria@ctrl.com', password: '123456', role: UserRole.DIRETOR },
  { name: 'Coordenação Geral', email: 'coordenacao@ctrl.com', password: '123456', role: UserRole.COORDENADOR },
]

async function run() {
  console.log('🔄 Sincronizando contas de usuários no Neon DB...')

  for (const u of usersToSync) {
    const passwordHash = await bcrypt.hash(u.password, 12)

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        role: u.role,
        active: true,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        active: true,
      }
    })
    console.log(`✓ Usuário sincronizado: ${u.name} (${u.email}) - Perfil: ${u.role}`)
  }

  console.log('🎉 Todos os usuários foram criados e atualizados com sucesso!')
}

run()
  .catch(console.error)
  .finally(() => pool.end())
