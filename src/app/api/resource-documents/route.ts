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
         FROM opponent_documents WHERE id = ? LIMIT 1`,
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
    if (user.role === "Manutenção") {
      return Response.json(
        { error: "O perfil Manutenção não pode instruir processos recursais." },
        { status: 403 },
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    let resourceCaseId = String(form.get("resourceCaseId") ?? "");
    const tenderId = String(form.get("tenderId") ?? "");
    const followupId = String(form.get("followupId") ?? "");
    const category = String(form.get("category") ?? "");
    const analysisSector = String(form.get("analysisSector") ?? "");
    const competitorName = String(form.get("competitorName") ?? "");
    const notes = String(form.get("notes") ?? "");
    if (!(file instanceof File) || !file.size || (!resourceCaseId && !tenderId) || !category || !analysisSector) {
      return Response.json(
        { error: "Informe o acompanhamento, arquivo, categoria e setor responsável." },
        { status: 400 },
      );
    }
    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: "O arquivo deve ter no máximo 25 MB." }, { status: 400 });
    }
    let resourceCase = resourceCaseId ? await getD1()
      .prepare("SELECT tender_id FROM resource_cases WHERE id = ? LIMIT 1")
      .bind(resourceCaseId)
      .first<{ tender_id: string }>() : null;
    if (!resourceCase && tenderId) {
      const followup = followupId
        ? await getD1().prepare(
            `SELECT followup_type, title, due_at, responsible, notes
             FROM tender_followups WHERE id = ? AND tender_id = ? LIMIT 1`,
          ).bind(followupId, tenderId).first<Record<string, string>>()
        : null;
      resourceCaseId = crypto.randomUUID();
      await getD1().prepare(
        `INSERT INTO resource_cases
         (id, tender_id, resource_type, position, deadline, responsible,
          competitor_name, status, summary, legal_ground, next_action, created_by)
         VALUES (?, ?, ?, 'Análise de concorrente', ?, ?, ?, 'Triagem', ?, '', ?, ?)`,
      ).bind(
        resourceCaseId,
        tenderId,
        followup?.followup_type || "Acompanhamento pós-disputa",
        followup?.due_at || new Date(Date.now() + 86400000).toISOString(),
        followup?.responsible || user.name,
        competitorName.trim(),
        followup?.notes || "Dossiê documental de empresa adversária.",
        followup?.title || "Conferir documentação da concorrente",
        user.email,
      ).run();
      resourceCase = { tender_id: tenderId };
    }
    if (!resourceCase) {
      return Response.json({ error: "Processo recursal não encontrado." }, { status: 404 });
    }

    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `recursos/${resourceCaseId}/${id}/${safeName}`;
    await getBucket().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { uploadedBy: user.email, category, analysisSector },
    });
    await getD1()
      .prepare(
        `INSERT INTO opponent_documents
        (id, resource_case_id, tender_id, competitor_name, name, object_key,
         content_type, size, category, analysis_sector, analysis_status,
         notes, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aguardando análise', ?, ?)`,
      )
      .bind(
        id,
        resourceCaseId,
        resourceCase.tender_id,
        competitorName.trim(),
        file.name,
        objectKey,
        file.type || "application/octet-stream",
        file.size,
        category,
        analysisSector,
        notes.trim(),
        user.email,
      )
      .run();
    await logAudit(
      user,
      "DOCUMENTO_ADVERSARIO_ENCAMINHADO",
      "recurso",
      resourceCaseId,
      `${file.name} encaminhado para ${analysisSector} (${category}).`,
    );
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível enviar o documento." },
      { status: 500 },
    );
  }
}
