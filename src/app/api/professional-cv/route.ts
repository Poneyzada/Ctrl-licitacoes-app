import { getAuthenticatedPortalUser, getD1, initDatabase } from "../../../db";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const tenderId = url.searchParams.get("tenderId");
    const requestedArea = url.searchParams.get("area") ?? "";
    if (!id) return Response.json({ error: "Profissional não informado." }, { status: 400 });

    const db = getD1();
    const professional = await db
      .prepare(
        `SELECT p.*, o.name AS organization_name
         FROM professionals p
         LEFT JOIN organizations o ON o.id = p.organization_id
         WHERE p.id = ? LIMIT 1`,
      )
      .bind(id)
      .first<Record<string, unknown>>();
    if (!professional) {
      return Response.json({ error: "Profissional não encontrado." }, { status: 404 });
    }
    const tender = tenderId
      ? await db
          .prepare("SELECT number, title, tender_type FROM tenders WHERE id = ? LIMIT 1")
          .bind(tenderId)
          .first<Record<string, unknown>>()
      : null;
    const documents = await db
      .prepare(
        `SELECT id, name, document_type, document_number, issuer, issued_at
         FROM compliance_documents WHERE professional_id = ?
         ORDER BY document_type, issued_at DESC`,
      )
      .bind(id)
      .all<Record<string, unknown>>();

    const area = String(requestedArea || tender?.tender_type || professional.experience_areas || professional.specialty || "Engenharia");
    const qualifications = String(professional.qualifications ?? "")
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
    const documentRows = documents.results
      .map(
        (document) => `<tr><td>${escapeHtml(document.document_type)}</td><td>${escapeHtml(document.document_number || document.name)}</td><td>${escapeHtml(document.issuer || "Não informado")}</td></tr>`,
      )
      .join("");
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Currículo técnico — ${escapeHtml(professional.name)}</title><style>
      @page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;color:#172033;line-height:1.45;margin:0}header{border-bottom:4px solid #315ee7;padding-bottom:16px;margin-bottom:24px}h1{font-size:26px;margin:0 0 6px}h2{font-size:13px;color:#315ee7;letter-spacing:.12em;text-transform:uppercase;margin:24px 0 9px}p{margin:5px 0}.meta{color:#52627a;font-size:13px}.focus{background:#edf3ff;border-left:4px solid #315ee7;padding:12px 14px;margin:18px 0}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #d8dfeb;padding:8px;text-align:left}th{background:#f2f5fa}ul{margin-top:6px}footer{font-size:10px;color:#6b778b;border-top:1px solid #d8dfeb;margin-top:28px;padding-top:10px}.actions{position:fixed;right:20px;top:20px}@media print{.actions{display:none}}</style></head><body>
      <button class="actions" onclick="window.print()">Imprimir / salvar em PDF</button>
      <header><div class="meta">CURRÍCULO TÉCNICO PARA LICITAÇÃO</div><h1>${escapeHtml(professional.name)}</h1><p>${escapeHtml(professional.professional_role)} · ${escapeHtml(professional.organization_name || "Profissional parceiro")}</p><p class="meta">${escapeHtml(professional.council)} ${escapeHtml(professional.registration)}</p></header>
      <div class="focus"><strong>Enfoque selecionado:</strong> ${escapeHtml(area)}${tender ? `<br><span class="meta">Aplicação: ${escapeHtml(tender.number)} — ${escapeHtml(tender.title)}</span>` : ""}</div>
      <h2>Formação acadêmica</h2><p><strong>${escapeHtml(professional.degree)}</strong> em ${escapeHtml(professional.formation || "Formação não informada")}</p><p class="meta">${escapeHtml(professional.institution)}${professional.graduation_year ? ` · ${escapeHtml(professional.graduation_year)}` : ""}</p>
      <h2>Especialidade e áreas de experiência</h2><p>${escapeHtml(professional.specialty || area)}</p><p>${escapeHtml(professional.experience_areas)}</p>
      <h2>Síntese da experiência relevante</h2><p>${escapeHtml(professional.experience_summary || "Síntese profissional pendente de complementação.")}</p>
      <h2>Qualificações selecionadas</h2>${qualifications.length ? `<ul>${qualifications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>Qualificações complementares ainda não registradas.</p>"}
      <h2>Documentos comprobatórios cadastrados</h2><table><thead><tr><th>Documento</th><th>Referência</th><th>Emitente</th></tr></thead><tbody>${documentRows || "<tr><td colspan='3'>Nenhum documento profissional cadastrado.</td></tr>"}</tbody></table>
      <footer>Relatório gerado pelo LicitaControl. A seleção de conteúdo é preliminar e deve ser conferida com as exigências do edital, especialmente formação, tempo de experiência, CAT, vínculo e critérios de pontuação.</footer>
    </body></html>`;
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao gerar currículo." },
      { status: 500 },
    );
  }
}
