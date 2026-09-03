import {
  getBucket,
  getAuthenticatedPortalUser,
  getD1,
  initDatabase,
  logAudit,
} from "../../../db";

function driveFileId(reference: string) {
  try {
    const url = new URL(reference);
    if (url.hostname !== "drive.google.com") return null;
    const pathMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    return pathMatch?.[1] ?? url.searchParams.get("id");
  } catch {
    return null;
  }
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function filenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8.replace(/["']/g, ""));
    } catch {
      return utf8.replace(/["']/g, "");
    }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1]?.trim() ?? null;
}

export async function GET(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const forceDownload = url.searchParams.get("download") === "1";
    if (!id) {
      return Response.json({ error: "Atestado não informado." }, { status: 400 });
    }
    const record = await getD1()
      .prepare(
        `SELECT internal_document_name, internal_document_key,
                internal_document_type
         FROM technical_records WHERE id = ? LIMIT 1`,
      )
      .bind(id)
      .first<{
        internal_document_name: string;
        internal_document_key: string;
        internal_document_type: string;
      }>();
    if (!record?.internal_document_key) {
      return Response.json(
        { error: "A cópia interna ainda não foi importada." },
        { status: 404 },
      );
    }
    const object = await getBucket().get(record.internal_document_key);
    if (!object) {
      return Response.json({ error: "Arquivo interno não encontrado." }, { status: 404 });
    }
    return new Response(Buffer.from(object.body), {
      headers: {
        "Content-Type": record.internal_document_type || "application/pdf",
        "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(record.internal_document_name)}`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao abrir o acervo." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    const contentType = request.headers.get("content-type") ?? "";
    const importFromDrive = contentType.includes("application/json");
    const form = importFromDrive ? null : await request.formData();
    const body = importFromDrive
      ? ((await request.json()) as {
          recordId?: string;
          importFromDrive?: boolean;
        })
      : null;
    const recordId = String(body?.recordId ?? form?.get("recordId") ?? "");
    if (!recordId) {
      return Response.json({ error: "Atestado não informado." }, { status: 400 });
    }
    const exists = await getD1()
      .prepare(
        `SELECT certificate_number, document_reference
         FROM technical_records WHERE id = ? LIMIT 1`,
      )
      .bind(recordId)
      .first<{ certificate_number: string; document_reference: string }>();
    if (!exists) {
      return Response.json({ error: "Registro de acervo não encontrado." }, { status: 404 });
    }

    let documentName = "";
    let documentType = "application/pdf";
    let documentSize = 0;
    let documentBody: ArrayBuffer | ReadableStream;
    let auditAction = "COPIA_ACERVO_IMPORTADA";

    if (importFromDrive && body?.importFromDrive) {
      const fileId = driveFileId(exists.document_reference ?? "");
      if (!fileId) {
        return Response.json(
          { error: "Este registro não possui um link válido do Google Drive." },
          { status: 400 },
        );
      }
      const driveResponse = await fetch(
        `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`,
        { redirect: "follow" },
      );
      const receivedType = driveResponse.headers.get("content-type") ?? "";
      if (!driveResponse.ok || receivedType.includes("text/html")) {
        return Response.json(
          {
            error:
              "O arquivo está restrito no Google Drive. Abra a origem com a conta autorizada ou envie o PDF manualmente para criar a cópia interna.",
          },
          { status: 409 },
        );
      }
      const declaredSize = Number(driveResponse.headers.get("content-length") ?? 0);
      if (declaredSize > 25 * 1024 * 1024) {
        return Response.json(
          { error: "O arquivo do Drive excede o limite de 25 MB." },
          { status: 400 },
        );
      }
      const downloaded = await driveResponse.arrayBuffer();
      if (!downloaded.byteLength || downloaded.byteLength > 25 * 1024 * 1024) {
        return Response.json(
          { error: "O arquivo do Drive está vazio ou excede o limite de 25 MB." },
          { status: 400 },
        );
      }
      documentName =
        filenameFromDisposition(driveResponse.headers.get("content-disposition")) ??
        `CAT_${exists.certificate_number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      documentType = receivedType || "application/pdf";
      documentSize = downloaded.byteLength;
      documentBody = downloaded;
      auditAction = "COPIA_ACERVO_DRIVE_IMPORTADA";
    } else {
      const file = form?.get("file");
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
      documentName = file.name;
      documentType = file.type || "application/pdf";
      documentSize = file.size;
      documentBody = file.stream();
    }

    const objectKey = `acervo/${recordId}/${crypto.randomUUID()}/${safeFileName(documentName)}`;
    await getBucket().put(objectKey, documentBody, {
      httpMetadata: { contentType: documentType },
      customMetadata: { uploadedBy: user.email, technicalRecordId: recordId },
    });
    await getD1()
      .prepare(
        `UPDATE technical_records SET internal_document_key = ?,
         internal_document_name = ?, internal_document_type = ?,
         internal_document_size = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(
        objectKey,
        documentName,
        documentType,
        documentSize,
        recordId,
      )
      .run();
    await logAudit(
      user,
      auditAction,
      "acervo_tecnico",
      recordId,
      `${documentName} passou a ser consultável diretamente no portal.`,
    );
    return Response.json({ ok: true, documentName, documentSize });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao importar o documento." },
      { status: 500 },
    );
  }
}
