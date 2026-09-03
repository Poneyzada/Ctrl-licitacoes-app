import {
  createPortalCredentialUser,
  getAuthenticatedPortalUser,
  getD1,
  initDatabase,
  logAudit,
  sha256,
  type PortalUser,
} from "../../../db";
import {
  OFFICIAL_ARCHIVE_RECORDS,
  OFFICIAL_ARCHIVE_SOURCES,
} from "../../acervo-data";

type TenderInput = {
  number?: string;
  modality?: string;
  title?: string;
  organ?: string;
  platform?: string;
  estimatedValue?: string;
  openingAt?: string;
  owner?: string;
  summary?: string;
  tenderType?: string;
  participationType?: string;
  participantOrganizationId?: string;
};

type TechnicalRecordInput = {
  company?: string;
  certificateNumber?: string;
  contractNumber?: string;
  issuer?: string;
  object?: string;
  serviceType?: string;
  mainServices?: string;
  characteristics?: string;
  quantitySummary?: string;
  technicalArea?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  catNumber?: string;
  documentReference?: string;
  keywords?: string;
  notes?: string;
};

type OrganizationInput = {
  name?: string;
  type?: string;
  taxId?: string;
  members?: string;
  notes?: string;
  consortiumMembers?: Array<{
    organizationId?: string;
    percentage?: string;
    isLeader?: boolean;
    technicalResponsibility?: string;
  }>;
};

type ProfessionalInput = {
  organizationId?: string;
  name?: string;
  professionalRole?: string;
  council?: string;
  registration?: string;
  specialty?: string;
  relationshipType?: string;
  formation?: string;
  degree?: string;
  institution?: string;
  graduationYear?: string;
  qualifications?: string;
  experienceAreas?: string;
  experienceSummary?: string;
};

type PncpItem = {
  numeroControlePNCP?: string;
  numeroCompra?: string;
  modalidadeNome?: string;
  objetoCompra?: string;
  informacaoComplementar?: string;
  dataEncerramentoProposta?: string;
  linkSistemaOrigem?: string;
  orgaoEntidade?: { razaoSocial?: string; razaosocial?: string };
  unidadeOrgao?: { municipioNome?: string; ufSigla?: string };
};

