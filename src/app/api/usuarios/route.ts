import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, login/email e senha são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@ctrl.com` }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Já existe um usuário cadastrado com este login/email.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@ctrl.com`,
        passwordHash,
        role: role in UserRole ? role : UserRole.OPERADOR,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      }
    });

    // Log de Auditoria
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ name: user.name, email: user.email, role: user.role })
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao criar usuário' }, { status: 500 });
  }
}
