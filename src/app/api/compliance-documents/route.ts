import {
  getBucket,
  getAuthenticatedPortalUser,
  getD1,
  initDatabase,
  logAudit,
} from "../../../db";

export async function GET(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Documento não informado." }, { status: 400 });
    }
    const document = await getD1()
      .prepare(
        `SELECT name, object_key, content_type
         FROM compliance_documents WHERE id = ? LIMIT 1`,
      )
      .bind(id)
      .first<{ name: string; object_key: string; content_type: string }>();
    if (!document || !document.object_key) {
      return Response.json({ error: "Arquivo não disponível." }, { status: 404 });
    }
    const object = await getBucket().get(document.object_key);
    if (!object) {
      return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }
    return new Response(Buffer.from(object.body), {
      headers: {
        "Content-Type": document.content_type,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao abrir documento." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    const form = await request.formData();
    const file = form.get("file");
    const organizationId = String(form.get("organizationId") ?? "");
    const professionalId = String(form.get("professionalId") ?? "") || null;
    const documentType = String(form.get("documentType") ?? "").trim();
    const documentNumber = String(form.get("documentNumber") ?? "").trim();
    const issuer = String(form.get("issuer") ?? "").trim();
    const issuedAt = String(form.get("issuedAt") ?? "") || null;
    const expiresAt = String(form.get("expiresAt") ?? "") || null;
    const noExpiry = String(form.get("noExpiry") ?? "") === "true" ? 1 : 0;
    const notes = String(form.get("notes") ?? "").trim();

    if (!organizationId || !documentType) {
      return Response.json(
        { error: "Informe a empresa/consórcio e o tipo do documento." },
        { status: 400 },
      );
    }
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Selecione um arquivo válido." }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return Response.json(
        { error: "O arquivo deve ter no máximo 25 MB." },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `habilitacao/${organizationId}/${id}/${safeName}`;
    await getBucket().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: {
        uploadedBy: user.email,
        documentType,
        organizationId,
      },
    });
    await getD1()
      .prepare(
        `INSERT INTO compliance_documents
        (id, organization_id, professional_id, name, document_type,
         document_number, object_key, content_type, size, issuer, issued_at,
         expires_at, no_expiry, notes, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        organizationId,
        professionalId,
        file.name,
        documentType,
        documentNumber,
        objectKey,
        file.type || "application/octet-stream",
        file.size,
        issuer,
        issuedAt,
        noExpiry ? null : expiresAt,
        noExpiry,
        notes,
        user.email,
      )
      .run();
    await logAudit(
      user,
      "DOCUMENTO_HABILITACAO_ENVIADO",
      professionalId ? "documento_profissional" : "documento_empresa",
      id,
      `${file.name} cadastrado com controle de validade.`,
    );
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o documento.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    if (user.role === "Manutenção") {
      return Response.json(
        { error: "O perfil de Manutenção não pode alterar documentos de habilitação." },
        { status: 403 },
      );
    }
    const payload = (await request.json()) as Record<string, unknown>;
    const id = String(payload.id ?? "");
    const organizationId = String(payload.organizationId ?? "");
    const professionalId = String(payload.professionalId ?? "") || null;
    const documentType = String(payload.documentType ?? "").trim();
    const documentNumber = String(payload.documentNumber ?? "").trim();
    const issuer = String(payload.issuer ?? "").trim();
    const issuedAt = String(payload.issuedAt ?? "") || null;
    const noExpiry = Boolean(payload.noExpiry);
    const expiresAt = noExpiry ? null : String(payload.expiresAt ?? "") || null;
    const notes = String(payload.notes ?? "").trim();
    if (!id || !organizationId || !documentType) {
      return Response.json(
        { error: "Informe o documento, a empresa e o tipo documental." },
        { status: 400 },
      );
    }
    const existing = await getD1()
      .prepare("SELECT name FROM compliance_documents WHERE id = ? LIMIT 1")
      .bind(id)
      .first<{ name: string }>();
    if (!existing) {
      return Response.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    await getD1()
      .prepare(
        `UPDATE compliance_documents
         SET organization_id = ?, professional_id = ?, document_type = ?,
             document_number = ?, issuer = ?, issued_at = ?, expires_at = ?,
             no_expiry = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(
        organizationId,
        professionalId,
        documentType,
        documentNumber,
        issuer,
        issuedAt,
        expiresAt,
        noExpiry ? 1 : 0,
        notes,
        id,
      )
      .run();
    await logAudit(
      user,
      "DOCUMENTO_HABILITACAO_EDITADO",
      professionalId ? "documento_profissional" : "documento_empresa",
      id,
      `${existing.name}: classificação, vínculo ou validade atualizados.`,
    );
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível editar o documento." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    if (user.role !== "Diretor") {
      return Response.json(
        { error: "Somente a Diretoria pode excluir documentos de habilitação." },
        { status: 403 },
      );
    }
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Documento não informado." }, { status: 400 });
    }
    const existing = await getD1()
      .prepare("SELECT name, object_key FROM compliance_documents WHERE id = ? LIMIT 1")
      .bind(id)
      .first<{ name: string; object_key: string }>();
    if (!existing) {
      return Response.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    await getD1().batch([
      getD1().prepare("DELETE FROM tender_document_links WHERE document_id = ?").bind(id),
      getD1().prepare("DELETE FROM compliance_documents WHERE id = ?").bind(id),
    ]);
    if (existing.object_key) {
      await getBucket().delete(existing.object_key);
    }
    await logAudit(
      user,
      "DOCUMENTO_HABILITACAO_EXCLUIDO",
      "documento_habilitacao",
      id,
      `${existing.name} excluído pela Diretoria e desvinculado dos processos.`,
    );
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível excluir o documento." },
      { status: 500 },
    );
  }
}
