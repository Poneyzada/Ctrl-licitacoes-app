import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const input = (credentials.email as string).toLowerCase().trim()
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: input },
                { email: `${input}@ctrl.com` },
                { name: { contains: input, mode: 'insensitive' } }
              ]
            },
          })

          if (!user || !user.active) return null

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isValid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (err) {
          console.error('Error during authorization:', err)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, active: true, role: true }
          });

          // Se o usuário foi desativado pela diretoria, derruba a sessão imediatamente
          if (!dbUser || !dbUser.active) {
            return null as any;
          }

          session.user.role = dbUser.role as string;
          session.user.id = token.id as string;
        } catch (err) {
          console.error('Erro ao verificar status do usuário na sessão:', err);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ctrl-licitacao-secret-prod-2026',
})

