import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { name, email, role, password, active } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      updateData.email = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@ctrl.com`;
    }
    if (role && role in UserRole) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ name: user.name, email: user.email, role: user.role, active: user.active })
      }
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    // Não permitir excluir a si mesmo
    if (session.user?.id === id) {
      return NextResponse.json({ error: 'Não é permitido desativar sua própria conta em uso.' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { active: false }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || 'system',
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        metadata: JSON.stringify({ active: false })
      }
    });

    return NextResponse.json({ success: true, message: 'Usuário desativado com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao desativar usuário:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao desativar usuário' }, { status: 500 });
  }
}
