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
    if (!id) return Response.json({ error: "Versão não informada." }, { status: 400 });
    const document = await getD1().prepare(
      `SELECT name, object_key, content_type FROM tender_edital_versions WHERE id = ? LIMIT 1`,
    ).bind(id).first<{ name: string; object_key: string; content_type: string }>();
    if (!document) return Response.json({ error: "Versão não encontrada." }, { status: 404 });
    const object = await getBucket().get(document.object_key);
    if (!object) return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
    return new Response(Buffer.from(object.body), { headers: {
      "Content-Type": document.content_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`,
    } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao abrir a versão." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    if (user.role === "Manutenção") return Response.json({ error: "Perfil sem permissão para alterar o dossiê editalício." }, { status: 403 });
    const form = await request.formData();
    const file = form.get("file");
    const tenderId = String(form.get("tenderId") ?? "");
    const eventType = String(form.get("eventType") ?? "Edital original").trim();
    const title = String(form.get("title") ?? (file instanceof File ? file.name : "")).trim();
    const processEffect = String(form.get("processEffect") ?? "Sem alteração de fase").trim();
    if (!(file instanceof File) || !file.size || !tenderId || !title) {
      return Response.json({ error: "Informe a licitação, o título e o arquivo." }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) return Response.json({ error: "O arquivo deve ter no máximo 25 MB." }, { status: 400 });
    const tender = await getD1().prepare("SELECT id FROM tenders WHERE id = ? AND deleted_at IS NULL LIMIT 1").bind(tenderId).first();
    if (!tender) return Response.json({ error: "Licitação não encontrada." }, { status: 404 });
    const version = await getD1().prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM tender_edital_versions WHERE tender_id = ?").bind(tenderId).first<{ next_version: number }>();
    const versionNumber = Number(version?.next_version ?? 1);
    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `editais/${tenderId}/v${versionNumber}/${id}/${safeName}`;
    await getBucket().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { uploadedBy: user.email, eventType, version: String(versionNumber) },
    });
    const processStatus = processEffect === "Suspender licitação" ? "Suspensa" : processEffect === "Sine die" ? "Sine die" : "Em análise";
    const phase = ["Suspender licitação", "Sine die"].includes(processEffect) ? processStatus : "Revisão editalícia";
    await getD1().batch([
      getD1().prepare(
        `INSERT INTO tender_edital_versions
         (id, tender_id, version_number, event_type, title, publication_date,
          effective_date, description, process_effect, status, object_key, name,
          content_type, size, extraction_summary, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Vigente', ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id, tenderId, versionNumber, eventType, title,
        String(form.get("publicationDate") ?? "") || null,
        String(form.get("effectiveDate") ?? "") || null,
        String(form.get("description") ?? "").trim(), processEffect, objectKey,
        file.name, file.type || "application/octet-stream", file.size,
        String(form.get("extractionSummary") ?? "").trim(), user.email,
      ),
      getD1().prepare(
        `UPDATE tenders SET status = ?, phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ).bind(processStatus, phase, tenderId),
    ]);
    await logAudit(user, "VERSAO_EDITALICIA_REGISTRADA", "licitacao", tenderId, `Versão ${versionNumber}: ${eventType} — ${file.name}. Efeito: ${processEffect}.`);
    return Response.json({ ok: true, id, versionNumber }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível registrar a versão." }, { status: 500 });
  }
}
