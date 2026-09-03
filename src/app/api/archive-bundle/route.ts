import { zipSync } from "fflate";

import { getAuthenticatedPortalUser, getBucket, getD1, initDatabase } from "../../../db";

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

export async function GET(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });

    const url = new URL(request.url);
    const recordIds = Array.from(
      new Set(
        (url.searchParams.get("ids") ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ).slice(0, 10);
    if (!recordIds.length) {
      return Response.json(
        { error: "Nenhum atestado foi selecionado." },
        { status: 400 },
      );
    }

    const records = await Promise.all(
      recordIds.map((id) =>
        getD1()
          .prepare(
            `SELECT id, certificate_number, internal_document_name,
                    internal_document_key, internal_document_size
             FROM technical_records WHERE id = ? LIMIT 1`,
          )
          .bind(id)
          .first<{
            id: string;
            certificate_number: string;
            internal_document_name: string;
            internal_document_key: string;
            internal_document_size: number;
          }>(),
      ),
    );
    const available = records.filter(
      (record): record is NonNullable<typeof record> =>
        Boolean(record?.internal_document_key),
    );
    if (!available.length) {
      return Response.json(
        { error: "Os atestados selecionados ainda não possuem cópia interna." },
        { status: 409 },
      );
    }
    const totalSize = available.reduce(
      (total, record) => total + Number(record.internal_document_size ?? 0),
      0,
    );
    if (totalSize > 80 * 1024 * 1024) {
      return Response.json(
        { error: "O conjunto excede 80 MB. Faça o download em grupos menores." },
        { status: 413 },
      );
    }

    const entries: Record<string, Uint8Array> = {};
    for (const [index, record] of available.entries()) {
      const object = await getBucket().get(record.internal_document_key);
      if (!object) continue;
      const bytes = new Uint8Array(await object.arrayBuffer());
      const originalName =
        record.internal_document_name ||
        `CAT_${record.certificate_number || index + 1}.pdf`;
      const filename = `${String(index + 1).padStart(2, "0")}_${safeFileName(originalName)}`;
      entries[filename] = bytes;
    }
    if (!Object.keys(entries).length) {
      return Response.json(
        { error: "As cópias internas selecionadas não foram encontradas." },
        { status: 404 },
      );
    }

    const archive = zipSync(entries, { level: 0 });
    const tenderId = safeFileName(url.searchParams.get("tenderId") || "processo");
    return new Response(new Blob([archive], { type: "application/zip" }), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="acervo_compativel_${tenderId}.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao preparar o acervo selecionado.",
      },
      { status: 500 },
    );
  }
}