const ROUTING_TERMS = {
  "UFC Engenharia": [
    "projeto",
    "projetos",
    "assessoramento",
    "gerenciamento",
    "consultoria",
    "supervisao",
    "fiscalizacao",
    "estudo",
    "apoio tecnico",
  ],
  "Pórtico Construções": [
    "integrada",
    "manutencao",
    "execucao",
    "obra",
    "obras",
    "construcao",
    "reforma",
    "implantacao",
  ],
} as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tenderIdentityPart(value: unknown) {
  return normalize(String(value ?? ""))
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function tenderIdentity(value: {
  number?: unknown;
  modality?: unknown;
  title?: unknown;
  organ?: unknown;
}) {
  return [value.organ, value.number, value.modality, value.title]
    .map(tenderIdentityPart)
    .join("|");
}

type DuplicateTenderRow = Record<string, unknown> & {
  id: string;
  number: string;
  modality: string;
  title: string;
  organ: string;
  status: string;
  phase: string;
  progress: number;
  created_at: string;
  updated_at: string;
  asset_count?: number;
};

const TENDER_PHASE_RANK: Record<string, number> = {
  Triagem: 10,
  "Revisão editalícia": 20,
  "Preparação da proposta": 30,
  "Análise de habilitação": 35,
  "Conferência documental": 40,
  Impugnação: 45,
  Monitoramento: 50,
  "Acompanhamento de resultado": 70,
  "Fase recursal": 80,
  Encerrada: 100,
};

function advancedTenderRank(tender: DuplicateTenderRow) {
  if (tender.status === "Finalizada") return 1000;
  return TENDER_PHASE_RANK[tender.phase] ?? 0;
}

async function findExistingTender(
  candidate: TenderInput,
  excludeTenderId = "",
) {
  const db = getD1();
  const rows = await db
    .prepare(
      `SELECT t.*, o.name AS participant_organization_name
       FROM tenders t
       LEFT JOIN organizations o ON o.id = t.participant_organization_id
       WHERE t.deleted_at IS NULL`,
    )
    .all<Record<string, unknown>>();
  const identity = tenderIdentity(candidate);
  return rows.results.find(
    (row) => String(row.id) !== excludeTenderId && tenderIdentity(row) === identity,
  );
}

async function mergeDuplicateTender(
  canonical: DuplicateTenderRow,
  duplicate: DuplicateTenderRow,
) {
  const db = getD1();
  await db.batch([
    db.prepare(
      `DELETE FROM tender_document_links
       WHERE tender_id = ? AND EXISTS (
         SELECT 1 FROM tender_document_links canonical
         WHERE canonical.tender_id = ?
           AND canonical.document_id = tender_document_links.document_id
           AND canonical.section = tender_document_links.section
       )`,
    ).bind(duplicate.id, canonical.id),
    db.prepare(
      "UPDATE tender_document_links SET tender_id = ? WHERE tender_id = ?",
    ).bind(canonical.id, duplicate.id),
    db.prepare(
      `DELETE FROM tender_team
       WHERE tender_id = ? AND EXISTS (
         SELECT 1 FROM tender_team canonical
         WHERE canonical.tender_id = ?
           AND canonical.professional_id = tender_team.professional_id
       )`,
    ).bind(duplicate.id, canonical.id),
    db.prepare(
      "UPDATE tender_team SET tender_id = ? WHERE tender_id = ?",
    ).bind(canonical.id, duplicate.id),
    db.prepare(
      `DELETE FROM tender_archive_matches
       WHERE tender_id = ? AND EXISTS (
         SELECT 1 FROM tender_archive_matches canonical
         WHERE canonical.tender_id = ?
           AND canonical.technical_record_id = tender_archive_matches.technical_record_id
       )`,
    ).bind(duplicate.id, canonical.id),
    db.prepare(
      "UPDATE tender_archive_matches SET tender_id = ? WHERE tender_id = ?",
    ).bind(canonical.id, duplicate.id),
    db.prepare(
      `DELETE FROM tender_outcomes
       WHERE tender_id = ? AND EXISTS (
         SELECT 1 FROM tender_outcomes canonical WHERE canonical.tender_id = ?
       )`,
    ).bind(duplicate.id, canonical.id),
    db.prepare(
      "UPDATE tender_outcomes SET tender_id = ? WHERE tender_id = ?",
    ).bind(canonical.id, duplicate.id),
    db.prepare("UPDATE documents SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare("UPDATE tender_edital_versions SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare("UPDATE tender_import_analyses SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare("UPDATE tender_requirements SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare("UPDATE tender_followups SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare("UPDATE tender_reuse_analyses SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare("UPDATE resource_cases SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare("UPDATE opponent_documents SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare("UPDATE calendar_events SET tender_id = ? WHERE tender_id = ?")
      .bind(canonical.id, duplicate.id),
    db.prepare(
      `UPDATE tenders
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP,
           result_notes = CASE
             WHEN result_notes = '' THEN ?
             ELSE result_notes || char(10) || ?
           END
       WHERE id = ? AND deleted_at IS NULL`,
    ).bind(
      `Cadastro consolidado no processo ${canonical.id}.`,
      `Cadastro consolidado no processo ${canonical.id}.`,
      duplicate.id,
    ),
  ]);
}

async function consolidateExactTenderDuplicates(user: PortalUser) {
  const db = getD1();
  const result = await db
    .prepare(
      `SELECT t.*,
        ((SELECT COUNT(*) FROM documents d WHERE d.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_document_links l WHERE l.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_team team WHERE team.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_archive_matches matches WHERE matches.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_edital_versions versions WHERE versions.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_import_analyses analyses WHERE analyses.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_requirements requirements WHERE requirements.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_followups followups WHERE followups.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_outcomes outcomes WHERE outcomes.tender_id = t.id) +
         (SELECT COUNT(*) FROM tender_reuse_analyses reuse WHERE reuse.tender_id = t.id) +
         (SELECT COUNT(*) FROM resource_cases resources WHERE resources.tender_id = t.id) +
         (SELECT COUNT(*) FROM opponent_documents opponents WHERE opponents.tender_id = t.id) +
         (SELECT COUNT(*) FROM calendar_events events WHERE events.tender_id = t.id)) AS asset_count
       FROM tenders t
       WHERE t.deleted_at IS NULL`,
    )
    .all<DuplicateTenderRow>();
  const groups = new Map<string, DuplicateTenderRow[]>();
  for (const tender of result.results) {
    const identity = tenderIdentity(tender);
    if (!identity.replaceAll("|", "")) continue;
    groups.set(identity, [...(groups.get(identity) ?? []), tender]);
  }

  let consolidated = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const canonical = [...group].sort((a, b) => {
      const assetDifference = Number(b.asset_count ?? 0) - Number(a.asset_count ?? 0);
      if (assetDifference) return assetDifference;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })[0];
    const advanced = [...group].sort((a, b) => {
      const phaseDifference = advancedTenderRank(b) - advancedTenderRank(a);
      if (phaseDifference) return phaseDifference;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })[0];
    const longestSummary = [...group].sort(
      (a, b) => String(b.summary ?? "").length - String(a.summary ?? "").length,
    )[0];

    for (const duplicate of group) {
      if (duplicate.id === canonical.id) continue;
      await mergeDuplicateTender(canonical, duplicate);
      consolidated += 1;
    }
    await db
      .prepare(
        `UPDATE tenders SET
           status = ?, phase = ?, progress = ?, summary = ?,
           final_result = ?, winner = ?, result_notes = ?, finalized_at = ?,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(
        advanced.status,
        advanced.phase,
        Math.max(...group.map((tender) => Number(tender.progress ?? 0))),
        String(longestSummary.summary ?? ""),
        String(advanced.final_result ?? ""),
        String(advanced.winner ?? ""),
        String(advanced.result_notes ?? ""),
        advanced.finalized_at ?? null,
        canonical.id,
      )
      .run();
    await logAudit(
      user,
      "LICITACOES_DUPLICADAS_CONSOLIDADAS",
      "licitacao",
      canonical.id,
      `${canonical.modality} ${canonical.number}: ${group.length} cadastros idênticos consolidados em um único processo, com preservação dos documentos e vínculos.`,
    );
  }
  return consolidated;
}

function uniqueUsefulTerms(value: string) {
  const ignored = new Set([
    "para", "com", "dos", "das", "de", "da", "do", "em", "e", "a", "o",
    "servico", "servicos", "engenharia", "tecnico", "tecnica",
  ]);
  return Array.from(
    new Set(
      normalize(value)
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 3 && !ignored.has(term)),
    ),
  );
}

function routeOpportunity(text: string) {
  const normalized = normalize(text);
  const ranked = Object.entries(ROUTING_TERMS)
    .map(([company, terms]) => ({
      company,
      hits: terms.filter((term) => normalized.includes(term)),
    }))
    .sort((a, b) => b.hits.length - a.hits.length);
  return ranked[0]?.hits.length ? ranked[0] : null;
}

async function seedTechnicalRecords(user: PortalUser) {
  const db = getD1();
  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM technical_records")
    .first<{ total: number }>();
  if (Number(count?.total ?? 0) > 0) {
    await db
      .prepare(
        `UPDATE alert_rules
         SET cadence = ?, reminder_minutes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_email = ? AND event_type = ?`,
      )
      .bind("30, 15, 7, 5 e 2 dias antes", "43200,21600,10080,7200,2880", user.email, "Certidões")
      .run();
    return;
  }

  const rows = [
    [
      "acervo-demo-ufc-01",
      "UFC Engenharia",
      "DEMO-UFC-001",
      "",
      "Registro demonstrativo",
      "Elaboração e revisão de projetos de infraestrutura",
      "Elaboração de projetos",
      "Levantamentos, estudos, projetos básicos e executivos, orçamento e especificações",
      "Infraestrutura viária e urbana, com disciplinas complementares",
      "72,2 km de projetos lineares",
      "Infraestrutura",
      "Bahia",
      "",
      "",
      "",
      "Substituir pela referência da planilha oficial",
      "projetos,rodovias,infraestrutura,orçamento",
      "Registro demonstrativo — substituir pelos dados e documentos oficiais.",
      "Demonstrativo",
    ],
    [
      "acervo-demo-ufc-02",
      "UFC Engenharia",
      "DEMO-UFC-002",
      "",
      "Registro demonstrativo",
      "Gerenciamento e supervisão de sistemas de saneamento",
      "Gerenciamento",
      "Gerenciamento, supervisão, fiscalização e apoio técnico",
      "Sistemas de abastecimento de água e esgotamento sanitário",
      "3 sistemas em 5 municípios",
      "Saneamento",
      "Nordeste",
      "",
      "",
      "",
      "Substituir pela referência da planilha oficial",
      "gerenciamento,supervisão,saneamento,fiscalização",
      "Registro demonstrativo — substituir pelos dados e documentos oficiais.",
      "Demonstrativo",
    ],
    [
      "acervo-demo-portico-01",
      "Pórtico Construções",
      "DEMO-PORTICO-001",
      "",
      "Registro demonstrativo",
      "Execução e manutenção de infraestrutura predial",
      "Execução",
      "Execução de serviços civis, manutenção preventiva e corretiva",
      "Edificações administrativas e instalações complementares",
      "12 unidades atendidas durante 24 meses",
      "Edificações",
      "Bahia",
      "",
      "",
      "",
      "Substituir pela referência da planilha oficial",
      "execução,manutenção,edificações,reforma",
      "Registro demonstrativo — substituir pelos dados e documentos oficiais.",
      "Demonstrativo",
    ],
    [
      "acervo-demo-portico-02",
      "Pórtico Construções",
      "DEMO-PORTICO-002",
      "",
      "Registro demonstrativo",
      "Contratação integrada para implantação de infraestrutura",
      "Contratação integrada",
      "Projeto, fornecimento, implantação, testes e entrega do empreendimento",
      "Empreendimento integrado de infraestrutura",
      "1 empreendimento completo",
      "Infraestrutura",
      "Nordeste",
      "",
      "",
      "",
      "Substituir pela referência da planilha oficial",
      "integrada,implantação,execução,infraestrutura",
      "Registro demonstrativo — substituir pelos dados e documentos oficiais.",
      "Demonstrativo",
    ],
  ];
  await db.batch(
    rows.map((row) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO technical_records
          (id, company, certificate_number, contract_number, issuer, object,
           service_type, main_services, characteristics, quantity_summary,
           technical_area, location, start_date, end_date, cat_number,
           document_reference, keywords, notes, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(...row, user.email),
    ),
  );
}

async function seedOrganizations(user: PortalUser) {
  const db = getD1();
  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO organizations
        (id, name, type, tax_id, members, notes, status, created_by)
        VALUES ('org-ufc', 'UFC Engenharia', 'Empresa', '', '',
                'Cadastro inicial para organização documental.', 'Ativa', ?)`,
      )
      .bind(user.email),
    db
      .prepare(
        `INSERT OR IGNORE INTO organizations
        (id, name, type, tax_id, members, notes, status, created_by)
        VALUES ('org-portico', 'Pórtico Construções', 'Empresa', '', '',
                'Cadastro inicial para organização documental.', 'Ativa', ?)`,
      )
      .bind(user.email),
    db
      .prepare(
        `INSERT OR IGNORE INTO professionals
        (id, organization_id, name, professional_role, council, registration,
         specialty, status, created_by)
        VALUES ('prof-demo-ufc', 'org-ufc', 'Profissional UFC (demonstrativo)',
                'Coordenador de Projetos', 'CREA', '', 'Gerenciamento e projetos',
                'Demonstrativo', ?)`,
      )
      .bind(user.email),
    db
      .prepare(
        `INSERT OR IGNORE INTO professionals
        (id, organization_id, name, professional_role, council, registration,
         specialty, status, created_by)
        VALUES ('prof-demo-portico', 'org-portico',
                'Profissional Pórtico (demonstrativo)', 'Responsável técnico',
                'CREA', '', 'Execução e manutenção', 'Demonstrativo', ?)`,
      )
      .bind(user.email),
    db
      .prepare(
        `INSERT OR IGNORE INTO compliance_documents
        (id, organization_id, professional_id, name, document_type,
         document_number, object_key, content_type, size, issuer, issued_at,
         expires_at, no_expiry, notes, status, uploaded_by)
        VALUES ('doc-demo-ufc', 'org-ufc', NULL,
                'Certidão fiscal — exemplo demonstrativo.pdf',
                'Regularidade fiscal', '', '', 'application/pdf', 0,
                'Registro demonstrativo', date('now', '-30 days'),
                date('now', '+12 days'), 0,
                'Substituir pelo documento oficial.', 'Demonstrativo', ?)`,
      )
      .bind(user.email),
    db
      .prepare(
        `INSERT OR IGNORE INTO compliance_documents
        (id, organization_id, professional_id, name, document_type,
         document_number, object_key, content_type, size, issuer, issued_at,
         expires_at, no_expiry, notes, status, uploaded_by)
        VALUES ('doc-demo-portico', 'org-portico', NULL,
                'Certificado FGTS — exemplo demonstrativo.pdf',
                'Regularidade perante o FGTS', '', '', 'application/pdf', 0,
                'Registro demonstrativo', date('now', '-15 days'),
                date('now', '+45 days'), 0,
                'Substituir pelo documento oficial.', 'Demonstrativo', ?)`,
      )
      .bind(user.email),
  ]);
}

async function seedOfficialArchive(user: PortalUser) {
  const db = getD1();
  const sourceCounts = new Map<string, number>();
  for (const record of OFFICIAL_ARCHIVE_RECORDS) {
    sourceCounts.set(record.sourceId, (sourceCounts.get(record.sourceId) ?? 0) + 1);
  }

  await db.batch(
    OFFICIAL_ARCHIVE_SOURCES.map((source) =>
      db
        .prepare(
          `INSERT INTO archive_sources
          (id, organization_id, name, provider_type, source_url, source_file_id,
           source_format, status, record_count, last_modified_at, last_synced_at, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            provider_type = excluded.provider_type,
            source_url = excluded.source_url,
            source_file_id = excluded.source_file_id,
            source_format = excluded.source_format,
            status = excluded.status,
            record_count = excluded.record_count,
            last_modified_at = excluded.last_modified_at,
            notes = excluded.notes`,
        )
        .bind(
          source.id,
          source.organizationId,
          source.name,
          source.providerType,
          source.sourceUrl,
          source.sourceFileId,
          source.sourceFormat,
          source.status,
          sourceCounts.get(source.id) ?? 0,
          source.lastModifiedAt,
          source.notes,
        ),
    ),
  );

  const officialCount = await db
    .prepare("SELECT COUNT(*) AS total FROM technical_records WHERE status = 'Sincronizado'")
    .first<{ total: number }>();
  if (Number(officialCount?.total ?? 0) < OFFICIAL_ARCHIVE_RECORDS.length) {
    await db.batch(
      OFFICIAL_ARCHIVE_RECORDS.map((record) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO technical_records
            (id, company, certificate_number, contract_number, issuer, object,
             service_type, main_services, characteristics, quantity_summary,
             technical_area, location, start_date, end_date, cat_number,
             document_reference, keywords, notes, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            record.id,
            record.company,
            record.certificateNumber,
            record.contractNumber,
            record.issuer,
            record.object,
            record.serviceType,
            record.mainServices,
            record.characteristics,
            record.quantitySummary,
            record.technicalArea,
            record.location,
            record.catNumber,
            record.documentReference,
            record.keywords,
            record.notes,
            record.status,
            user.email,
          ),
      ),
    );
    await db
      .prepare("DELETE FROM technical_records WHERE id LIKE 'acervo-demo-%'")
      .run();
    await logAudit(
      user,
      "ACERVO_OFICIAL_IMPORTADO",
      "acervo_tecnico",
      "fontes-google",
      `${OFFICIAL_ARCHIVE_RECORDS.length} registros vinculados às planilhas da UFC e da Pórtico.`,
    );
  }
}

async function analyzeTenderAgainstArchive(tenderId: string, user: PortalUser) {
  const db = getD1();
  const tender = await db
    .prepare(
      `SELECT title, summary, tags,
              (SELECT routed_company FROM tender_import_analyses tia
               WHERE tia.tender_id = tenders.id
               ORDER BY datetime(tia.created_at) DESC LIMIT 1) AS routed_company
       FROM tenders WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    )
    .bind(tenderId)
    .first<{ title: string; summary: string; tags: string; routed_company?: string | null }>();
  if (!tender) throw new Error("Licitação não encontrada.");
  const requirements = await db
    .prepare("SELECT * FROM tender_requirements WHERE tender_id = ?")
    .bind(tenderId)
    .all<Record<string, unknown>>();
  const requirementRows = requirements.results as Record<string, unknown>[];
  const tenderText = `${tender.title} ${tender.summary} ${tender.tags} ${requirementRows
    .map((item) => item.description)
    .join(" ")}`;
  const tenderTerms = uniqueUsefulTerms(tenderText);
  const inferredRoute = routeOpportunity(tender.title);
  const routedCompany = ["UFC Engenharia", "Pórtico Construções"].includes(tender.routed_company ?? "")
    ? String(tender.routed_company)
    : tender.routed_company
      ? undefined
      : inferredRoute?.company;
  await db.prepare("DELETE FROM tender_archive_matches WHERE tender_id = ?").bind(tenderId).run();
  if (!routedCompany) {
    await logAudit(user, "ANALISE_ACERVO_BLOQUEADA", "licitacao", tenderId, "Natureza do objeto indeterminada; nenhum acervo foi consultado automaticamente.");
    return { matches: 0, requirementAssessments: [], skipped: true };
  }
  const records = await db
    .prepare("SELECT * FROM technical_records WHERE company = ?")
    .bind(routedCompany)
    .all<Record<string, unknown>>();
  const technicalRows = records.results as Record<string, unknown>[];
  const ranked = technicalRows
    .map((record) => {
      const corpus = [
        record.object,
        record.service_type,
        record.main_services,
        record.characteristics,
        record.quantity_summary,
        record.technical_area,
        record.keywords,
      ].join(" ");
      const corpusNormalized = normalize(corpus);
      const matches = tenderTerms
        .filter((term) => corpusNormalized.includes(term))
        .slice(0, 8);
      const score = Math.min(
        96,
        20 + matches.length * 12 + 10,
      );
      const assessment =
        score >= 75
          ? "Potencialmente atende — validar evidências"
          : score >= 50
            ? "Atende parcialmente"
            : score >= 38
              ? "Depende de validação"
              : "Baixa aderência";
      return { record, matches, score, assessment };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (ranked.length) {
    await db.batch(
      ranked.map(({ record, matches, score, assessment }) =>
        db
          .prepare(
            `INSERT INTO tender_archive_matches
            (id, tender_id, technical_record_id, score, matched_terms,
             assessment, notes, analyzed_by, analyzed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(tender_id, technical_record_id) DO UPDATE SET
              score = excluded.score,
              matched_terms = excluded.matched_terms,
              assessment = excluded.assessment,
              analyzed_by = excluded.analyzed_by,
              analyzed_at = CURRENT_TIMESTAMP`,
          )
          .bind(
            crypto.randomUUID(),
            tenderId,
            String(record.id),
            score,
            matches.join(","),
            assessment,
            "",
            user.email,
          ),
      ),
    );
  }

  const requirementAssessments = requirementRows.map((requirement) => {
    const requirementText = `${requirement.description} ${requirement.minimum_quantity} ${requirement.unit}`;
    const terms = uniqueUsefulTerms(requirementText);
    const professional = String(requirement.requirement_type) === "Profissional";
    if (professional) {
      return {
        id: String(requirement.id),
        status: "Depende de validação profissional",
        reference: `${String(requirement.evidence ?? "Fonte editalícia não registrada")} | Conferir formação, CAT, experiência, vínculo e função no cadastro de profissionais.`,
        score: 0,
        matchedTerms: [] as string[],
        quantityConfirmed: false,
      };
    }
    const minimum = Number(
      String(requirement.minimum_quantity ?? "").replace(/\./g, "").replace(",", "."),
    );
    const candidates = technicalRows.map((record) => {
        const corpus = [
          record.object,
          record.service_type,
          record.main_services,
          record.characteristics,
          record.quantity_summary,
          record.technical_area,
          record.keywords,
        ].join(" ");
        const normalizedCorpus = normalize(corpus);
        const matched = terms.filter((term) => normalizedCorpus.includes(term));
        const numbers = String(record.quantity_summary ?? "")
          .match(/\d[\d.,]*/g)
          ?.map((value) => Number(value.replace(/\./g, "").replace(",", ".")))
          .filter(Number.isFinite) ?? [];
        const quantityConfirmed =
          Number.isFinite(minimum) && minimum > 0 &&
          (!String(requirement.unit ?? "").trim() ||
            normalizedCorpus.includes(normalize(String(requirement.unit)))) &&
          numbers.some((value) => value >= minimum);
        const score = Math.min(100, matched.length * 18 + (quantityConfirmed ? 22 : 0));
        return { record, matched, quantityConfirmed, score };
      })
      .sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const hasMinimum = Number.isFinite(minimum) && minimum > 0;
    const status = !best || best.score < 36
      ? "Não identificado"
      : hasMinimum && !best.quantityConfirmed
        ? "Não atende quantitativo identificado"
        : best.score >= 72
          ? "Potencialmente atende — validar evidências"
        : "Atende parcialmente";
    const reference = best
      ? `${String(requirement.evidence ?? "Fonte editalícia não registrada")} | Acervo ${routedCompany}: ${best.record.cat_number || best.record.certificate_number} · quantitativo ${best.quantityConfirmed ? "potencialmente compatível" : "não comprovado"}`
      : `${String(requirement.evidence ?? "Fonte editalícia não registrada")} | Nenhum atestado correlato localizado no acervo ${routedCompany}`;
    return {
      id: String(requirement.id),
      status,
      reference,
      score: best?.score ?? 0,
      matchedTerms: best?.matched ?? [],
      quantityConfirmed: best?.quantityConfirmed ?? false,
    };
  });
  if (requirementAssessments.length) {
    await db.batch(
      requirementAssessments.map((item) =>
        db
          .prepare(
            `UPDATE tender_requirements SET status = ?, evidence = ? WHERE id = ?`,
          )
          .bind(item.status, item.reference, item.id),
      ),
    );
  }
  await logAudit(
    user,
    "ACERVO_ANALISADO",
    "licitacao",
    tenderId,
    `${ranked.length} atestado(s) do acervo exclusivo ${routedCompany} e ${requirementAssessments.length} exigência(s) comparados em análise preliminar sujeita à validação humana.`,
  );
  return { matches: ranked.length, requirementAssessments };
}

type ReuseTeamSuggestion = {
  professionalId: string;
  name: string;
  organization: string;
  proposedRole: string;
  specialty: string;
  council: string;
  registration: string;
  score: number;
  matchedRequirements: string[];
};

type ReuseArchiveSuggestion = {
  technicalRecordId: string;
  company: string;
  certificateNumber: string;
  catNumber: string;
  object: string;
  serviceType: string;
  quantitySummary: string;
  score: number;
  matchedTerms: string[];
};

type ReuseCandidate = {
  sourceTenderId: string;
  number: string;
  modality: string;
  title: string;
  tenderType: string;
  participant: string;
  outcome: string;
  overallScore: number;
  objectScore: number;
  matchedTerms: string[];
  documentCount: number;
  teamSuggestions: ReuseTeamSuggestion[];
  archiveSuggestions: ReuseArchiveSuggestion[];
};

async function analyzeTenderReuse(tenderId: string, user: PortalUser) {
  const db = getD1();
  const target = await db
    .prepare(
      `SELECT t.*,
              (SELECT routed_company FROM tender_import_analyses tia
               WHERE tia.tender_id = t.id
               ORDER BY datetime(tia.created_at) DESC LIMIT 1) AS routed_company
       FROM tenders t
       WHERE t.id = ? AND t.deleted_at IS NULL LIMIT 1`,
    )
    .bind(tenderId)
    .first<Record<string, unknown>>();
  if (!target) throw new Error("Licitação não encontrada.");

  const [requirementsResult, sourcesResult, teamsResult, archivesResult] = await Promise.all([
    db.prepare("SELECT * FROM tender_requirements WHERE tender_id = ?")
      .bind(tenderId)
      .all<Record<string, unknown>>(),
    db.prepare(
      `SELECT t.*, outcome.outcome, outcome.notes AS outcome_notes,
              outcome.reusable_items, organization.name AS participant_name,
              ((SELECT COUNT(*) FROM documents d WHERE d.tender_id = t.id) +
               (SELECT COUNT(*) FROM tender_document_links tdl WHERE tdl.tender_id = t.id)) AS document_count
       FROM tenders t
       LEFT JOIN tender_outcomes outcome ON outcome.tender_id = t.id
       LEFT JOIN organizations organization ON organization.id = t.participant_organization_id
       WHERE (t.status = 'Finalizada' OR t.phase = 'Acompanhamento de resultado')
         AND t.deleted_at IS NULL AND t.id <> ?`,
    ).bind(tenderId).all<Record<string, unknown>>(),
    db.prepare(
      `SELECT tt.tender_id, tt.professional_id, tt.proposed_role,
              p.name, p.specialty, p.council, p.registration, p.formation,
              p.qualifications, p.experience_areas, p.experience_summary,
              organization.name AS organization_name
       FROM tender_team tt
       JOIN professionals p ON p.id = tt.professional_id
       JOIN tenders t ON t.id = tt.tender_id
       LEFT JOIN organizations organization ON organization.id = p.organization_id
       WHERE (t.status = 'Finalizada' OR t.phase = 'Acompanhamento de resultado')
         AND t.deleted_at IS NULL`,
    ).all<Record<string, unknown>>(),
    db.prepare(
      `SELECT tam.tender_id, tam.technical_record_id, tam.score AS prior_score,
              tr.company, tr.certificate_number, tr.cat_number, tr.object,
              tr.service_type, tr.main_services, tr.characteristics,
              tr.quantity_summary, tr.technical_area, tr.keywords
       FROM tender_archive_matches tam
       JOIN technical_records tr ON tr.id = tam.technical_record_id
       JOIN tenders t ON t.id = tam.tender_id
       WHERE (t.status = 'Finalizada' OR t.phase = 'Acompanhamento de resultado')
         AND t.deleted_at IS NULL`,
    ).all<Record<string, unknown>>(),
  ]);

  const requirements = requirementsResult.results;
  const companyRequirements = requirements.filter((row) => row.requirement_type === "Empresa");
  const professionalRequirements = requirements.filter((row) => row.requirement_type === "Profissional");
  const targetCorpus = [
    target.title,
    target.summary,
    target.tags,
    target.tender_type,
    ...requirements.map((row) => `${row.description} ${row.minimum_quantity} ${row.unit}`),
  ].join(" ");
  const targetTerms = uniqueUsefulTerms(targetCorpus);
  const professionalTerms = uniqueUsefulTerms(
    professionalRequirements.map((row) => row.description).join(" "),
  );
  const routedCompany = ["UFC Engenharia", "Pórtico Construções"].includes(String(target.routed_company ?? ""))
    ? String(target.routed_company)
    : undefined;

  const teamsByTender = new Map<string, Record<string, unknown>[]>();
  for (const row of teamsResult.results) {
    const key = String(row.tender_id);
    teamsByTender.set(key, [...(teamsByTender.get(key) ?? []), row]);
  }
  const archivesByTender = new Map<string, Record<string, unknown>[]>();
  for (const row of archivesResult.results) {
    const key = String(row.tender_id);
    archivesByTender.set(key, [...(archivesByTender.get(key) ?? []), row]);
  }

  const candidates: ReuseCandidate[] = sourcesResult.results
    .map((source) => {
      const sourceId = String(source.id);
      const sourceTeam = teamsByTender.get(sourceId) ?? [];
      const sourceArchives = archivesByTender.get(sourceId) ?? [];
      const sourceCorpus = [
        source.title,
        source.summary,
        source.tags,
        source.tender_type,
        source.outcome_notes,
        source.reusable_items,
        ...sourceTeam.map((row) => `${row.proposed_role} ${row.specialty} ${row.experience_areas}`),
        ...sourceArchives.map((row) => `${row.object} ${row.service_type} ${row.main_services} ${row.characteristics}`),
      ].join(" ");
      const normalizedSource = normalize(sourceCorpus);
      const matchedTerms = targetTerms.filter((term) => normalizedSource.includes(term)).slice(0, 10);
      const sameType = normalize(String(source.tender_type ?? "")) === normalize(String(target.tender_type ?? ""));
      const objectScore = Math.min(98, 16 + matchedTerms.length * 9 + (sameType ? 18 : 0));

      const teamSuggestions: ReuseTeamSuggestion[] = sourceTeam
        .map((row) => {
          const corpus = normalize([
            row.proposed_role,
            row.specialty,
            row.formation,
            row.qualifications,
            row.experience_areas,
            row.experience_summary,
          ].join(" "));
          const comparisonTerms = professionalTerms.length ? professionalTerms : targetTerms;
          const hits = comparisonTerms.filter((term) => corpus.includes(term)).slice(0, 6);
          return {
            professionalId: String(row.professional_id),
            name: String(row.name),
            organization: String(row.organization_name ?? "Sem vínculo registrado"),
            proposedRole: String(row.proposed_role),
            specialty: String(row.specialty ?? "Não informada"),
            council: String(row.council ?? ""),
            registration: String(row.registration ?? ""),
            score: Math.min(94, 36 + hits.length * 11 + (professionalRequirements.length ? 8 : 0)),
            matchedRequirements: hits,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const archiveSuggestions: ReuseArchiveSuggestion[] = sourceArchives
        .filter((row) => !routedCompany || String(row.company) === routedCompany)
        .map((row) => {
          const corpus = normalize([
            row.object,
            row.service_type,
            row.main_services,
            row.characteristics,
            row.quantity_summary,
            row.technical_area,
            row.keywords,
          ].join(" "));
          const hits = targetTerms.filter((term) => corpus.includes(term)).slice(0, 8);
          const priorScore = Math.max(0, Math.min(100, Number(row.prior_score ?? 0)));
          return {
            technicalRecordId: String(row.technical_record_id),
            company: String(row.company),
            certificateNumber: String(row.certificate_number ?? ""),
            catNumber: String(row.cat_number ?? ""),
            object: String(row.object),
            serviceType: String(row.service_type ?? ""),
            quantitySummary: String(row.quantity_summary ?? ""),
            score: Math.min(96, 24 + hits.length * 9 + Math.round(priorScore * .18) + (companyRequirements.length ? 6 : 0)),
            matchedTerms: hits,
          };
        })
        .filter((item) => item.matchedTerms.length > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const bestTeam = teamSuggestions[0]?.score ?? 0;
      const bestArchive = archiveSuggestions[0]?.score ?? 0;
      const overallScore = Math.min(98, Math.round(objectScore * .62 + bestTeam * .16 + bestArchive * .22));
      return {
        sourceTenderId: sourceId,
        number: String(source.number),
        modality: String(source.modality),
        title: String(source.title),
        tenderType: String(source.tender_type ?? ""),
        participant: String(source.participant_name ?? "Participante não registrado"),
        outcome: String(source.outcome ?? "Em acompanhamento pós-disputa"),
        overallScore,
        objectScore,
        matchedTerms,
        documentCount: Number(source.document_count ?? 0),
        teamSuggestions,
        archiveSuggestions,
      };
    })
    .filter((candidate) => candidate.matchedTerms.length > 0 || candidate.teamSuggestions.length > 0 || candidate.archiveSuggestions.length > 0)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5);

  const gaps: string[] = [];
  if (!sourcesResult.results.length) gaps.push("Ainda não há licitações finalizadas ou em acompanhamento pós-disputa para comparação.");
  if (!requirements.length) gaps.push("As exigências técnicas desta licitação ainda não foram cadastradas; a comparação considerou principalmente o objeto.");
  if (!professionalRequirements.length) gaps.push("Nenhuma exigência profissional foi identificada para confrontar formação, experiência e função da equipe.");
  if (!companyRequirements.length) gaps.push("Nenhuma exigência operacional foi identificada para confrontar objeto, quantitativo e unidade dos atestados.");
  if (!routedCompany) gaps.push("O acervo empresarial não está confirmado; atestados foram omitidos até a definição exclusiva de UFC ou Pórtico.");
  if (candidates.length && !candidates.some((candidate) => candidate.teamSuggestions.length)) gaps.push("Nenhuma equipe de precedente apresentou aderência suficiente para sugestão automática.");
  if (candidates.length && !candidates.some((candidate) => candidate.archiveSuggestions.length)) gaps.push("Nenhum atestado anteriormente analisado apresentou aderência suficiente para reutilização.");

  const analysisId = crypto.randomUUID();
  const status = gaps.length ? "Concluída com ressalvas" : "Concluída";
  await db.prepare(
    `INSERT INTO tender_reuse_analyses
     (id, tender_id, status, method_version, candidate_count, candidates_json,
      gaps_json, activated_by, analyzed_at)
     VALUES (?, ?, ?, 'reuso-v1', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
  ).bind(
    analysisId,
    tenderId,
    status,
    candidates.length,
    JSON.stringify(candidates),
    JSON.stringify(gaps),
    user.email,
  ).run();
  await logAudit(
    user,
    "AGENTE_REUTILIZACAO_EXECUTADO",
    "licitacao",
    tenderId,
    `${candidates.length} precedente(s) comparado(s); ${candidates.reduce((total, candidate) => total + candidate.teamSuggestions.length, 0)} profissional(is) e ${candidates.reduce((total, candidate) => total + candidate.archiveSuggestions.length, 0)} atestado(s) sugeridos para conferência.`,
  );
  return { analysisId, status, candidates: candidates.length, gaps: gaps.length };
}

function technicalRecordRows(rows: Record<string, unknown>[]) {
  return rows.map((row) => ({
    id: row.id,
    company: row.company,
    certificateNumber: row.certificate_number,
    contractNumber: row.contract_number,
    issuer: row.issuer,
    object: row.object,
    serviceType: row.service_type,
    mainServices: row.main_services,
    characteristics: row.characteristics,
    quantitySummary: row.quantity_summary,
    technicalArea: row.technical_area,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    catNumber: row.cat_number,
    documentReference: row.document_reference,
    internalDocumentName: row.internal_document_name,
    internalDocumentType: row.internal_document_type,
    internalDocumentSize: row.internal_document_size,
    hasInternalDocument: Number(row.internal_document_size ?? 0) > 0,
    keywords: String(row.keywords ?? "").split(",").filter(Boolean),
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function syncPncp(user: PortalUser) {
  const db = getD1();
  const technicalResult = await db
    .prepare("SELECT * FROM technical_records")
    .all<Record<string, unknown>>();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 60);
  const dateFinal = horizon.toISOString().slice(0, 10).replace(/-/g, "");
  const modalities = [4, 5, 6];
  const responses: PncpItem[][] = [];
  let successfulRequests = 0;
  for (const code of modalities) {
    try {
      const url =
        `https://pncp.gov.br/api/consulta/v1/contratacoes/proposta` +
        `?dataFinal=${dateFinal}&codigoModalidadeContratacao=${code}` +
        `&pagina=1&tamanhoPagina=75`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        responses.push([]);
        continue;
      }
      const result = (await response.json()) as { data?: PncpItem[] };
      successfulRequests += 1;
      responses.push(result.data ?? []);
    } catch {
      responses.push([]);
    }
  }

  const recordsByCompany = new Map<string, string>();
  for (const record of technicalResult.results) {
    const company = String(record.company);
    const corpus = [
      record.object,
      record.main_services,
      record.characteristics,
      record.technical_area,
      record.keywords,
    ].join(" ");
    recordsByCompany.set(
      company,
      `${recordsByCompany.get(company) ?? ""} ${corpus}`,
    );
  }

  const matches = responses
    .flat()
    .map((item) => {
      const object = `${item.objetoCompra ?? ""} ${item.informacaoComplementar ?? ""}`;
      const route = routeOpportunity(object);
      if (!route || !item.numeroControlePNCP) return null;
      const archiveTerms = uniqueUsefulTerms(
        recordsByCompany.get(route.company) ?? "",
      );
      const normalizedObject = normalize(object);
      const matchedArchiveTerms = archiveTerms
        .filter((term) => normalizedObject.includes(term))
        .slice(0, 8);
      const matchedTerms = Array.from(
        new Set([...route.hits, ...matchedArchiveTerms]),
      );
      const score = Math.min(
        98,
        38 + route.hits.length * 9 + matchedArchiveTerms.length * 5,
      );
      return {
        item,
        company: route.company,
        score,
        matchedTerms,
      };
    })
    .filter((match): match is { item: PncpItem; company: "UFC Engenharia" | "Pórtico Construções"; score: number; matchedTerms: string[] } => {
      return match !== null && match !== undefined && match.score >= 47;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);

  if (matches.length) {
    await db.batch(
      matches.map(({ item, company, score, matchedTerms }) =>
        db
          .prepare(
            `INSERT INTO pncp_opportunities
            (id, pncp_control_number, purchase_number, modality, object, organ,
             location, opening_at, source_url, suggested_company, match_score,
             matched_terms, status, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Nova', CURRENT_TIMESTAMP)
            ON CONFLICT(pncp_control_number) DO UPDATE SET
              purchase_number = excluded.purchase_number,
              modality = excluded.modality,
              object = excluded.object,
              organ = excluded.organ,
              location = excluded.location,
              opening_at = excluded.opening_at,
              source_url = excluded.source_url,
              suggested_company = excluded.suggested_company,
              match_score = excluded.match_score,
              matched_terms = excluded.matched_terms,
              fetched_at = CURRENT_TIMESTAMP`,
          )
          .bind(
            crypto.randomUUID(),
            item.numeroControlePNCP,
            item.numeroCompra ?? "",
            item.modalidadeNome ?? "",
            item.objetoCompra ?? "",
            item.orgaoEntidade?.razaoSocial ??
              item.orgaoEntidade?.razaosocial ??
              "",
            [item.unidadeOrgao?.municipioNome, item.unidadeOrgao?.ufSigla]
              .filter(Boolean)
              .join(" / "),
            item.dataEncerramentoProposta ?? null,
            item.linkSistemaOrigem ??
              `https://pncp.gov.br/app/editais/${item.numeroControlePNCP}`,
            company,
            score,
            matchedTerms.join(","),
          ),
      ),
    );
  }
  await logAudit(
    user,
    "RADAR_PNCP_ATUALIZADO",
    "pncp",
    dateFinal,
    `${responses.flat().length} contratações examinadas; ${matches.length} aderências registradas.`,
  );
  return {
    examined: responses.flat().length,
    matches: matches.length,
    warning:
      successfulRequests === 0
        ? "O PNCP não respondeu à consulta agora. Tente novamente mais tarde."
        : undefined,
  };
}

async function seedTenders(user: PortalUser) {
  const db = getD1();
  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM tenders")
    .first<{ total: number }>();
  if (Number(count?.total ?? 0) > 0) return;

  const rows = [
    [
      "demo-001",
      "L-2026007",
      "Concorrência",
      "Gerenciamento e supervisão de sistemas de saneamento",
      "Secretaria de Infraestrutura Hídrica e Saneamento",
      "Portal institucional",
      "R$ 18,7 mi",
      "Atenção",
      "Preparação da proposta",
      "2026-07-29T09:30:00-03:00",
      "Alto",
      72,
      "Ana Paula Souza",
      "saneamento,engenharia",
      "Conferência final de equipe técnica, atestados e planilha orçamentária.",
    ],
    [
      "demo-002",
      "7004611636",
      "Pregão Eletrônico",
      "Serviços técnicos multidisciplinares de manutenção",
      "Empresa de Energia",
      "Portal de compras",
      "Sigiloso",
      "Em análise",
      "Análise de habilitação",
      "2026-08-03T14:00:00-03:00",
      "Médio",
      48,
      "Rodolpho Veras",
      "manutenção,energia",
      "Análise integrada do edital, Adendo D e critérios técnicos por família.",
    ],
    [
      "demo-003",
      "032/2026",
      "Concorrência",
      "Supervisão de obras rodoviárias — Lote 02",
      "Departamento Nacional de Infraestrutura",
      "Compras.gov.br",
      "R$ 42,3 mi",
      "Em dia",
      "Conferência documental",
      "2026-08-07T10:00:00-03:00",
      "Baixo",
      61,
      "Mariana Costa",
      "rodovias,supervisão",
      "Validação dos quantitativos mínimos e vínculo dos profissionais.",
    ],
    [
      "demo-004",
      "015/2026",
      "Concorrência",
      "Projetos executivos de infraestrutura urbana",
      "Prefeitura Municipal",
      "BLL Compras",
      "R$ 9,8 mi",
      "Atenção",
      "Impugnação",
      "2026-08-12T09:00:00-03:00",
      "Alto",
      35,
      "Equipe Jurídica",
      "projetos,impugnação",
      "Prazo de impugnação próximo; revisar exigências de qualificação técnica.",
    ],
    [
      "demo-005",
      "008/2026",
      "Pregão Eletrônico",
      "Apoio técnico ao gerenciamento de contratos",
      "Secretaria Estadual de Infraestrutura",
      "Licitações-e",
      "R$ 6,4 mi",
      "Em dia",
      "Monitoramento",
      "2026-08-18T11:00:00-03:00",
      "Médio",
      23,
      "Paulo Oliveira",
      "gerenciamento,contratos",
      "Aguardando esclarecimentos do órgão e confirmação da equipe mínima.",
    ],
  ];

  await db.batch(
    rows.map((row) =>
      db
        .prepare(
          `INSERT INTO tenders
          (id, number, modality, title, organ, platform, estimated_value, status,
           phase, opening_at, risk, progress, owner, tags, summary, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(...row, user.email),
    ),
  );
  await logAudit(
    user,
    "BASE_INICIAL",
    "portal",
    "seed",
    "Base demonstrativa de licitações criada.",
  );
}

function tenderRows(dbRows: Record<string, unknown>[]) {
  return dbRows.map((row) => ({
    id: String(row.id ?? ""),
    number: String(row.number ?? "Sem número"),
    modality: String(row.modality ?? "Modalidade não informada"),
    title: String(row.title ?? "Objeto não informado"),
    organ: String(row.organ ?? "Órgão não informado"),
    platform: String(row.platform ?? "Não informada"),
    estimatedValue: String(row.estimated_value ?? "Não informado"),
    status: String(row.status ?? "Em análise"),
    phase: String(row.phase ?? "Triagem"),
    openingAt: String(row.opening_at ?? ""),
    risk: String(row.risk ?? "Não informado"),
    progress: Number(row.progress ?? 0),
    owner: String(row.owner ?? "Responsável não definido"),
    tags: String(row.tags ?? "")
      .split(",")
      .filter(Boolean),
    summary: String(row.summary ?? ""),
    tenderType: row.tender_type,
    participationType: row.participation_type,
    participantOrganizationId: row.participant_organization_id,
    participantOrganizationName: row.participant_organization_name,
    finalResult: row.final_result,
    winner: row.winner,
    resultNotes: row.result_notes,
    finalizedAt: row.finalized_at,
    updatedAt: row.updated_at,
  }));
}

async function seedAlertRules(user: PortalUser) {
  const db = getD1();
  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM alert_rules WHERE user_email = ?")
    .bind(user.email)
    .first<{ total: number }>();
  if (Number(count?.total ?? 0) > 0) return;
  const defaults = [
    ["Sessão pública", "Sessão pública", "7 dias, 48h e 2h antes", "10080,2880,120"],
    ["Impugnação", "Impugnação", "5 dias e 24h antes", "7200,1440"],
    ["Certidões", "Certidões", "30, 15, 7, 5 e 2 dias antes", "43200,21600,10080,7200,2880"],
    ["Cadastro em plataformas", "Plataformas", "30, 15 e 7 dias antes", "43200,21600,10080"],
    ["Mudança no edital", "Mudança no edital", "Aviso imediato", "0"],
    ["Resultado / recurso", "Recurso", "24h, 2h e 30min antes", "1440,120,30"],
  ];
  await db.batch(
    defaults.map(([name, eventType, cadence, reminderMinutes]) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO alert_rules
          (id, user_email, event_type, name, cadence, reminder_minutes, active)
          VALUES (?, ?, ?, ?, ?, ?, 1)`,
        )
        .bind(
          crypto.randomUUID(),
          user.email,
          eventType,
          name,
          cadence,
          reminderMinutes,
        ),
    ),
  );
}

export async function GET(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    await seedTenders(user);
    await seedTechnicalRecords(user);
    await seedOrganizations(user);
    await seedOfficialArchive(user);
    await seedAlertRules(user);
    const db = getD1();
    const consolidatedDuplicates = await consolidateExactTenderDuplicates(user);
    const [
      tendersResult,
      documentsResult,
      usersResult,
      auditResult,
      technicalResult,
      opportunitiesResult,
      organizationsResult,
      complianceDocumentsResult,
      professionalsResult,
      tenderTeamResult,
      documentLinksResult,
      archiveMatchesResult,
      archiveSourcesResult,
      pncpDecisionsResult,
      permissionResult,
      consortiumMembersResult,
      platformRegistrationsResult,
      platformDocumentsResult,
      tenderEditalVersionsResult,
      tenderImportAnalysesResult,
      tenderRequirementsResult,
      tenderFollowupsResult,
      tenderOutcomesResult,
      tenderReuseAnalysesResult,
      resourceCasesResult,
      opponentDocumentsResult,
      calendarEventsResult,
      alertRulesResult,
    ] =
      await Promise.all([
        db
          .prepare(
            `SELECT t.*, o.name AS participant_organization_name
             FROM tenders t
             LEFT JOIN organizations o ON o.id = t.participant_organization_id
             WHERE t.deleted_at IS NULL
             ORDER BY datetime(t.opening_at) ASC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT id, tender_id, name, content_type, size, category,
                    analysis_status, uploaded_by, created_at
             FROM documents ORDER BY created_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
                    pc.username, pc.last_login_at,
                    COALESCE(p.enabled, 0) AS pncp_can_approve
             FROM users u
             LEFT JOIN portal_credentials pc ON pc.user_email = u.email
             LEFT JOIN pncp_operator_permissions p ON p.user_email = u.email
             ORDER BY u.created_at`,
          )
          .all<Record<string, unknown>>(),
        user.role === "Diretor"
          ? db
              .prepare(
                `SELECT * FROM audit_logs
                 ORDER BY created_at DESC LIMIT 40`,
              )
              .all<Record<string, unknown>>()
          : Promise.resolve({ results: [] as Record<string, unknown>[] }),
        db
          .prepare(
            `SELECT * FROM technical_records WHERE status <> 'Excluído'
             ORDER BY company, status, updated_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT * FROM pncp_opportunities
             ORDER BY match_score DESC, datetime(fetched_at) DESC LIMIT 30`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT o.*,
                    COUNT(DISTINCT cd.id) AS document_count,
                    COUNT(DISTINCT CASE WHEN p.status <> 'Excluído' THEN p.id END) AS professional_count
             FROM organizations o
             LEFT JOIN compliance_documents cd ON cd.organization_id = o.id
             LEFT JOIN professionals p ON p.organization_id = o.id
             GROUP BY o.id
             ORDER BY o.name`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT cd.*, o.name AS organization_name,
                    p.name AS professional_name
             FROM compliance_documents cd
             JOIN organizations o ON o.id = cd.organization_id
             LEFT JOIN professionals p ON p.id = cd.professional_id
             ORDER BY
               CASE WHEN cd.expires_at IS NULL THEN 1 ELSE 0 END,
               date(cd.expires_at) ASC, cd.created_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT p.*, o.name AS organization_name
             FROM professionals p
             LEFT JOIN organizations o ON o.id = p.organization_id
             WHERE p.status <> 'Excluído'
             ORDER BY p.name`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT tt.*, p.name AS professional_name,
                    p.council, p.registration, p.specialty,
                    o.name AS organization_name
             FROM tender_team tt
             JOIN professionals p ON p.id = tt.professional_id
             LEFT JOIN organizations o ON o.id = p.organization_id
             ORDER BY tt.created_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT tdl.*, cd.name AS document_name,
                    cd.document_type, cd.expires_at, cd.no_expiry, cd.size AS document_size,
                    cd.professional_id, o.name AS organization_name,
                    p.name AS professional_name
             FROM tender_document_links tdl
             JOIN compliance_documents cd ON cd.id = tdl.document_id
             JOIN organizations o ON o.id = cd.organization_id
             LEFT JOIN professionals p ON p.id = cd.professional_id
             ORDER BY tdl.created_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT tam.*, tr.company, tr.certificate_number,
                    tr.object, tr.service_type, tr.quantity_summary,
                    tr.main_services
             FROM tender_archive_matches tam
             JOIN technical_records tr ON tr.id = tam.technical_record_id
             ORDER BY tam.score DESC, tam.analyzed_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT a.*, o.name AS organization_name
             FROM archive_sources a
             JOIN organizations o ON o.id = a.organization_id
             ORDER BY o.name`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT * FROM pncp_decisions
             ORDER BY datetime(created_at) DESC LIMIT 120`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT enabled FROM pncp_operator_permissions
             WHERE user_email = ? LIMIT 1`,
          )
          .bind(user.email)
          .first<{ enabled: number }>(),
        db
          .prepare(
            `SELECT cm.*, member.name AS member_organization_name,
                    consortium.name AS consortium_name
             FROM consortium_members cm
             JOIN organizations member ON member.id = cm.member_organization_id
             JOIN organizations consortium ON consortium.id = cm.consortium_id
             ORDER BY consortium.name, cm.is_leader DESC, member.name`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT pr.*, o.name AS organization_name
             FROM platform_registrations pr
             JOIN organizations o ON o.id = pr.organization_id
             ORDER BY date(pr.expires_at) ASC, o.name, pr.platform_name`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT pd.*, o.name AS organization_name,
                    pr.platform_name
             FROM platform_documents pd
             JOIN organizations o ON o.id = pd.organization_id
             JOIN platform_registrations pr ON pr.id = pd.platform_registration_id
             ORDER BY COALESCE(date(pd.expires_at), '9999-12-31'), pd.created_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT id, tender_id, version_number, event_type, title,
                    publication_date, effective_date, description, process_effect,
                    status, name, content_type, size, extraction_summary,
                    uploaded_by, created_at
             FROM tender_edital_versions
             ORDER BY tender_id, version_number DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT * FROM tender_import_analyses
             ORDER BY tender_id, datetime(created_at) DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT * FROM tender_requirements
             ORDER BY tender_id, requirement_type, created_at`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT tf.*, t.number AS tender_number, t.title AS tender_title,
                    t.modality AS tender_modality
             FROM tender_followups tf
             JOIN tenders t ON t.id = tf.tender_id
             WHERE t.deleted_at IS NULL
             ORDER BY datetime(tf.due_at) ASC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT outcome.*, t.number AS tender_number, t.title AS tender_title,
                    t.modality AS tender_modality, t.tender_type,
                    o.name AS participant_organization_name
             FROM tender_outcomes outcome
             JOIN tenders t ON t.id = outcome.tender_id
             LEFT JOIN organizations o ON o.id = t.participant_organization_id
             ORDER BY date(outcome.decision_date) DESC, outcome.created_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT tra.*, u.name AS activated_by_name
             FROM tender_reuse_analyses tra
             LEFT JOIN users u ON u.email = tra.activated_by
             ORDER BY tra.tender_id, datetime(tra.analyzed_at) DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT rc.*, t.number AS tender_number, t.title AS tender_title,
                    t.modality AS tender_modality, t.organ AS tender_organ
             FROM resource_cases rc
             JOIN tenders t ON t.id = rc.tender_id
             WHERE t.deleted_at IS NULL
             ORDER BY datetime(rc.deadline) ASC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT id, resource_case_id, tender_id, competitor_name, name,
                    content_type, size, category, analysis_sector,
                    analysis_status, notes, uploaded_by, created_at
             FROM opponent_documents
             ORDER BY created_at DESC`,
          )
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT ce.*, t.number AS tender_number, t.title AS tender_title
             FROM calendar_events ce
             LEFT JOIN tenders t ON t.id = ce.tender_id
             WHERE ce.status <> 'Cancelado'
               AND (ce.visibility = 'Equipe' OR ce.owner_email = ?)
             ORDER BY datetime(ce.starts_at) ASC`,
          )
          .bind(user.email)
          .all<Record<string, unknown>>(),
        db
          .prepare(
            `SELECT * FROM alert_rules
             WHERE user_email = ? ORDER BY created_at ASC`,
          )
          .bind(user.email)
          .all<Record<string, unknown>>(),
      ]);

    return Response.json({
      user: {
        ...user,
        pncpCanApprove:
          user.role === "Diretor" ||
          user.role === "Coordenador" ||
          Number(permissionResult?.enabled ?? 0) === 1,
      },
      tenders: tenderRows(tendersResult.results),
      documents: documentsResult.results,
      users: usersResult.results,
      auditLogs: auditResult.results,
      technicalRecords: technicalRecordRows(technicalResult.results),
      pncpOpportunities: opportunitiesResult.results,
      organizations: organizationsResult.results,
      complianceDocuments: complianceDocumentsResult.results,
      professionals: professionalsResult.results,
      tenderTeam: tenderTeamResult.results,
      tenderDocumentLinks: documentLinksResult.results,
      archiveMatches: archiveMatchesResult.results,
      archiveSources: archiveSourcesResult.results,
      pncpDecisions: pncpDecisionsResult.results,
      consortiumMembers: consortiumMembersResult.results,
      platformRegistrations: platformRegistrationsResult.results,
      platformDocuments: platformDocumentsResult.results,
      tenderEditalVersions: tenderEditalVersionsResult.results,
      tenderImportAnalyses: tenderImportAnalysesResult.results,
      tenderRequirements: tenderRequirementsResult.results,
      tenderFollowups: tenderFollowupsResult.results,
      tenderOutcomes: tenderOutcomesResult.results,
      tenderReuseAnalyses: tenderReuseAnalysesResult.results,
      resourceCases: resourceCasesResult.results,
      opponentDocuments: opponentDocumentsResult.results,
      calendarEvents: calendarEventsResult.results,
      alertRules: alertRulesResult.results,
      consolidatedDuplicates,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o portal.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    const payload = (await request.json()) as {
      action?: string;
      tender?: TenderInput;
      requirements?: Array<{
        requirementType?: string;
        description?: string;
        minimumQuantity?: string;
        unit?: string;
        evidence?: string;
      }>;
      importAnalysis?: {
        analysisMode?: string;
        objectNature?: string;
        routedCompany?: string;
        routingReason?: string;
        recommendation?: string;
        sources?: unknown[];
        fieldEvidence?: Record<string, unknown>;
        missingDocuments?: string[];
        conflicts?: unknown[];
        criticalConditions?: unknown[];
        reviewStatus?: string;
      };
      importAnalysisId?: string;
      routingDecision?: {
        objectNature?: string;
        routedCompany?: string;
        routingReason?: string;
      };
      tenderId?: string;
      status?: string;
      reason?: string;
      authorizationCode?: string;
      invitedUser?: {
        name?: string;
        email?: string;
        role?: string;
        username?: string;
        password?: string;
      };
      updatedUser?: {
        name?: string;
        email?: string;
        role?: string;
        status?: string;
        username?: string;
        password?: string;
      };
      technicalRecord?: TechnicalRecordInput;
      technicalRecordId?: string;
      organization?: OrganizationInput;
      professional?: ProfessionalInput;
      documentId?: string;
      section?: string;
      requirement?: string;
      notes?: string;
      professionalId?: string;
      proposedRole?: string;
      opportunityId?: string;
      decision?: string;
      targetUserEmail?: string;
      enabled?: boolean;
      active?: boolean;
      alertRuleId?: string;
      calendarEvent?: {
        tenderId?: string;
        visibility?: string;
        eventType?: string;
        title?: string;
        description?: string;
        startsAt?: string;
        endsAt?: string;
        location?: string;
        responsible?: string;
        priority?: string;
        reminderMinutes?: string;
      };
      platformRegistration?: {
        id?: string;
        organizationId?: string;
        platformName?: string;
        registrationCode?: string;
        accessEmail?: string;
        expiresAt?: string;
        responsible?: string;
        reminderDays?: string;
        notes?: string;
        status?: string;
      };
      tenderRequirement?: {
        requirementType?: string;
        description?: string;
        minimumQuantity?: string;
        unit?: string;
        evidence?: string;
        status?: string;
      };
      tenderFollowup?: {
        followupType?: string;
        title?: string;
        dueAt?: string;
        responsible?: string;
        notes?: string;
      };
      tenderOutcome?: {
        outcome?: string;
        winner?: string;
        finalValue?: string;
        decisionDate?: string;
        notes?: string;
        reusableItems?: string;
      };
      reuseAnalysisId?: string;
      reuseSuggestion?: {
        sourceTenderId?: string;
        kind?: "Equipe" | "Atestado";
        assetId?: string;
      };
      resourceCase?: {
        resourceType?: string;
        position?: string;
        deadline?: string;
        responsible?: string;
        competitorName?: string;
        status?: string;
        summary?: string;
        legalGround?: string;
        nextAction?: string;
      };
      resourceCaseId?: string;
      opponentDocumentId?: string;
      analysisStatus?: string;
    };
    const db = getD1();

    if (payload.action === "createTender" || payload.action === "createTenderFromEdital") {
      const tender = payload.tender ?? {};
      const required = [
        tender.number,
        tender.modality,
        tender.title,
        tender.organ,
        tender.openingAt,
      ];
      if (required.some((value) => !String(value ?? "").trim())) {
        return Response.json(
          { error: "Preencha número, modalidade, objeto, órgão e data da sessão." },
          { status: 400 },
        );
      }
      const existingTender = await findExistingTender(tender);
      if (existingTender) {
        return Response.json(
          {
            error: `Esta licitação já está cadastrada como ${existingTender.modality} ${existingTender.number}. O processo existente foi aberto para evitar duplicidade.`,
            duplicate: true,
            existingTender: tenderRows([existingTender])[0],
          },
          { status: 409 },
        );
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO tenders
          (id, number, modality, title, organ, platform, estimated_value, status,
           phase, opening_at, risk, progress, owner, tags, summary, tender_type,
           participation_type, participant_organization_id, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Em análise', 'Triagem', ?, 'Médio', 10,
                  ?, '', ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          tender.number!.trim(),
          tender.modality!.trim(),
          tender.title!.trim(),
          tender.organ!.trim(),
          tender.platform?.trim() || "Portal do órgão",
          tender.estimatedValue?.trim() || "Não informado",
          tender.openingAt,
          tender.owner?.trim() || user.name,
          tender.summary?.trim() || "",
          tender.tenderType?.trim() || "Outros serviços de engenharia",
          tender.participationType?.trim() || "Empresa",
          tender.participantOrganizationId || null,
          user.email,
        )
        .run();
      const requirements = (payload.requirements ?? []).filter(
        (item) =>
          ["Empresa", "Profissional"].includes(item.requirementType ?? "") &&
          item.description?.trim(),
      );
      if (requirements.length) {
        await db.batch(
          requirements.map((requirement) =>
            db
              .prepare(
                `INSERT INTO tender_requirements
                (id, tender_id, requirement_type, description, minimum_quantity,
                 unit, evidence, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendente', ?)`,
              )
              .bind(
                crypto.randomUUID(),
                id,
                requirement.requirementType,
                requirement.description!.trim(),
                requirement.minimumQuantity?.trim() || "",
                requirement.unit?.trim() || "",
                requirement.evidence?.trim() || "Extraída do documento editalício",
                user.email,
              ),
          ),
        );
      }
      if (payload.action === "createTenderFromEdital") {
        const analysis = payload.importAnalysis ?? {};
        await db
          .prepare(
            `INSERT INTO tender_import_analyses
             (id, tender_id, analysis_mode, object_nature, routed_company,
              routing_reason, recommendation, sources_json, field_evidence_json,
              missing_documents_json, conflicts_json, critical_conditions_json,
              review_status, confirmed_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            id,
            analysis.analysisMode?.trim() || "Opção D – Indeterminado",
            analysis.objectNature?.trim() || "Não identificada",
            analysis.routedCompany?.trim() || "Indeterminado",
            analysis.routingReason?.trim() || "Roteamento depende de conferência.",
            analysis.recommendation?.trim() || "INDETERMINADO",
            JSON.stringify(analysis.sources ?? []),
            JSON.stringify(analysis.fieldEvidence ?? {}),
            JSON.stringify(analysis.missingDocuments ?? []),
            JSON.stringify(analysis.conflicts ?? []),
            JSON.stringify(analysis.criticalConditions ?? []),
            analysis.reviewStatus?.trim() || "Conferência humana registrada",
            user.email,
          )
          .run();
      }
      await logAudit(
        user,
        payload.action === "createTenderFromEdital"
          ? "LICITACAO_IMPORTADA_DO_EDITAL"
          : "LICITACAO_CRIADA",
        "licitacao",
        id,
        `${tender.modality} ${tender.number} cadastrada${requirements.length ? ` com ${requirements.length} exigência(s) para validação` : ""}.`,
      );
      return Response.json({ ok: true, id }, { status: 201 });
    }

    if (payload.action === "createResourceCase") {
      const resourceCase = payload.resourceCase ?? {};
      if (user.role === "Manutenção") {
        return Response.json(
          { error: "O perfil Manutenção não pode instruir processos recursais." },
          { status: 403 },
        );
      }
      if (
        !payload.tenderId ||
        !resourceCase.resourceType?.trim() ||
        !resourceCase.deadline ||
        !resourceCase.responsible?.trim()
      ) {
        return Response.json(
          { error: "Informe a licitação, o tipo, o prazo e o responsável." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      const followupId = crypto.randomUUID();
      await db.batch([
        db
          .prepare(
            `INSERT INTO resource_cases
            (id, tender_id, resource_type, position, deadline, responsible,
             competitor_name, status, summary, legal_ground, next_action, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            payload.tenderId,
            resourceCase.resourceType.trim(),
            resourceCase.position?.trim() || "A definir",
            resourceCase.deadline,
            resourceCase.responsible.trim(),
            resourceCase.competitorName?.trim() || "",
            resourceCase.status?.trim() || "Triagem",
            resourceCase.summary?.trim() || "",
            resourceCase.legalGround?.trim() || "",
            resourceCase.nextAction?.trim() || "",
            user.email,
          ),
        db
          .prepare(
            `INSERT INTO tender_followups
            (id, tender_id, followup_type, title, due_at, responsible,
             notes, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendente', ?)`,
          )
          .bind(
            followupId,
            payload.tenderId,
            resourceCase.resourceType.trim(),
            resourceCase.nextAction?.trim() || `Providenciar ${resourceCase.resourceType.trim()}`,
            resourceCase.deadline,
            resourceCase.responsible.trim(),
            resourceCase.summary?.trim() || "",
            user.email,
          ),
        db
          .prepare(
            `UPDATE tenders SET phase = 'Fase recursal', status = 'Atenção',
             updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`,
          )
          .bind(payload.tenderId),
      ]);
      await logAudit(
        user,
        "PROCESSO_RECURSAL_ABERTO",
        "recurso",
        id,
        `${resourceCase.resourceType.trim()} aberto com prazo ${resourceCase.deadline} e responsável ${resourceCase.responsible.trim()}.`,
      );
      return Response.json({ ok: true, id }, { status: 201 });
    }

    if (payload.action === "updateResourceCaseStatus") {
      if (!payload.resourceCaseId || !payload.status?.trim()) {
        return Response.json({ error: "Informe o processo e o novo status." }, { status: 400 });
      }
      if (user.role === "Manutenção") {
        return Response.json({ error: "Perfil sem permissão para alterar o mérito." }, { status: 403 });
      }
      await db
        .prepare(
          `UPDATE resource_cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .bind(payload.status.trim(), payload.resourceCaseId)
        .run();
      await logAudit(
        user,
        "PROCESSO_RECURSAL_ATUALIZADO",
        "recurso",
        payload.resourceCaseId,
        `Status alterado para ${payload.status.trim()}.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "updateTender") {
      const tender = payload.tender ?? {};
      if (!payload.tenderId) {
        return Response.json({ error: "Licitação não informada." }, { status: 400 });
      }
      const required = [
        tender.number,
        tender.modality,
        tender.title,
        tender.organ,
        tender.openingAt,
      ];
      if (required.some((value) => !String(value ?? "").trim())) {
        return Response.json(
          { error: "Preencha número, modalidade, objeto, órgão e data da sessão." },
          { status: 400 },
        );
      }
      const existingTender = await findExistingTender(tender, payload.tenderId);
      if (existingTender) {
        return Response.json(
          {
            error: `A alteração criaria uma duplicidade com ${existingTender.modality} ${existingTender.number}. Abra o cadastro existente e complemente o mesmo processo.`,
            duplicate: true,
            existingTender: tenderRows([existingTender])[0],
          },
          { status: 409 },
        );
      }
      await db
        .prepare(
          `UPDATE tenders SET
             number = ?, modality = ?, title = ?, organ = ?, platform = ?,
             estimated_value = ?, opening_at = ?, owner = ?, summary = ?,
             tender_type = ?, participation_type = ?, participant_organization_id = ?,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND deleted_at IS NULL`,
        )
        .bind(
          tender.number!.trim(),
          tender.modality!.trim(),
          tender.title!.trim(),
          tender.organ!.trim(),
          tender.platform?.trim() || "Portal do órgão",
          tender.estimatedValue?.trim() || "Não informado",
          tender.openingAt,
          tender.owner?.trim() || user.name,
          tender.summary?.trim() || "",
          tender.tenderType?.trim() || "Outros serviços de engenharia",
          tender.participationType?.trim() || "Empresa",
          tender.participantOrganizationId || null,
          payload.tenderId,
        )
        .run();
      await logAudit(
        user,
        "LICITACAO_EDITADA",
        "licitacao",
        payload.tenderId,
        `${tender.modality} ${tender.number} teve seus dados atualizados.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "confirmTenderRouting") {
      const decision = payload.routingDecision ?? {};
      if (!payload.importAnalysisId || !["UFC Engenharia", "Pórtico Construções"].includes(decision.routedCompany ?? "") || !decision.objectNature?.trim() || !decision.routingReason?.trim()) {
        return Response.json({ error: "Informe a natureza do objeto, a empresa e a justificativa do roteamento." }, { status: 400 });
      }
      if (user.role === "Manutenção") return Response.json({ error: "Perfil sem permissão para confirmar decisão de mérito." }, { status: 403 });
      const result = await db.prepare(
        `UPDATE tender_import_analyses SET object_nature = ?, routed_company = ?,
         routing_reason = ?, review_status = 'Roteamento confirmado após revisão humana',
         confirmed_by = ? WHERE id = ?`,
      ).bind(decision.objectNature.trim(), decision.routedCompany, decision.routingReason.trim(), user.email, payload.importAnalysisId).run();
      if (!Number(result.meta?.changes ?? 0)) return Response.json({ error: "Relatório de importação não encontrado." }, { status: 404 });
      await logAudit(user, "ROTEAMENTO_EMPRESARIAL_CONFIRMADO", "licitacao", payload.tenderId || payload.importAnalysisId, `${decision.objectNature.trim()} → ${decision.routedCompany}. ${decision.routingReason.trim()}`);
      return Response.json({ ok: true });
    }

    if (payload.action === "createOrganization") {
      const organization = payload.organization ?? {};
      const name = organization.name?.trim() ?? "";
      const type = organization.type?.trim() ?? "";
      if (!name || !["Empresa", "Consórcio"].includes(type)) {
        return Response.json(
          { error: "Informe o nome e escolha Empresa ou Consórcio." },
          { status: 400 },
        );
      }
      const consortiumMembers = organization.consortiumMembers ?? [];
      if (type === "Consórcio") {
        const total = consortiumMembers.reduce(
          (sum, member) => sum + Number(member.percentage ?? 0),
          0,
        );
        const leaders = consortiumMembers.filter((member) => member.isLeader).length;
        const uniqueMembers = new Set(
          consortiumMembers.map((member) => member.organizationId).filter(Boolean),
        );
        if (
          consortiumMembers.length < 2 ||
          uniqueMembers.size !== consortiumMembers.length ||
          Math.abs(total - 100) > 0.01 ||
          leaders !== 1 ||
          consortiumMembers.some(
            (member) =>
              !member.organizationId ||
              Number(member.percentage ?? 0) <= 0 ||
              !member.technicalResponsibility?.trim(),
          )
        ) {
          return Response.json(
            {
              error:
                "O consórcio precisa de ao menos duas empresas distintas, percentuais totalizando 100%, uma líder e a responsabilidade técnica de cada integrante.",
            },
            { status: 400 },
          );
        }
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO organizations
          (id, name, type, tax_id, members, notes, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, 'Ativa', ?)`,
        )
        .bind(
          id,
          name,
          type,
          organization.taxId?.trim() || "",
          organization.members?.trim() || "",
          organization.notes?.trim() || "",
          user.email,
        )
        .run();
      if (type === "Consórcio") {
        await db.batch(
          consortiumMembers.map((member) =>
            db
              .prepare(
                `INSERT INTO consortium_members
                (id, consortium_id, member_organization_id,
                 participation_percentage, is_leader, technical_responsibility)
                VALUES (?, ?, ?, ?, ?, ?)`,
              )
              .bind(
                crypto.randomUUID(),
                id,
                member.organizationId,
                member.percentage,
                member.isLeader ? 1 : 0,
                member.technicalResponsibility?.trim() || "",
              ),
          ),
        );
      }
      await logAudit(
        user,
        "ORGANIZACAO_CADASTRADA",
        "organizacao",
        id,
        `${type} ${name} incluída na base documental.`,
      );
      return Response.json({ ok: true, id }, { status: 201 });
    }

    if (payload.action === "createProfessional") {
      const professional = payload.professional ?? {};
      const name = professional.name?.trim() ?? "";
      const professionalRole = professional.professionalRole?.trim() ?? "";
      if (!name || !professionalRole) {
        return Response.json(
          { error: "Informe o nome e a função principal do profissional." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO professionals
          (id, organization_id, name, professional_role, council, registration,
           specialty, relationship_type, formation, degree, institution,
           graduation_year, qualifications, experience_areas,
           experience_summary, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', ?)`,
        )
        .bind(
          id,
          professional.organizationId || null,
          name,
          professionalRole,
          professional.council?.trim() || "",
          professional.registration?.trim() || "",
          professional.specialty?.trim() || "",
          professional.relationshipType?.trim() || "Próprio",
          professional.formation?.trim() || "",
          professional.degree?.trim() || "Graduação",
          professional.institution?.trim() || "",
          professional.graduationYear?.trim() || "",
          professional.qualifications?.trim() || "",
          professional.experienceAreas?.trim() || "",
          professional.experienceSummary?.trim() || "",
          user.email,
        )
        .run();
      await logAudit(
        user,
        "PROFISSIONAL_CADASTRADO",
        "profissional",
        id,
        `${name} incluído no banco de profissionais.`,
      );
      return Response.json({ ok: true, id }, { status: 201 });
    }

    if (payload.action === "updateProfessional") {
      if (user.role === "Manutenção") {
        return Response.json(
          { error: "O perfil de Manutenção não pode editar profissionais." },
          { status: 403 },
        );
      }
      const professional = payload.professional ?? {};
      const professionalId = payload.professionalId ?? "";
      const name = professional.name?.trim() ?? "";
      const professionalRole = professional.professionalRole?.trim() ?? "";
      if (!professionalId || !name || !professionalRole) {
        return Response.json(
          { error: "Informe o profissional, o nome e a função principal." },
          { status: 400 },
        );
      }
      const result = await db
        .prepare(
          `UPDATE professionals SET
             organization_id = ?, name = ?, professional_role = ?, council = ?,
             registration = ?, specialty = ?, relationship_type = ?, formation = ?,
             degree = ?, institution = ?, graduation_year = ?, qualifications = ?,
             experience_areas = ?, experience_summary = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status <> 'Excluído'`,
        )
        .bind(
          professional.organizationId || null,
          name,
          professionalRole,
          professional.council?.trim() || "",
          professional.registration?.trim() || "",
          professional.specialty?.trim() || "",
          professional.relationshipType?.trim() || "Próprio",
          professional.formation?.trim() || "",
          professional.degree?.trim() || "Graduação",
          professional.institution?.trim() || "",
          professional.graduationYear?.trim() || "",
          professional.qualifications?.trim() || "",
          professional.experienceAreas?.trim() || "",
          professional.experienceSummary?.trim() || "",
          professionalId,
        )
        .run();
      if (!Number(result.meta?.changes ?? 0)) {
        return Response.json({ error: "Profissional não encontrado." }, { status: 404 });
      }
      await logAudit(
        user,
        "PROFISSIONAL_EDITADO",
        "profissional",
        professionalId,
        `${name}: cadastro, formação e vínculo atualizados.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "setProfessionalStatus") {
      if (user.role === "Manutenção") {
        return Response.json(
          { error: "O perfil de Manutenção não pode retirar ou reativar profissionais." },
          { status: 403 },
        );
      }
      const professionalId = payload.professionalId ?? "";
      const status = payload.status === "Ativo" ? "Ativo" : "Inativo";
      const professional = await db
        .prepare("SELECT name FROM professionals WHERE id = ? AND status <> 'Excluído' LIMIT 1")
        .bind(professionalId)
        .first<{ name: string }>();
      if (!professional) {
        return Response.json({ error: "Profissional não encontrado." }, { status: 404 });
      }
      if (status === "Inativo") {
        await db.batch([
          db.prepare("UPDATE professionals SET status = 'Inativo', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(professionalId),
          db.prepare("UPDATE tender_team SET status = 'Retirado' WHERE professional_id = ? AND status <> 'Retirado'").bind(professionalId),
        ]);
      } else {
        await db
          .prepare("UPDATE professionals SET status = 'Ativo', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(professionalId)
          .run();
      }
      await logAudit(
        user,
        status === "Ativo" ? "PROFISSIONAL_REATIVADO" : "PROFISSIONAL_RETIRADO",
        "profissional",
        professionalId,
        `${professional.name}: status alterado para ${status}.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "deleteProfessional") {
      if (user.role !== "Diretor") {
        return Response.json(
          { error: "Somente a Diretoria pode excluir profissionais." },
          { status: 403 },
        );
      }
      const professionalId = payload.professionalId ?? "";
      const reason = payload.reason?.trim() ?? "";
      if (!reason) {
        return Response.json(
          { error: "Informe a justificativa da exclusão." },
          { status: 400 },
        );
      }
      const professional = await db
        .prepare("SELECT name FROM professionals WHERE id = ? AND status <> 'Excluído' LIMIT 1")
        .bind(professionalId)
        .first<{ name: string }>();
      if (!professional) {
        return Response.json({ error: "Profissional não encontrado." }, { status: 404 });
      }
      await db.batch([
        db.prepare("UPDATE professionals SET status = 'Excluído', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(professionalId),
        db.prepare("UPDATE tender_team SET status = 'Retirado' WHERE professional_id = ? AND status <> 'Retirado'").bind(professionalId),
      ]);
      await logAudit(
        user,
        "PROFISSIONAL_EXCLUIDO",
        "profissional",
        professionalId,
        `${professional.name} excluído do banco ativo. Justificativa: ${reason}`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "createPlatformRegistration") {
      const registration = payload.platformRegistration ?? {};
      if (
        !registration.organizationId ||
        !registration.platformName?.trim() ||
        !registration.expiresAt
      ) {
        return Response.json(
          { error: "Informe empresa, plataforma e data de validade do cadastro." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO platform_registrations
          (id, organization_id, platform_name, registration_code, access_email,
           expires_at, responsible, reminder_days, notes, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', ?)`,
        )
        .bind(
          id,
          registration.organizationId,
          registration.platformName.trim(),
          registration.registrationCode?.trim() || "",
          registration.accessEmail?.trim() || "",
          registration.expiresAt,
          registration.responsible?.trim() || user.name,
          registration.reminderDays?.trim() || "30,15,7",
          registration.notes?.trim() || "",
          user.email,
        )
        .run();
      await logAudit(
        user,
        "VALIDADE_PLATAFORMA_CADASTRADA",
        "plataforma",
        id,
        `${registration.platformName} com validade em ${registration.expiresAt}.`,
      );
      return Response.json({ ok: true, id }, { status: 201 });
    }

    if (payload.action === "updatePlatformRegistration") {
      const registration = payload.platformRegistration ?? {};
      if (user.role === "Manutenção") {
        return Response.json({ error: "Perfil sem permissão para editar credenciamentos." }, { status: 403 });
      }
      if (!registration.id || !registration.organizationId || !registration.platformName?.trim() || !registration.expiresAt) {
        return Response.json({ error: "Informe o cadastro, a empresa, a plataforma e a validade." }, { status: 400 });
      }
      const result = await db.prepare(
        `UPDATE platform_registrations SET
           organization_id = ?, platform_name = ?, registration_code = ?,
           access_email = ?, expires_at = ?, responsible = ?, reminder_days = ?,
           notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      ).bind(
        registration.organizationId,
        registration.platformName.trim(),
        registration.registrationCode?.trim() || "",
        registration.accessEmail?.trim() || "",
        registration.expiresAt,
        registration.responsible?.trim() || user.name,
        registration.reminderDays?.trim() || "30,15,7",
        registration.notes?.trim() || "",
        registration.status?.trim() || "Ativo",
        registration.id,
      ).run();
      if (!Number(result.meta?.changes ?? 0)) return Response.json({ error: "Cadastro não encontrado." }, { status: 404 });
      await logAudit(user, "VALIDADE_PLATAFORMA_ATUALIZADA", "plataforma", registration.id, `${registration.platformName.trim()} atualizado com validade em ${registration.expiresAt}.`);
      return Response.json({ ok: true });
    }

    if (payload.action === "updateOpponentDocumentAnalysis") {
      if (user.role === "Manutenção") return Response.json({ error: "Perfil sem permissão para registrar análise documental." }, { status: 403 });
      if (!payload.opponentDocumentId || !payload.analysisStatus?.trim()) {
        return Response.json({ error: "Informe o documento e o resultado da análise." }, { status: 400 });
      }
      const result = await db.prepare(
        `UPDATE opponent_documents SET analysis_status = ?, notes = CASE WHEN ? <> '' THEN ? ELSE notes END WHERE id = ?`,
      ).bind(payload.analysisStatus.trim(), payload.notes?.trim() || "", payload.notes?.trim() || "", payload.opponentDocumentId).run();
      if (!Number(result.meta?.changes ?? 0)) return Response.json({ error: "Documento não encontrado." }, { status: 404 });
      await logAudit(user, "DOCUMENTO_ADVERSARIO_ANALISADO", "documento_adversario", payload.opponentDocumentId, `Resultado: ${payload.analysisStatus.trim()}. ${payload.notes?.trim() || ""}`);
      return Response.json({ ok: true });
    }

    if (payload.action === "createCalendarEvent") {
      const event = payload.calendarEvent ?? {};
      const startsAt = new Date(event.startsAt ?? "");
      const endsAt = new Date(event.endsAt ?? "");
      if (
        !event.title?.trim() ||
        Number.isNaN(startsAt.getTime()) ||
        Number.isNaN(endsAt.getTime()) ||
        endsAt <= startsAt
      ) {
        return Response.json(
          { error: "Informe o título e um período válido para o compromisso." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO calendar_events
          (id, tender_id, owner_email, visibility, event_type, title,
           description, starts_at, ends_at, location, responsible, priority,
           reminder_minutes, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Agendado', ?)`,
        )
        .bind(
          id,
          event.tenderId || null,
          user.email,
          event.visibility === "Pessoal" ? "Pessoal" : "Equipe",
          event.eventType?.trim() || "Compromisso",
          event.title.trim(),
          event.description?.trim() || "",
          event.startsAt,
          event.endsAt,
          event.location?.trim() || "",
          event.responsible?.trim() || user.name,
          ["Alta", "Média", "Baixa"].includes(event.priority ?? "")
            ? event.priority
            : "Média",
          event.reminderMinutes?.trim() || "1440,120",
          user.email,
        )
        .run();
      await logAudit(
        user,
        "COMPROMISSO_AGENDADO",
        "agenda",
        id,
        `${event.title.trim()} agendado para ${event.startsAt}.`,
      );
      return Response.json({ ok: true, id }, { status: 201 });
    }

    if (payload.action === "updateAlertRule") {
      if (!payload.alertRuleId || typeof payload.active !== "boolean") {
        return Response.json(
          { error: "Informe a regra e o novo estado do alerta." },
          { status: 400 },
        );
      }
      const result = await db
        .prepare(
          `UPDATE alert_rules SET active = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_email = ?`,
        )
        .bind(payload.active ? 1 : 0, payload.alertRuleId, user.email)
        .run();
      if (!Number(result.meta?.changes ?? 0)) {
        return Response.json(
          { error: "Regra de alerta não encontrada para este usuário." },
          { status: 404 },
        );
      }
      await logAudit(
        user,
        "REGRA_DE_ALERTA_ATUALIZADA",
        "agenda",
        payload.alertRuleId,
        `Regra ${payload.active ? "ativada" : "desativada"} por ${user.name}.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "createTenderRequirement") {
      const requirement = payload.tenderRequirement ?? {};
      if (
        !payload.tenderId ||
        !["Empresa", "Profissional"].includes(requirement.requirementType ?? "") ||
        !requirement.description?.trim()
      ) {
        return Response.json(
          { error: "Informe a licitação, o tipo da exigência e sua descrição." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO tender_requirements
          (id, tender_id, requirement_type, description, minimum_quantity,
           unit, evidence, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          payload.tenderId,
          requirement.requirementType,
          requirement.description.trim(),
          requirement.minimumQuantity?.trim() || "",
          requirement.unit?.trim() || "",
          requirement.evidence?.trim() || "",
          requirement.status?.trim() || "Pendente",
          user.email,
        )
        .run();
      await logAudit(
        user,
        "EXIGENCIA_TECNICA_CADASTRADA",
        "licitacao",
        payload.tenderId,
        `Exigência da ${String(requirement.requirementType).toLowerCase()}: ${requirement.description.trim()}`,
      );
      return Response.json({ ok: true, id }, { status: 201 });
    }

    if (payload.action === "createTenderFollowup") {
      const followup = payload.tenderFollowup ?? {};
      if (user.role === "Manutenção") {
        return Response.json(
          { error: "O perfil Manutenção não pode movimentar licitações para o pós-disputa." },
          { status: 403 },
        );
      }
      if (
        !payload.tenderId ||
        !followup.followupType?.trim() ||
        !followup.title?.trim() ||
        !followup.dueAt
      ) {
        return Response.json(
          { error: "Informe licitação, tipo, atividade e prazo do acompanhamento." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      const followupType = followup.followupType.trim();
      const recursalTypes = new Set([
        "Intenção recursal",
        "Razões recursais",
        "Recurso",
        "Contrarrazões",
        "Julgamento de recurso",
      ]);
      const isRecursal = recursalTypes.has(followupType);
      const resourceCaseId = isRecursal ? crypto.randomUUID() : "";
      const statements = [
        db
          .prepare(
            `INSERT INTO tender_followups
            (id, tender_id, followup_type, title, due_at, responsible,
             notes, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendente', ?)`,
          )
          .bind(
            id,
            payload.tenderId,
            followupType,
            followup.title.trim(),
            followup.dueAt,
            followup.responsible?.trim() || user.name,
            followup.notes?.trim() || "",
            user.email,
          ),
        ...(isRecursal
          ? [
              db
                .prepare(
                  `INSERT INTO resource_cases
                   (id, tender_id, resource_type, position, deadline, responsible,
                    competitor_name, status, summary, legal_ground, next_action, created_by)
                   VALUES (?, ?, ?, ?, ?, ?, '', 'Triagem', ?, '', ?, ?)`,
                )
                .bind(
                  resourceCaseId,
                  payload.tenderId,
                  followupType,
                  followupType === "Contrarrazões"
                    ? "Recorrida"
                    : followupType === "Julgamento de recurso"
                      ? "Interessada"
                      : "Recorrente",
                  followup.dueAt,
                  followup.responsible?.trim() || user.name,
                  followup.notes?.trim() || "",
                  followup.title.trim(),
                  user.email,
                ),
            ]
          : []),
        db
          .prepare(
            `UPDATE tenders SET phase = ?, status = 'Atenção',
             updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          )
          .bind(
            isRecursal ? "Fase recursal" : "Acompanhamento de resultado",
            payload.tenderId,
          ),
      ];
      await db.batch(statements);
      await logAudit(
        user,
        isRecursal
          ? "PROCESSO_RECURSAL_ENCAMINHADO"
          : "ACOMPANHAMENTO_CADASTRADO",
        isRecursal ? "recurso" : "licitacao",
        isRecursal ? resourceCaseId : payload.tenderId,
        `Processo encaminhado para ${isRecursal ? "Recursos & prazos" : "Acompanhamento de resultado"}. ${followupType}: ${followup.title.trim()} — prazo ${followup.dueAt}.`,
      );
      return Response.json(
        {
          ok: true,
          id,
          tenderId: payload.tenderId,
          moved: true,
          resourceCaseId: resourceCaseId || undefined,
        },
        { status: 201 },
      );
    }

    if (payload.action === "finalizeTender") {
      const outcome = payload.tenderOutcome ?? {};
      if (!payload.tenderId || !outcome.outcome?.trim()) {
        return Response.json(
          { error: "Informe a licitação e o resultado final." },
          { status: 400 },
        );
      }
      if (!["Coordenador", "Diretor"].includes(user.role)) {
        return Response.json(
          { error: "Somente Coordenação ou Diretoria pode finalizar uma licitação." },
          { status: 403 },
        );
      }
      const id = crypto.randomUUID();
      await db.batch([
        db
          .prepare(
            `INSERT INTO tender_outcomes
            (id, tender_id, outcome, winner, final_value, decision_date,
             notes, reusable_items, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(tender_id) DO UPDATE SET
              outcome = excluded.outcome,
              winner = excluded.winner,
              final_value = excluded.final_value,
              decision_date = excluded.decision_date,
              notes = excluded.notes,
              reusable_items = excluded.reusable_items,
              created_by = excluded.created_by`,
          )
          .bind(
            id,
            payload.tenderId,
            outcome.outcome.trim(),
            outcome.winner?.trim() || "",
            outcome.finalValue?.trim() || "",
            outcome.decisionDate || null,
            outcome.notes?.trim() || "",
            outcome.reusableItems?.trim() || "",
            user.email,
          ),
        db
          .prepare(
            `UPDATE tenders SET status = 'Finalizada', phase = 'Encerrada',
             final_result = ?, winner = ?, result_notes = ?,
             finalized_at = CURRENT_TIMESTAMP, progress = 100,
             updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          )
          .bind(
            outcome.outcome.trim(),
            outcome.winner?.trim() || "",
            outcome.notes?.trim() || "",
            payload.tenderId,
          ),
      ]);
      await logAudit(
        user,
        "LICITACAO_FINALIZADA",
        "licitacao",
        payload.tenderId,
        `${outcome.outcome.trim()}${outcome.winner ? ` — vencedor: ${outcome.winner}` : ""}.`,
      );
      return Response.json({ ok: true, id });
    }

    if (payload.action === "analyzeTender") {
      if (!payload.tenderId) {
        return Response.json({ error: "Licitação não informada." }, { status: 400 });
      }
      const result = await analyzeTenderAgainstArchive(payload.tenderId, user);
      return Response.json({ ok: true, ...result });
    }

    if (payload.action === "runReuseAnalysis") {
      if (!payload.tenderId) {
        return Response.json({ error: "Licitação não informada." }, { status: 400 });
      }
      if (user.role === "Manutenção") {
        return Response.json(
          { error: "O perfil de Manutenção não executa análises licitatórias." },
          { status: 403 },
        );
      }
      const result = await analyzeTenderReuse(payload.tenderId, user);
      return Response.json({ ok: true, ...result });
    }

    if (payload.action === "applyReuseSuggestion") {
      const suggestion = payload.reuseSuggestion ?? {};
      if (!payload.tenderId || !payload.reuseAnalysisId || !suggestion.sourceTenderId || !suggestion.kind || !suggestion.assetId) {
        return Response.json(
          { error: "Sugestão de reutilização incompleta." },
          { status: 400 },
        );
      }
      if (user.role === "Manutenção") {
        return Response.json(
          { error: "O perfil de Manutenção não pode aplicar sugestões licitatórias." },
          { status: 403 },
        );
      }
      const analysis = await db.prepare(
        `SELECT candidates_json FROM tender_reuse_analyses
         WHERE id = ? AND tender_id = ? LIMIT 1`,
      ).bind(payload.reuseAnalysisId, payload.tenderId).first<{ candidates_json: string }>();
      if (!analysis) {
        return Response.json({ error: "Análise de reutilização não localizada." }, { status: 404 });
      }
      let candidates: ReuseCandidate[] = [];
      try {
        candidates = JSON.parse(analysis.candidates_json) as ReuseCandidate[];
      } catch {
        return Response.json({ error: "O relatório de reutilização está inválido; execute novamente o agente." }, { status: 409 });
      }
      const candidate = candidates.find((item) => item.sourceTenderId === suggestion.sourceTenderId);
      if (!candidate) {
        return Response.json({ error: "O precedente selecionado não pertence a esta análise." }, { status: 400 });
      }

      if (suggestion.kind === "Equipe") {
        const teamSuggestion = candidate.teamSuggestions.find((item) => item.professionalId === suggestion.assetId);
        if (!teamSuggestion) {
          return Response.json({ error: "Profissional não recomendado nesta análise." }, { status: 400 });
        }
        const sourceMember = await db.prepare(
          `SELECT proposed_role FROM tender_team
           WHERE tender_id = ? AND professional_id = ? LIMIT 1`,
        ).bind(suggestion.sourceTenderId, suggestion.assetId).first<{ proposed_role: string }>();
        if (!sourceMember) {
          return Response.json({ error: "Vínculo do profissional com o precedente não localizado." }, { status: 404 });
        }
        await db.prepare(
          `INSERT INTO tender_team
           (id, tender_id, professional_id, proposed_role, status, notes, assigned_by)
           VALUES (?, ?, ?, ?, 'Sugerido pelo agente', ?, ?)
           ON CONFLICT(tender_id, professional_id) DO UPDATE SET
             proposed_role = excluded.proposed_role,
             status = excluded.status,
             notes = excluded.notes,
             assigned_by = excluded.assigned_by`,
        ).bind(
          crypto.randomUUID(),
          payload.tenderId,
          suggestion.assetId,
          sourceMember.proposed_role,
          `Reutilização sugerida a partir da licitação ${candidate.number}; validar exigência, vínculo e documentação vigente.`,
          user.email,
        ).run();
        await logAudit(user, "EQUIPE_REUTILIZADA", "licitacao", payload.tenderId, `${teamSuggestion.name} reaproveitado(a) da licitação ${candidate.number}, sujeito(a) à conferência documental.`);
        return Response.json({ ok: true, kind: "Equipe" });
      }

      const archiveSuggestion = candidate.archiveSuggestions.find((item) => item.technicalRecordId === suggestion.assetId);
      if (!archiveSuggestion) {
        return Response.json({ error: "Atestado não recomendado nesta análise." }, { status: 400 });
      }
      const sourceMatch = await db.prepare(
        `SELECT id FROM tender_archive_matches
         WHERE tender_id = ? AND technical_record_id = ? LIMIT 1`,
      ).bind(suggestion.sourceTenderId, suggestion.assetId).first<{ id: string }>();
      if (!sourceMatch) {
        return Response.json({ error: "Vínculo do atestado com o precedente não localizado." }, { status: 404 });
      }
      await db.prepare(
        `INSERT INTO tender_archive_matches
         (id, tender_id, technical_record_id, score, matched_terms,
          assessment, notes, analyzed_by, analyzed_at)
         VALUES (?, ?, ?, ?, ?, 'Selecionado para reutilização — validar edital', ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(tender_id, technical_record_id) DO UPDATE SET
           score = excluded.score,
           matched_terms = excluded.matched_terms,
           assessment = excluded.assessment,
           notes = excluded.notes,
           analyzed_by = excluded.analyzed_by,
           analyzed_at = CURRENT_TIMESTAMP`,
      ).bind(
        crypto.randomUUID(),
        payload.tenderId,
        suggestion.assetId,
        archiveSuggestion.score,
        archiveSuggestion.matchedTerms.join(","),
        `Reutilização sugerida a partir da licitação ${candidate.number}; reconferir objeto, quantitativo, unidade, CAT e regra de somatório.`,
        user.email,
      ).run();
      await logAudit(user, "ATESTADO_REUTILIZADO", "licitacao", payload.tenderId, `${archiveSuggestion.certificateNumber || archiveSuggestion.catNumber} reaproveitado da licitação ${candidate.number}, sujeito à conferência editalícia.`);
      return Response.json({ ok: true, kind: "Atestado" });
    }

    if (payload.action === "linkComplianceDocument") {
      if (!payload.tenderId || !payload.documentId || !payload.section) {
        return Response.json(
          { error: "Selecione a licitação, o documento e o bloco de atendimento." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO tender_document_links
          (id, tender_id, document_id, section, requirement, status, notes, linked_by)
          VALUES (?, ?, ?, ?, ?, 'Selecionado', ?, ?)
          ON CONFLICT(tender_id, document_id, section) DO UPDATE SET
            requirement = excluded.requirement,
            notes = excluded.notes,
            linked_by = excluded.linked_by`,
        )
        .bind(
          id,
          payload.tenderId,
          payload.documentId,
          payload.section,
          payload.requirement?.trim() || "",
          payload.notes?.trim() || "",
          user.email,
        )
        .run();
      await logAudit(
        user,
        "DOCUMENTO_VINCULADO",
        "licitacao",
        payload.tenderId,
        `Documento de habilitação vinculado ao bloco ${payload.section}.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "assignProfessional") {
      if (!payload.tenderId || !payload.professionalId || !payload.proposedRole?.trim()) {
        return Response.json(
          { error: "Selecione o profissional e informe a função na proposta." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO tender_team
          (id, tender_id, professional_id, proposed_role, status, notes, assigned_by)
          VALUES (?, ?, ?, ?, 'Indicado', ?, ?)
          ON CONFLICT(tender_id, professional_id) DO UPDATE SET
            proposed_role = excluded.proposed_role,
            notes = excluded.notes,
            assigned_by = excluded.assigned_by`,
        )
        .bind(
          id,
          payload.tenderId,
          payload.professionalId,
          payload.proposedRole.trim(),
          payload.notes?.trim() || "",
          user.email,
        )
        .run();
      await logAudit(
        user,
        "PROFISSIONAL_INDICADO",
        "licitacao",
        payload.tenderId,
        `Profissional indicado para ${payload.proposedRole.trim()}.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "updateTechnicalRecord") {
      if (user.role === "Manutenção") {
        return Response.json({ error: "O perfil Manutenção não pode alterar o mérito do acervo." }, { status: 403 });
      }
      const record = payload.technicalRecord ?? {};
      if (!payload.technicalRecordId || !record.company?.trim() || !record.certificateNumber?.trim() || !record.issuer?.trim() || !record.object?.trim() || !record.serviceType?.trim() || !record.mainServices?.trim() || !record.quantitySummary?.trim()) {
        return Response.json({ error: "Preencha empresa, atestado, emitente, objeto, tipo, serviços e quantitativos." }, { status: 400 });
      }
      const result = await db.prepare(
        `UPDATE technical_records SET company = ?, certificate_number = ?, contract_number = ?,
         issuer = ?, object = ?, service_type = ?, main_services = ?, characteristics = ?,
         quantity_summary = ?, technical_area = ?, location = ?, start_date = ?, end_date = ?,
         cat_number = ?, document_reference = ?, keywords = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status <> 'Excluído'`,
      ).bind(
        record.company.trim(), record.certificateNumber.trim(), record.contractNumber?.trim() || "",
        record.issuer.trim(), record.object.trim(), record.serviceType.trim(), record.mainServices.trim(),
        record.characteristics?.trim() || "", record.quantitySummary.trim(), record.technicalArea?.trim() || "Engenharia",
        record.location?.trim() || "", record.startDate || null, record.endDate || null,
        record.catNumber?.trim() || "", record.documentReference?.trim() || "", record.keywords?.trim() || "",
        record.notes?.trim() || "", payload.technicalRecordId,
      ).run();
      if (!Number(result.meta?.changes ?? 0)) return Response.json({ error: "Registro de acervo não encontrado." }, { status: 404 });
      await logAudit(user, "ACERVO_RETIFICADO", "acervo_tecnico", payload.technicalRecordId, `${record.certificateNumber.trim()} retificado por ${user.name}.`);
      return Response.json({ ok: true });
    }

    if (payload.action === "deleteTechnicalRecord") {
      if (user.role !== "Diretor") {
        return Response.json({ error: "Somente a Diretoria pode excluir registros do acervo." }, { status: 403 });
      }
      if (!payload.technicalRecordId || !payload.reason?.trim()) {
        return Response.json({ error: "Informe o registro e a justificativa da exclusão." }, { status: 400 });
      }
      const result = await db.prepare("UPDATE technical_records SET status = 'Excluído', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status <> 'Excluído'").bind(payload.technicalRecordId).run();
      if (!Number(result.meta?.changes ?? 0)) return Response.json({ error: "Registro de acervo não encontrado." }, { status: 404 });
      await logAudit(user, "ACERVO_EXCLUIDO", "acervo_tecnico", payload.technicalRecordId, payload.reason.trim());
      return Response.json({ ok: true });
    }

    if (payload.action === "createTechnicalRecord") {
      const record = payload.technicalRecord ?? {};
      const company = record.company?.trim() ?? "";
      const required = [
        company,
        record.certificateNumber,
        record.issuer,
        record.object,
        record.serviceType,
        record.mainServices,
        record.quantitySummary,
      ];
      const organizationExists = company
        ? await db
            .prepare("SELECT id FROM organizations WHERE name = ? LIMIT 1")
            .bind(company)
            .first<{ id: string }>()
        : null;
      if (!organizationExists || required.some((value) => !String(value ?? "").trim())) {
        return Response.json(
          { error: "Preencha empresa, atestado, emitente, objeto, tipo, serviços e quantitativos." },
          { status: 400 },
        );
      }
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO technical_records
          (id, company, certificate_number, contract_number, issuer, object,
           service_type, main_services, characteristics, quantity_summary,
           technical_area, location, start_date, end_date, cat_number,
           document_reference, keywords, notes, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', ?)`,
        )
        .bind(
          id,
          company,
          record.certificateNumber!.trim(),
          record.contractNumber?.trim() || "",
          record.issuer!.trim(),
          record.object!.trim(),
          record.serviceType!.trim(),
          record.mainServices!.trim(),
          record.characteristics?.trim() || "",
          record.quantitySummary!.trim(),
          record.technicalArea?.trim() || "Engenharia",
          record.location?.trim() || "",
          record.startDate || null,
          record.endDate || null,
          record.catNumber?.trim() || "",
          record.documentReference?.trim() || "",
          record.keywords?.trim() || "",
          record.notes?.trim() || "",
          user.email,
        )
        .run();
      await logAudit(
        user,
        "ACERVO_CADASTRADO",
        "acervo_tecnico",
        id,
        `${record.certificateNumber} cadastrado para ${company}.`,
      );
      return Response.json({ ok: true, id }, { status: 201 });
    }

    if (payload.action === "syncPncp") {
      const result = await syncPncp(user);
      return Response.json({ ok: true, ...result });
    }

    if (payload.action === "setPncpOperatorPermission") {
      if (user.role !== "Diretor") {
        return Response.json(
          { error: "Somente a Diretoria pode liberar decisões do PNCP para operadores." },
          { status: 403 },
        );
      }
      const email = payload.targetUserEmail?.trim().toLowerCase() ?? "";
      const target = await db
        .prepare("SELECT name, role FROM users WHERE email = ? LIMIT 1")
        .bind(email)
        .first<{ name: string; role: string }>();
      if (!target || target.role !== "Operador") {
        return Response.json(
          { error: "Selecione um usuário com perfil Operador." },
          { status: 400 },
        );
      }
      await db
        .prepare(
          `INSERT INTO pncp_operator_permissions
          (id, user_email, enabled, granted_by, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_email) DO UPDATE SET
            enabled = excluded.enabled,
            granted_by = excluded.granted_by,
            updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(crypto.randomUUID(), email, payload.enabled === false ? 0 : 1, user.email)
        .run();
      await logAudit(
        user,
        payload.enabled === false ? "PERMISSAO_PNCP_REVOGADA" : "PERMISSAO_PNCP_CONCEDIDA",
        "usuario",
        email,
        `${target.name}: decisão de triagem PNCP ${payload.enabled === false ? "revogada" : "liberada"}.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "decidePncp") {
      const opportunityId = payload.opportunityId?.trim() ?? "";
      const decision = payload.decision?.trim() ?? "";
      const reason = payload.reason?.trim() ?? "";
      if (!opportunityId || !decision || !reason) {
        return Response.json(
          { error: "Informe a decisão e registre uma justificativa." },
          { status: 400 },
        );
      }
      const permissions: Record<string, string[]> = {
        Operador: ["Recomendar aprovação", "Recomendar negativa"],
        Coordenador: ["Aprovar para Diretoria", "Negar tecnicamente"],
        Diretor: ["Aprovar participação", "Negar participação"],
      };
      if (!permissions[user.role]?.includes(decision)) {
        return Response.json(
          { error: "Esta decisão não está disponível para o seu perfil." },
          { status: 403 },
        );
      }
      if (user.role === "Operador") {
        const permission = await db
          .prepare(
            `SELECT enabled FROM pncp_operator_permissions
             WHERE user_email = ? LIMIT 1`,
          )
          .bind(user.email)
          .first<{ enabled: number }>();
        if (Number(permission?.enabled ?? 0) !== 1) {
          return Response.json(
            { error: "A Diretoria ainda não liberou sua participação na triagem do PNCP." },
            { status: 403 },
          );
        }
      }
      const opportunity = await db
        .prepare("SELECT status FROM pncp_opportunities WHERE id = ? LIMIT 1")
        .bind(opportunityId)
        .first<{ status: string }>();
      if (!opportunity) {
        return Response.json({ error: "Oportunidade não encontrada." }, { status: 404 });
      }
      if (["Aprovada pela Diretoria", "Negada pela Diretoria"].includes(opportunity.status)) {
        return Response.json(
          { error: "A Diretoria já concluiu esta decisão." },
          { status: 409 },
        );
      }
      const nextStatus: Record<string, string> = {
        "Recomendar aprovação": "Recomendada pelo Operador",
        "Recomendar negativa": "Não recomendada pelo Operador",
        "Aprovar para Diretoria": "Aguardando Diretoria",
        "Negar tecnicamente": "Negada pela Coordenação",
        "Aprovar participação": "Aprovada pela Diretoria",
        "Negar participação": "Negada pela Diretoria",
      };
      await db.batch([
        db
          .prepare(
            `INSERT INTO pncp_decisions
            (id, opportunity_id, actor_email, actor_name, actor_role, decision,
             reason, previous_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            opportunityId,
            user.email,
            user.name,
            user.role,
            decision,
            reason,
            opportunity.status,
          ),
        db
          .prepare(
            `UPDATE pncp_opportunities SET status = ? WHERE id = ?`,
          )
          .bind(nextStatus[decision], opportunityId),
      ]);
      await logAudit(
        user,
        "DECISAO_PNCP_REGISTRADA",
        "pncp",
        opportunityId,
        `${decision}: ${reason}`,
      );
      return Response.json({ ok: true, status: nextStatus[decision] });
    }

    if (payload.action === "updateStatus") {
      if (!["Coordenador", "Diretor"].includes(user.role)) {
        return Response.json(
          { error: "Apenas Coordenação ou Diretoria pode alterar o status." },
          { status: 403 },
        );
      }
      if (!payload.tenderId || !payload.status) {
        return Response.json({ error: "Dados incompletos." }, { status: 400 });
      }
      await db
        .prepare(
          "UPDATE tenders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
        )
        .bind(payload.status, payload.tenderId)
        .run();
      await logAudit(
        user,
        "STATUS_ALTERADO",
        "licitacao",
        payload.tenderId,
        `Status atualizado para ${payload.status}.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "generateDeleteCode") {
      if (user.role !== "Diretor") {
        return Response.json(
          { error: "Somente a Diretoria pode gerar autorizações." },
          { status: 403 },
        );
      }
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000)
        .padStart(6, "0");
      const codeHash = await sha256(code);
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO delete_authorizations
          (id, code_hash, created_by, expires_at)
          VALUES (?, ?, ?, datetime('now', '+30 minutes'))`,
        )
        .bind(id, codeHash, user.email)
        .run();
      await logAudit(
        user,
        "CODIGO_EXCLUSAO_GERADO",
        "autorizacao",
        id,
        "Código de uso único gerado com validade de 30 minutos.",
      );
      return Response.json({ code, expiresInMinutes: 30 });
    }

    if (payload.action === "inviteUser") {
      if (!['Diretor', 'Manutenção'].includes(user.role)) {
        return Response.json(
          { error: "Somente a Diretoria ou a Manutenção Master pode criar usuários." },
          { status: 403 },
        );
      }
      const invited = payload.invitedUser ?? {};
      const email = invited.email?.trim().toLowerCase() ?? "";
      const name = invited.name?.trim() ?? "";
      const role = invited.role ?? "";
      const username = invited.username?.trim().toLowerCase() ?? "";
      const password = invited.password ?? "";
      if (
        !name ||
        !email.includes("@") ||
        username.length < 4 ||
        password.length < 8 ||
        !["Operador", "Coordenador", "Diretor", "Manutenção"].includes(role)
      ) {
        return Response.json(
          { error: "Informe nome, e-mail, login com ao menos 4 caracteres, senha com 8 caracteres e perfil." },
          { status: 400 },
        );
      }
      await createPortalCredentialUser({
        name,
        email,
        username,
        password,
        role: role as PortalUser["role"],
        createdBy: user.email,
      });
      await logAudit(
        user,
        "USUARIO_CRIADO",
        "usuario",
        email,
        `${name} foi cadastrado com o perfil ${role} e login ${username}.`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "updatePortalUser") {
      if (user.role !== "Diretor") {
        return Response.json(
          { error: "Somente a Diretoria pode editar usuários do portal." },
          { status: 403 },
        );
      }
      const targetEmail = payload.targetUserEmail?.trim().toLowerCase() ?? "";
      const updated = payload.updatedUser ?? {};
      const name = updated.name?.trim() ?? "";
      const email = updated.email?.trim().toLowerCase() ?? "";
      const username = updated.username?.trim().toLowerCase() ?? "";
      const role = updated.role ?? "";
      const status = updated.status ?? "";
      const password = updated.password ?? "";
      const validRoles = ["Operador", "Coordenador", "Diretor", "Manutenção"];
      const validStatuses = ["Ativo", "Inativo"];
      if (
        !targetEmail || !name || !email.includes("@") ||
        !validRoles.includes(role) || !validStatuses.includes(status) ||
        (username && username.length < 4) || (password && password.length < 8)
      ) {
        return Response.json(
          { error: "Confira nome, e-mail, login, perfil, situação e a nova senha informados." },
          { status: 400 },
        );
      }
      const target = await db
        .prepare(`SELECT u.id, u.email, u.name, u.role, u.status, pc.username,
                         CASE WHEN pc.id IS NULL THEN 0 ELSE 1 END AS has_credential
                  FROM users u
                  LEFT JOIN portal_credentials pc ON pc.user_email = u.email
                  WHERE lower(u.email) = ? LIMIT 1`)
        .bind(targetEmail)
        .first<Record<string, unknown>>();
      if (!target || target.status === "Excluído") {
        return Response.json({ error: "Usuário não localizado." }, { status: 404 });
      }
      const editingSelf = targetEmail === user.email.toLowerCase();
      if (
        editingSelf &&
        (email !== targetEmail || role !== user.role || status !== "Ativo")
      ) {
        return Response.json(
          { error: "Para proteger a sessão atual, altere somente seu nome, login ou senha. Outro Diretor deve modificar seu e-mail, perfil ou situação." },
          { status: 400 },
        );
      }
      if (target.role === "Diretor" && (role !== "Diretor" || status !== "Ativo")) {
        const otherDirectors = await db
          .prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'Diretor' AND status = 'Ativo' AND lower(email) <> ?")
          .bind(targetEmail)
          .first<{ total: number }>();
        if (Number(otherDirectors?.total ?? 0) === 0) {
          return Response.json(
            { error: "É necessário manter ao menos um Diretor ativo no portal." },
            { status: 400 },
          );
        }
      }
      const conflictingEmail = await db
        .prepare("SELECT id FROM users WHERE lower(email) = ? AND lower(email) <> ? LIMIT 1")
        .bind(email, targetEmail)
        .first<{ id: string }>();
      if (conflictingEmail) {
        return Response.json({ error: "Este e-mail já está vinculado a outro usuário." }, { status: 409 });
      }
      const effectiveUsername = username || String(target.username ?? "");
      if (effectiveUsername) {
        const conflictingUsername = await db
          .prepare("SELECT id FROM portal_credentials WHERE lower(username) = ? AND lower(user_email) <> ? LIMIT 1")
          .bind(effectiveUsername, targetEmail)
          .first<{ id: string }>();
        if (conflictingUsername) {
          return Response.json({ error: "Este login já está em uso." }, { status: 409 });
        }
      }
      const hasCredential = Number(target.has_credential ?? 0) === 1;
      if (!hasCredential && Boolean(effectiveUsername) !== Boolean(password)) {
        return Response.json(
          { error: "Para criar o acesso interno deste usuário, informe login e nova senha juntos." },
          { status: 400 },
        );
      }

      const statements = [
        db.prepare(`UPDATE users
                    SET name = ?, email = ?, role = ?, status = ?
                    WHERE lower(email) = ?`)
          .bind(name, email, role, status, targetEmail),
      ];
      if (hasCredential && password) {
        const salt = crypto.randomUUID();
        statements.push(
          db.prepare(`UPDATE portal_credentials
                      SET user_email = ?, username = ?, password_hash = ?, password_salt = ?,
                          must_change_password = 1, failed_attempts = 0, locked_until = NULL,
                          updated_at = CURRENT_TIMESTAMP
                      WHERE lower(user_email) = ?`)
            .bind(email, effectiveUsername, await sha256(`${salt}:${password}`), salt, targetEmail),
        );
      } else if (hasCredential) {
        statements.push(
          db.prepare(`UPDATE portal_credentials
                      SET user_email = ?, username = ?, updated_at = CURRENT_TIMESTAMP
                      WHERE lower(user_email) = ?`)
            .bind(email, effectiveUsername, targetEmail),
        );
      } else if (effectiveUsername && password) {
        const salt = crypto.randomUUID();
        statements.push(
          db.prepare(`INSERT INTO portal_credentials
                      (id, user_email, username, password_hash, password_salt,
                       must_change_password, created_by)
                      VALUES (?, ?, ?, ?, ?, 1, ?)`)
            .bind(
              crypto.randomUUID(), email, effectiveUsername,
              await sha256(`${salt}:${password}`), salt, user.email,
            ),
        );
      }
      if (email !== targetEmail) {
        statements.push(
          db.prepare("UPDATE pncp_operator_permissions SET user_email = ? WHERE lower(user_email) = ?").bind(email, targetEmail),
          db.prepare("UPDATE alert_rules SET user_email = ? WHERE lower(user_email) = ?").bind(email, targetEmail),
        );
      }
      if (role !== "Operador") {
        statements.push(
          db.prepare("DELETE FROM pncp_operator_permissions WHERE lower(user_email) IN (?, ?)").bind(targetEmail, email),
        );
      }
      if (
        status !== "Ativo" || email !== targetEmail || role !== target.role ||
        Boolean(password)
      ) {
        statements.push(
          db.prepare("DELETE FROM portal_sessions WHERE lower(user_email) IN (?, ?)").bind(targetEmail, email),
        );
      }
      await db.batch(statements);
      await logAudit(
        user,
        "USUARIO_EDITADO",
        "usuario",
        String(target.id),
        `${String(target.name)} (${targetEmail}) foi atualizado para ${name} (${email}), perfil ${role}, situação ${status}${password ? ", com redefinição de senha" : ""}.`,
      );
      return Response.json({ ok: true, email });
    }

    if (payload.action === "deletePortalUser") {
      if (user.role !== "Diretor") {
        return Response.json(
          { error: "Somente a Diretoria pode excluir usuários do portal." },
          { status: 403 },
        );
      }
      const targetEmail = payload.targetUserEmail?.trim().toLowerCase() ?? "";
      const reason = payload.reason?.trim() ?? "";
      if (!targetEmail || !reason) {
        return Response.json(
          { error: "Selecione o usuário e informe a justificativa da exclusão." },
          { status: 400 },
        );
      }
      if (targetEmail === user.email.toLowerCase()) {
        return Response.json(
          { error: "O Diretor não pode excluir o próprio acesso durante a sessão." },
          { status: 400 },
        );
      }
      const target = await db
        .prepare("SELECT id, name, email, role, status FROM users WHERE lower(email) = ? LIMIT 1")
        .bind(targetEmail)
        .first<Record<string, unknown>>();
      if (!target || target.status === "Excluído") {
        return Response.json({ error: "Usuário não localizado." }, { status: 404 });
      }
      if (target.role === "Diretor") {
        const otherDirectors = await db
          .prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'Diretor' AND status = 'Ativo' AND lower(email) <> ?")
          .bind(targetEmail)
          .first<{ total: number }>();
        if (Number(otherDirectors?.total ?? 0) === 0) {
          return Response.json(
            { error: "É necessário manter ao menos um Diretor ativo no portal." },
            { status: 400 },
          );
        }
      }
      await db.batch([
        db.prepare("UPDATE users SET status = 'Excluído' WHERE lower(email) = ?").bind(targetEmail),
        db.prepare("DELETE FROM portal_credentials WHERE lower(user_email) = ?").bind(targetEmail),
        db.prepare("DELETE FROM portal_sessions WHERE lower(user_email) = ?").bind(targetEmail),
        db.prepare("DELETE FROM pncp_operator_permissions WHERE lower(user_email) = ?").bind(targetEmail),
        db.prepare("DELETE FROM alert_rules WHERE lower(user_email) = ?").bind(targetEmail),
      ]);
      await logAudit(
        user,
        "USUARIO_EXCLUIDO",
        "usuario",
        String(target.id),
        `${String(target.name)} (${targetEmail}) teve o acesso excluído. Justificativa: ${reason}`,
      );
      return Response.json({ ok: true });
    }

    if (payload.action === "deleteTender") {
      if (!payload.tenderId || !payload.reason?.trim()) {
        return Response.json(
          { error: "Informe a licitação e a justificativa da exclusão." },
          { status: 400 },
        );
      }
      let delegatedBy: string | null = null;
      if (user.role !== "Diretor") {
        if (!payload.authorizationCode) {
          return Response.json(
            { error: "Informe o código de autorização da Diretoria." },
            { status: 403 },
          );
        }
        const codeHash = await sha256(payload.authorizationCode);
        const authorization = await db
          .prepare(
            `SELECT id, created_by FROM delete_authorizations
             WHERE code_hash = ? AND used_at IS NULL
               AND datetime(expires_at) > datetime('now')
             LIMIT 1`,
          )
          .bind(codeHash)
          .first<{ id: string; created_by: string }>();
        if (!authorization) {
          return Response.json(
            { error: "Código inválido, expirado ou já utilizado." },
            { status: 403 },
          );
        }
        delegatedBy = authorization.created_by;
        await db
          .prepare(
            "UPDATE delete_authorizations SET used_at = CURRENT_TIMESTAMP, used_by = ? WHERE id = ?",
          )
          .bind(user.email, authorization.id)
          .run();
      }
      await db
        .prepare(
          "UPDATE tenders SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .bind(payload.tenderId)
        .run();
      await logAudit(
        user,
        delegatedBy ? "LICITACAO_EXCLUIDA_DELEGADA" : "LICITACAO_EXCLUIDA",
        "licitacao",
        payload.tenderId,
        `${payload.reason.trim()}${delegatedBy ? ` Autorizada por ${delegatedBy}.` : ""}`,
      );
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Ação não reconhecida." }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a ação.",
      },
      { status: 500 },
    );
  }
}
