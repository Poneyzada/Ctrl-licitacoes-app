import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const documentos = await prisma.licitacaoDocumento.findMany({
      where: { licitacaoId: id },
      include: {
        uploader: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(documentos);
  } catch (error: any) {
    console.error('Error fetching documentos:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: licitacaoId } = await params;

    // Verify licitacao exists
    const licitacao = await prisma.licitacao.findUnique({
      where: { id: licitacaoId },
      select: { id: true, numero: true, orgaoNome: true }
    });
    if (!licitacao) return NextResponse.json({ error: 'Licitação não encontrada' }, { status: 404 });

    const contentType = req.headers.get('content-type') || '';
    let nome = '';
    let categoria: any = 'OUTROS';
    let mimeType = 'application/pdf';
    let tamanhoBytes = 0;
    let storageUrl = '';
    let observacoes = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      nome = (formData.get('nome') as string) || (file ? file.name : 'Documento');
      categoria = (formData.get('categoria') as string) || 'OUTROS';
      observacoes = (formData.get('observacoes') as string) || '';
      const externalUrl = (formData.get('externalUrl') as string) || '';

      if (file && file.size > 0) {
        mimeType = file.type || 'application/octet-stream';
        tamanhoBytes = file.size;

        // Convert file to base64 Data URL for standalone persistent viewing/downloading
        const buffer = Buffer.from(await file.arrayBuffer());
        storageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      } else if (externalUrl) {
        storageUrl = externalUrl;
      }
    } else {
      const body = await req.json();
      nome = body.nome || 'Documento';
      categoria = body.categoria || 'OUTROS';
      mimeType = body.mimeType || 'application/pdf';
      tamanhoBytes = body.tamanhoBytes || 0;
      storageUrl = body.storageUrl || body.externalUrl || '';
      observacoes = body.observacoes || '';
    }

    if (!nome) {
      return NextResponse.json({ error: 'Nome do documento é obrigatório' }, { status: 400 });
    }

    // Validate categoria enum
    const validCategorias = [
      'EDITAL', 'RETIFICACAO', 'ESCLARECIMENTO', 'IMPUGNACAO_DECISAO',
      'SUSPENSAO', 'SINE_DIE', 'REABERTURA', 'CONSOLIDACAO',
      'ATA_RESULTADO', 'HABILITACAO', 'PROPOSTA_TECNICA', 'PROPOSTA_COMERCIAL',
      'ADVERSARIO', 'DILIGENCIA_RECURSO', 'CONTRATO', 'TERMO_REFERENCIA',
      'PROJETO_BASICO', 'MATRIZ_RISCO', 'ORCAMENTO_BDI', 'CRONOGRAMA', 'OUTROS'
    ];
    if (!validCategorias.includes(categoria)) {
      categoria = 'OUTROS';
    }

    const doc = await prisma.licitacaoDocumento.create({
      data: {
        licitacaoId,
        nome: nome.trim(),
        categoria,
        mimeType,
        tamanhoBytes,
        storageUrl: storageUrl || null,
        status: 'ANALISADO',
        textoExtraido: observacoes ? `Obs: ${observacoes}` : null,
        uploadedBy: session.user?.id || null,
      },
      include: {
        uploader: { select: { id: true, name: true, email: true } }
      }
    });

    // Audit log
    if (session.user?.id) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'UPLOAD_DOCUMENTO',
            entity: 'LicitacaoDocumento',
            entityId: doc.id,
            metadata: JSON.stringify({
              documento: doc.nome,
              categoria: doc.categoria,
              licitacao: licitacao.numero || licitacao.orgaoNome
            })
          }
        });
      } catch (err) {
        console.warn('AuditLog error:', err);
      }
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error('Error creating documento:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId');

    if (!docId) {
      return NextResponse.json({ error: 'docId é obrigatório' }, { status: 400 });
    }

    await prisma.licitacaoDocumento.delete({
      where: { id: docId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting documento:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
