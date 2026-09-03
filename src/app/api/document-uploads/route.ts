import {
  getBucket,
  getAuthenticatedPortalUser,
  getD1,
  initDatabase,
  logAudit,
} from "../../../db";

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const MAX_PART_BYTES = 6 * 1024 * 1024;

type UploadDestination = "document" | "editalVersion" | "resourceDocument";

type UploadedPart = {
  partNumber: number;
  etag: string;
};

type UploadPayload = {
  destination?: UploadDestination;
  documentId?: string;
  objectKey?: string;
  uploadId?: string;
  versionNumber?: number;
  parts?: UploadedPart[];
  name?: string;
  size?: number;
  contentType?: string;
  tenderId?: string;
  category?: string;
  resourceCaseId?: string;
  followupId?: string;
  competitorName?: string;
  analysisSector?: string;
  notes?: string;
  eventType?: string;
  title?: string;
  processEffect?: string;
  publicationDate?: string;
  effectiveDate?: string;
  description?: string;
  extractionSummary?: string;
};

function normalizedContentType(name: string, value?: string) {
  if (name.toLowerCase().endsWith(".pdf")) return "application/pdf";
  return value?.trim() || "application/octet-stream";
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "documento";
}

async function requestPayload(request: Request) {
  try {
    return (await request.json()) as UploadPayload;
  } catch {
    throw new Error("Dados do envio inválidos.");
  }
}

