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
    if (!id) return Response.json({ error: "Documento não informado." }, { status: 400 });
    const document = await getD1().prepare(
      `SELECT name, object_key, content_type FROM platform_documents WHERE id = ? LIMIT 1`,
    ).bind(id).first<{ name: string; object_key: string; content_type: string }>();
    if (!document) return Response.json({ error: "Documento não encontrado." }, { status: 404 });
    const object = await getBucket().get(document.object_key);
    if (!object) return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
    return new Response(Buffer.from(object.body), { headers: {
      "Content-Type": document.content_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`,
    } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao abrir documento." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    if (user.role === "Manutenção") return Response.json({ error: "Perfil sem permissão para alterar documentos de credenciamento." }, { status: 403 });
    const form = await request.formData();
    const file = form.get("file");
    const platformRegistrationId = String(form.get("platformRegistrationId") ?? "");
    const documentType = String(form.get("documentType") ?? "").trim();
    if (!(file instanceof File) || !file.size || !platformRegistrationId || !documentType) {
      return Response.json({ error: "Informe o cadastro, o tipo e o arquivo." }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) return Response.json({ error: "O arquivo deve ter no máximo 25 MB." }, { status: 400 });
    const registration = await getD1().prepare(
      `SELECT organization_id FROM platform_registrations WHERE id = ? LIMIT 1`,
    ).bind(platformRegistrationId).first<{ organization_id: string }>();
    if (!registration) return Response.json({ error: "Cadastro de plataforma não encontrado." }, { status: 404 });
    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `plataformas/${platformRegistrationId}/${id}/${safeName}`;
    await getBucket().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { uploadedBy: user.email, documentType },
    });
    await getD1().prepare(
      `INSERT INTO platform_documents
       (id, platform_registration_id, organization_id, name, document_type,
        document_number, object_key, content_type, size, issued_at, expires_at,
        notes, status, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', ?)`,
    ).bind(
      id, platformRegistrationId, registration.organization_id, file.name, documentType,
      String(form.get("documentNumber") ?? "").trim(), objectKey,
      file.type || "application/octet-stream", file.size,
      String(form.get("issuedAt") ?? "") || null,
      String(form.get("expiresAt") ?? "") || null,
      String(form.get("notes") ?? "").trim(), user.email,
    ).run();
    await logAudit(user, "DOCUMENTO_DE_CREDENCIAMENTO_ENVIADO", "plataforma", platformRegistrationId, `${file.name} incluído em ${documentType}.`);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível enviar o documento." }, { status: 500 });
  }
}
