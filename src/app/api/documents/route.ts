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
        "SELECT name, object_key, content_type FROM documents WHERE id = ? LIMIT 1",
      )
      .bind(id)
      .first<{ name: string; object_key: string; content_type: string }>();
    if (!document) {
      return Response.json({ error: "Documento não encontrado." }, { status: 404 });
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
    const tenderId = String(form.get("tenderId") ?? "") || null;
    const category =
      String(form.get("category") ?? "") || "Documento editalício";

    if (!(file instanceof File) || file.size === 0) {
      return Response.json(
        { error: "Selecione um arquivo válido." },
        { status: 400 },
      );
    }
    if (file.size > 25 * 1024 * 1024) {
      return Response.json(
        { error: "O arquivo deve ter no máximo 25 MB." },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `documentos/${id}/${safeName}`;
    await getBucket().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: {
        uploadedBy: user.email,
        category,
      },
    });
    await getD1()
      .prepare(
        `INSERT INTO documents
        (id, tender_id, name, object_key, content_type, size, category,
         analysis_status, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Aguardando análise', ?)`,
      )
      .bind(
        id,
        tenderId,
        file.name,
        objectKey,
        file.type || "application/octet-stream",
        file.size,
        category,
        user.email,
      )
      .run();
    await logAudit(
      user,
      "DOCUMENTO_ENVIADO",
      "documento",
      id,
      `${file.name} enviado para a central documental.`,
    );
    return Response.json(
      {
        document: {
          id,
          tender_id: tenderId,
          name: file.name,
          content_type: file.type,
          size: file.size,
          category,
          analysis_status: "Aguardando análise",
          uploaded_by: user.email,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
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