async function requireTender(tenderId: string) {
  const tender = await getD1()
    .prepare(
      "SELECT id FROM tenders WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    )
    .bind(tenderId)
    .first();
  if (!tender) throw new Error("Licitação não encontrada.");
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    const action = new URL(request.url).searchParams.get("action") ?? "init";

    if (action === "part") {
      const url = new URL(request.url);
      const objectKey = url.searchParams.get("objectKey") ?? "";
      const uploadId = url.searchParams.get("uploadId") ?? "";
      const partNumber = Number(url.searchParams.get("partNumber") ?? 0);
      if (
        !objectKey ||
        !uploadId ||
        !Number.isInteger(partNumber) ||
        partNumber < 1 ||
        partNumber > 40 ||
        (!objectKey.startsWith("documentos/") &&
          !objectKey.startsWith("editais/") &&
          !objectKey.startsWith("recursos/"))
      ) {
        return Response.json(
          { error: "Parte do arquivo inválida." },
          { status: 400 },
        );
      }
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > MAX_PART_BYTES) {
        return Response.json(
          { error: "O bloco do arquivo possui tamanho inválido." },
          { status: 400 },
        );
      }
      const multipart = getBucket().resumeMultipartUpload(objectKey, uploadId);
      const part = await multipart.uploadPart(partNumber, bytes);
      return Response.json({ partNumber: part.partNumber, etag: part.etag });
    }

    const payload = await requestPayload(request);

    if (action === "abort") {
      const objectKey = String(payload.objectKey ?? "");
      const uploadId = String(payload.uploadId ?? "");
      if (
        objectKey &&
        uploadId &&
        (objectKey.startsWith("documentos/") ||
          objectKey.startsWith("editais/") ||
          objectKey.startsWith("recursos/"))
      ) {
        await getBucket()
          .resumeMultipartUpload(objectKey, uploadId)
          .abort();
      }
      return Response.json({ ok: true });
    }

    const destination: UploadDestination =
      payload.destination === "editalVersion"
        ? "editalVersion"
        : payload.destination === "resourceDocument"
          ? "resourceDocument"
          : "document";

    if (action === "init") {
      if (user.role === "Manutenção") {
        return Response.json(
          { error: "Perfil sem permissão para enviar documentos." },
          { status: 403 },
        );
      }
      const name = String(payload.name ?? "").trim();
      const size = Number(payload.size ?? 0);
      const tenderId = String(payload.tenderId ?? "");
      const category = String(payload.category ?? "").trim();
      const analysisSector = String(payload.analysisSector ?? "").trim();
      if (!name || !Number.isFinite(size) || size <= 0) {
        return Response.json(
          { error: "Nome e tamanho do arquivo são obrigatórios." },
          { status: 400 },
        );
      }
      if (size > MAX_UPLOAD_BYTES) {
        return Response.json(
          { error: "Cada arquivo pode ter no máximo 200 MB." },
          { status: 400 },
        );
      }
      if (tenderId) await requireTender(tenderId);
      if (destination === "editalVersion" && !tenderId) {
        return Response.json(
          { error: "A licitação é obrigatória para o dossiê editalício." },
          { status: 400 },
        );
      }
      if (
        destination === "resourceDocument" &&
        (!tenderId || !category || !analysisSector)
      ) {
        return Response.json(
          { error: "Informe a licitação, a categoria e o setor responsável." },
          { status: 400 },
        );
      }

      const documentId = crypto.randomUUID();
      const contentType = normalizedContentType(name, payload.contentType);
      let versionNumber: number | undefined;
      let resourceCaseId = String(payload.resourceCaseId ?? "");
      let objectKey: string;
      if (destination === "editalVersion") {
        const version = await getD1()
          .prepare(
            "SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM tender_edital_versions WHERE tender_id = ?",
          )
          .bind(tenderId)
          .first<{ next_version: number }>();
        versionNumber = Number(version?.next_version ?? 1);
        objectKey = `editais/${tenderId}/v${versionNumber}/${documentId}/${safeFileName(name)}`;
      } else if (destination === "resourceDocument") {
        let resourceCase = resourceCaseId
          ? await getD1()
              .prepare(
                "SELECT id, tender_id FROM resource_cases WHERE id = ? LIMIT 1",
              )
              .bind(resourceCaseId)
              .first<{ id: string; tender_id: string }>()
          : null;
        if (resourceCase && resourceCase.tender_id !== tenderId) {
          return Response.json(
            { error: "O processo recursal não pertence à licitação informada." },
            { status: 400 },
          );
        }
        const followupId = String(payload.followupId ?? "");
        const followup = !resourceCase && followupId
          ? await getD1()
              .prepare(
                `SELECT followup_type, title, due_at, responsible, notes
                 FROM tender_followups WHERE id = ? AND tender_id = ? LIMIT 1`,
              )
              .bind(followupId, tenderId)
              .first<Record<string, string>>()
          : null;
        if (!resourceCase && followup) {
          const existing = await getD1()
            .prepare(
              `SELECT id, tender_id FROM resource_cases
               WHERE tender_id = ? AND resource_type = ? AND status != 'Concluído'
               ORDER BY created_at DESC LIMIT 1`,
            )
            .bind(tenderId, followup.followup_type)
            .first<{ id: string; tender_id: string }>();
          if (existing) {
            resourceCase = existing;
            resourceCaseId = existing.id;
          } else {
            resourceCaseId = crypto.randomUUID();
            await getD1()
              .prepare(
                `INSERT INTO resource_cases
                 (id, tender_id, resource_type, position, deadline, responsible,
                  competitor_name, status, summary, legal_ground, next_action, created_by)
                 VALUES (?, ?, ?, 'Análise de concorrente', ?, ?, ?, 'Triagem', ?, '', ?, ?)`,
              )
              .bind(
                resourceCaseId,
                tenderId,
                followup.followup_type || "Acompanhamento pós-disputa",
                followup.due_at || new Date(Date.now() + 86400000).toISOString(),
                followup.responsible || user.name,
                String(payload.competitorName ?? "").trim(),
                followup.notes || "Dossiê documental de empresa adversária.",
                followup.title || "Conferir documentação da concorrente",
                user.email,
              )
              .run();
            resourceCase = { id: resourceCaseId, tender_id: tenderId };
          }
        }
        if (!resourceCase) {
          return Response.json(
            { error: "Processo recursal ou acompanhamento não encontrado." },
            { status: 404 },
          );
        }
        objectKey = `recursos/${resourceCaseId}/${documentId}/${safeFileName(name)}`;
      } else {
        objectKey = `documentos/${documentId}/${safeFileName(name)}`;
      }

      const multipart = await getBucket().createMultipartUpload(objectKey, {
        httpMetadata: { contentType },
        customMetadata: {
          uploadedBy: user.email,
          destination,
          format: name.toLowerCase().endsWith(".pdf") ? "pdf" : "original",
          ...(destination === "resourceDocument"
            ? { category, analysisSector }
            : {}),
        },
      });
      return Response.json({
        documentId,
        objectKey,
        uploadId: multipart.uploadId,
        versionNumber,
        resourceCaseId: resourceCaseId || undefined,
        contentType,
      });
    }

    if (action !== "complete") {
      return Response.json({ error: "Ação inválida." }, { status: 400 });
    }

    if (user.role === "Manutenção") {
      return Response.json(
        { error: "Perfil sem permissão para guardar documentos." },
        { status: 403 },
      );
    }
    const documentId = String(payload.documentId ?? "");
    const objectKey = String(payload.objectKey ?? "");
    const uploadId = String(payload.uploadId ?? "");
    const name = String(payload.name ?? "").trim();
    const size = Number(payload.size ?? 0);
    const tenderId = String(payload.tenderId ?? "");
    const resourceCaseId = String(payload.resourceCaseId ?? "");
    const contentType = normalizedContentType(name, payload.contentType);
    const parts = Array.isArray(payload.parts)
      ? payload.parts.filter(
          (part) =>
            Number.isInteger(part.partNumber) &&
            part.partNumber > 0 &&
            Boolean(part.etag),
        )
      : [];
    parts.sort((first, second) => first.partNumber - second.partNumber);
    const validPrefix =
      destination === "editalVersion"
        ? `editais/${tenderId}/`
        : destination === "resourceDocument"
          ? `recursos/${resourceCaseId}/${documentId}/`
          : `documentos/${documentId}/`;
    if (
      !documentId ||
      !objectKey.startsWith(validPrefix) ||
      !uploadId ||
      !name ||
      !size ||
      size > MAX_UPLOAD_BYTES ||
      !parts.length
    ) {
      return Response.json(
        { error: "Não foi possível confirmar todas as partes do arquivo." },
        { status: 400 },
      );
    }
    if (tenderId) await requireTender(tenderId);
    await getBucket()
      .resumeMultipartUpload(objectKey, uploadId)
      .complete(parts);

    if (destination === "editalVersion") {
      const versionNumber = Number(payload.versionNumber ?? 0);
      const eventType = String(payload.eventType ?? "Edital original").trim();
      const title = String(payload.title ?? name).trim();
      const processEffect = String(
        payload.processEffect ?? "Sem alteração de fase",
      ).trim();
      if (!tenderId || !versionNumber || !title) {
        return Response.json(
          { error: "Dados da versão editalícia incompletos." },
          { status: 400 },
        );
      }
      const processStatus =
        processEffect === "Suspender licitação"
          ? "Suspensa"
          : processEffect === "Sine die"
            ? "Sine die"
            : "Em análise";
      const phase = ["Suspender licitação", "Sine die"].includes(
        processEffect,
      )
        ? processStatus
        : "Revisão editalícia";
      await getD1().batch([
        getD1()
          .prepare(
            `INSERT INTO tender_edital_versions
             (id, tender_id, version_number, event_type, title, publication_date,
              effective_date, description, process_effect, status, object_key, name,
              content_type, size, extraction_summary, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Vigente', ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            documentId,
            tenderId,
            versionNumber,
            eventType,
            title,
            payload.publicationDate || null,
            payload.effectiveDate || null,
            String(payload.description ?? "").trim(),
            processEffect,
            objectKey,
            name,
            contentType,
            size,
            String(payload.extractionSummary ?? "").trim(),
            user.email,
          ),
        getD1()
          .prepare(
            "UPDATE tenders SET status = ?, phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          )
          .bind(processStatus, phase, tenderId),
      ]);
      await logAudit(
        user,
        "VERSAO_EDITALICIA_REGISTRADA",
        "licitacao",
        tenderId,
        `Versão ${versionNumber}: ${eventType} — ${name}. Efeito: ${processEffect}.`,
      );
      return Response.json(
        { ok: true, id: documentId, versionNumber },
        { status: 201 },
      );
    }

    if (destination === "resourceDocument") {
      const category = String(payload.category ?? "").trim();
      const analysisSector = String(payload.analysisSector ?? "").trim();
      const competitorName = String(payload.competitorName ?? "").trim();
      const notes = String(payload.notes ?? "").trim();
      const resourceCase = resourceCaseId
        ? await getD1()
            .prepare(
              "SELECT tender_id FROM resource_cases WHERE id = ? LIMIT 1",
            )
            .bind(resourceCaseId)
            .first<{ tender_id: string }>()
        : null;
      if (
        !resourceCase ||
        resourceCase.tender_id !== tenderId ||
        !category ||
        !analysisSector
      ) {
        return Response.json(
          { error: "Dados do documento recursal incompletos ou inconsistentes." },
          { status: 400 },
        );
      }
      await getD1()
        .prepare(
          `INSERT INTO opponent_documents
           (id, resource_case_id, tender_id, competitor_name, name, object_key,
            content_type, size, category, analysis_sector, analysis_status,
            notes, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aguardando análise', ?, ?)`,
        )
        .bind(
          documentId,
          resourceCaseId,
          tenderId,
          competitorName,
          name,
          objectKey,
          contentType,
          size,
          category,
          analysisSector,
          notes,
          user.email,
        )
        .run();
      await logAudit(
        user,
        "DOCUMENTO_ADVERSARIO_ENCAMINHADO",
        "recurso",
        resourceCaseId,
        `${name} encaminhado para ${analysisSector} (${category}).`,
      );
      return Response.json(
        { ok: true, id: documentId, resourceCaseId },
        { status: 201 },
      );
    }

    const category = String(payload.category ?? "Documento editalício").trim();
    await getD1()
      .prepare(
        `INSERT INTO documents
         (id, tender_id, name, object_key, content_type, size, category, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        documentId,
        tenderId || null,
        name,
        objectKey,
        contentType,
        size,
        category,
        user.email,
      )
      .run();
    await logAudit(
      user,
      "DOCUMENTO_ENVIADO",
      "documento",
      documentId,
      `${name} foi preservado em ${category}${tenderId ? ` e vinculado à licitação ${tenderId}` : ""}.`,
    );
    const document = await getD1()
      .prepare("SELECT * FROM documents WHERE id = ?")
      .bind(documentId)
      .first();
    return Response.json({ document }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o envio do arquivo.",
      },
      { status: 500 },
    );
  }
}
