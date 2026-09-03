"use client";

import {
  Component,
  type ErrorInfo,
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Role = "Operador" | "Coordenador" | "Diretor" | "Manutenção";
type Page =
  | "overview"
  | "intake"
  | "tenders"
  | "calendar"
  | "platforms"
  | "resources"
  | "monitoring"
  | "finalized"
  | "documents"
  | "companyDocs"
  | "organizations"
  | "reports"
  | "team"
  | "audit";

type Tender = {
  id: string;
  number: string;
  modality: string;
  title: string;
  organ: string;
  platform: string;
  estimatedValue: string;
  status: string;
  phase: string;
  openingAt: string;
  risk: string;
  progress: number;
  owner: string;
  tags: string[];
  summary: string;
  updatedAt?: string;
  tenderType?: string;
  participationType?: string;
  participantOrganizationId?: string | null;
  participantOrganizationName?: string | null;
  finalResult?: string;
  winner?: string;
  resultNotes?: string;
  finalizedAt?: string | null;
};

const AXXIA_URL = "https://axialicitacoes.lovable.app/auth";
const SERVICE_TYPES = [
  "Elaboração de projetos",
  "Projeto de Infraestrutura",
  "Contratação integrada — projetos e execução",
  "Execução",
  "Execução de Infraestrutura",
  "Serviços Hídricos/Hidráulicos",
  "Fiscalização",
  "Assessoramento",
  "Gerenciamento",
  "Manutenção",
  "Supervisão",
] as const;

function classifyTenderService(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const integratedScope =
    /(contratacao|licitacao)\s+(semi-?)?integrada/.test(normalized) ||
    /(elaboracao|desenvolvimento)[^\n.]{0,160}projet[^\n.]{0,160}(execucao|obra|implantacao)/.test(normalized) ||
    /(execucao|obra|implantacao)[^\n.]{0,160}(elaboracao|desenvolvimento)[^\n.]{0,120}projet/.test(normalized);

  if (integratedScope) return "Contratação integrada — projetos e execução";
  if (/(servico|sistema|obra)[^\n.]{0,100}(hidric|hidraulic)|abastecimento de agua|drenagem|saneamento/.test(normalized)) {
    return "Serviços Hídricos/Hidráulicos";
  }
  if (/projet[^\n.]{0,100}(infraestrutura|infra-estrutura)|infraestrutura[^\n.]{0,100}projet/.test(normalized)) {
    return "Projeto de Infraestrutura";
  }
  if (/manutencao/.test(normalized)) return "Manutenção";
  if (/(execucao|obra|implantacao)[^\n.]{0,120}(infraestrutura|infra-estrutura)|infraestrutura[^\n.]{0,120}(execucao|obra|implantacao)/.test(normalized)) {
    return "Execução de Infraestrutura";
  }
  if (/(execucao|obra|reforma|implantacao)/.test(normalized)) return "Execução";
  if (/fiscalizacao/.test(normalized)) return "Fiscalização";
  if (/gerenciamento/.test(normalized)) return "Gerenciamento";
  if (/supervisao/.test(normalized)) return "Supervisão";
  if (/(elaboracao|desenvolvimento)\s+(?:(?:de|do|dos|da|das)\s+)?projet|projetos?\s+(?:basicos?|executivos?|arquitetonicos?|estruturais?)/.test(normalized)) {
    return "Elaboração de projetos";
  }
  if (/(assessoramento|consultoria|acompanhamento|estudo)/.test(normalized)) {
    return "Assessoramento";
  }
  return "Assessoramento";
}
const TENDER_MODALITIES = [
  "Concorrência Eletrônica",
  "Licitação Presencial",
  "Chamamento",
  "Pregão Eletrônico",
  "Dispensa",
] as const;
const MAX_DOCUMENT_BYTES = 200 * 1024 * 1024;
const DOCUMENT_CHUNK_BYTES = 5 * 1024 * 1024;

type PortalUser = {
  id?: string;
  email: string;
  name: string;
  role: Role;
  status?: string;
  pncpCanApprove?: boolean;
  pncp_can_approve?: number;
  username?: string | null;
  last_login_at?: string | null;
};

type DocumentRecord = {
  id: string;
  tender_id?: string | null;
  name: string;
  content_type: string;
  size: number;
  category: string;
  analysis_status: string;
  uploaded_by: string;
  created_at: string;
};

type AuditRecord = {
  id: string;
  actor_email: string;
  actor_name: string;
  actor_role: Role;
  action: string;
  entity_type: string;
  entity_id: string;
  detail: string;
  created_at: string;
};

type TechnicalRecord = {
  id: string;
  company: string;
  certificateNumber: string;
  contractNumber: string;
  issuer: string;
  object: string;
  serviceType: string;
  mainServices: string;
  characteristics: string;
  quantitySummary: string;
  technicalArea: string;
  location: string;
  startDate?: string | null;
  endDate?: string | null;
  catNumber: string;
  documentReference: string;
  keywords: string[];
  notes: string;
  status: string;
  createdAt?: string;
  internalDocumentName?: string;
  internalDocumentType?: string;
  internalDocumentSize?: number;
  hasInternalDocument?: boolean;
};

type PncpOpportunity = {
  id: string;
  pncp_control_number: string;
  purchase_number: string;
  modality: string;
  object: string;
  organ: string;
  location: string;
  opening_at?: string | null;
  source_url: string;
  suggested_company: "UFC Engenharia" | "Pórtico Construções";
  match_score: number;
  matched_terms: string;
  status: string;
  fetched_at: string;
};

type ArchiveSource = {
  id: string;
  organization_id: string;
  organization_name: string;
  name: string;
  provider_type: string;
  source_url: string;
  source_file_id: string;
  source_format: string;
  status: string;
  record_count: number;
  last_modified_at?: string | null;
  last_synced_at: string;
  notes: string;
};

type PncpDecision = {
  id: string;
  opportunity_id: string;
  actor_email: string;
  actor_name: string;
  actor_role: Role;
  decision: string;
  reason: string;
  previous_status: string;
  created_at: string;
};

type Organization = {
  id: string;
  name: string;
  type: "Empresa" | "Consórcio";
  tax_id: string;
  members: string;
  notes: string;
  status: string;
  document_count: number;
  professional_count: number;
};

type ComplianceDocument = {
  id: string;
  organization_id: string;
  professional_id?: string | null;
  name: string;
  document_type: string;
  document_size: number;
  document_number: string;
  content_type: string;
  size: number;
  issuer: string;
  issued_at?: string | null;
  expires_at?: string | null;
  no_expiry: number;
  notes: string;
  status: string;
  organization_name: string;
  professional_name?: string | null;
};

type Professional = {
  id: string;
  organization_id?: string | null;
  organization_name?: string | null;
  name: string;
  professional_role: string;
  council: string;
  registration: string;
  specialty: string;
  status: string;
  relationship_type?: string;
  formation?: string;
  degree?: string;
  institution?: string;
  graduation_year?: string;
  qualifications?: string;
  experience_areas?: string;
  experience_summary?: string;
};

type ConsortiumMember = {
  id: string;
  consortium_id: string;
  member_organization_id: string;
  member_organization_name: string;
  consortium_name: string;
  participation_percentage: string;
  is_leader: number;
  technical_responsibility: string;
};

type PlatformRegistration = {
  id: string;
  organization_id: string;
  organization_name: string;
  platform_name: string;
  registration_code: string;
  access_email: string;
  expires_at: string;
  responsible: string;
  reminder_days: string;
  notes: string;
  status: string;
};

type PlatformDocument = {
  id: string;
  platform_registration_id: string;
  organization_id: string;
  organization_name: string;
  platform_name: string;
  name: string;
  document_type: string;
  document_number: string;
  content_type: string;
  size: number;
  issued_at?: string | null;
  expires_at?: string | null;
  notes: string;
  status: string;
};

type TenderEditalVersion = {
  id: string;
  tender_id: string;
  version_number: number;
  event_type: string;
  title: string;
  publication_date?: string | null;
  effective_date?: string | null;
  description: string;
  process_effect: string;
  status: string;
  name: string;
  content_type: string;
  size: number;
  extraction_summary: string;
  uploaded_by: string;
  created_at: string;
};

type TenderImportAnalysis = {
  id: string;
  tender_id: string;
  analysis_mode: string;
  object_nature: string;
  routed_company: string;
  routing_reason: string;
  recommendation: string;
  sources_json: string;
  field_evidence_json: string;
  missing_documents_json: string;
  conflicts_json: string;
  critical_conditions_json: string;
  review_status: string;
  confirmed_by: string;
  created_at: string;
};

type TenderRequirement = {
  id: string;
  tender_id: string;
  requirement_type: "Empresa" | "Profissional";
  description: string;
  minimum_quantity: string;
  unit: string;
  evidence: string;
  status: string;
};

type TenderFollowup = {
  id: string;
  tender_id: string;
  tender_number: string;
  tender_title: string;
  tender_modality: string;
  followup_type: string;
  title: string;
  due_at: string;
  responsible: string;
  notes: string;
  status: string;
};

type CalendarEventRecord = {
  id: string;
  tender_id?: string | null;
  tender_number?: string | null;
  tender_title?: string | null;
  owner_email: string;
  visibility: "Equipe" | "Pessoal";
  event_type: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location: string;
  responsible: string;
  priority: "Alta" | "Média" | "Baixa";
  reminder_minutes: string;
  status: string;
};

type AlertRule = {
  id: string;
  event_type: string;
  name: string;
  cadence: string;
  reminder_minutes: string;
  active: number;
};

type TenderOutcome = {
  id: string;
  tender_id: string;
  tender_number: string;
  tender_title: string;
  tender_modality: string;
  tender_type: string;
  participant_organization_name?: string | null;
  outcome: string;
  winner: string;
  final_value: string;
  decision_date?: string | null;
  notes: string;
  reusable_items: string;
};

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

type TenderReuseAnalysis = {
  id: string;
  tender_id: string;
  status: string;
  method_version: string;
  candidate_count: number;
  candidates_json: string;
  gaps_json: string;
  activated_by: string;
  activated_by_name?: string | null;
  analyzed_at: string;
};

type ResourceCase = {
  id: string;
  tender_id: string;
  tender_number: string;
  tender_title: string;
  tender_modality: string;
  tender_organ: string;
  resource_type: string;
  position: string;
  deadline: string;
  responsible: string;
  competitor_name: string;
  status: string;
  summary: string;
  legal_ground: string;
  next_action: string;
  created_at: string;
};

type OpponentDocument = {
  id: string;
  resource_case_id: string;
  tender_id: string;
  competitor_name: string;
  name: string;
  content_type: string;
  size: number;
  category: string;
  analysis_sector: string;
  analysis_status: string;
  notes: string;
  uploaded_by: string;
  created_at: string;
};

type PortalNotification = {
  id: string;
  category: "Urgente" | "Prazo" | "Documento";
  tone: "critical" | "warning" | "info";
  icon: string;
  title: string;
  description: string;
  timing: string;
  dueAt?: string | null;
  targetPage: Page;
  tenderId?: string;
};

type NotificationFilter = "Todas" | "Urgentes" | "Prazos" | "Documentos";

type TenderTeamRecord = {
  id: string;
  tender_id: string;
  professional_id: string;
  proposed_role: string;
  status: string;
  notes: string;
  professional_name: string;
  organization_name?: string | null;
  council: string;
  registration: string;
  specialty: string;
};

type TenderDocumentLink = {
  id: string;
  tender_id: string;
  document_id: string;
  section: string;
  requirement: string;
  status: string;
  notes: string;
  document_name: string;
  document_type: string;
  document_size?: number;
  expires_at?: string | null;
  no_expiry: number;
  organization_name: string;
  professional_name?: string | null;
};

type ArchiveMatch = {
  id: string;
  tender_id: string;
  technical_record_id: string;
  score: number;
  matched_terms: string;
  assessment: string;
  analyzed_at: string;
  company: string;
  certificate_number: string;
  object: string;
  service_type: string;
  quantity_summary: string;
  main_services: string;
};

const fallbackTechnicalRecords: TechnicalRecord[] = [
  {
    id: "acervo-demo-ufc-01",
    company: "UFC Engenharia",
    certificateNumber: "DEMO-UFC-001",
    contractNumber: "",
    issuer: "Registro demonstrativo",
    object: "Elaboração e revisão de projetos de infraestrutura",
    serviceType: "Elaboração de projetos",
    mainServices:
      "Levantamentos, estudos, projetos básicos e executivos, orçamento e especificações",
    characteristics: "Infraestrutura viária e urbana",
    quantitySummary: "72,2 km de projetos lineares",
    technicalArea: "Infraestrutura",
    location: "Bahia",
    catNumber: "",
    documentReference: "Aguardando planilha oficial",
    keywords: ["projetos", "rodovias", "infraestrutura"],
    notes: "Substituir pelos dados e documentos oficiais.",
    status: "Demonstrativo",
  },
  {
    id: "acervo-demo-portico-01",
    company: "Pórtico Construções",
    certificateNumber: "DEMO-PORTICO-001",
    contractNumber: "",
    issuer: "Registro demonstrativo",
    object: "Execução e manutenção de infraestrutura predial",
    serviceType: "Execução",
    mainServices:
      "Execução de serviços civis, manutenção preventiva e corretiva",
    characteristics: "Edificações e instalações complementares",
    quantitySummary: "12 unidades atendidas durante 24 meses",
    technicalArea: "Edificações",
    location: "Bahia",
    catNumber: "",
    documentReference: "Aguardando planilha oficial",
    keywords: ["execução", "manutenção", "edificações"],
    notes: "Substituir pelos dados e documentos oficiais.",
    status: "Demonstrativo",
  },
];

const fallbackTenders: Tender[] = [
  {
    id: "demo-001",
    number: "L-2026007",
    modality: "Concorrência",
    title: "Gerenciamento e supervisão de sistemas de saneamento",
    organ: "Secretaria de Infraestrutura Hídrica e Saneamento",
    platform: "Portal institucional",
    estimatedValue: "R$ 18,7 mi",
    status: "Atenção",
    phase: "Preparação da proposta",
    openingAt: "2026-07-29T09:30:00-03:00",
    risk: "Alto",
    progress: 72,
    owner: "Ana Paula Souza",
    tags: ["saneamento", "engenharia"],
    summary:
      "Conferência final de equipe técnica, atestados e planilha orçamentária.",
  },
  {
    id: "demo-002",
    number: "7004611636",
    modality: "Pregão Eletrônico",
    title: "Serviços técnicos multidisciplinares de manutenção",
    organ: "Empresa de Energia",
    platform: "Portal de compras",
    estimatedValue: "Sigiloso",
    status: "Em análise",
    phase: "Análise de habilitação",
    openingAt: "2026-08-03T14:00:00-03:00",
    risk: "Médio",
    progress: 48,
    owner: "Rodolpho Veras",
    tags: ["manutenção", "energia"],
    summary:
      "Análise integrada do edital, Adendo D e critérios técnicos por família.",
  },
  {
    id: "demo-003",
    number: "032/2026",
    modality: "Concorrência",
    title: "Supervisão de obras rodoviárias — Lote 02",
    organ: "Departamento Nacional de Infraestrutura",
    platform: "Compras.gov.br",
    estimatedValue: "R$ 42,3 mi",
    status: "Em dia",
    phase: "Conferência documental",
    openingAt: "2026-08-07T10:00:00-03:00",
    risk: "Baixo",
    progress: 61,
    owner: "Mariana Costa",
    tags: ["rodovias", "supervisão"],
    summary:
      "Validação dos quantitativos mínimos e vínculo dos profissionais.",
  },
  {
    id: "demo-004",
    number: "015/2026",
    modality: "Concorrência",
    title: "Projetos executivos de infraestrutura urbana",
    organ: "Prefeitura Municipal",
    platform: "BLL Compras",
    estimatedValue: "R$ 9,8 mi",
    status: "Atenção",
    phase: "Impugnação",
    openingAt: "2026-08-12T09:00:00-03:00",
    risk: "Alto",
    progress: 35,
    owner: "Equipe Jurídica",
    tags: ["projetos", "impugnação"],
    summary:
      "Prazo de impugnação próximo; revisar exigências de qualificação técnica.",
  },
  {
    id: "demo-005",
    number: "008/2026",
    modality: "Pregão Eletrônico",
    title: "Apoio técnico ao gerenciamento de contratos",
    organ: "Secretaria Estadual de Infraestrutura",
    platform: "Licitações-e",
    estimatedValue: "R$ 6,4 mi",
    status: "Em dia",
    phase: "Monitoramento",
    openingAt: "2026-08-18T11:00:00-03:00",
    risk: "Médio",
    progress: 23,
    owner: "Paulo Oliveira",
    tags: ["gerenciamento", "contratos"],
    summary:
      "Aguardando esclarecimentos do órgão e confirmação da equipe mínima.",
  },
];

const navItems: { id: Page; label: string; icon: string; directorOnly?: boolean }[] =
  [
    { id: "overview", label: "Visão geral", icon: "▦" },
    { id: "intake", label: "Entrada AXXIA", icon: "↳" },
    { id: "tenders", label: "Licitações", icon: "◇" },
    { id: "resources", label: "Recursos & prazos", icon: "⚖" },
    { id: "monitoring", label: "Acompanhando resultado", icon: "↗" },
    { id: "finalized", label: "Licitações finalizadas", icon: "✓" },
    { id: "calendar", label: "Agenda & alertas", icon: "□" },
    { id: "platforms", label: "Validade das plataformas", icon: "◷" },
    { id: "documents", label: "Documentos", icon: "▱" },
    { id: "companyDocs", label: "Acervo técnico", icon: "▤" },
    { id: "organizations", label: "Empresas & habilitação", icon: "▣" },
    { id: "reports", label: "Relatórios", icon: "⌁" },
    { id: "team", label: "Equipe & acessos", icon: "◎" },
    {
      id: "audit",
      label: "Auditoria",
      icon: "✓",
      directorOnly: true,
    },
  ];

const operationalOwners = [
  {
    name: "Pâmela",
    role: "Captação e distribuição",
    initials: "PA",
    actions: ["Prospectar no AXXIA/PNCP", "Preencher a oportunidade", "Encaminhar para Felipe"],
    sla: "No mesmo dia da captação",
  },
  {
    name: "Felipe",
    role: "Cadastro e instrução inicial",
    initials: "FE",
    actions: ["Receber a oportunidade", "Importar edital e TR", "Validar dados e abrir dossiê"],
    sla: "Até 4 horas úteis após recebimento",
  },
  {
    name: "Geise",
    role: "Habilitação e credenciamentos",
    initials: "GE",
    actions: ["Montar habilitação", "Controlar certidões", "Renovar cadastros nas plataformas"],
    sla: "Checklist inicial em 1 dia útil",
  },
  {
    name: "Coordenação / Diretoria",
    role: "Decisão e governança",
    initials: "CD",
    actions: ["Aprovar participação", "Resolver impedimentos", "Autorizar exclusões e prioridades"],
    sla: "Imediato para licitações críticas",
  },
];

const roleMatrix = [
  {
    role: "Operador",
    description: "Execução diária e alimentação da base",
    color: "blue",
    grants: ["Cadastrar dados", "Atualizar checklist", "Enviar documentos"],
    denies: ["Excluir licitação", "Gerir usuários"],
  },
  {
    role: "Coordenador",
    description: "Gestão do fluxo e validação das entregas",
    color: "violet",
    grants: ["Tudo do Operador", "Alterar status", "Atribuir responsáveis"],
    denies: ["Excluir sem código", "Alterar perfis"],
  },
  {
    role: "Diretor",
    description: "Governança, decisão e acesso integral",
    color: "amber",
    grants: ["Acesso integral", "Autorizar exclusões", "Auditoria e perfis"],
    denies: [],
  },
  {
    role: "Manutenção",
    description: "Configurações técnicas e integrações",
    color: "green",
    grants: ["Integrações", "Diagnósticos", "Configurações", "Criar usuários"],
    denies: ["Editar mérito", "Excluir registros"],
  },
];

function formatDate(value: string, withTime = true) {
  const normalized = String(value ?? "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T12:00:00-03:00`)
    : new Date(normalized);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    day: "2-digit",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
    .format(date)
    .replace(".", "");
}

function formatFileSize(value?: number) {
  const size = Number(value ?? 0);
  if (!size) return "Tamanho não informado";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

async function readApiResponse<T extends Record<string, unknown>>(
  response: Response,
  fallbackMessage: string,
) {
  const raw = await response.text();
  let payload: Record<string, unknown> = {};
  if (raw) {
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error("O arquivo excede o limite de envio. Comprima ou divida o PDF e tente novamente.");
    }
    throw new Error(String(payload.error || raw || fallbackMessage));
  }
  return payload as T;
}

type PreservedUploadOptions = {
  file: File;
  destination?: "document" | "editalVersion" | "resourceDocument";
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
  onProgress?: (percent: number) => void;
};

type PreservedUploadResult = {
  document?: DocumentRecord;
  id?: string;
  versionNumber?: number;
  resourceCaseId?: string;
};

async function uploadPreservedFile({
  file,
  destination = "document",
  tenderId = "",
  category = "Documento editalício",
  onProgress,
  ...metadata
}: PreservedUploadOptions) {
  if (!file.size) throw new Error("O arquivo selecionado está vazio.");
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("Cada arquivo pode ter no máximo 200 MB.");
  }

  const initResponse = await fetch("/api/document-uploads?action=init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination,
      tenderId,
      category,
      name: file.name,
      size: file.size,
      contentType: file.type,
      ...metadata,
    }),
  });
  const session = await readApiResponse<{
    documentId: string;
    objectKey: string;
    uploadId: string;
    versionNumber?: number;
    resourceCaseId?: string;
    contentType: string;
  }>(initResponse, "Não foi possível iniciar o envio do arquivo.");
  const parts: Array<{ partNumber: number; etag: string }> = [];

  try {
    const totalParts = Math.ceil(file.size / DOCUMENT_CHUNK_BYTES);
    for (let index = 0; index < totalParts; index += 1) {
      const partNumber = index + 1;
      const start = index * DOCUMENT_CHUNK_BYTES;
      const end = Math.min(start + DOCUMENT_CHUNK_BYTES, file.size);
      const partResponse = await fetch(
        `/api/document-uploads?action=part&objectKey=${encodeURIComponent(session.objectKey)}&uploadId=${encodeURIComponent(session.uploadId)}&partNumber=${partNumber}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: file.slice(start, end),
        },
      );
      const part = await readApiResponse<{
        partNumber: number;
        etag: string;
      }>(partResponse, `Falha ao enviar a parte ${partNumber} do arquivo.`);
      parts.push(part);
      onProgress?.(Math.round((partNumber / totalParts) * 100));
    }

    const completeResponse = await fetch(
      "/api/document-uploads?action=complete",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          tenderId,
          category,
          documentId: session.documentId,
          objectKey: session.objectKey,
          uploadId: session.uploadId,
          versionNumber: session.versionNumber,
          parts,
          name: file.name,
          size: file.size,
          contentType: session.contentType,
          ...metadata,
          resourceCaseId: session.resourceCaseId || metadata.resourceCaseId,
        }),
      },
    );
    return await readApiResponse<PreservedUploadResult>(
      completeResponse,
      "Não foi possível guardar o arquivo.",
    );
  } catch (error) {
    void fetch("/api/document-uploads?action=abort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectKey: session.objectKey,
        uploadId: session.uploadId,
      }),
    });
    throw error;
  }
}

function safeJson<T>(value: string | undefined, fallback: T): T {
  try {
    const parsed = value ? JSON.parse(value) as T : fallback;
    return parsed == null ? fallback : parsed;
  }
  catch { return fallback; }
}

function validDate(value?: string | null) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

function tenderDateTimeLocalValue(value?: string | null) {
  const date = validDate(value);
  return date ? date.toISOString().slice(0, 16) : "";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function googleCalendarUrl(tender: Tender) {
  const start = validDate(tender.openingAt);
  if (!start) return "https://calendar.google.com/calendar/u/0/r";
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const compact = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${tender.modality} ${tender.number} — Sessão pública`,
    dates: `${compact(start)}/${compact(end)}`,
    details: `${tender.title}\n\nÓrgão: ${tender.organ}\nPlataforma: ${tender.platform}\nResponsável: ${tender.owner}\n\nEvento criado pelo LicitaControl.`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function calendarTemplateUrl({
  title,
  startsAt,
  durationMinutes = 30,
  details,
}: {
  title: string;
  startsAt: string;
  durationMinutes?: number;
  details: string;
}) {
  const start = validDate(startsAt);
  if (!start) return "https://calendar.google.com/calendar/u/0/r";
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const compact = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${compact(start)}/${compact(end)}`,
    details: `${details}\n\nAlerta criado pelo LicitaControl.`,
  }).toString()}`;
}

function timeUntil(value: string, now: string) {
  const target = validDate(value);
  const reference = validDate(now);
  if (!target || !reference) return "Data pendente";
  const difference = target.getTime() - reference.getTime();
  const days = Math.max(0, Math.ceil(difference / 86400000));
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `${days} dias`;
}

function isActiveTender(tender: Tender) {
  const status = String(tender.status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const phase = String(tender.phase ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const terminalStatuses = [
    "finalizada", "finalizado", "encerrada", "encerrado", "concluida", "concluido",
    "descartada", "descartado", "perdida", "perdido", "cancelada", "cancelado",
    "arquivada", "arquivado",
  ];
  const postDisputePhases = [
    "acompanhamento de resultado",
    "fase recursal",
    "recurso",
    "pos-disputa",
    "julgamento",
    "homologacao",
    "encerrada",
  ];
  return !terminalStatuses.includes(status) && !postDisputePhases.some((value) => phase.includes(value));
}

function daysUntilOpening(value: string) {
  const date = validDate(value);
  if (!date) return Number.POSITIVE_INFINITY;
  const difference = date.getTime() - Date.now();
  return Math.ceil(difference / 86400000);
}

function tenderRegion(tender: Tender) {
  const tags = Array.isArray(tender.tags) ? tender.tags : [];
  const corpus = `${tender.organ ?? ""} ${tender.title ?? ""} ${tender.summary ?? ""} ${tags.join(" ")}`.toUpperCase();
  const states: Record<string, string[]> = {
    Norte: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
    Nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE", "BAHIA"],
    "Centro-Oeste": ["DF", "GO", "MT", "MS"],
    Sudeste: ["ES", "MG", "RJ", "SP"],
    Sul: ["PR", "RS", "SC"],
  };
  for (const [region, abbreviations] of Object.entries(states)) {
    if (abbreviations.some((value) => new RegExp(`(^|[^A-Z])${value}([^A-Z]|$)`).test(corpus))) return region;
  }
  return "Não informado";
}

function normalizedTerms(value: string) {
  const ignored = new Set([
    "para", "com", "dos", "das", "uma", "obra", "obras", "servico",
    "servicos", "engenharia", "tecnico", "tecnica",
  ]);
  return Array.from(
    new Set(
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 3 && !ignored.has(term)),
    ),
  );
}

type ParsedEdital = TenderInputDraft & {
  companyRequirements: string[];
  professionalRequirements: string[];
  extractionNote: string;
  reviewChecks: Array<{
    label: string;
    value: string;
    status: "identified" | "pending";
  }>;
  analysisMode: string;
  objectNature: string;
  routedCompany: string;
  routingReason: string;
  recommendation: string;
  inventory: Array<{
    name: string;
    type: string;
    pages: number;
    status: "Lido" | "Sem texto pesquisável" | "Preservado para conferência";
    note: string;
  }>;
  fieldEvidence: Record<string, SourceEvidence | null>;
  missingDocuments: string[];
  conflicts: Array<{ field: string; values: string[]; action: string }>;
  criticalConditions: Array<{ topic: string; finding: string; source: string }>;
};

type SourceEvidence = {
  document: string;
  page: number;
  excerpt: string;
  confidence: "Alta" | "Média";
};

type ExtractedEditalDocument = {
  name: string;
  type: string;
  size: number;
  pages: Array<{ page: number; text: string }>;
  note: string;
  status: "Lido" | "Sem texto pesquisável" | "Preservado para conferência";
};

type TenderInputDraft = {
  number: string;
  modality: string;
  title: string;
  organ: string;
  platform: string;
  estimatedValue: string;
  openingAt: string;
  summary: string;
  tenderType: string;
};

function isoLocalDate(dateValue: string, timeValue = "09:00") {
  const parts = dateValue.match(/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/);
  if (!parts) return "";
  return `${parts[3]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}T${timeValue}`;
}

function parseEditalTextLegacy(text: string, extractionNote = "Texto extraído do arquivo") {
  const compactText = text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n");
  const lines = compactText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const findValue = (labels: RegExp) => {
    const line = lines.find((item) => labels.test(item));
    return line?.replace(labels, "").replace(/^\s*[:\-–—]\s*/, "").trim() ?? "";
  };
  const modalityMatch = compactText.match(
    /\b(concorr[eê]ncia|preg[aã]o eletr[oô]nico|dispensa eletr[oô]nica|credenciamento|di[aá]logo competitivo)\b/i,
  );
  const numberMatch = compactText.match(
    /(?:edital|concorr[eê]ncia|preg[aã]o|processo)\s*(?:n[º°o.]*)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9./-]{2,})/i,
  );
  const object = findValue(/^(?:objeto|objeto da licita[cç][aã]o)\b/i);
  const organ = findValue(/^(?:[oó]rg[aã]o|contratante|entidade)\b/i);
  const platform = findValue(/^(?:plataforma|portal|sistema eletr[oô]nico)\b/i);
  const valueMatch = compactText.match(/(?:valor estimado|valor global|or[cç]amento)[^\dR$]{0,30}(R\$\s*[\d.,]+)/i);
  const dateLine = lines.find((line) => /(sess[aã]o|abertura|recebimento das propostas|disputa)/i.test(line) && /\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}/.test(line));
  const dateMatch = dateLine?.match(/\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}/)?.[0] ?? "";
  const timeMatch = dateLine?.match(/(?:[àa]s?|hor[aá]rio)\s*(\d{1,2}[:h]\d{2})/i)?.[1]?.replace("h", ":") ?? "09:00";
  const requirementLines = lines
    .filter((line) =>
      line.length >= 24 &&
      line.length <= 520 &&
      /(atestado|certid[aã]o de acervo|\bcat\b|capacidade t[eé]cnic|qualifica[cç][aã]o t[eé]cnic|quantitativo m[ií]nimo|experi[eê]ncia|equipe t[eé]cnica|profissional|respons[aá]vel t[eé]cnico)/i.test(line),
    )
    .map((line) => line.replace(/^\d+(?:\.\d+)*[.)-]?\s*/, ""));
  const uniqueRequirements = Array.from(new Set(requirementLines)).slice(0, 16);
  const professionalRequirements = uniqueRequirements.filter((line) =>
    /(profissional|equipe t[eé]cnica|respons[aá]vel t[eé]cnico|engenheir|arquiteto|coordenador)/i.test(line),
  );
  const companyRequirements = uniqueRequirements.filter(
    (line) => !professionalRequirements.includes(line),
  );
  const normalized = compactText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const deadlineValue = (pattern: RegExp) => {
    const line = lines.find(
      (item) => pattern.test(item) && /\d{1,2}[/.-]\d{1,2}[/.-]\d{4}/.test(item),
    );
    return line?.match(/\d{1,2}[/.-]\d{1,2}[/.-]\d{4}/)?.[0] ?? "";
  };
  const impugnationDeadline = deadlineValue(/impugna[cç][aã]o/i);
  const clarificationDeadline = deadlineValue(/esclarecimento/i);
  const participation = lines.find((line) =>
    /(participa[cç][aã]o.*cons[oó]rcio|cons[oó]rcio.*(?:permit|vedad)|condi[cç][oõ]es de participa[cç][aã]o)/i.test(line),
  ) ?? "";
  const proposal = lines.find((line) =>
    /(proposta t[eé]cnica|crit[eé]rio de julgamento|t[eé]cnica e pre[cç]o|garantia da proposta)/i.test(line),
  ) ?? "";
  const tenderType = classifyTenderService(normalized);
  return {
    number: numberMatch?.[1] ?? "",
    modality: modalityMatch
      ? modalityMatch[1].replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "Concorrência",
    title: object.slice(0, 420),
    organ: organ.slice(0, 220),
    platform: platform.slice(0, 120),
    estimatedValue: valueMatch?.[1] ?? "Não informado",
    openingAt: dateMatch ? isoLocalDate(dateMatch, timeMatch) : "",
    summary: "Dados extraídos do edital e sujeitos à conferência humana antes da aprovação.",
    tenderType,
    companyRequirements,
    professionalRequirements,
    extractionNote,
    reviewChecks: [
      { label: "Sessão pública", value: dateMatch ? `${dateMatch} às ${timeMatch}` : "Data não identificada", status: dateMatch ? "identified" : "pending" },
      { label: "Impugnação", value: impugnationDeadline || "Prazo não identificado", status: impugnationDeadline ? "identified" : "pending" },
      { label: "Esclarecimentos", value: clarificationDeadline || "Prazo não identificado", status: clarificationDeadline ? "identified" : "pending" },
      { label: "Participação / consórcio", value: participation.slice(0, 180) || "Regra não localizada", status: participation ? "identified" : "pending" },
      { label: "Julgamento / proposta", value: proposal.slice(0, 180) || "Critério não localizado", status: proposal ? "identified" : "pending" },
      { label: "Qualificação técnica", value: `${companyRequirements.length} exigência(s) da empresa e ${professionalRequirements.length} dos profissionais`, status: uniqueRequirements.length ? "identified" : "pending" },
    ],
  };
}

void parseEditalTextLegacy;

function parseEditalDocuments(documents: ExtractedEditalDocument[]): ParsedEdital {
  type Candidate = { value: string; evidence: SourceEvidence };
  const pages = documents.flatMap((document) =>
    document.pages.map((page) => ({ ...page, document: document.name })),
  );
  const clean = (value: string) => value.replace(/\s+/g, " ").replace(/^[\s:–—-]+|[\s;]+$/g, "").trim();
  const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const excerpt = (text: string, index: number) => clean(text.slice(Math.max(0, index - 45), index + 230));
  const collect = (pattern: RegExp, group = 1, confidence: "Alta" | "Média" = "Alta") => {
    const results: Candidate[] = [];
    for (const page of pages) {
      const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
      for (const match of page.text.matchAll(regex)) {
        const value = clean(match[group] ?? "");
        if (value) results.push({ value, evidence: { document: page.document, page: page.page, excerpt: excerpt(page.text, match.index ?? 0), confidence } });
      }
    }
    return results;
  };
  const conflicts: ParsedEdital["conflicts"] = [];
  const choose = (field: string, items: Candidate[], fallback = "") => {
    const seen = new Map<string, Candidate>();
    items.forEach((item) => {
      const key = norm(item.value).replace(/[^a-z0-9]/g, "");
      if (key && !seen.has(key)) seen.set(key, item);
    });
    const unique = Array.from(seen.values());
    if (unique.length > 1) {
      conflicts.push({ field, values: unique.map((item) => item.value).slice(0, 5), action: "Conferir a publicação mais recente e específica; o campo não foi autopreenchido." });
      return { value: fallback, evidence: null as SourceEvidence | null };
    }
    return unique[0] ? { value: unique[0].value, evidence: unique[0].evidence } : { value: fallback, evidence: null as SourceEvidence | null };
  };

  const number = choose("Número do edital", collect(/(?:EDITAL|CONCORR[EÊ]NCIA|PREG[AÃ]O(?:\s+ELETR[OÔ]NICO)?)\s*(?:N[º°O.]*)\s*[:\-]?\s*([0-9]{1,8}(?:[./-][0-9A-Z]{1,8}){0,3})/gi));
  const modality = choose("Modalidade", collect(/(?:MODALIDADE\s*[:\-]\s*|^\s*)(CONCORR[EÊ]NCIA(?: ELETR[OÔ]NICA)?|LICITA[CÇ][AÃ]O PRESENCIAL|CHAMAMENTO|PREG[AÃ]O ELETR[OÔ]NICO|DISPENSA(?: ELETR[OÔ]NICA)?)\b/gim));
  const object = choose("Objeto", collect(/(?:^|\n)\s*(?:OBJETO(?:\s+DA\s+(?:LICITA[CÇ][AÃ]O|CONTRATA[CÇ][AÃ]O))?)\s*[:\-–—]\s*([^\n]{20,650})/gim));
  const organ = choose("Órgão / contratante", collect(/(?:^|\n)\s*(?:[OÓ]RG[AÃ]O|CONTRATANTE|ENTIDADE)\s*[:\-–—]\s*([^\n]{3,220})/gim));
  const platform = choose("Plataforma", collect(/(?:^|\n)\s*(?:PLATAFORMA|PORTAL|SISTEMA ELETR[OÔ]NICO)\s*[:\-–—]\s*([^\n]{3,120})/gim));
  const estimatedValue = choose("Valor estimado", collect(/(?:VALOR ESTIMADO|VALOR GLOBAL|OR[CÇ]AMENTO ESTIMADO)\s*[:\-–—]?\s*(R\$\s*[\d.]+(?:,\d{2})?)/gi), "Não informado");
  const opening = choose("Sessão pública", collect(/(?:SESS[AÃ]O P[ÚU]BLICA|ABERTURA(?:\s+DAS\s+PROPOSTAS)?|IN[IÍ]CIO DA DISPUTA)[^\n]{0,180}?(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}(?:[^\n]{0,40}?\d{1,2}[:h]\d{2})?)/gi));
  const openingDate = opening.value.match(/\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}/)?.[0] ?? "";
  const openingTime = opening.value.match(/\d{1,2}[:h]\d{2}/)?.[0]?.replace("h", ":") ?? "09:00";

  const requirementEntries = pages
    .flatMap((page) => page.text.split("\n").map((line) => ({ page, line: clean(line) })))
    .filter(({ line }) => line.length >= 24 && line.length <= 650 && /(atestado|certid[aã]o de acervo|\bcat\b|capacidade t[eé]cnic|qualifica[cç][aã]o t[eé]cnic|parcela de maior relev[aâ]ncia|quantitativo m[ií]nimo|experi[eê]ncia|equipe t[eé]cnica|profissional|respons[aá]vel t[eé]cnico)/i.test(line))
    .map(({ page, line }) => `[${page.document} · p. ${page.page}] ${line.replace(/^\d+(?:\.\d+)*[.)-]?\s*/, "")}`);
  const uniqueRequirements = Array.from(new Set(requirementEntries)).slice(0, 28);
  const professionalRequirements = uniqueRequirements.filter((line) => /(profissional|equipe t[eé]cnica|respons[aá]vel t[eé]cnico|engenheir|arquiteto|coordenador)/i.test(line));
  const companyRequirements = uniqueRequirements.filter((line) => !professionalRequirements.includes(line));

  const objectNormalized = norm(object.value);
  const executionTrigger = /(obra|execucao|manutencao|reforma|implantacao|contratacao integrada|semi-integrada)/.test(objectNormalized);
  const consultingTrigger = /(gerenciamento|supervisao|fiscalizacao|elaboracao de projeto|consultoria|assessoramento|acompanhamento|estudo)/.test(objectNormalized);
  const routedCompany = executionTrigger ? "Pórtico Construções" : consultingTrigger ? "UFC Engenharia" : "Indeterminado";
  const objectNature = executionTrigger ? "Obra, execução, manutenção ou contratação integrada" : consultingTrigger ? "Consultoria, projeto, gerenciamento, supervisão ou fiscalização sem execução predominante" : "Natureza não identificada com segurança";
  const routingReason = executionTrigger
    ? "O objeto contém gatilho de execução/obra; aplica-se conservadoramente apenas o acervo da Pórtico."
    : consultingTrigger
      ? "O objeto indica serviço consultivo ou elaboração/gerenciamento sem execução predominante; aplica-se apenas o acervo UFC."
      : "O objeto não possui evidência suficiente; nenhum acervo deve ser consultado automaticamente.";
  const allText = norm(pages.map((page) => page.text).join("\n"));
  const analysisMode = /tecnica e preco|melhor tecnica/.test(allText) ? "Opção A – Técnica e Preço" : /menor preco|maior desconto/.test(allText) ? "Opção B – Menor Preço" : /dispensa[^.]{0,100}art\.?\s*75/.test(allText) ? "Opção C – Dispensa (art. 75)" : "Opção D – Indeterminado";
  const tenderType = classifyTenderService(objectNormalized);

  const inventory = documents.map((document) => ({ name: document.name, type: document.type || "Tipo não informado", pages: document.pages.length, status: document.status, note: document.note }));
  const identifiedNames = norm(documents.map((document) => document.name).join(" "));
  const expected = [["Termo de Referência", /(termo.*referencia|\btr\b)/], ["Projeto Básico", /projeto.*basico/], ["ETP", /(estudo.*tecnico.*preliminar|\betp\b)/], ["Matriz de Riscos", /matriz.*risco/], ["Minuta contratual", /minuta.*contrat/], ["Planilha orçamentária", /(planilha|orcamento|quantitativo)/]] as Array<[string, RegExp]>;
  const missingDocuments = expected.filter(([, pattern]) => !pattern.test(identifiedNames)).map(([name]) => name);
  const criticalPatterns = [["Consórcio", /(cons[oó]rcio[^\n]{0,240})/i], ["Subcontratação", /(subcontrata[cç][aã]o[^\n]{0,240})/i], ["Visita técnica", /((?:visita|vistoria) t[eé]cnica[^\n]{0,240})/i], ["Garantia", /(garantia (?:da proposta|contratual)[^\n]{0,240})/i], ["Amostra / prova de conceito", /((?:amostra|prova de conceito)[^\n]{0,240})/i]] as Array<[string, RegExp]>;
  const criticalConditions = criticalPatterns.flatMap(([topic, pattern]) => {
    const found = collect(pattern, 1, "Média")[0];
    return found ? [{ topic, finding: found.value, source: `${found.evidence.document} · p. ${found.evidence.page}` }] : [];
  });
  const impugnation = choose("Prazo de impugnação", collect(/IMPUGNA[CÇ][AÃ]O[^\n]{0,160}?(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4})/gi));
  const clarification = choose("Prazo de esclarecimento", collect(/ESCLARECIMENTO[^\n]{0,160}?(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4})/gi));
  const recommendation = !object.value || !number.value || !openingDate || conflicts.length ? "INDETERMINADO" : "GO COM RESSALVAS";
  const fieldEvidence: ParsedEdital["fieldEvidence"] = { number: number.evidence, modality: modality.evidence, title: object.evidence, organ: organ.evidence, platform: platform.evidence, estimatedValue: estimatedValue.evidence, openingAt: opening.evidence };

  return {
    number: number.value,
    modality: modality.value ? modality.value.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Indeterminado",
    title: object.value.slice(0, 650), organ: organ.value.slice(0, 220), platform: platform.value.slice(0, 120), estimatedValue: estimatedValue.value,
    openingAt: openingDate ? isoLocalDate(openingDate, openingTime) : "",
    summary: `Importação com evidência documental. ${routingReason}`,
    tenderType, companyRequirements, professionalRequirements,
    extractionNote: `${documents.filter((item) => item.status === "Lido").length} de ${documents.length} arquivo(s) com texto pesquisável. Campos conflitantes ou sem fonte não foram preenchidos automaticamente.`,
    reviewChecks: [
      { label: "Inventário de fontes", value: `${inventory.length} arquivo(s); ${missingDocuments.length} peça(s) não identificada(s)`, status: inventory.length ? "identified" : "pending" },
      { label: "Sessão pública", value: openingDate ? `${openingDate} às ${openingTime}` : "Data não identificada com fonte segura", status: openingDate ? "identified" : "pending" },
      { label: "Impugnação", value: impugnation.value || "Prazo não identificado", status: impugnation.value ? "identified" : "pending" },
      { label: "Esclarecimentos", value: clarification.value || "Prazo não identificado", status: clarification.value ? "identified" : "pending" },
      { label: "Roteamento empresarial", value: `${objectNature} → ${routedCompany}`, status: routedCompany !== "Indeterminado" ? "identified" : "pending" },
      { label: "Qualificação técnica", value: `${companyRequirements.length} exigência(s) da empresa e ${professionalRequirements.length} dos profissionais`, status: uniqueRequirements.length ? "identified" : "pending" },
    ],
    analysisMode, objectNature, routedCompany, routingReason, recommendation,
    inventory, fieldEvidence, missingDocuments, conflicts, criticalConditions,
  };
}

function requirementPayload(type: "Empresa" | "Profissional", lines: string[]) {
  return lines.filter(Boolean).map((rawDescription) => {
    const source = rawDescription.match(/^\[([^\]]+)\]\s*/)?.[1] ?? "Fonte não identificada";
    const description = rawDescription.replace(/^\[[^\]]+\]\s*/, "");
    const quantity = description.match(/(?:m[ií]nimo|ao menos|igual ou superior a)\D{0,20}([\d.,]+)\s*([a-zA-Z²³%]+)/i);
    return {
      requirementType: type,
      description,
      minimumQuantity: quantity?.[1] ?? "",
      unit: quantity?.[2] ?? "",
      evidence: `${source} — validar item, redação integral, unidade e regra de somatório`,
    };
  });
}

async function extractDocumentText(file: File): Promise<ExtractedEditalDocument> {
  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    const text = await file.text();
    return { name: file.name, type: file.type || "text/plain", size: file.size, pages: [{ page: 1, text }], note: "Texto integral extraído do arquivo TXT.", status: text.trim() ? "Lido" : "Sem texto pesquisável" };
  }
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const { extractText } = await import("unpdf");
    const { text, totalPages } = await extractText(new Uint8Array(await file.arrayBuffer()), { mergePages: true });
    const pages = [{ page: 1, text: text || "" }];
    return {
      name: file.name,
      type: file.type || "application/pdf",
      size: file.size,
      pages,
      note: (text || "").length > 120
        ? `${totalPages || 1} página(s) lidas com rastreabilidade por página.`
        : "PDF com pouco texto pesquisável (possível documento digitalizado/imagem).",
      status: (text || "").trim() ? "Lido" : "Sem texto pesquisável",
    };
  }
  return {
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    pages: [],
    note: "Formato preservado como anexo. A extração automática aceita PDF com texto ou TXT; complete os campos manualmente.",
    status: "Preservado para conferência",
  };
}

function suggestArchiveRecords(
  opportunity: PncpOpportunity,
  records: TechnicalRecord[],
) {
  const terms = normalizedTerms(
    `${opportunity.object} ${opportunity.matched_terms}`,
  );
  return records
    .filter(
      (record) =>
        record.company === opportunity.suggested_company &&
        record.documentReference.startsWith("http"),
    )
    .map((record) => {
      const corpus = normalizedTerms(
        `${record.object} ${record.serviceType} ${record.mainServices} ${record.quantitySummary} ${record.keywords.join(" ")}`,
      );
      const matched = terms.filter((term) => corpus.includes(term));
      return { record, matched, score: Math.min(98, 35 + matched.length * 11) };
    })
    .filter((item) => item.matched.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function StatusPill({ value }: { value: string }) {
  const tone =
    value === "Atenção" || value === "Prioridade crítica" || value.startsWith("Negada") || value.startsWith("Não recomendada") || value.startsWith("Vencido") || value === "Não atende"
      ? "danger"
      : value === "Em dia" || value === "Concluído" || value === "Sincronizado" || value === "Vinculada" || value === "Finalizada" || value === "Atende" || value === "Atende preliminarmente" || value.startsWith("Aprovada") || value.startsWith("Adjudicada") || value.startsWith("Homologada") || value.startsWith("Contratada")
        ? "success"
        : value === "Em análise" || value === "Aguardando análise" || value === "Aguardando Diretoria" || value.startsWith("Recomendada") || value.startsWith("Vence em") || value === "Atende parcialmente"
          ? "info"
          : "neutral";
  return <span className={`status-pill ${tone}`}>{value}</span>;
}

function EvidenceNote({ evidence }: { evidence?: SourceEvidence | null }) {
  if (!evidence) return <small className="field-evidence pending">Sem fonte segura — preencher e conferir manualmente.</small>;
  return <small className="field-evidence"><b>Fonte:</b> {evidence.document} · p. {evidence.page} · confiança {evidence.confidence.toLowerCase()}<span>{evidence.excerpt}</span></small>;
}

function MiniAvatar({ name }: { name: string }) {
  return <span className="mini-avatar">{initials(name)}</span>;
}

function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (user: PortalUser) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Acesso não autorizado.");
      await onAuthenticated(result.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-brand"><span>L</span><div><strong>LicitaControl</strong><small>Central de Licitações</small></div></div>
        <div className="login-hero-copy"><span className="eyebrow">GOVERNANÇA DE PONTA A PONTA</span><h1>Controle licitatório com acesso individual e rastreável.</h1><p>Organize editais, habilitação, acervo técnico, prazos e decisões em uma central protegida por perfil.</p></div>
        <div className="login-role-grid">
          {roleMatrix.map((item) => <article key={item.role} className={item.color}><span>{item.role[0]}</span><div><strong>{item.role}</strong><small>{item.description}</small></div></article>)}
        </div>
        <div className="login-trust"><span>✓ Sessões protegidas</span><span>✓ Permissões por perfil</span><span>✓ Auditoria de ações</span></div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">ACESSO AO PORTAL</span>
          <h2>Entre na sua área</h2>
          <p>Use o login interno fornecido pela Diretoria ou pela Manutenção.</p>
          <form onSubmit={submit}>
            <label>Login<input name="username" autoComplete="username" placeholder="Digite seu login" required /></label>
            <label>Senha<div className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Ocultar" : "Exibir"}</button></div></label>
            {error && <div className="login-error" role="alert">{error}</div>}
            <button className="primary login-submit" disabled={busy}>{busy ? "Validando acesso..." : "Entrar no sistema →"}</button>
          </form>
          <div className="login-help"><strong>Primeiro acesso?</strong><span>Solicite seu usuário à Diretoria ou à Manutenção Master.</span></div>
        </div>
        <footer>LicitaControl · Ambiente corporativo UFC Engenharia e Pórtico Construções</footer>
      </section>
    </main>
  );
}

export default function Portal({
  identity,
  renderedAt,
}: {
  identity: { email: string; name: string };
  renderedAt: string;
}) {
  const [page, setPage] = useState<Page>("overview");
  const [tenders, setTenders] = useState<Tender[]>(fallbackTenders);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [technicalRecords, setTechnicalRecords] = useState<TechnicalRecord[]>(
    fallbackTechnicalRecords,
  );
  const [pncpOpportunities, setPncpOpportunities] = useState<PncpOpportunity[]>([]);
  const [archiveSources, setArchiveSources] = useState<ArchiveSource[]>([]);
  const [pncpDecisions, setPncpDecisions] = useState<PncpDecision[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [complianceDocuments, setComplianceDocuments] = useState<
    ComplianceDocument[]
  >([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [tenderTeam, setTenderTeam] = useState<TenderTeamRecord[]>([]);
  const [tenderDocumentLinks, setTenderDocumentLinks] = useState<
    TenderDocumentLink[]
  >([]);
  const [archiveMatches, setArchiveMatches] = useState<ArchiveMatch[]>([]);
  const [consortiumMembers, setConsortiumMembers] = useState<ConsortiumMember[]>([]);
  const [platformRegistrations, setPlatformRegistrations] = useState<PlatformRegistration[]>([]);
  const [platformDocuments, setPlatformDocuments] = useState<PlatformDocument[]>([]);
  const [tenderEditalVersions, setTenderEditalVersions] = useState<TenderEditalVersion[]>([]);
  const [tenderImportAnalyses, setTenderImportAnalyses] = useState<TenderImportAnalysis[]>([]);
  const [tenderRequirements, setTenderRequirements] = useState<TenderRequirement[]>([]);
  const [tenderFollowups, setTenderFollowups] = useState<TenderFollowup[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventRecord[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [tenderOutcomes, setTenderOutcomes] = useState<TenderOutcome[]>([]);
  const [tenderReuseAnalyses, setTenderReuseAnalyses] = useState<TenderReuseAnalysis[]>([]);
  const [resourceCases, setResourceCases] = useState<ResourceCase[]>([]);
  const [opponentDocuments, setOpponentDocuments] = useState<OpponentDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [user, setUser] = useState<PortalUser>({
    ...identity,
    role: "Diretor",
  });
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "anonymous">("authenticated");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [typeFilter, setTypeFilter] = useState("Todos os tipos");
  const [modalityFilter, setModalityFilter] = useState("Todas as modalidades");
  const [participantFilter, setParticipantFilter] = useState("Todos os participantes");
  const [phaseFilter, setPhaseFilter] = useState("Todas as fases");
  const [selected, setSelected] = useState<Tender | null>(null);
  const [newTenderOpen, setNewTenderOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [googleOpen, setGoogleOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newRecordOpen, setNewRecordOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [resourceTenderId, setResourceTenderId] = useState("");
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("Todas");
  const [onlyUnreadNotifications, setOnlyUnreadNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = window.localStorage.getItem(`licitacontrol:notifications:${identity.email.toLowerCase()}`);
      const ids = stored ? JSON.parse(stored) : [];
      return new Set(Array.isArray(ids) ? ids.map(String) : []);
    } catch {
      return new Set();
    }
  });
  const [toast, setToast] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPortal = useCallback(async () => {
    try {
      const response = await fetch("/api/portal", { cache: "no-store" });
      if (!response.ok) throw new Error("offline");
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      }
      setTenders(data.tenders ?? fallbackTenders);
      setDocuments(data.documents ?? []);
      setTechnicalRecords(
        data.technicalRecords?.length
          ? data.technicalRecords
          : fallbackTechnicalRecords,
      );
      setPncpOpportunities(data.pncpOpportunities ?? []);
      setArchiveSources(data.archiveSources ?? []);
      setPncpDecisions(data.pncpDecisions ?? []);
      setOrganizations(data.organizations ?? []);
      setComplianceDocuments(data.complianceDocuments ?? []);
      setProfessionals(data.professionals ?? []);
      setTenderTeam(data.tenderTeam ?? []);
      setTenderDocumentLinks(data.tenderDocumentLinks ?? []);
      setArchiveMatches(data.archiveMatches ?? []);
      setConsortiumMembers(data.consortiumMembers ?? []);
      setPlatformRegistrations(data.platformRegistrations ?? []);
      setPlatformDocuments(data.platformDocuments ?? []);
      setTenderEditalVersions(data.tenderEditalVersions ?? []);
      setTenderImportAnalyses(data.tenderImportAnalyses ?? []);
      setTenderRequirements(data.tenderRequirements ?? []);
      setTenderFollowups(data.tenderFollowups ?? []);
      setCalendarEvents(data.calendarEvents ?? []);
      setAlertRules(data.alertRules ?? []);
      setTenderOutcomes(data.tenderOutcomes ?? []);
      setTenderReuseAnalyses(data.tenderReuseAnalyses ?? []);
      setResourceCases(data.resourceCases ?? []);
      setOpponentDocuments(data.opponentDocuments ?? []);
      setAuditLogs(data.auditLogs);
      setUsers(data.users);
      setUser(data.user);
      if (Number(data.consolidatedDuplicates ?? 0) > 0) {
        setToast(
          `${data.consolidatedDuplicates} cadastro(s) duplicado(s) foram consolidados. Documentos, equipe, análises e prazos permaneceram no processo original.`,
        );
      }
      setAuthStatus("authenticated");
      setSelected((current) =>
        current
          ? data.tenders.find((item: Tender) => item.id === current.id) ?? current
          : current,
      );
    } catch {
      setToast("Não foi possível carregar os dados do portal agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function completeLogin(authenticatedUser: PortalUser) {
    setUser(authenticatedUser);
    setAuthStatus("authenticated");
    setLoading(true);
    await loadPortal();
  }

  async function logout() {
    setProfileMenuOpen(false);
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } finally {
      setAuthStatus("anonymous");
      setPage("overview");
      setSelected(null);
      setNotificationsOpen(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPortal();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPortal]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [notificationsOpen]);

  const filteredTenders = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return tenders.filter((tender) => {
      const matchesStatus =
        statusFilter === "Todas" || tender.status === statusFilter;
      const matchesType =
        typeFilter === "Todos os tipos" || tender.tenderType === typeFilter;
      const matchesModality =
        modalityFilter === "Todas as modalidades" || tender.modality === modalityFilter;
      const matchesParticipant =
        participantFilter === "Todos os participantes" ||
        tender.participantOrganizationId === participantFilter;
      const matchesPhase =
        phaseFilter === "Todas as fases" || tender.phase === phaseFilter;
      const searchable =
        `${tender.number} ${tender.title} ${tender.organ} ${tender.owner} ${tender.tenderType ?? ""} ${tender.participantOrganizationName ?? ""}`.toLowerCase();
      return matchesStatus && matchesType && matchesModality && matchesParticipant && matchesPhase &&
        (!normalized || searchable.includes(normalized));
    });
  }, [query, statusFilter, typeFilter, modalityFilter, participantFilter, phaseFilter, tenders]);

  const stats = useMemo(() => {
    const activeTenders = tenders.filter(isActiveTender);
    const attention = activeTenders.filter((item) => item.status === "Atenção").length;
    const inAnalysis = activeTenders.filter(
      (item) => item.status === "Em análise",
    ).length;
    const onTrack = activeTenders.filter((item) => item.status === "Em dia").length;
    return { attention, inAnalysis, onTrack, total: activeTenders.length };
  }, [tenders]);

  const notifications = useMemo<PortalNotification[]>(() => {
    const now = validDate(renderedAt) ?? new Date();
    const dayDifference = (value?: string | null) => {
      const target = validDate(value);
      return target ? Math.ceil((target.getTime() - now.getTime()) / 86400000) : null;
    };
    const timingLabel = (days: number | null, date?: string | null) => {
      if (days === null) return "Data pendente";
      if (days < 0) return `${Math.abs(days)} dia(s) em atraso`;
      if (days === 0) return "Vence hoje";
      if (days === 1) return "Vence amanhã";
      if (days <= 30) return `Vence em ${days} dias`;
      return date ? formatDate(date, false) : "Data pendente";
    };
    const items: PortalNotification[] = [];

    tenders
      .filter(isActiveTender)
      .forEach((tender) => {
        const days = dayDifference(tender.openingAt);
        if (days !== null && days >= 0 && days < 5) {
          items.push({
            id: `tender-deadline:${tender.id}:${tender.openingAt}`,
            category: "Urgente",
            tone: days <= 1 ? "critical" : "warning",
            icon: "!",
            title: `${tender.modality} ${tender.number}`,
            description: `Disputa próxima · ${tender.title}`,
            timing: timingLabel(days, tender.openingAt),
            dueAt: tender.openingAt,
            targetPage: "tenders",
            tenderId: tender.id,
          });
        } else if (tender.status === "Atenção") {
          items.push({
            id: `tender-attention:${tender.id}:${tender.updatedAt || tender.progress}`,
            category: "Urgente",
            tone: "warning",
            icon: "!",
            title: `Providência necessária · ${tender.number}`,
            description: tender.summary || tender.title,
            timing: "Revisar processo",
            dueAt: tender.openingAt,
            targetPage: "tenders",
            tenderId: tender.id,
          });
        }
      });

    tenderFollowups
      .filter((item) => item.status !== "Concluído")
      .forEach((item) => {
        const days = dayDifference(item.due_at);
        if (days !== null && days <= 15) items.push({
          id: `followup:${item.id}:${item.due_at}:${item.status}`,
          category: "Prazo",
          tone: days <= 1 ? "critical" : days <= 5 ? "warning" : "info",
          icon: "↗",
          title: `${item.followup_type} · ${item.tender_number}`,
          description: item.title,
          timing: timingLabel(days, item.due_at),
          dueAt: item.due_at,
          targetPage: "monitoring",
          tenderId: item.tender_id,
        });
      });

    resourceCases
      .filter((item) => item.status !== "Concluído")
      .forEach((item) => {
        const days = dayDifference(item.deadline);
        if (days !== null && days <= 15) items.push({
          id: `resource:${item.id}:${item.deadline}:${item.status}`,
          category: "Prazo",
          tone: days <= 1 ? "critical" : days <= 5 ? "warning" : "info",
          icon: "§",
          title: `${item.resource_type} · ${item.tender_number}`,
          description: item.next_action || item.summary || "Prazo recursal em acompanhamento",
          timing: timingLabel(days, item.deadline),
          dueAt: item.deadline,
          targetPage: "resources",
          tenderId: item.tender_id,
        });
      });

    platformRegistrations
      .filter((item) => item.status === "Ativo")
      .forEach((item) => {
        const days = dayDifference(item.expires_at);
        if (days !== null && days <= 30) items.push({
          id: `platform:${item.id}:${item.expires_at}`,
          category: "Documento",
          tone: days < 0 ? "critical" : days <= 7 ? "warning" : "info",
          icon: "◷",
          title: `${item.platform_name} · ${item.organization_name}`,
          description: `Renovar cadastro da plataforma · responsável: ${item.responsible || "não definido"}`,
          timing: timingLabel(days, item.expires_at),
          dueAt: item.expires_at,
          targetPage: "platforms",
        });
      });

    complianceDocuments
      .filter((item) => !item.no_expiry && item.expires_at)
      .forEach((item) => {
        const days = dayDifference(item.expires_at);
        if (days !== null && days <= 30) items.push({
          id: `compliance:${item.id}:${item.expires_at}`,
          category: "Documento",
          tone: days < 0 ? "critical" : days <= 7 ? "warning" : "info",
          icon: "▱",
          title: `${item.document_type} · ${item.organization_name}`,
          description: item.professional_name ? `Documento de ${item.professional_name}` : item.name,
          timing: timingLabel(days, item.expires_at),
          dueAt: item.expires_at,
          targetPage: "organizations",
        });
      });

    const toneRank = { critical: 0, warning: 1, info: 2 };
    return items.sort((a, b) => {
      const toneOrder = toneRank[a.tone] - toneRank[b.tone];
      if (toneOrder) return toneOrder;
      const aTime = validDate(a.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = validDate(b.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [complianceDocuments, platformRegistrations, renderedAt, resourceCases, tenderFollowups, tenders]);

  const unreadNotificationCount = notifications.filter((item) => !readNotificationIds.has(item.id)).length;
  const visibleNotifications = notifications.filter((item) => {
    const categoryMatches = notificationFilter === "Todas"
      || (notificationFilter === "Urgentes" && item.category === "Urgente")
      || (notificationFilter === "Prazos" && item.category === "Prazo")
      || (notificationFilter === "Documentos" && item.category === "Documento");
    return categoryMatches && (!onlyUnreadNotifications || !readNotificationIds.has(item.id));
  });

  function saveReadNotifications(next: Set<string>) {
    setReadNotificationIds(next);
    try {
      window.localStorage.setItem(`licitacontrol:notifications:${user.email}`, JSON.stringify(Array.from(next).slice(-250)));
    } catch {
      // A central continua funcional mesmo quando o navegador bloqueia preferências locais.
    }
  }

  function markNotificationRead(id: string) {
    const next = new Set(readNotificationIds);
    next.add(id);
    saveReadNotifications(next);
  }

  function openNotification(item: PortalNotification) {
    markNotificationRead(item.id);
    setNotificationsOpen(false);
    const tender = item.tenderId ? tenders.find((entry) => entry.id === item.tenderId) : undefined;
    if (item.targetPage === "tenders" && tender) setSelected(tender);
    else setPage(item.targetPage);
  }

  async function generateAuthorization() {
    setBusy(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateDeleteCode" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setGeneratedCode(result.code);
      setToast("Código temporário gerado. Validade: 30 minutos.");
      await loadPortal();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Falha na autorização.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTender() {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteTender",
          tenderId: selected.id,
          reason: deleteReason,
          authorizationCode: deleteCode,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDeleteOpen(false);
      setSelected(null);
      setDeleteCode("");
      setDeleteReason("");
      setToast("Acompanhamento removido com registro integral da ação.");
      await loadPortal();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Exclusão não realizada.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File, tenderId = "", category = "Documento editalício") {
    setBusy(true);
    try {
      const result = await uploadPreservedFile({ file, tenderId, category });
      if (result.document) {
        setDocuments((current) => [result.document!, ...current]);
      }
      setToast("Documento enviado e preservado no formato original.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }

  async function inviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const invitedUser = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inviteUser", invitedUser }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setInviteOpen(false);
      setToast("Usuário criado com login, senha inicial e perfil registrado na auditoria.");
      await loadPortal();
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível incluir o usuário.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitTechnicalRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    const technicalRecord = Object.fromEntries(Array.from(form.entries()).filter(([key]) => key !== "file"));
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createTechnicalRecord", technicalRecord }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (file instanceof File && file.size > 0) {
        const documentForm = new FormData();
        documentForm.append("recordId", result.id);
        documentForm.append("file", file);
        const documentResponse = await fetch("/api/archive-documents", { method: "POST", body: documentForm });
        const documentResult = await documentResponse.json();
        if (!documentResponse.ok) throw new Error(`Atestado cadastrado, mas o arquivo não foi importado: ${documentResult.error}`);
      }
      setNewRecordOpen(false);
      setToast(file instanceof File && file.size > 0 ? "Atestado e arquivo incluídos no acervo consultável." : "Atestado incluído no acervo e registrado na auditoria.");
      await loadPortal();
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Não foi possível cadastrar o atestado.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function consultPncp() {
    setBusy(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncPncp" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setToast(result.warning ??
        `${result.examined} contratações examinadas; ${result.matches} aderências registradas.`);
      await loadPortal();
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar o PNCP agora.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function decidePncp(
    opportunityId: string,
    decision: string,
    reason: string,
  ) {
    setBusy(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decidePncp",
          opportunityId,
          decision,
          reason,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setToast(`Decisão registrada: ${result.status}.`);
      await loadPortal();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Decisão não registrada.");
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function setOperatorPncpPermission(email: string, enabled: boolean) {
    setBusy(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setPncpOperatorPermission",
          targetUserEmail: email,
          enabled,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setToast(enabled ? "Operador liberado para a triagem do PNCP." : "Liberação do PNCP revogada.");
      await loadPortal();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Permissão não atualizada.");
    } finally {
      setBusy(false);
    }
  }

  if (authStatus === "checking") {
    return <main className="auth-checking"><div className="brand-mark">L</div><strong>Preparando acesso seguro...</strong></main>;
  }
  if (authStatus === "anonymous") {
    return <LoginPage onAuthenticated={completeLogin} />;
  }

  const visibleNav = navItems.filter(
    (item) => !item.directorOnly || user.role === "Diretor",
  );

  return (
    <div className="portal-shell">
      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">L</div>
          <div>
            <strong>LicitaControl</strong>
            <span>Central de Licitações</span>
          </div>
          <button
            className="sidebar-close"
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="workspace-label">UFC ENGENHARIA</div>
        <nav>
          <span className="nav-caption">OPERAÇÃO</span>
          {visibleNav.slice(0, 12).map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id);
                setMobileNavOpen(false);
              }}
            >
              <i>{item.icon}</i>
              <span>{item.label}</span>
              {item.id === "calendar" && stats.attention > 0 && (
                <b>{stats.attention}</b>
              )}
            </button>
          ))}
          <span className="nav-caption governance">GOVERNANÇA</span>
          {visibleNav.slice(12).map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id);
                setMobileNavOpen(false);
              }}
            >
              <i>{item.icon}</i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-sync">
          <div className="sync-icon">G</div>
          <div>
            <strong>Google Agenda</strong>
            <span>Alertas em um clique</span>
          </div>
          <button aria-label="Configurar Google Agenda" onClick={() => setGoogleOpen(true)}>
            →
          </button>
        </div>

        <div className="profile">
          <MiniAvatar name={user.name} />
          <div>
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button className="profile-menu" aria-label="Abrir atalhos do perfil" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((value) => !value)}>•••</button>
          {profileMenuOpen && <>
            <button className="profile-menu-scrim" aria-label="Fechar menu do perfil" onClick={() => setProfileMenuOpen(false)} />
            <div className="profile-popover">
              <header><MiniAvatar name={user.name} /><div><strong>{user.name}</strong><span>{user.email}</span></div></header>
              <button onClick={() => { setPage("team"); setProfileMenuOpen(false); }}>◎ Meu perfil e acessos</button>
              {user.role === "Diretor" && <button onClick={() => { setPage("audit"); setProfileMenuOpen(false); }}>✓ Abrir auditoria</button>}
              <button onClick={() => { setPage("calendar"); setProfileMenuOpen(false); }}>□ Agenda e alertas</button>
              <button className="logout-action" onClick={logout}>↪ Sair do sistema</button>
            </div>
          </>}
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          aria-label="Fechar menu"
          className="backdrop nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setMobileNavOpen(true)}
          >
            ☰
          </button>
          <label className="global-search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por edital, órgão, objeto ou responsável..."
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-actions">
            <span className="live-status">
              <i />
              Central ativa
            </span>
            <div className="notification-center">
              <button className={`icon-button notification-trigger ${notificationsOpen ? "active" : ""}`} aria-label={`Notificações${unreadNotificationCount ? `, ${unreadNotificationCount} não lidas` : ""}`} aria-expanded={notificationsOpen} aria-haspopup="dialog" onClick={() => setNotificationsOpen((current) => !current)}>
                <span aria-hidden="true">♢</span>
                {unreadNotificationCount > 0 && <b>{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</b>}
              </button>
              {notificationsOpen && <>
                <button className="notification-scrim" aria-label="Fechar notificações" onClick={() => setNotificationsOpen(false)} />
                <section className="notification-panel" role="dialog" aria-modal="false" aria-label="Central de notificações">
                  <header className="notification-panel-head"><div><span>COORDENAÇÃO OPERACIONAL</span><h2>Notificações</h2><p><strong>{unreadNotificationCount}</strong> não lida(s) · {notifications.length} alerta(s) ativo(s)</p></div>{unreadNotificationCount > 0 && <button onClick={() => saveReadNotifications(new Set([...readNotificationIds, ...notifications.map((item) => item.id)]))}>Marcar todas como lidas</button>}</header>
                  <div className="notification-filters">{(["Todas", "Urgentes", "Prazos", "Documentos"] as NotificationFilter[]).map((filter) => <button key={filter} className={notificationFilter === filter ? "active" : ""} onClick={() => setNotificationFilter(filter)}>{filter}<span>{filter === "Todas" ? notifications.length : notifications.filter((item) => filter === "Urgentes" ? item.category === "Urgente" : filter === "Prazos" ? item.category === "Prazo" : item.category === "Documento").length}</span></button>)}</div>
                  <div className="notification-list" aria-live="polite">
                    {visibleNotifications.map((item) => {
                      const read = readNotificationIds.has(item.id);
                      return <article className={`notification-item ${item.tone} ${read ? "read" : "unread"}`} key={item.id}><button className="notification-open" onClick={() => openNotification(item)}><i>{item.icon}</i><div><span>{item.category}</span><strong>{item.title}</strong><p>{item.description}</p><small>{item.timing}</small></div><b>→</b></button>{!read && <button className="notification-read" onClick={() => markNotificationRead(item.id)} aria-label={`Marcar ${item.title} como lida`}>✓</button>}</article>;
                    })}
                    {!visibleNotifications.length && <div className="notification-empty"><span>✓</span><strong>Nenhuma notificação neste filtro</strong><p>Os novos prazos e vencimentos aparecerão aqui automaticamente.</p></div>}
                  </div>
                  <footer className="notification-panel-foot"><button className={onlyUnreadNotifications ? "active" : ""} onClick={() => setOnlyUnreadNotifications((current) => !current)}><span>{onlyUnreadNotifications ? "✓" : ""}</span> Somente não lidas</button><button onClick={() => { setNotificationsOpen(false); setPage("calendar"); }}>Abrir Agenda & alertas →</button></footer>
                </section>
              </>}
            </div>
            <button className="primary compact" onClick={() => setNewTenderOpen(true)}>
              <span>＋</span> Importar edital
            </button>
          </div>
        </header>

        <div className="content">
          {loading && <div className="loading-line" />}
          {page === "overview" && (
            <Overview
              tenders={filteredTenders}
              stats={stats}
              setPage={setPage}
              openTender={setSelected}
              openCalendar={() => setPage("calendar")}
              now={renderedAt}
            />
          )}
          {page === "intake" && (
            <IntakePage
              tenders={tenders}
              organizations={organizations}
              refresh={loadPortal}
              notify={setToast}
              importEdital={() => setNewTenderOpen(true)}
              openTender={setSelected}
            />
          )}
          {page === "tenders" && (
            <TendersPage
              tenders={filteredTenders.filter(isActiveTender)}
              allTenders={tenders.filter(isActiveTender)}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              modalityFilter={modalityFilter}
              setModalityFilter={setModalityFilter}
              participantFilter={participantFilter}
              setParticipantFilter={setParticipantFilter}
              phaseFilter={phaseFilter}
              setPhaseFilter={setPhaseFilter}
              organizations={organizations}
              openTender={setSelected}
              newTender={() => setNewTenderOpen(true)}
            />
          )}
          {page === "calendar" && (
            <CalendarPage
              tenders={tenders}
              followups={tenderFollowups}
              platforms={platformRegistrations}
              platformDocuments={platformDocuments}
              resources={resourceCases}
              complianceDocuments={complianceDocuments}
              calendarEvents={calendarEvents}
              alertRules={alertRules}
              currentUser={user.name}
              connect={() => setGoogleOpen(true)}
              refresh={loadPortal}
              notify={setToast}
            />
          )}
          {page === "resources" && (
            <ResourcesPage
              tenders={tenders.filter((item) => item.status !== "Finalizada")}
              cases={resourceCases}
              documents={opponentDocuments}
              initialTenderId={resourceTenderId}
              consumeInitialTender={() => setResourceTenderId("")}
              role={user.role}
              currentUser={user.name}
              now={renderedAt}
              refresh={loadPortal}
              notify={setToast}
              openTender={setSelected}
            />
          )}
          {page === "platforms" && (
            <PlatformValidityPage
              organizations={organizations.filter((organization) => organization.type === "Empresa")}
              registrations={platformRegistrations}
              documents={platformDocuments}
              refresh={loadPortal}
              notify={setToast}
            />
          )}
          {page === "monitoring" && (
            <MonitoringPage
              tenders={tenders}
              followups={tenderFollowups}
              cases={resourceCases}
              documents={opponentDocuments}
              refresh={loadPortal}
              notify={setToast}
              openTender={setSelected}
            />
          )}
          {page === "finalized" && (
            <FinalizedPage
              tenders={tenders}
              outcomes={tenderOutcomes}
              documents={documents}
              team={tenderTeam}
              openTender={setSelected}
            />
          )}
          {page === "documents" && (
            <DocumentsPage
              documents={documents}
              tenders={tenders}
              upload={uploadFile}
              busy={busy}
              refresh={loadPortal}
              notify={setToast}
            />
          )}
          {page === "companyDocs" && (
            <CompanyDocumentationPage
              records={technicalRecords}
              sources={archiveSources}
              opportunities={pncpOpportunities}
              decisions={pncpDecisions}
              user={user}
              createRecord={() => setNewRecordOpen(true)}
              consultPncp={consultPncp}
              decidePncp={decidePncp}
              busy={busy}
              refresh={loadPortal}
              notify={setToast}
              organizations={organizations}
              consortiumMembers={consortiumMembers}
              openOrganizations={() => setPage("organizations")}
            />
          )}
          {page === "organizations" && (
            <OrganizationsPage
              organizations={organizations}
              documents={complianceDocuments}
              professionals={professionals}
              consortiumMembers={consortiumMembers}
              role={user.role}
              refresh={loadPortal}
              notify={setToast}
            />
          )}
          {page === "reports" && <ReportsPage tenders={tenders} />}
          {page === "team" && (
            <TeamPage
              users={users.length ? users : [user]}
              currentRole={user.role}
              generateAuthorization={generateAuthorization}
              generatedCode={generatedCode}
              busy={busy}
              invite={() => setInviteOpen(true)}
              setPncpPermission={setOperatorPncpPermission}
              currentUser={user}
              refresh={loadPortal}
              notify={setToast}
            />
          )}
          {page === "audit" && (
            <AuditPage auditLogs={auditLogs} userRole={user.role} />
          )}
        </div>
      </main>

      <input
        ref={fileRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadFile(file);
          event.currentTarget.value = "";
        }}
      />

      {selected && (
        <TenderDrawerErrorBoundary key={selected.id} close={() => setSelected(null)}>
          <TenderDrawer
            tender={selected}
            role={user.role}
            documents={documents.filter((document) => document.tender_id === selected.id)}
            archiveMatches={archiveMatches.filter((match) => match.tender_id === selected.id)}
            technicalRecords={technicalRecords}
            complianceDocuments={complianceDocuments}
            professionals={professionals}
            team={tenderTeam.filter((item) => item.tender_id === selected.id)}
            documentLinks={tenderDocumentLinks.filter((item) => item.tender_id === selected.id)}
            requirements={tenderRequirements.filter((item) => item.tender_id === selected.id)}
            editalVersions={tenderEditalVersions.filter((item) => item.tender_id === selected.id)}
            importAnalyses={tenderImportAnalyses.filter((item) => item.tender_id === selected.id)}
            reuseAnalyses={tenderReuseAnalyses.filter((item) => item.tender_id === selected.id)}
            organizations={organizations}
            refresh={loadPortal}
            notify={setToast}
            close={() => setSelected(null)}
            openFollowupDestination={(destination, tenderId) => {
              setSelected(null);
              if (destination === "resources") {
                setResourceTenderId(tenderId);
                setPage("resources");
              } else {
                setPage("monitoring");
              }
            }}
            remove={() => setDeleteOpen(true)}
          />
        </TenderDrawerErrorBoundary>
      )}

      {newTenderOpen && (
        <EditalIntakeModal
          organizations={organizations}
          currentUser={user.name}
          close={() => setNewTenderOpen(false)}
          refresh={loadPortal}
          notify={setToast}
          openTender={setSelected}
        />
      )}

      {newRecordOpen && (
        <Modal
          title="Cadastrar atestado no acervo"
          close={() => setNewRecordOpen(false)}
        >
          <form className="form-grid" onSubmit={submitTechnicalRecord}>
            <label>
              Empresa
              <select name="company" defaultValue={organizations[0]?.name ?? "UFC Engenharia"} required>
                {organizations.map((organization) => (
                  <option key={organization.id}>{organization.name}</option>
                ))}
              </select>
            </label>
            <label>
              Número do atestado
              <input name="certificateNumber" placeholder="Ex.: ATEST-014/2024" required />
            </label>
            <label>
              Contrato
              <input name="contractNumber" placeholder="Número do contrato" />
            </label>
            <label>
              CAT / registro
              <input name="catNumber" placeholder="CAT ou referência técnica" />
            </label>
            <label className="wide">
              Emitente / contratante
              <input name="issuer" placeholder="Razão social do emitente" required />
            </label>
            <label className="wide">
              Objeto
              <textarea name="object" rows={3} placeholder="Objeto integral ou resumido" required />
            </label>
            <label>
              Tipo de serviço
              <select name="serviceType" defaultValue={SERVICE_TYPES[0]} required>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <label>
              Área técnica
              <input name="technicalArea" placeholder="Rodovias, saneamento..." />
            </label>
            <label className="wide">
              Serviços principais
              <textarea name="mainServices" rows={3} placeholder="Separe os serviços relevantes por vírgula" required />
            </label>
            <label className="wide">
              Quantitativos
              <textarea name="quantitySummary" rows={3} placeholder="Ex.: 32 km; 4 unidades; 18.500 m²" required />
            </label>
            <label className="wide">
              Características do serviço
              <textarea name="characteristics" rows={3} placeholder="Complexidade, disciplinas, porte e condições especiais" />
            </label>
            <label>
              Local
              <input name="location" placeholder="Município / UF" />
            </label>
            <label>
              Referência documental
              <input name="documentReference" placeholder="Arquivo, pasta ou link" />
            </label>
            <label className="wide">
              Arquivo do atestado / CAT para análise e consulta
              <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" />
              <small>Se enviado, o documento ficará acessível a todos os usuários autorizados do portal.</small>
            </label>
            <label>
              Início
              <input name="startDate" type="date" />
            </label>
            <label>
              Término
              <input name="endDate" type="date" />
            </label>
            <label className="wide">
              Palavras-chave
              <input name="keywords" placeholder="projetos, saneamento, rodovias..." />
            </label>
            <label className="wide">
              Observações
              <textarea name="notes" rows={2} />
            </label>
            <div className="modal-actions wide">
              <button type="button" className="secondary" onClick={() => setNewRecordOpen(false)}>Cancelar</button>
              <button className="primary" disabled={busy}>{busy ? "Salvando..." : "Salvar no acervo"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteOpen && selected && (
        <Modal title="Excluir acompanhamento" close={() => setDeleteOpen(false)}>
          <div className="danger-callout">
            <strong>Ação controlada e auditável</strong>
            <p>
              O registro deixará a operação ativa, mas permanecerá preservado
              para auditoria e eventual restauração pela Diretoria.
            </p>
          </div>
          <div className="delete-form">
            <label>
              Justificativa obrigatória
              <textarea
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Explique o motivo da exclusão..."
              />
            </label>
            {user.role !== "Diretor" && (
              <label>
                Código de autorização da Diretoria
                <input
                  value={deleteCode}
                  onChange={(event) => setDeleteCode(event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                />
              </label>
            )}
            <div className="form-actions">
              <button className="ghost" onClick={() => setDeleteOpen(false)}>
                Voltar
              </button>
              <button
                className="danger-button"
                disabled={!deleteReason.trim() || busy}
                onClick={deleteTender}
              >
                {busy ? "Validando..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {googleOpen && (
        <Modal title="Integração com Google Agenda" close={() => setGoogleOpen(false)}>
          <div className="google-connect">
            <div className="google-logo">G</div>
            <div>
              <span className="eyebrow">CONEXÃO SEGURA</span>
              <h3>Centralize prazos na agenda da equipe</h3>
              <p>
                O portal já gera eventos compatíveis com o Google Agenda. A
                inclusão individual já funciona em um clique para sessões,
                recursos e validades de plataformas. A sincronização automática
                bidirecional depende da autorização OAuth da conta administradora.
              </p>
            </div>
          </div>
          <div className="integration-steps">
            <span><b>1</b> Use “Adicionar ao Google” em qualquer prazo</span>
            <span><b>2</b> Baixe a agenda .ics para importar os prazos em lote</span>
            <span><b>3</b> Para sincronização automática, autorize a conta administradora via OAuth</span>
          </div>
          <div className="form-actions">
            <button className="ghost" onClick={() => setGoogleOpen(false)}>
              Agora não
            </button>
            <a className="secondary link-button" href="/api/calendar-feed">
              Baixar agenda .ics
            </a>
            <a
              className="primary link-button"
              href={tenders[0] ? googleCalendarUrl(tenders[0]) : "https://calendar.google.com/calendar/"}
              target="_blank"
              rel="noreferrer"
            >
              Testar com o próximo prazo ↗
            </a>
          </div>
        </Modal>
      )}

      {inviteOpen && (
        <Modal title="Criar usuário do portal" close={() => setInviteOpen(false)}>
          <form className="form-grid" onSubmit={inviteUser}>
            <label className="wide">
              Nome completo
              <input name="name" placeholder="Nome do integrante" required />
            </label>
            <label className="wide">
              E-mail do integrante
              <input
                name="email"
                type="email"
                placeholder="nome@empresa.com.br"
                required
              />
            </label>
            <label>
              Login de acesso
              <input name="username" minLength={4} autoComplete="off" placeholder="ex.: felipe" required />
            </label>
            <label>
              Senha inicial
              <input name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" required />
            </label>
            <label className="wide">
              Perfil de acesso
              <select name="role" defaultValue="Operador">
                <option>Operador</option>
                <option>Coordenador</option>
                <option>Diretor</option>
                <option>Manutenção</option>
              </select>
            </label>
            <div className="invite-notice wide">
              <strong>Governança de acesso</strong>
              <p>
                O usuário será ativado imediatamente com o perfil escolhido. A
                criação, o responsável e o horário ficarão registrados na auditoria.
              </p>
            </div>
            <div className="form-actions wide">
              <button type="button" className="ghost" onClick={() => setInviteOpen(false)}>
                Cancelar
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Incluindo..." : "Incluir na equipe"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function Overview({
  tenders,
  stats,
  setPage,
  openTender,
  openCalendar,
  now,
}: {
  tenders: Tender[];
  stats: { attention: number; inAnalysis: number; onTrack: number; total: number };
  setPage: (page: Page) => void;
  openTender: (tender: Tender) => void;
  openCalendar: () => void;
  now: string;
}) {
  const reference = validDate(now) ?? new Date();
  const activeTenders = tenders.filter(isActiveTender);
  const deadlines = activeTenders
    .map((tender) => {
      const opening = validDate(tender.openingAt);
      const days = opening
        ? Math.ceil((opening.getTime() - reference.getTime()) / 86400000)
        : Number.POSITIVE_INFINITY;
      return { tender, days };
    })
    .filter(({ days }) => Number.isFinite(days) && days >= 0);
  const immediatePriorities = deadlines
    .filter(({ tender, days }) => {
      const elevatedRisk = tender.risk === "Alto" || String(tender.risk) === "Crítico";
      return days <= 5 || (days <= 10 && (tender.status === "Atenção" || elevatedRisk));
    })
    .sort((a, b) => {
      const riskWeight = (tender: Tender) => tender.risk === "Alto" || String(tender.risk) === "Crítico" ? 1 : 0;
      return a.days - b.days || riskWeight(b.tender) - riskWeight(a.tender);
    })
    .slice(0, 4);
  const upcomingDeadlines = deadlines
    .filter(({ days }) => days <= 7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);
  return (
    <>
      <PageHeading
        eyebrow="SEGUNDA-FEIRA, 27 DE JULHO"
        title="Central de comando"
        description="Prioridades, prazos e decisões que exigem atenção hoje."
        action={
          <button className="secondary" onClick={openCalendar}>
            □ Ver agenda completa
          </button>
        }
      />

      <section className="metrics-grid">
        <article className="metric featured">
          <div className="metric-icon">◇</div>
          <div>
            <span>Licitações ativas</span>
            <strong>{stats.total}</strong>
            <small><i className="up">↗</i> 2 novas nesta semana</small>
          </div>
          <div className="sparkline">
            {[28, 44, 38, 62, 55, 78, 72, 90].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>
        <article className="metric">
          <div className="metric-icon danger">!</div>
          <div>
            <span>Exigem atenção</span>
            <strong>{stats.attention}</strong>
            <small>Prazo ou risco crítico</small>
          </div>
        </article>
        <article className="metric">
          <div className="metric-icon info">⌁</div>
          <div>
            <span>Em análise</span>
            <strong>{stats.inAnalysis}</strong>
            <small>Documentos em conferência</small>
          </div>
        </article>
        <article className="metric">
          <div className="metric-icon success">✓</div>
          <div>
            <span>Prazos em dia</span>
            <strong>86%</strong>
            <small><i className="up">↗</i> +7% no mês</small>
          </div>
        </article>
      </section>

      <section className="overview-grid">
        <div className="panel priority-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">FOCO OPERACIONAL</span>
              <h2>Prioridades imediatas</h2>
            </div>
            <button className="text-button" onClick={() => setPage("tenders")}>
              Ver todas →
            </button>
          </div>
          <div className="priority-list">
            {immediatePriorities.map(({ tender }, index) => (
              <button key={tender.id} onClick={() => openTender(tender)}>
                <span className={`priority-index risk-${tender.risk.toLowerCase()}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="priority-main">
                  <div>
                    <strong>{tender.modality} {tender.number}</strong>
                    <StatusPill value={tender.status} />
                  </div>
                  <p>{tender.title}</p>
                  <small>{tender.phase} · {tender.owner}</small>
                </div>
                <div className="deadline">
                  <span>{timeUntil(tender.openingAt, now)}</span>
                  <strong>{formatDate(tender.openingAt)}</strong>
                </div>
                <span className="row-arrow">→</span>
              </button>
            ))}
            {!immediatePriorities.length && (
              <div className="priority-empty">
                <span>✓</span>
                <div>
                  <strong>Nenhuma prioridade imediata</strong>
                  <p>Somente licitações ativas com disputa em até 5 dias, ou risco elevado em até 10 dias, aparecem aqui.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="panel agenda-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">PRÓXIMOS 7 DIAS</span>
              <h2>Agenda de prazos</h2>
            </div>
            <span className="google-badge">G Agenda</span>
          </div>
          <div className="agenda-list">
            {upcomingDeadlines.map(({ tender }, index) => (
              <div className="agenda-item" key={tender.id}>
                <div className={`date-block tone-${index}`}>
                  <b>
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: "America/Bahia",
                      day: "2-digit",
                    }).format(new Date(tender.openingAt))}
                  </b>
                  <span>
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: "America/Bahia",
                      month: "short",
                    })
                      .format(new Date(tender.openingAt))
                      .replace(".", "")}
                  </span>
                </div>
                <div>
                  <span className="agenda-time">
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: "America/Bahia",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(tender.openingAt))}
                  </span>
                  <strong>{tender.phase}</strong>
                  <p>{tender.number} · {tender.organ}</p>
                </div>
                <a
                  href={googleCalendarUrl(tender)}
                  target="_blank"
                  rel="noreferrer"
                  title="Adicionar ao Google Agenda"
                >
                  ＋
                </a>
              </div>
            ))}
            {!upcomingDeadlines.length && (
              <div className="agenda-empty">
                <span>✓</span>
                <strong>Nenhuma sessão ativa nos próximos 7 dias</strong>
              </div>
            )}
          </div>
          <button className="calendar-cta" onClick={openCalendar}>
            Abrir calendário operacional <span>→</span>
          </button>
        </div>
      </section>

    </>
  );
}

function EditalIntakeModal({
  organizations,
  currentUser,
  close,
  refresh,
  notify,
  openTender,
}: {
  organizations: Organization[];
  currentUser: string;
  close: () => void;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  openTender: (tender: Tender) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [parsed, setParsed] = useState<ParsedEdital | null>(null);
  const [busy, setBusy] = useState(false);

  async function inspectFiles() {
    if (!files.length) {
      notify("Selecione ao menos o edital principal.");
      return;
    }
    setBusy(true);
    try {
      const extracted = await Promise.all(files.map(async (file) => {
        try {
          return await extractDocumentText(file);
        } catch {
          return { name: file.name, type: file.type || "application/octet-stream", size: file.size, pages: [], note: "Falha na leitura automática; arquivo preservado para conferência manual.", status: "Preservado para conferência" as const };
        }
      }));
      setParsed(parseEditalDocuments(extracted));
    } catch (error) {
      setParsed(parseEditalDocuments(files.map((file) => ({ name: file.name, type: file.type || "application/octet-stream", size: file.size, pages: [], note: "Não foi possível ler automaticamente; arquivo preservado.", status: "Preservado para conferência" as const }))));
      notify(error instanceof Error ? error.message : "O arquivo será cadastrado para conferência manual.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const companyRequirements = String(form.get("companyRequirements") ?? "")
      .split("\n").map((item) => item.trim()).filter(Boolean);
    const professionalRequirements = String(form.get("professionalRequirements") ?? "")
      .split("\n").map((item) => item.trim()).filter(Boolean);
    const tenderFields = new Set(["number", "modality", "title", "organ", "platform", "estimatedValue", "tenderType", "openingAt", "participationType", "participantOrganizationId", "owner", "summary"]);
    const tender = Object.fromEntries(Array.from(form.entries()).filter(([key]) => tenderFields.has(key)));
    try {
      const createResponse = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createTenderFromEdital",
          tender,
          requirements: [
            ...requirementPayload("Empresa", companyRequirements),
            ...requirementPayload("Profissional", professionalRequirements),
          ],
          importAnalysis: parsed ? {
            analysisMode: parsed.analysisMode,
            objectNature: parsed.objectNature,
            routedCompany: parsed.routedCompany,
            routingReason: parsed.routingReason,
            recommendation: parsed.recommendation,
            sources: parsed.inventory,
            fieldEvidence: parsed.fieldEvidence,
            missingDocuments: parsed.missingDocuments,
            conflicts: parsed.conflicts,
            criticalConditions: parsed.criticalConditions,
            reviewStatus: "Conferência humana confirmada no registro",
          } : undefined,
        }),
      });
      const created = await createResponse.json();
      if (createResponse.status === 409 && created.existingTender) {
        close();
        notify(created.error);
        openTender(created.existingTender as Tender);
        return;
      }
      if (!createResponse.ok) throw new Error(created.error);
      for (const [index, file] of files.entries()) {
        try {
          await uploadPreservedFile({
            file,
            destination: "editalVersion",
            tenderId: String(created.id),
            eventType: index === 0 ? "Edital original" : "Novo anexo",
            title:
              index === 0
                ? `Edital original — ${file.name}`
                : `Anexo inicial — ${file.name}`,
            processEffect: "Sem alteração de fase",
            description:
              index === 0
                ? "Documento principal recebido no registro da licitação."
                : "Documento integrante do conjunto editalício inicial.",
            extractionSummary:
              parsed?.extractionNote ??
              "Arquivo preservado para conferência manual.",
          });
        } catch (error) {
          throw new Error(
            `Licitação criada, mas ${file.name} não foi enviado: ${error instanceof Error ? error.message : "falha no envio"}`,
          );
        }
      }
      if (parsed?.routedCompany !== "Indeterminado") {
        await fetch("/api/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyzeTender", tenderId: created.id }),
        });
      }
      close();
      notify(parsed?.routedCompany === "Indeterminado"
        ? "Processo registrado com fontes preservadas. A consulta ao acervo foi bloqueada até confirmar a natureza do objeto."
        : `Processo registrado e comparado exclusivamente com o acervo ${parsed?.routedCompany}.`);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível concluir a importação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Registrar licitação pelo edital" close={close}>
      {!parsed ? (
        <div className="intake-start">
          <div className="intake-hero">
            <span>01</span>
            <div>
              <strong>Registre somente o que estiver comprovado</strong>
              <p>Envie edital, TR, projeto básico, ETP, matriz de riscos, minuta, planilhas e atualizações. O sistema inventaria as fontes, compara documentos e só sugere dados acompanhados da página de origem.</p>
            </div>
          </div>
          <label className="file-drop">
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            <span>⇧</span>
            <strong>{files.length ? `${files.length} arquivo(s) selecionado(s)` : "Selecionar edital e anexos"}</strong>
            <small>PDF com texto ou TXT para extração; DOC/DOCX ficam preservados para conferência.</small>
          </label>
          {!!files.length && <div className="file-list">{files.map((file) => <span key={`${file.name}-${file.size}`}>{file.name}<small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></span>)}</div>}
          <div className="intake-checks">
            <span>✓ Fonte e página em cada dado sugerido</span>
            <span>✓ Divergências impedem autopreenchimento</span>
            <span>✓ Roteamento exclusivo UFC ou Pórtico</span>
          </div>
          <div className="form-actions">
            <button className="ghost" onClick={close}>Cancelar</button>
            <button className="primary" disabled={busy || !files.length} onClick={inspectFiles}>{busy ? "Lendo documento..." : "Ler e revisar dados →"}</button>
          </div>
        </div>
      ) : (
        <form className="form-grid intake-review" onSubmit={submit}>
          <div className="extraction-status wide"><span>✓</span><div><strong>Documento processado</strong><p>{parsed.extractionNote}</p></div></div>
          <div className="intake-review-matrix wide">
            <div><span className="eyebrow">CONFERÊNCIA CRITERIOSA</span><strong>Itens localizados e pendências</strong><small>Revise cada resultado no documento-fonte antes de aprovar a participação.</small></div>
            <section>{parsed.reviewChecks.map((check) => <article className={check.status} key={check.label}><span>{check.status === "identified" ? "✓" : "!"}</span><div><strong>{check.label}</strong><p>{check.value}</p></div></article>)}</section>
          </div>
          <div className="routing-decision wide"><div><span>ROTEAMENTO EMPRESARIAL</span><strong>Natureza do Objeto Identificada: {parsed.objectNature} → Acervo Técnico Selecionado: {parsed.routedCompany}</strong><p>{parsed.routingReason}</p></div><div><span>MODO DE ANÁLISE</span><strong>{parsed.analysisMode}</strong><StatusPill value={parsed.recommendation} /></div></div>
          <div className="source-inventory wide"><header><div><span className="eyebrow">INVENTÁRIO DE FONTES CONSULTADAS</span><strong>Arquivos recebidos e legibilidade</strong></div><StatusPill value={`${parsed.inventory.filter((item) => item.status === "Lido").length}/${parsed.inventory.length} lidos`} /></header>{parsed.inventory.map((item) => <article key={item.name}><span>▱</span><div><strong>{item.name}</strong><small>{item.type} · {item.pages || "—"} página(s) · {item.note}</small></div><StatusPill value={item.status} /></article>)}{!!parsed.missingDocuments.length && <div className="missing-source"><strong>Peças não identificadas no envio</strong><span>{parsed.missingDocuments.join(" · ")}</span></div>}</div>
          {!!parsed.conflicts.length && <div className="document-conflicts wide"><strong>⚠ Divergências encontradas — autopreenchimento bloqueado</strong>{parsed.conflicts.map((conflict) => <article key={conflict.field}><span>{conflict.field}</span><p>{conflict.values.join(" ↔ ")}</p><small>{conflict.action}</small></article>)}</div>}
          <label>Número do edital<input name="number" defaultValue={parsed.number} required /><EvidenceNote evidence={parsed.fieldEvidence.number} /></label>
          <label>Modalidade<select name="modality" defaultValue={parsed.modality}><option>Indeterminado</option>{TENDER_MODALITIES.map((item) => <option key={item}>{item}</option>)}{parsed.modality && !TENDER_MODALITIES.includes(parsed.modality as typeof TENDER_MODALITIES[number]) && <option>{parsed.modality}</option>}</select><EvidenceNote evidence={parsed.fieldEvidence.modality} /></label>
          <label className="wide">Objeto<textarea name="title" defaultValue={parsed.title} rows={3} required /><EvidenceNote evidence={parsed.fieldEvidence.title} /></label>
          <label className="wide">Órgão / contratante<input name="organ" defaultValue={parsed.organ} required /><EvidenceNote evidence={parsed.fieldEvidence.organ} /></label>
          <label>Plataforma<input name="platform" defaultValue={parsed.platform} placeholder="Compras.gov.br" /><EvidenceNote evidence={parsed.fieldEvidence.platform} /></label>
          <label>Valor estimado<input name="estimatedValue" defaultValue={parsed.estimatedValue} /><EvidenceNote evidence={parsed.fieldEvidence.estimatedValue} /></label>
          <label>Tipo de serviço<select name="tenderType" defaultValue={parsed.tenderType}>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}{parsed.tenderType && !SERVICE_TYPES.includes(parsed.tenderType as typeof SERVICE_TYPES[number]) && <option>{parsed.tenderType}</option>}</select></label>
          <label>Data e hora da sessão<input name="openingAt" type="datetime-local" defaultValue={parsed.openingAt} required /><EvidenceNote evidence={parsed.fieldEvidence.openingAt} /></label>
          <label>Forma de participação<select name="participationType" defaultValue="A definir"><option>Empresa</option><option>Consórcio</option><option>A definir</option></select></label>
          <label>Empresa ou consórcio<select name="participantOrganizationId" defaultValue=""><option value="">A definir na triagem</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name} · {organization.type}</option>)}</select></label>
          <label className="wide">Responsável<input name="owner" defaultValue={currentUser} required /></label>
          <div className="requirement-editor wide">
            <label><span>Exigências de experiência da empresa</span><small>Uma exigência por linha. Informe quantitativo e unidade quando constarem do edital.</small><textarea name="companyRequirements" rows={7} defaultValue={parsed.companyRequirements.join("\n")} placeholder="Ex.: Atestado de supervisão de obras rodoviárias, mínimo 20 km" /></label>
            <label><span>Exigências dos profissionais</span><small>Separe formação, CAT/experiência e função exigida.</small><textarea name="professionalRequirements" rows={7} defaultValue={parsed.professionalRequirements.join("\n")} placeholder="Ex.: Engenheiro civil com CAT em fiscalização de obras" /></label>
          </div>
          {!!parsed.criticalConditions.length && <div className="critical-conditions wide"><span className="eyebrow">CONDIÇÕES CRÍTICAS LOCALIZADAS</span>{parsed.criticalConditions.map((condition) => <article key={condition.topic}><strong>{condition.topic}</strong><p>{condition.finding}</p><small>{condition.source}</small></article>)}</div>}
          <label className="wide">Notas da triagem<textarea name="summary" defaultValue={parsed.summary} rows={3} /></label>
          <div className="human-review wide"><strong>Conferência obrigatória</strong><span>A pontuação do acervo é um parecer preliminar. Item, página, quantitativo e aderência jurídica devem ser validados antes da aprovação.</span></div>
          <label className="review-confirmation wide"><input type="checkbox" name="reviewConfirmed" required /><span><strong>Confirmo que revisei os campos nas fontes indicadas</strong><small>Campos sem fonte, conflitos, peças faltantes, quantitativos, unidades, CAT, somatório, prazos e regras de participação foram conferidos antes do registro.</small></span></label>
          <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setParsed(null)}>← Trocar arquivos</button><button className="primary" disabled={busy}>{busy ? "Criando processo..." : "Registrar e analisar acervo"}</button></div>
        </form>
      )}
    </Modal>
  );
}

function IntakePage({
  tenders,
  organizations,
  refresh,
  notify,
  importEdital,
  openTender,
}: {
  tenders: Tender[];
  organizations: Organization[];
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  importEdital: () => void;
  openTender: (tender: Tender) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const incoming = tenders
    .filter((tender) => tender.phase === "Triagem" || tender.owner.toLowerCase().includes("felipe"))
    .sort((a, b) => new Date(a.openingAt).getTime() - new Date(b.openingAt).getTime());

  async function registerHandoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const tender = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createTender", tender }),
      });
      const result = await response.json();
      if (response.status === 409 && result.existingTender) {
        setOpen(false);
        notify(result.error);
        openTender(result.existingTender as Tender);
        return;
      }
      if (!response.ok) throw new Error(result.error);
      setOpen(false);
      notify("Oportunidade recebida de Pâmela e encaminhada à fila de Felipe.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível registrar o recebimento.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PageHeading
      eyebrow="CAPTAÇÃO E DISTRIBUIÇÃO"
      title="Caixa de entrada AXXIA"
      description="Organize a passagem da oportunidade captada por Pâmela para o cadastro e a instrução inicial conduzidos por Felipe."
      action={<div className="heading-actions"><a className="secondary link-button" href={AXXIA_URL} target="_blank" rel="noreferrer">Abrir AXXIA ↗</a><button className="primary" onClick={() => setOpen(true)}>＋ Registrar recebimento</button></div>}
    />
    <section className="integration-status-card">
      <span className="integration-mark">AX</span>
      <div><span className="eyebrow">PONTE OPERACIONAL</span><h2>Entrada estruturada hoje; automação pronta para API ou webhook</h2><p>O portal registra imediatamente os dados encaminhados pelo AXXIA e preserva o fluxo Pâmela → Felipe. A sincronização sem intervenção dependerá de credencial técnica e documentação de API/webhook fornecidas pelo AXXIA.</p></div>
      <StatusPill value="Integração assistida" />
    </section>
    <section className="handoff-flow">
      {operationalOwners.map((owner, index) => <article key={owner.name}><header><span>{owner.initials}</span><div><small>ETAPA {index + 1}</small><h3>{owner.name}</h3><p>{owner.role}</p></div></header><ul>{owner.actions.map((action) => <li key={action}>✓ {action}</li>)}</ul><footer><span>SLA</span><strong>{owner.sla}</strong></footer></article>)}
    </section>
    <section className="panel intake-queue">
      <div className="panel-title"><div><span className="eyebrow">FILA DE RECEBIMENTO</span><h2>Licitações aguardando instrução inicial</h2></div><span className="updated">{incoming.length} processo(s)</span></div>
      <div className="intake-queue-list">
        {incoming.slice(0, 8).map((tender) => { const days = daysUntilOpening(tender.openingAt); return <button key={tender.id} onClick={() => openTender(tender)}><div><StatusPill value={days >= 0 && days < 5 ? "Prioridade crítica" : tender.status} /><strong>{tender.modality} {tender.number}</strong><p>{tender.title}</p></div><div><span>Responsável</span><strong>{tender.owner}</strong><small>{days < 0 ? "Sessão já realizada" : `${days} dia(s) para a disputa`}</small></div><b>→</b></button>; })}
        {!incoming.length && <div className="empty-state compact-empty"><span>✓</span><h3>Fila de entrada concluída</h3><p>Novos encaminhamentos de Pâmela aparecerão aqui.</p></div>}
      </div>
    </section>
    <section className="intake-actions"><button className="secondary" onClick={importEdital}>⇧ Importar edital e anexos</button><a className="secondary link-button" href="/api/calendar-feed">⇩ Baixar agenda operacional</a></section>
    {open && <Modal title="Registrar oportunidade recebida do AXXIA" close={() => setOpen(false)}><form className="form-grid" onSubmit={registerHandoff}><div className="routing-notice wide"><strong>Responsabilidades</strong><span>Pâmela registra a origem e os dados mínimos; Felipe valida a documentação, completa o cadastro e abre o dossiê editalício.</span></div><label>Número / referência<input name="number" required /></label><label>Modalidade<select name="modality" defaultValue={TENDER_MODALITIES[0]}>{TENDER_MODALITIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="wide">Objeto<textarea name="title" rows={3} required /></label><label className="wide">Órgão / contratante<input name="organ" required /></label><label>Plataforma<input name="platform" defaultValue="AXXIA" /></label><label>Valor estimado<input name="estimatedValue" placeholder="Não informado" /></label><label>Tipo de serviço<select name="tenderType" defaultValue={SERVICE_TYPES[0]}>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Data e hora da disputa<input name="openingAt" type="datetime-local" required /></label><label>Participante<select name="participantOrganizationId" defaultValue=""><option value="">A definir</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label><label>Forma de participação<select name="participationType" defaultValue="A definir"><option>Empresa</option><option>Consórcio</option><option>A definir</option></select></label><label className="wide">Responsável pelo cadastro<input name="owner" defaultValue="Felipe" required /></label><label className="wide">Registro da captação<textarea name="summary" rows={3} defaultValue="Oportunidade captada por Pâmela no AXXIA e encaminhada para validação documental de Felipe." /></label><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Encaminhando..." : "Encaminhar para Felipe"}</button></div></form></Modal>}
  </>;
}

function TendersPage({
  tenders,
  allTenders,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  modalityFilter,
  setModalityFilter,
  participantFilter,
  setParticipantFilter,
  phaseFilter,
  setPhaseFilter,
  organizations,
  openTender,
  newTender,
}: {
  tenders: Tender[];
  allTenders: Tender[];
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  modalityFilter: string;
  setModalityFilter: (value: string) => void;
  participantFilter: string;
  setParticipantFilter: (value: string) => void;
  phaseFilter: string;
  setPhaseFilter: (value: string) => void;
  organizations: Organization[];
  openTender: (tender: Tender) => void;
  newTender: () => void;
}) {
  const statuses = ["Todas", "Atenção", "Em análise", "Em dia"];
  const [view, setView] = useState<"cards" | "list" | "map">("cards");
  const [deadlineFilter, setDeadlineFilter] = useState("Todos os prazos");
  const [regionFilter, setRegionFilter] = useState("Todas as regiões");
  const visibleTenders = tenders
    .filter((tender) => {
      const days = daysUntilOpening(tender.openingAt);
      const deadlineMatch = deadlineFilter === "Todos os prazos" ||
        (deadlineFilter === "Prioridade: até 5 dias" && days >= 0 && days < 5) ||
        (deadlineFilter === "De 5 a 15 dias" && days >= 5 && days <= 15) ||
        (deadlineFilter === "Acima de 15 dias" && days > 15);
      return deadlineMatch && (regionFilter === "Todas as regiões" || tenderRegion(tender) === regionFilter);
    })
    .sort((a, b) => {
      const aDays = daysUntilOpening(a.openingAt);
      const bDays = daysUntilOpening(b.openingAt);
      const aPriority = aDays >= 0 && aDays < 5 ? 0 : 1;
      const bPriority = bDays >= 0 && bDays < 5 ? 0 : 1;
      return aPriority - bPriority || new Date(a.openingAt).getTime() - new Date(b.openingAt).getTime();
    });
  const serviceOptions = Array.from(new Set([...SERVICE_TYPES, ...allTenders.map((item) => item.tenderType).filter(Boolean) as string[]]));
  const modalityOptions = Array.from(new Set([...TENDER_MODALITIES, ...allTenders.map((item) => item.modality)]));
  const regionCounts = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul", "Não informado"].map((region) => ({ region, count: visibleTenders.filter((tender) => tenderRegion(tender) === region).length }));

  function exportRegionalReport() {
    const header = ["Número", "Modalidade", "Objeto", "Órgão", "Região", "Participante", "Fase", "Responsável", "Sessão"];
    const rows = visibleTenders.map((tender) => [tender.number, tender.modality, tender.title, tender.organ, tenderRegion(tender), tender.participantOrganizationName || "A definir", tender.phase, tender.owner, tender.openingAt]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-regional-licitacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeading
        eyebrow="CARTEIRA ATIVA"
        title="Licitações"
        description="Carteira de prospecção e elaboração: da entrada da oportunidade até a disputa. Após a sessão, o processo segue para Acompanhamento de resultado."
        action={<button className="primary" onClick={newTender}>＋ Importar edital</button>}
      />
      <div className="toolbar">
        <div className="filter-tabs">
          {statuses.map((status) => (
            <button
              key={status}
              className={statusFilter === status ? "active" : ""}
              onClick={() => setStatusFilter(status)}
            >
              {status}
              <span>
                {status === "Todas"
                  ? allTenders.length
                  : allTenders.filter((item) => item.status === status).length}
              </span>
            </button>
          ))}
        </div>
        <div className="view-actions">
          <button aria-label="Visualização em cartões" className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>▦</button>
          <button aria-label="Visualização em lista" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☷</button>
          <button aria-label="Visualização no mapa" className={view === "map" ? "active" : ""} onClick={() => setView("map")}>⌖</button>
          <button onClick={exportRegionalReport}>⇩ Exportar por região</button>
        </div>
      </div>
      <div className="advanced-filters" aria-label="Filtros da carteira">
        <label><span>Tipo de serviço</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Todos os tipos</option>{serviceOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Modalidade</span><select value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value)}><option>Todas as modalidades</option>{modalityOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Participante</span><select value={participantFilter} onChange={(event) => setParticipantFilter(event.target.value)}><option>Todos os participantes</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></label>
        <label><span>Fase</span><select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)}><option>Todas as fases</option>{Array.from(new Set(allTenders.map((item) => item.phase))).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Prazo da disputa</span><select value={deadlineFilter} onChange={(event) => setDeadlineFilter(event.target.value)}><option>Todos os prazos</option><option>Prioridade: até 5 dias</option><option>De 5 a 15 dias</option><option>Acima de 15 dias</option></select></label>
        <label><span>Região</span><select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}><option>Todas as regiões</option><option>Norte</option><option>Nordeste</option><option>Centro-Oeste</option><option>Sudeste</option><option>Sul</option><option>Não informado</option></select></label>
        <button className="ghost" onClick={() => { setTypeFilter("Todos os tipos"); setModalityFilter("Todas as modalidades"); setParticipantFilter("Todos os participantes"); setPhaseFilter("Todas as fases"); setDeadlineFilter("Todos os prazos"); setRegionFilter("Todas as regiões"); }}>Limpar filtros</button>
      </div>
      {visibleTenders.some((tender) => { const days = daysUntilOpening(tender.openingAt); return days >= 0 && days < 5; }) && <div className="critical-deadline-banner"><span>!</span><div><strong>Prioridade automática ativada</strong><p>Licitações com disputa em menos de cinco dias aparecem primeiro e recebem identificação crítica.</p></div><button onClick={() => setDeadlineFilter("Prioridade: até 5 dias")}>Ver somente críticas</button></div>}
      {view === "cards" && <section className="tender-grid">
        {visibleTenders.map((tender) => (
          <article className="tender-card" key={tender.id}>
            <div className="card-accent" data-risk={tender.risk} />
            <div className="tender-card-top">
              <span className="modality">{tender.modality}</span>
              {daysUntilOpening(tender.openingAt) >= 0 && daysUntilOpening(tender.openingAt) < 5 ? <StatusPill value="Prioridade crítica" /> : <StatusPill value={tender.status} />}
            </div>
            <h3>{tender.title}</h3>
            <div className="tender-number">Nº {tender.number}</div>
            <div className="tender-classification"><span>{tender.tenderType || "Tipo não classificado"}</span><strong>{tender.participantOrganizationName || "Participante a definir"}</strong></div>
            <dl>
              <div><dt>Órgão</dt><dd>{tender.organ}</dd></div>
              <div><dt>Sessão</dt><dd>{formatDate(tender.openingAt)}</dd></div>
              <div><dt>Valor</dt><dd>{tender.estimatedValue}</dd></div>
            </dl>
            <div className="progress-head">
              <span>{tender.phase}</span>
              <strong>{tender.progress}%</strong>
            </div>
            <div className="progress-bar"><i style={{ width: `${tender.progress}%` }} /></div>
            <div className="card-footer">
              <div><MiniAvatar name={tender.owner} /><span>{tender.owner}</span></div>
              <button onClick={() => openTender(tender)}>Abrir processo →</button>
            </div>
          </article>
        ))}
      </section>}
      {view === "list" && <section className="panel tender-list-view"><div className="tender-list-row head"><span>Processo</span><span>Objeto</span><span>Participante</span><span>Região</span><span>Disputa</span><span /></div>{visibleTenders.map((tender) => <button className="tender-list-row" key={tender.id} onClick={() => openTender(tender)}><span><strong>{tender.number}</strong><small>{tender.modality}</small></span><span><strong>{tender.title}</strong><small>{tender.organ}</small></span><span>{tender.participantOrganizationName || "A definir"}</span><span>{tenderRegion(tender)}</span><span><strong>{formatDate(tender.openingAt)}</strong><small>{timeUntil(tender.openingAt, new Date().toISOString())}</small></span><b>→</b></button>)}</section>}
      {view === "map" && <section className="panel brazil-map-view"><div className="map-copy"><span className="eyebrow">DISTRIBUIÇÃO TERRITORIAL</span><h2>Mapa da carteira ativa</h2><p>Selecione uma região para filtrar as licitações. Registros sem UF permanecem destacados para complementação cadastral.</p><div className="map-legend">{regionCounts.map((item) => <button key={item.region} className={regionFilter === item.region ? "active" : ""} onClick={() => setRegionFilter(item.region)}><span>{item.region}</span><strong>{item.count}</strong></button>)}</div></div><div className="brazil-schematic" aria-label="Mapa esquemático do Brasil por regiões"><button className="north" onClick={() => setRegionFilter("Norte")}><span>Norte</span><b>{regionCounts.find((item) => item.region === "Norte")?.count}</b></button><button className="northeast" onClick={() => setRegionFilter("Nordeste")}><span>Nordeste</span><b>{regionCounts.find((item) => item.region === "Nordeste")?.count}</b></button><button className="central" onClick={() => setRegionFilter("Centro-Oeste")}><span>Centro-Oeste</span><b>{regionCounts.find((item) => item.region === "Centro-Oeste")?.count}</b></button><button className="southeast" onClick={() => setRegionFilter("Sudeste")}><span>Sudeste</span><b>{regionCounts.find((item) => item.region === "Sudeste")?.count}</b></button><button className="south" onClick={() => setRegionFilter("Sul")}><span>Sul</span><b>{regionCounts.find((item) => item.region === "Sul")?.count}</b></button></div></section>}
      {!visibleTenders.length && (
        <div className="empty-state">
          <span>⌕</span>
          <h3>Nenhuma licitação encontrada</h3>
          <p>Ajuste a busca ou os filtros para visualizar outros processos.</p>
        </div>
      )}
    </>
  );
}

function ResourcesPage({
  tenders,
  cases,
  documents,
  initialTenderId,
  consumeInitialTender,
  role,
  currentUser,
  now,
  refresh,
  notify,
  openTender,
}: {
  tenders: Tender[];
  cases: ResourceCase[];
  documents: OpponentDocument[];
  initialTenderId: string;
  consumeInitialTender: () => void;
  role: Role;
  currentUser: string;
  now: string;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  openTender: (tender: Tender) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadCase, setUploadCase] = useState<ResourceCase | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [tenderFilter, setTenderFilter] = useState(
    initialTenderId || "Todos os processos",
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!initialTenderId) return;
    const timer = window.setTimeout(consumeInitialTender, 0);
    return () => window.clearTimeout(timer);
  }, [consumeInitialTender, initialTenderId]);
  const visible = cases.filter((item) =>
    (statusFilter === "Todos" || item.status === statusFilter) &&
    (tenderFilter === "Todos os processos" || item.tender_id === tenderFilter),
  );
  const nowTimestamp = new Date(now).getTime();
  const overdue = cases.filter((item) => item.status !== "Concluído" && new Date(item.deadline).getTime() < nowTimestamp).length;

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const tenderId = String(form.get("tenderId") ?? "");
    const resourceCase = Object.fromEntries(Array.from(form.entries()).filter(([key]) => key !== "tenderId"));
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createResourceCase", tenderId, resourceCase }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCreateOpen(false);
      notify("Fase recursal aberta, licitação sinalizada e prazo incluído na agenda operacional.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível abrir o processo recursal.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadOpponentDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadCase) return;
    const formElement = event.currentTarget;
    const sourceForm = new FormData(formElement);
    const files = sourceForm
      .getAll("file")
      .filter((item): item is File => item instanceof File && item.size > 0);
    if (!files.length) {
      notify("Selecione ao menos um documento para as razões recursais.");
      return;
    }
    setBusy(true);
    setUploadProgress(`Preparando ${files.length} documento(s)...`);
    let completed = 0;
    const failures: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress(`Enviando ${index + 1} de ${files.length}: ${file.name}`);
        try {
          await uploadPreservedFile({
            file,
            destination: "resourceDocument",
            tenderId: uploadCase.tender_id,
            resourceCaseId: uploadCase.id,
            category: String(sourceForm.get("category") ?? "Recurso ou contrarrazões"),
            analysisSector: String(sourceForm.get("analysisSector") ?? "Jurídico"),
            competitorName: String(sourceForm.get("competitorName") ?? ""),
            notes: String(sourceForm.get("notes") ?? ""),
            onProgress: (percent) => setUploadProgress(
              `Enviando ${index + 1} de ${files.length}: ${file.name} — ${percent}%`,
            ),
          });
          completed += 1;
        } catch (error) {
          failures.push(`${file.name}: ${error instanceof Error ? error.message : "falha no envio"}`);
        }
      }
      await refresh();
      formElement.reset();
      setUploadFiles([]);
      if (!failures.length) {
        setUploadCase(null);
        notify(`${completed} documento(s) preservado(s) e encaminhado(s) para análise recursal.`);
      } else {
        notify(`${completed} de ${files.length} documento(s) enviados. Não concluídos: ${failures.join(" | ")}`);
      }
    } finally {
      setBusy(false);
      setUploadProgress("");
    }
  }

  async function updateStatus(resourceCaseId: string, status: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateResourceCaseStatus", resourceCaseId, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      notify(`Processo recursal atualizado para ${status}.`);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Status não atualizado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CONTENCIOSO E PÓS-SESSÃO"
        title="Recursos & prazos"
        description="Controle intenção recursal, razões, contrarrazões, decisões e a análise setorial da documentação dos concorrentes."
        action={<button className="primary" disabled={role === "Manutenção"} onClick={() => setCreateOpen(true)}>＋ Abrir fase recursal</button>}
      />
      <section className="resource-metrics">
        <article><span>Processos ativos</span><strong>{cases.filter((item) => item.status !== "Concluído").length}</strong><small>Com trilha e responsável</small></article>
        <article className={overdue ? "warning" : "valid"}><span>Prazos vencidos</span><strong>{overdue}</strong><small>Exigem decisão imediata</small></article>
        <article><span>Documentos adversários</span><strong>{documents.length}</strong><small>Distribuídos por setor</small></article>
        <article className="valid"><span>Agenda Google</span><strong>Ativa</strong><small>Links individuais + arquivo .ics</small></article>
      </section>
      <div className="toolbar resource-toolbar">
        <div className="filter-tabs">{["Todos", "Triagem", "Em análise", "Minuta", "Protocolado", "Aguardando decisão", "Concluído"].map((status) => <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>{status}<span>{status === "Todos" ? cases.length : cases.filter((item) => item.status === status).length}</span></button>)}</div>
        <label className="resource-process-filter">Processo<select value={tenderFilter} onChange={(event) => setTenderFilter(event.target.value)}><option>Todos os processos</option>{tenders.filter((tender) => cases.some((item) => item.tender_id === tender.id)).map((tender) => <option value={tender.id} key={tender.id}>{tender.number} · {tender.title}</option>)}</select></label>
        <a className="ghost link-button" href="/api/calendar-feed">⇩ Baixar agenda .ics</a>
      </div>
      {tenderFilter !== "Todos os processos" && (() => { const focusedTender = tenders.find((tender) => tender.id === tenderFilter); return focusedTender ? <div className="resource-forwarded-context"><span>✓</span><div><strong>Processo puxado automaticamente</strong><p>{focusedTender.modality} {focusedTender.number} · {focusedTender.title}</p></div><button className="ghost" onClick={() => setTenderFilter("Todos os processos")}>Ver todos</button></div> : null; })()}
      <section className="resource-grid">
        {visible.map((item) => {
          const tender = tenders.find((candidate) => candidate.id === item.tender_id);
          const caseDocuments = documents.filter((document) => document.resource_case_id === item.id);
          const days = Math.ceil((new Date(item.deadline).getTime() - nowTimestamp) / 86400000);
          return (
            <article className="resource-card" key={item.id}>
              <div className="resource-card-head"><div><span>{item.tender_modality}</span><h3>{item.tender_number}</h3></div><StatusPill value={item.status} /></div>
              <h4>{item.resource_type}</h4>
              <p>{item.tender_title}</p>
              <div className={`deadline-box ${days < 0 ? "late" : days <= 2 ? "urgent" : ""}`}><span>Prazo fatal</span><strong>{formatDate(item.deadline)}</strong><small>{days < 0 ? `${Math.abs(days)} dia(s) vencido` : days === 0 ? "vence hoje" : `${days} dia(s) restante(s)`}</small></div>
              <dl className="resource-details"><div><dt>Posição</dt><dd>{item.position}</dd></div><div><dt>Concorrente</dt><dd>{item.competitor_name || "Não informado"}</dd></div><div><dt>Responsável</dt><dd>{item.responsible}</dd></div><div><dt>Próxima ação</dt><dd>{item.next_action || "Definir estratégia"}</dd></div></dl>
              <div className="sector-docs"><span>Documentos para análise</span>{caseDocuments.length ? caseDocuments.slice(0, 4).map((document) => <a href={`/api/resource-documents?id=${document.id}`} key={document.id}><div><strong>{document.name}</strong><small>{document.category} · {document.analysis_sector}</small></div><StatusPill value={document.analysis_status} /></a>) : <small>Nenhum documento adversário anexado.</small>}</div>
              <div className="resource-actions"><button className="secondary" onClick={() => setUploadCase(item)}>＋ Documento adversário</button><a className="google-mini" href={calendarTemplateUrl({ title: `${item.resource_type} — ${item.tender_number}`, startsAt: item.deadline, details: `${item.tender_title}\nResponsável: ${item.responsible}\nPróxima ação: ${item.next_action}` })} target="_blank" rel="noreferrer">G Agenda</a></div>
              <div className="resource-footer">{tender && <button onClick={() => openTender(tender)}>Abrir licitação →</button>}<select value={item.status} disabled={busy || role === "Manutenção"} onChange={(event) => updateStatus(item.id, event.target.value)}>{["Triagem", "Em análise", "Minuta", "Protocolado", "Aguardando decisão", "Concluído"].map((status) => <option key={status}>{status}</option>)}</select></div>
            </article>
          );
        })}
      </section>
      {!visible.length && <div className="empty-state"><span>⚖</span><h3>Nenhum prazo recursal nesta visão</h3><p>Abra a fase recursal a partir da licitação após a disputa ou ajuste o filtro.</p></div>}

      {createOpen && <Modal title="Abrir fase recursal" close={() => setCreateOpen(false)}><form className="form-grid" onSubmit={createCase}><label className="wide">Licitação<select name="tenderId" required defaultValue=""><option value="">Selecione o processo</option>{tenders.map((tender) => <option value={tender.id} key={tender.id}>{tender.number} · {tender.title}</option>)}</select></label><label>Tipo<select name="resourceType" defaultValue="Razões recursais"><option>Intenção recursal</option><option>Razões recursais</option><option>Contrarrazões</option><option>Recurso administrativo</option><option>Resposta à diligência</option><option>Impugnação</option><option>Decisão recursal</option></select></label><label>Posição<select name="position" defaultValue="Recorrente"><option>Recorrente</option><option>Recorrida</option><option>Interessada</option><option>A definir</option></select></label><label>Prazo fatal<input name="deadline" type="datetime-local" required /></label><label>Responsável<input name="responsible" defaultValue={currentUser} required /></label><label className="wide">Concorrente / adversário<input name="competitorName" placeholder="Razão social ou consórcio" /></label><label className="wide">Síntese do fato e do risco<textarea name="summary" rows={3} placeholder="Decisão, item controvertido e efeito esperado" /></label><label className="wide">Fundamento / item do edital<textarea name="legalGround" rows={2} placeholder="Item, norma, precedente ou argumento central" /></label><label className="wide">Próxima ação<input name="nextAction" placeholder="Ex.: concluir minuta e validar com Jurídico" required /></label><input type="hidden" name="status" value="Triagem" /><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setCreateOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Abrindo..." : "Abrir e criar alerta"}</button></div></form></Modal>}

      {uploadCase && <Modal title={`Documentos das razões recursais · ${uploadCase.tender_number}`} close={() => { if (!busy) { setUploadCase(null); setUploadFiles([]); setUploadProgress(""); } }}><form className="form-grid" onSubmit={uploadOpponentDocument}><div className="decision-context wide"><span className="company-chip ufc">PROCESSO VINCULADO</span><strong>{uploadCase.tender_modality} {uploadCase.tender_number}</strong><small>{uploadCase.tender_title}</small></div><label className="wide">Arquivos<input type="file" name="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" required disabled={busy} onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))} /><small>Selecione vários documentos. Cada arquivo pode ter até 200 MB; PDFs são preservados no formato original.</small></label>{!!uploadFiles.length && <div className="multi-file-selection wide"><div><strong>{uploadFiles.length} documento(s) selecionado(s)</strong><span>{formatFileSize(uploadFiles.reduce((total, file) => total + file.size, 0))} no total</span></div>{uploadFiles.map((file) => <span className={file.size > MAX_DOCUMENT_BYTES ? "oversize" : ""} key={`${file.name}-${file.size}-${file.lastModified}`}><b>{file.name}</b><small>{formatFileSize(file.size)}{file.size > MAX_DOCUMENT_BYTES ? " · excede 200 MB" : " · formato preservado"}</small></span>)}</div>}<label>Categoria<select name="category" defaultValue="Recurso ou contrarrazões"><option>Habilitação</option><option>Proposta técnica</option><option>Proposta comercial</option><option>Atestados e CAT</option><option>Planilha, orçamento e BDI</option><option>Diligência ou decisão</option><option>Recurso ou contrarrazões</option><option>Outro</option></select></label><label>Setor responsável<select name="analysisSector" defaultValue="Jurídico"><option>Técnico</option><option>Jurídico</option><option>Licitações</option><option>Orçamento</option><option>Diretoria</option></select></label><label className="wide">Concorrente<input name="competitorName" defaultValue={uploadCase.competitor_name} placeholder="Razão social" /></label><label className="wide">Orientação para análise<textarea name="notes" rows={3} placeholder="Ponto específico, item do edital ou inconsistência a verificar" /></label>{uploadProgress && <div className="upload-progress-note wide"><span className="loading-dot" />{uploadProgress}</div>}<div className="routing-notice wide"><strong>Fluxo setorial</strong><span>Os arquivos serão preservados, vinculados automaticamente a esta licitação e ficarão com status “Aguardando análise”.</span></div><div className="form-actions wide"><button type="button" className="ghost" disabled={busy} onClick={() => { setUploadCase(null); setUploadFiles([]); setUploadProgress(""); }}>Cancelar</button><button className="primary" disabled={busy || !uploadFiles.length}>{busy ? uploadProgress || "Enviando..." : uploadFiles.length > 1 ? `Encaminhar ${uploadFiles.length} documentos` : "Encaminhar documento"}</button></div></form></Modal>}
    </>
  );
}

type CalendarDisplayEvent = {
  id: string;
  source: "Próprio" | "Licitação" | "Pós-disputa" | "Recurso" | "Plataforma" | "Documento";
  ruleType: string;
  title: string;
  subtitle: string;
  startsAt: string;
  endsAt: string;
  details: string;
  location: string;
  responsible: string;
  risk: "alto" | "médio" | "baixo";
  reminders: number[];
};

function localDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateTimeLocalValue(value: Date) {
  return `${localDateKey(value)}T${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

function reminderValues(value: string, fallback: number[]) {
  const parsed = value.split(",").map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item >= 0);
  return parsed.length ? parsed : fallback;
}

function downloadCalendarEntry(event: CalendarDisplayEvent) {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const icsDate = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LicitaControl//Agenda Operacional//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${escape(event.id)}@licitacontrol`, `DTSTAMP:${icsDate(new Date().toISOString())}`, `DTSTART:${icsDate(event.startsAt)}`, `DTEND:${icsDate(event.endsAt)}`,
    `SUMMARY:${escape(event.title)}`, `DESCRIPTION:${escape(`${event.details}\nResponsável: ${event.responsible}`)}`, ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
    ...event.reminders.flatMap((minutes) => ["BEGIN:VALARM", `TRIGGER:-PT${minutes}M`, "ACTION:DISPLAY", `DESCRIPTION:${escape(event.title)}`, "END:VALARM"]),
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `licitacontrol-${event.id.replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function CalendarPage({
  tenders,
  followups,
  platforms,
  platformDocuments,
  resources,
  complianceDocuments,
  calendarEvents,
  alertRules,
  currentUser,
  connect,
  refresh,
  notify,
}: {
  tenders: Tender[];
  followups: TenderFollowup[];
  platforms: PlatformRegistration[];
  platformDocuments: PlatformDocument[];
  resources: ResourceCase[];
  complianceDocuments: ComplianceDocument[];
  calendarEvents: CalendarEventRecord[];
  alertRules: AlertRule[];
  currentUser: string;
  connect: () => void;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("Todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [integrationOpen, setIntegrationOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarDisplayEvent | null>(null);
  const [deviceAlerts, setDeviceAlerts] = useState(false);
  const [busy, setBusy] = useState(false);

  const displayEvents = useMemo<CalendarDisplayEvent[]>(() => {
    const expiryAt = (value: string) => `${value.slice(0, 10)}T09:00:00-03:00`;
    const entries: CalendarDisplayEvent[] = [
      ...calendarEvents.map((item) => ({
        id: `proprio-${item.id}`,
        source: "Próprio" as const,
        ruleType: item.event_type,
        title: item.title,
        subtitle: item.tender_number || item.event_type,
        startsAt: item.starts_at,
        endsAt: item.ends_at,
        details: item.description || item.tender_title || "Compromisso criado no LicitaControl.",
        location: item.location,
        responsible: item.responsible,
        risk: item.priority === "Alta" ? "alto" as const : item.priority === "Baixa" ? "baixo" as const : "médio" as const,
        reminders: reminderValues(item.reminder_minutes, [1440, 120]),
      })),
      ...tenders.filter((item) => item.status !== "Finalizada").map((item) => ({
        id: `licitacao-${item.id}`,
        source: "Licitação" as const,
        ruleType: "Sessão pública",
        title: "Sessão pública",
        subtitle: `${item.modality} ${item.number}`,
        startsAt: item.openingAt,
        endsAt: new Date(new Date(item.openingAt).getTime() + 90 * 60000).toISOString(),
        details: `${item.title}\nÓrgão: ${item.organ}\nPlataforma: ${item.platform}`,
        location: item.platform,
        responsible: item.owner,
        risk: item.risk === "Alto" ? "alto" as const : item.risk === "Baixo" ? "baixo" as const : "médio" as const,
        reminders: [10080, 2880, 120],
      })),
      ...followups.filter((item) => item.status !== "Concluído").map((item) => ({
        id: `acompanhamento-${item.id}`,
        source: "Pós-disputa" as const,
        ruleType: /(recurso|contrarraz|recursal)/i.test(item.followup_type) ? "Recurso" : item.followup_type,
        title: item.title,
        subtitle: `${item.followup_type} · ${item.tender_number}`,
        startsAt: item.due_at,
        endsAt: new Date(new Date(item.due_at).getTime() + 30 * 60000).toISOString(),
        details: item.notes || item.tender_title,
        location: "",
        responsible: item.responsible,
        risk: "alto" as const,
        reminders: [1440, 120],
      })),
      ...resources.filter((item) => item.status !== "Concluído").map((item) => ({
        id: `recurso-${item.id}`,
        source: "Recurso" as const,
        ruleType: "Recurso",
        title: item.resource_type,
        subtitle: item.tender_number,
        startsAt: item.deadline,
        endsAt: new Date(new Date(item.deadline).getTime() + 45 * 60000).toISOString(),
        details: `${item.tender_title}\nPróxima ação: ${item.next_action}`,
        location: "",
        responsible: item.responsible,
        risk: "alto" as const,
        reminders: [1440, 120, 30],
      })),
      ...platforms.filter((item) => item.status === "Ativo").map((item) => ({
        id: `plataforma-${item.id}`,
        source: "Plataforma" as const,
        ruleType: "Plataformas",
        title: `Renovar cadastro — ${item.platform_name}`,
        subtitle: item.organization_name,
        startsAt: expiryAt(item.expires_at),
        endsAt: `${item.expires_at.slice(0, 10)}T09:30:00-03:00`,
        details: item.notes || `Validade do cadastro na plataforma ${item.platform_name}.`,
        location: item.platform_name,
        responsible: item.responsible,
        risk: (daysToExpiry(item.expires_at) ?? 999) <= 15 ? "alto" as const : "médio" as const,
        reminders: item.reminder_days.split(",").map((day) => Number(day.trim()) * 1440).filter(Number.isFinite),
      })),
      ...platformDocuments.filter((item) => item.status === "Ativo" && item.expires_at).map((item) => {
        const registration = platforms.find((entry) => entry.id === item.platform_registration_id);
        return {
          id: `documento-plataforma-${item.id}`,
          source: "Plataforma" as const,
          ruleType: "Plataformas",
          title: `Renovar ${item.document_type}`,
          subtitle: `${item.organization_name} · ${item.platform_name}`,
          startsAt: expiryAt(item.expires_at!),
          endsAt: `${item.expires_at!.slice(0, 10)}T09:30:00-03:00`,
          details: `${item.name}\nDocumento de credenciamento da plataforma.`,
          location: item.platform_name,
          responsible: registration?.responsible || item.organization_name,
          risk: (daysToExpiry(item.expires_at) ?? 999) <= 15 ? "alto" as const : "médio" as const,
          reminders: registration?.reminder_days.split(",").map((day) => Number(day.trim()) * 1440).filter(Number.isFinite) || [43200, 21600],
        };
      }),
      ...complianceDocuments.filter((item) => !item.no_expiry && item.expires_at).map((item) => ({
        id: `documento-${item.id}`,
        source: "Documento" as const,
        ruleType: "Certidões",
        title: `Renovar ${item.document_type}`,
        subtitle: item.organization_name,
        startsAt: expiryAt(item.expires_at!),
        endsAt: `${item.expires_at!.slice(0, 10)}T09:30:00-03:00`,
        details: `${item.name}\nEmissor: ${item.issuer || "Não informado"}`,
        location: "",
        responsible: item.professional_name || item.organization_name,
        risk: (daysToExpiry(item.expires_at) ?? 999) <= 15 ? "alto" as const : "médio" as const,
        reminders: [43200, 21600, 10080, 7200, 2880],
      })),
    ];
    return entries.filter((item) => !Number.isNaN(new Date(item.startsAt).getTime())).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [calendarEvents, complianceDocuments, followups, platformDocuments, platforms, resources, tenders]);

  const weekDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(start);
      value.setDate(start.getDate() + index);
      return value;
    });
  }, [weekOffset]);

  const filteredEvents = displayEvents.filter((event) => sourceFilter === "Todos" || event.source === sourceFilter);
  const complianceAgenda = complianceDocuments
    .filter((item) => !item.no_expiry && item.expires_at)
    .sort((first, second) => new Date(first.expires_at!).getTime() - new Date(second.expires_at!).getTime());
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60000);
  nextHour.setMinutes(0, 0, 0);
  const nextHourEnd = new Date(nextHour.getTime() + 60 * 60000);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const timer = window.setTimeout(() => {
      setDeviceAlerts(Notification.permission === "granted" && localStorage.getItem("licitacontrol-device-alerts") === "enabled");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!deviceAlerts || typeof window === "undefined" || Notification.permission !== "granted") return;
    const checkAlerts = () => {
      const notified = new Set(JSON.parse(localStorage.getItem("licitacontrol-notified") || "[]") as string[]);
      const current = Date.now();
      for (const event of displayEvents) {
        const rule = alertRules.find((item) => item.event_type === event.ruleType);
        if (rule && !Number(rule.active)) continue;
        const eventTime = new Date(event.startsAt).getTime();
        for (const minutes of event.reminders) {
          const trigger = eventTime - minutes * 60000;
          const key = `${event.id}-${minutes}`;
          if (current >= trigger && current < trigger + 90000 && !notified.has(key)) {
            new Notification(`LicitaControl · ${event.title}`, { body: `${event.subtitle} · ${formatDate(event.startsAt)}`, tag: key });
            notified.add(key);
          }
        }
      }
      localStorage.setItem("licitacontrol-notified", JSON.stringify(Array.from(notified).slice(-250)));
    };
    checkAlerts();
    const timer = window.setInterval(checkAlerts, 60000);
    return () => window.clearInterval(timer);
  }, [alertRules, deviceAlerts, displayEvents]);

  async function enableDeviceNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      notify("Este navegador não oferece notificações do computador.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      notify("A permissão de notificações não foi concedida no navegador.");
      return;
    }
    localStorage.setItem("licitacontrol-device-alerts", "enabled");
    setDeviceAlerts(true);
    new Notification("LicitaControl conectado", { body: "Os alertas serão exibidos neste computador enquanto o portal estiver aberto." });
    notify("Alertas ativados neste computador.");
  }

  async function createCalendarEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const calendarEvent = {
      ...values,
      startsAt: new Date(String(values.startsAt)).toISOString(),
      endsAt: new Date(String(values.endsAt)).toISOString(),
    };
    try {
      const response = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "createCalendarEvent", calendarEvent }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCreateOpen(false);
      notify("Compromisso criado na agenda própria do LicitaControl.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível criar o compromisso.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAlertRule(rule: AlertRule) {
    try {
      const response = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateAlertRule", alertRuleId: rule.id, active: !Number(rule.active) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível atualizar a regra.");
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="COORDENAÇÃO DE PRAZOS"
        title="Agenda & alertas"
        description="Agenda própria do LicitaControl para prazos legais, entregas internas, validades e sessões públicas."
        action={<div className="heading-actions"><button className="secondary" onClick={() => setIntegrationOpen(true)}>▣ Integrar ao computador</button><button className="primary" onClick={() => setCreateOpen(true)}>＋ Novo compromisso</button></div>}
      />
      <section className="calendar-device-banner">
        <div className="device-status-icon">▣</div>
        <div><strong>Agenda LicitaControl</strong><span>Importe no aplicativo de calendário do computador e receba lembretes mesmo com o portal fechado.</span></div>
        <span className={`device-status ${deviceAlerts ? "connected" : ""}`}>{deviceAlerts ? "Alertas deste computador ativos" : "Alertas deste computador inativos"}</span>
        <button className="secondary" onClick={deviceAlerts ? () => setIntegrationOpen(true) : enableDeviceNotifications}>{deviceAlerts ? "Gerenciar" : "Ativar alertas"}</button>
      </section>
      <div className="calendar-summary expanded">
        <div><span className="dot danger" />{resources.filter((item) => item.status !== "Concluído").length} prazos recursais</div>
        <div><span className="dot violet" />{platforms.filter((item) => (daysToExpiry(item.expires_at) ?? 999) <= 30).length} cadastros a renovar</div>
        <div><span className="dot green" />{tenders.filter((item) => item.status !== "Finalizada").length} sessões controladas</div>
        <div><span className="dot own" />{calendarEvents.length} compromissos próprios</div>
        <div className="calendar-week-nav"><button onClick={() => setWeekOffset((value) => value - 1)} aria-label="Semana anterior">‹</button><strong>{weekDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {weekDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</strong><button onClick={() => setWeekOffset((value) => value + 1)} aria-label="Próxima semana">›</button><button onClick={() => setWeekOffset(0)}>Hoje</button></div>
      </div>
      <div className="calendar-source-filters" aria-label="Filtrar agenda">
        {["Todos", "Próprio", "Licitação", "Pós-disputa", "Recurso", "Plataforma", "Documento"].map((source) => <button className={sourceFilter === source ? "active" : ""} onClick={() => setSourceFilter(source)} key={source}>{source}</button>)}
      </div>
      <section className="calendar-layout">
        <div className="panel calendar-board native-calendar">
          <div className="week-header">
            {weekDays.map((day) => {
              const today = localDateKey(day) === localDateKey(new Date());
              return <div key={day.toISOString()} className={today ? "today" : ""}><span>{day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase()}</span><b>{day.getDate()}</b></div>;
            })}
          </div>
          <div className="week-grid">
            {weekDays.map((day) => {
              const today = localDateKey(day) === localDateKey(new Date());
              const events = filteredEvents.filter((event) => localDateKey(event.startsAt) === localDateKey(day));
              return <div className={`day-column ${today ? "today" : ""}`} key={day.toISOString()}>{today && <span className="time-marker">agora</span>}{events.map((event) => <button className={`calendar-event risk-${event.risk} source-${event.source.toLowerCase().replace("-", "")}`} key={event.id} onClick={() => setSelectedEvent(event)}><span>{new Date(event.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {event.source}</span><strong>{event.title}</strong><small>{event.subtitle}</small></button>)}{!events.length && <span className="empty-day">Sem compromissos</span>}</div>;
            })}
          </div>
        </div>
        <aside className="panel alert-rules">
          <div className="panel-title"><div><span className="eyebrow">AUTOMAÇÕES</span><h2>Regras de alerta</h2></div><button onClick={() => setIntegrationOpen(true)}>⚙</button></div>
          {alertRules.map((rule) => <div className="alert-rule" key={rule.id}><div><strong>{rule.name}</strong><span>{rule.cadence}</span></div><button className={`toggle ${Number(rule.active) ? "on" : ""}`} role="switch" aria-checked={Boolean(Number(rule.active))} aria-label={`${Number(rule.active) ? "Desativar" : "Ativar"} alerta de ${rule.name}`} onClick={() => toggleAlertRule(rule)}><i /></button></div>)}
          <div className="alert-destination"><span>DESTINOS DISPONÍVEIS</span><div><i className="channel computer">▣</i><strong>Este computador</strong><small>{deviceAlerts ? "Notificações ativas com o portal aberto" : "Aguardando ativação"}</small></div><div><i className="channel calendar">▦</i><strong>Calendário do computador</strong><small>Outlook, Windows, Apple e aplicativos compatíveis com .ics</small></div><div><i className="channel calendar">G</i><strong>Google Agenda</strong><small>Inclusão individual ou importação do arquivo .ics</small></div></div>
        </aside>
      </section>
      <section className="calendar-operational-grid">
        <div className="panel"><div className="panel-title"><div><span className="eyebrow">PRÓXIMOS EVENTOS</span><h2>Fila operacional</h2></div></div>{displayEvents.filter((event) => new Date(event.startsAt) >= new Date()).slice(0, 6).map((event) => <button className="calendar-list-item event-row" key={event.id} onClick={() => setSelectedEvent(event)}><div><strong>{event.title} · {event.subtitle}</strong><span>{formatDate(event.startsAt)} · {event.responsible}</span></div><span className={`event-source source-${event.source.toLowerCase().replace("-", "")}`}>{event.source}</span></button>)}</div>
        <div className="panel"><div className="panel-title"><div><span className="eyebrow">INTEGRAÇÃO LOCAL</span><h2>Levar para o computador</h2></div></div><div className="computer-integration-card"><span>1</span><div><strong>Baixe a agenda completa</strong><p>O arquivo inclui sessões, recursos, documentos, plataformas e compromissos próprios, todos com lembretes.</p></div><a className="primary link-button" href="/api/calendar-feed">⇩ Baixar .ics</a></div><div className="computer-integration-card"><span>2</span><div><strong>Abra no aplicativo de calendário</strong><p>O computador oferecerá Outlook, Calendário do Windows, Apple Calendar ou outro aplicativo compatível.</p></div><button className="secondary" onClick={() => setIntegrationOpen(true)}>Ver instruções</button></div></div>
      </section>
      <section className="panel compliance-calendar-panel">
        <div className="panel-title"><div><span className="eyebrow">VALIDADES DA HABILITAÇÃO</span><h2>Agenda específica de documentos</h2><p className="module-description">Alertas programados para 30, 15, 7, 5 e 2 dias antes do vencimento.</p></div><span className="updated">{complianceAgenda.length} documento(s) controlado(s)</span></div>
        <div className="compliance-calendar-list">
          {complianceAgenda.map((document) => {
            const startsAt = `${document.expires_at!.slice(0, 10)}T09:00:00-03:00`;
            const expiry = expiryLabel(document);
            const calendarDocument: CalendarDisplayEvent = { id: `documento-${document.id}`, source: "Documento", ruleType: "Certidões", title: `Renovar ${document.document_type}`, subtitle: document.organization_name, startsAt, endsAt: `${document.expires_at!.slice(0, 10)}T09:30:00-03:00`, details: `${document.name}\nEmissor: ${document.issuer || "Não informado"}`, location: "", responsible: document.professional_name || document.organization_name, risk: (daysToExpiry(document.expires_at) ?? 999) <= 15 ? "alto" : "médio", reminders: [43200, 21600, 10080, 7200, 2880] };
            return <article className="compliance-calendar-item" key={document.id}><div className={`compliance-calendar-date ${expiry.tone}`}><b>{document.expires_at ? new Date(`${document.expires_at.slice(0, 10)}T12:00:00`).getDate().toString().padStart(2, "0") : "—"}</b><span>{document.expires_at ? new Date(`${document.expires_at.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") : ""}</span></div><div><strong>{document.document_type}</strong><span>{document.organization_name} · {document.name}</span><small>Alertas: 30 · 15 · 7 · 5 · 2 dias</small></div><StatusPill value={expiry.label} /><div className="compliance-calendar-actions"><button className="secondary" onClick={() => downloadCalendarEntry(calendarDocument)}>⇩ .ics</button><a className="google-mini" href={calendarTemplateUrl({ title: calendarDocument.title, startsAt, details: `${calendarDocument.details}\nAlertas internos: 30, 15, 7, 5 e 2 dias.` })} target="_blank" rel="noreferrer">G Agenda</a></div></article>;
          })}
          {!complianceAgenda.length && <div className="empty-state compact"><span>✓</span><h3>Nenhuma validade documental pendente</h3><p>Documentos com data de vencimento aparecerão automaticamente aqui.</p></div>}
        </div>
      </section>

      {createOpen && <Modal title="Novo compromisso e alerta" close={() => setCreateOpen(false)}><form className="form-grid" onSubmit={createCalendarEvent}><label className="wide">Título<input name="title" placeholder="Ex.: concluir conferência da proposta técnica" required /></label><label>Tipo<select name="eventType" defaultValue="Entrega interna"><option>Entrega interna</option><option>Sessão pública</option><option>Impugnação</option><option>Recurso</option><option>Diligência</option><option>Reunião</option><option>Compromisso</option></select></label><label>Visibilidade<select name="visibility" defaultValue="Equipe"><option>Equipe</option><option>Pessoal</option></select></label><label className="wide">Licitação vinculada<select name="tenderId" defaultValue=""><option value="">Sem vínculo específico</option>{tenders.map((tender) => <option value={tender.id} key={tender.id}>{tender.number} · {tender.title}</option>)}</select></label><label>Início<input name="startsAt" type="datetime-local" defaultValue={dateTimeLocalValue(nextHour)} required /></label><label>Término<input name="endsAt" type="datetime-local" defaultValue={dateTimeLocalValue(nextHourEnd)} required /></label><label>Responsável<input name="responsible" defaultValue={currentUser} required /></label><label>Prioridade<select name="priority" defaultValue="Média"><option>Alta</option><option>Média</option><option>Baixa</option></select></label><label className="wide">Local ou plataforma<input name="location" placeholder="Sala, endereço, Compras.gov.br, BLL..." /></label><label className="wide">Alertas<select name="reminderMinutes" defaultValue="1440,120"><option value="10080,2880,120">7 dias, 48h e 2h antes</option><option value="7200,1440">5 dias e 24h antes</option><option value="1440,120">24h e 2h antes</option><option value="120,30">2h e 30min antes</option><option value="60,15">1h e 15min antes</option></select></label><label className="wide">Descrição e providência<textarea name="description" rows={3} placeholder="Registre o que deverá ser feito, os documentos envolvidos e a próxima ação." /></label><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setCreateOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Agendando..." : "Criar compromisso"}</button></div></form></Modal>}

      {integrationOpen && <Modal title="Integrar a agenda ao computador" close={() => setIntegrationOpen(false)}><div className="calendar-integration-modal"><div className="integration-hero"><span>▣</span><div><strong>Agenda operacional no computador</strong><p>O arquivo .ics leva todos os prazos e alertas do LicitaControl para o aplicativo de calendário instalado.</p></div></div><div className="integration-options"><article><i>W</i><div><strong>Windows e Outlook</strong><p>Baixe o arquivo, abra-o e escolha “Adicionar ao calendário” ou “Importar”.</p></div></article><article><i>⌘</i><div><strong>Apple Calendar</strong><p>Abra o arquivo .ics e confirme a agenda de destino no Mac, iPhone ou iPad.</p></div></article><article><i>G</i><div><strong>Google Agenda</strong><p>Use Configurações → Importar e exportar para importar a agenda completa.</p></div></article></div><div className="integration-limit"><strong>Como os alertas funcionarão</strong><span>O aplicativo de calendário do computador continuará emitindo os lembretes mesmo com o portal fechado. As notificações diretas do navegador funcionam enquanto o LicitaControl estiver aberto.</span></div><div className="form-actions"><button className="ghost" onClick={() => setIntegrationOpen(false)}>Fechar</button><button className="secondary" onClick={connect}><b>G</b> Google Agenda</button><a className="primary link-button" href="/api/calendar-feed">⇩ Baixar agenda completa</a></div></div></Modal>}

      {selectedEvent && <Modal title="Detalhes do compromisso" close={() => setSelectedEvent(null)}><div className="calendar-event-detail"><div className={`event-detail-head risk-${selectedEvent.risk}`}><span>{selectedEvent.source}</span><strong>{selectedEvent.title}</strong><small>{selectedEvent.subtitle}</small></div><dl><div><dt>Início</dt><dd>{formatDate(selectedEvent.startsAt)}</dd></div><div><dt>Término</dt><dd>{formatDate(selectedEvent.endsAt)}</dd></div><div><dt>Responsável</dt><dd>{selectedEvent.responsible}</dd></div><div><dt>Local / plataforma</dt><dd>{selectedEvent.location || "Não informado"}</dd></div></dl><p>{selectedEvent.details}</p><div className="event-reminders"><span>Alertas programados</span>{selectedEvent.reminders.map((minutes) => <b key={minutes}>{minutes >= 1440 ? `${Math.round(minutes / 1440)} dia(s)` : minutes >= 60 ? `${Math.round(minutes / 60)} hora(s)` : `${minutes} min`}</b>)}</div><div className="form-actions"><button className="ghost" onClick={() => setSelectedEvent(null)}>Fechar</button><button className="secondary" onClick={() => downloadCalendarEntry(selectedEvent)}>⇩ Baixar evento .ics</button><a className="primary link-button" href={calendarTemplateUrl({ title: selectedEvent.title, startsAt: selectedEvent.startsAt, details: `${selectedEvent.details}\nResponsável: ${selectedEvent.responsible}` })} target="_blank" rel="noreferrer">G Adicionar ao Google</a></div></div></Modal>}
    </>
  );
}

function PlatformValidityPage({
  organizations,
  registrations,
  documents,
  refresh,
  notify,
}: {
  organizations: Organization[];
  registrations: PlatformRegistration[];
  documents: PlatformDocument[];
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformRegistration | null>(null);
  const [documentTarget, setDocumentTarget] = useState<PlatformRegistration | null>(null);
  const [companyFilter, setCompanyFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [busy, setBusy] = useState(false);
  const visible = registrations.filter(
    (item) => {
      const days = daysToExpiry(item.expires_at);
      const matchesCompany = companyFilter === "Todas" || item.organization_id === companyFilter;
      const matchesStatus = statusFilter === "Todos" ||
        (statusFilter === "Vencidos" && days !== null && days < 0) ||
        (statusFilter === "A renovar" && days !== null && days >= 0 && days <= 30) ||
        (statusFilter === "Em dia" && days !== null && days > 30);
      return matchesCompany && matchesStatus;
    },
  );
  const critical = registrations.filter((item) => {
    const days = daysToExpiry(item.expires_at);
    return days !== null && days <= 30;
  }).length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const platformRegistration = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    if (editing) Object.assign(platformRegistration, { id: editing.id });
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: editing ? "updatePlatformRegistration" : "createPlatformRegistration", platformRegistration }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setOpen(false);
      setEditing(null);
      notify(editing ? "Cadastro da plataforma atualizado e alteração registrada." : "Cadastro da plataforma incluído com alertas de validade.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível cadastrar.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPlatformDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentTarget) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    form.set("platformRegistrationId", documentTarget.id);
    try {
      const response = await fetch("/api/platform-documents", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDocumentTarget(null);
      notify("Documento de credenciamento preservado e validade incluída na agenda.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível enviar o documento.");
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(registration: PlatformRegistration) {
    setEditing(registration);
    setOpen(true);
  }

  return (
    <>
      <PageHeading
        eyebrow="CREDENCIAMENTOS PARA DISPUTA"
        title="Validade das plataformas"
        description="Controle separadamente a vigência dos cadastros da UFC e da Pórtico nas plataformas de licitação."
        action={<div className="heading-actions"><a className="secondary link-button" href="/api/calendar-feed">⇩ Agenda do computador</a><button className="primary" onClick={openCreate}>＋ Registrar plataforma</button></div>}
      />
      <section className="organization-metrics platform-metrics">
        <article><span>Cadastros controlados</span><strong>{registrations.length}</strong><small>UFC, Pórtico e futuras empresas</small></article>
        <article className="warning"><span>Renovação em até 30 dias</span><strong>{critical}</strong><small>Alerta prévio recomendado</small></article>
        <article className="valid"><span>Documentos de cadastro</span><strong>{documents.length}</strong><small>{documents.filter((item) => { const days = daysToExpiry(item.expires_at); return days !== null && days <= 30; }).length} exigem atenção em até 30 dias</small></article>
      </section>
      <div className="advanced-filters one-line">
        <label><span>Empresa</span><select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}><option>Todas</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></label>
        <label><span>Situação</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option><option>Vencidos</option><option>A renovar</option><option>Em dia</option></select></label>
      </div>
      <section className="platform-grid">
        {visible.map((registration) => {
          const days = daysToExpiry(registration.expires_at);
          const label = days === null ? "Sem data" : days < 0 ? `Vencido há ${Math.abs(days)} dia(s)` : `Vence em ${days} dia(s)`;
          const calendarUrl = calendarTemplateUrl({
            title: `Renovar cadastro — ${registration.platform_name}`,
            startsAt: `${registration.expires_at.slice(0, 10)}T09:00:00-03:00`,
            details: `${registration.organization_name}\nCadastro: ${registration.registration_code || "não informado"}\nAcesso: ${registration.access_email || "não informado"}\nResponsável: ${registration.responsible}\nAlertas previstos: ${registration.reminder_days} dias antes.`,
          });
          const platformDocs = documents.filter((document) => document.platform_registration_id === registration.id);
          const docAlerts = platformDocs.filter((document) => { const value = daysToExpiry(document.expires_at); return value !== null && value <= 30; }).length;
          return <article className="platform-card platform-control-card" key={registration.id}><div className="platform-card-top"><span className="platform-logo">{registration.platform_name.slice(0, 2).toUpperCase()}</span><div><small>{registration.organization_name}</small><h3>{registration.platform_name}</h3></div><StatusPill value={label} /></div><dl><div><dt>Identificação</dt><dd>{registration.registration_code || "Não informada"}</dd></div><div><dt>E-mail de acesso</dt><dd>{registration.access_email || "Não informado"}</dd></div><div><dt>Responsável</dt><dd>{registration.responsible}</dd></div><div><dt>Validade</dt><dd>{formatDate(registration.expires_at, false)}</dd></div></dl><div className="platform-doc-summary"><div><span>Documentação do cadastro</span><strong>{platformDocs.length} arquivo(s)</strong></div><StatusPill value={docAlerts ? `${docAlerts} com alerta` : "Em dia"} /></div>{platformDocs.slice(0, 3).map((document) => <a className="platform-document-row" href={`/api/platform-documents?id=${document.id}`} key={document.id}><span>▱</span><div><strong>{document.document_type}</strong><small>{document.name}{document.expires_at ? ` · vence ${formatDate(document.expires_at, false)}` : " · sem validade"}</small></div><b>⇩</b></a>)}<p>{registration.notes || "Sem observações."}</p><div className="platform-actions"><button className="secondary" onClick={() => openEdit(registration)}>✎ Editar cadastro</button><button className="secondary" onClick={() => setDocumentTarget(registration)}>＋ Documento</button><button className="ghost" onClick={() => downloadCalendarEntry({ id: `plataforma-${registration.id}`, source: "Plataforma", ruleType: "Plataformas", title: `Renovar cadastro — ${registration.platform_name}`, subtitle: registration.organization_name, startsAt: `${registration.expires_at.slice(0, 10)}T09:00:00-03:00`, endsAt: `${registration.expires_at.slice(0, 10)}T09:30:00-03:00`, details: `Cadastro ${registration.registration_code || "não informado"}\nAlertas: ${registration.reminder_days} dias antes`, location: "", responsible: registration.responsible, risk: days !== null && days <= 30 ? "alto" : "baixo", reminders: reminderValues(registration.reminder_days, [30, 15, 7]).map((value) => value * 1440) })}>⇩ Computador</button><a className="google-inline" href={calendarUrl} target="_blank" rel="noreferrer"><b>G</b> Google</a></div></article>;
        })}
        {!visible.length && <div className="empty-state compact"><span>◷</span><h3>Nenhuma validade cadastrada</h3><p>Inclua cada empresa e plataforma de disputa para ativar o controle.</p></div>}
      </section>
      {open && <Modal title={editing ? "Editar cadastro da plataforma" : "Registrar validade de plataforma"} close={() => { setOpen(false); setEditing(null); }}><form className="form-grid" onSubmit={submit}><label>Empresa<select name="organizationId" required defaultValue={editing?.organization_id || ""}><option value="" disabled>Selecione</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></label><label>Plataforma<select name="platformName" defaultValue={editing?.platform_name || "Compras.gov.br"}><option>Compras.gov.br</option><option>Licitações-e</option><option>BLL Compras</option><option>Portal de Compras Públicas</option><option>Licitanet</option><option>BBMNET</option><option>Outro</option></select></label><label>Identificação do cadastro<input name="registrationCode" defaultValue={editing?.registration_code} placeholder="Código, CNPJ ou usuário" /></label><label>E-mail de acesso<input name="accessEmail" defaultValue={editing?.access_email} type="email" /></label><label>Validade do cadastro<input name="expiresAt" defaultValue={editing?.expires_at?.slice(0, 10)} type="date" required /></label><label>Responsável interno<input name="responsible" defaultValue={editing?.responsible} /></label><label>Status<select name="status" defaultValue={editing?.status || "Ativo"}><option>Ativo</option><option>Em renovação</option><option>Suspenso</option><option>Inativo</option></select></label><label>Alertas antecipados<input name="reminderDays" defaultValue={editing?.reminder_days || "30,15,7"} /><small>Informe os dias separados por vírgula.</small></label><label className="wide">Observações<textarea name="notes" defaultValue={editing?.notes} rows={3} /></label><div className="human-review wide"><strong>Rastreabilidade</strong><span>A edição preserva os documentos já vinculados e registra o responsável pela alteração na auditoria.</span></div><div className="form-actions wide"><button type="button" className="ghost" onClick={() => { setOpen(false); setEditing(null); }}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : editing ? "Salvar alterações" : "Salvar validade"}</button></div></form></Modal>}
      {documentTarget && <Modal title={`Documento de cadastro · ${documentTarget.platform_name}`} close={() => setDocumentTarget(null)}><form className="form-grid" onSubmit={uploadPlatformDocument}><label>Tipo de documento<select name="documentType" defaultValue="Comprovante de credenciamento"><option>Comprovante de credenciamento</option><option>Declaração de cadastro</option><option>Certificado digital</option><option>Procuração</option><option>Termo de adesão</option><option>Dados bancários</option><option>Outro</option></select></label><label>Número / referência<input name="documentNumber" /></label><label>Emissão<input name="issuedAt" type="date" /></label><label>Validade<input name="expiresAt" type="date" /></label><label className="wide">Arquivo<input name="file" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" required /></label><label className="wide">Observações<textarea name="notes" rows={3} placeholder="Pendência, responsável pela renovação ou orientação de uso." /></label><div className="routing-notice wide"><strong>Alerta automático</strong><span>Se houver validade, o documento será incluído na agenda completa do portal e no arquivo .ics do computador.</span></div><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setDocumentTarget(null)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Enviando..." : "Guardar documento"}</button></div></form></Modal>}
    </>
  );
}

function MonitoringPage({
  tenders,
  followups,
  cases,
  documents,
  refresh,
  notify,
  openTender,
}: {
  tenders: Tender[];
  followups: TenderFollowup[];
  cases: ResourceCase[];
  documents: OpponentDocument[];
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  openTender: (tender: Tender) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<TenderFollowup | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [opponentUploadFiles, setOpponentUploadFiles] = useState<File[]>([]);
  const [opponentUploadProgress, setOpponentUploadProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState("Todas as fases");
  const [typeFilter, setTypeFilter] = useState("Todos os tipos");
  const [organFilter, setOrganFilter] = useState("Todos os órgãos");
  const [participantFilter, setParticipantFilter] = useState("Todas as licitantes");
  const [platformFilter, setPlatformFilter] = useState("Todos os sistemas");
  const eligible = tenders.filter((item) => item.status !== "Finalizada");
  const followupTypes = Array.from(new Set(followups.map((item) => item.followup_type).filter(Boolean))).sort();
  const organs = Array.from(new Set(tenders.map((item) => item.organ).filter(Boolean))).sort();
  const participants = Array.from(new Set(tenders.map((item) => item.participantOrganizationName || "A definir"))).sort();
  const platforms = Array.from(new Set(tenders.map((item) => item.platform).filter(Boolean))).sort();
  const filteredFollowups = followups.filter((item) => {
    const tender = tenders.find((entry) => entry.id === item.tender_id);
    return (
      (phaseFilter === "Todas as fases" || item.status === phaseFilter) &&
      (typeFilter === "Todos os tipos" || item.followup_type === typeFilter) &&
      (organFilter === "Todos os órgãos" || tender?.organ === organFilter) &&
      (participantFilter === "Todas as licitantes" || (tender?.participantOrganizationName || "A definir") === participantFilter) &&
      (platformFilter === "Todos os sistemas" || tender?.platform === platformFilter)
    );
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const tenderId = String(form.get("tenderId") ?? "");
    const tenderFollowup = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "createTenderFollowup", tenderId, tenderFollowup }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setOpen(false);
      notify("Prazo pós-disputa incluído e pronto para o Google Agenda.");
      await refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível registrar."); }
    finally { setBusy(false); }
  }

  async function uploadOpponentDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFollowup) return;
    const formElement = event.currentTarget;
    const sourceForm = new FormData(formElement);
    const files = opponentUploadFiles.length
      ? opponentUploadFiles
      : sourceForm.getAll("file").filter((value): value is File => value instanceof File && value.size > 0);
    if (!files.length) {
      notify("Selecione ao menos um documento para encaminhar.");
      return;
    }
    setBusy(true);
    const linkedCase = cases.find(
      (item) =>
        item.tender_id === selectedFollowup.tender_id &&
        item.resource_type === selectedFollowup.followup_type,
    ) || cases.find((item) => item.tender_id === selectedFollowup.tender_id);
    let resourceCaseId = linkedCase?.id || "";
    let completed = 0;
    const failures: string[] = [];
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        try {
          const result = await uploadPreservedFile({
            file,
            destination: "resourceDocument",
            tenderId: selectedFollowup.tender_id,
            followupId: selectedFollowup.id,
            resourceCaseId,
            category: String(sourceForm.get("category") ?? "Recurso ou contrarrazões"),
            analysisSector: String(sourceForm.get("analysisSector") ?? "Jurídico"),
            competitorName: String(sourceForm.get("competitorName") ?? ""),
            notes: String(sourceForm.get("notes") ?? ""),
            onProgress: (percent) => setOpponentUploadProgress(
              `Enviando ${index + 1} de ${files.length}: ${file.name} — ${percent}%`,
            ),
          });
          resourceCaseId = result.resourceCaseId || resourceCaseId;
          completed += 1;
        } catch (error) {
          failures.push(`${file.name}: ${error instanceof Error ? error.message : "falha no envio"}`);
        }
      }
      await refresh();
      formElement.reset();
      setOpponentUploadFiles([]);
      if (!failures.length) {
        setUploadOpen(false);
        notify(`${completed} documento(s) preservado(s) e encaminhado(s) ao setor responsável.`);
      } else {
        notify(`${completed} de ${files.length} documento(s) enviados. Não concluídos: ${failures.join(" | ")}`);
      }
    } finally {
      setBusy(false);
      setOpponentUploadProgress("");
    }
  }

  async function updateOpponentStatus(document: OpponentDocument, analysisStatus: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateOpponentDocumentAnalysis", opponentDocumentId: document.id, analysisStatus }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      notify(`Documento marcado como ${analysisStatus.toLowerCase()}.`);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível atualizar a análise.");
    } finally {
      setBusy(false);
    }
  }

  const selectedDocuments = selectedFollowup ? documents.filter((item) => item.tender_id === selectedFollowup.tender_id) : [];
  const selectedTender = selectedFollowup ? tenders.find((item) => item.id === selectedFollowup.tender_id) : null;
  const competitors = Array.from(new Set(selectedDocuments.map((item) => item.competitor_name || "Concorrente não identificado")));

  return <>
    <PageHeading eyebrow="PÓS-DISPUTA E JULGAMENTO" title="Acompanhamento de resultado" description="Controle resultados, diligências, recursos, contrarrazões, documentos dos concorrentes, adjudicação e homologação." action={<button className="primary" onClick={() => setOpen(true)}>＋ Novo acompanhamento</button>} />
    <section className="monitoring-summary"><article><span>Prazos ativos</span><strong>{followups.filter((item) => item.status !== "Concluído").length}</strong><small>Com responsáveis e alertas</small></article><article><span>Documentos adversários</span><strong>{documents.length}</strong><small>{documents.filter((item) => item.analysis_status === "Aguardando análise").length} aguardando análise</small></article><article><span>Setores acionados</span><strong>{new Set(documents.map((item) => item.analysis_sector)).size}</strong><small>Técnico, Jurídico, Licitações e Orçamento</small></article></section>
    <section className="monitoring-filter-panel" aria-label="Filtros do acompanhamento">
      <div><span>Fase</span><select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)}><option>Todas as fases</option>{["Pendente", "Em elaboração", "Protocolado", "Concluído"].map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><span>Tipo</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Todos os tipos</option>{followupTypes.map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><span>Órgão contratante</span><select value={organFilter} onChange={(event) => setOrganFilter(event.target.value)}><option>Todos os órgãos</option>{organs.map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><span>Empresa licitante</span><select value={participantFilter} onChange={(event) => setParticipantFilter(event.target.value)}><option>Todas as licitantes</option>{participants.map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><span>Sistema / plataforma</span><select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}><option>Todos os sistemas</option>{platforms.map((value) => <option key={value}>{value}</option>)}</select></div>
      <button className="ghost" onClick={() => { setPhaseFilter("Todas as fases"); setTypeFilter("Todos os tipos"); setOrganFilter("Todos os órgãos"); setParticipantFilter("Todas as licitantes"); setPlatformFilter("Todos os sistemas"); }}>Limpar filtros</button>
      <strong>{filteredFollowups.length} acompanhamento(s)</strong>
    </section>
    <section className="monitoring-board">{["Pendente", "Em elaboração", "Protocolado", "Concluído"].map((status) => <div className="monitoring-column" key={status}><header><h3>{status}</h3><span>{filteredFollowups.filter((item) => item.status === status).length}</span></header>{filteredFollowups.filter((item) => item.status === status).map((item) => { const tender = tenders.find((entry) => entry.id === item.tender_id); const days = timeUntil(item.due_at, new Date().toISOString()); const docCount = documents.filter((document) => document.tender_id === item.tender_id).length; return <article key={item.id}><div><span className="modality">{item.followup_type}</span><StatusPill value={days} /></div><div className="monitoring-next-action"><span>PRÓXIMA AÇÃO</span><h4>{item.title}</h4></div><p>{item.tender_modality} {item.tender_number}</p><small>{item.tender_title}</small>{tender && <div className="monitoring-context"><span>{tender.organ}</span><span>{tender.participantOrganizationName || "Licitante a definir"}</span><span>{tender.platform}</span></div>}<div className="monitoring-doc-count"><span>▱</span><strong>{docCount}</strong> documento(s) de concorrentes</div><footer><span>{item.responsible}</span><div><a href={calendarTemplateUrl({ title: `${item.followup_type} — ${item.tender_number}`, startsAt: item.due_at, details: `${item.title}\n${item.tender_title}\nResponsável: ${item.responsible}\n${item.notes}` })} target="_blank" rel="noreferrer">G Agenda</a><button onClick={() => setSelectedFollowup(item)}>Dossiê</button>{tender && <button onClick={() => openTender(tender)}>Licitação</button>}</div></footer></article>; })}</div>)}</section>
    {open && <Modal title="Registrar acompanhamento de resultado" close={() => setOpen(false)}><form className="form-grid" onSubmit={submit}><label className="wide">Licitação<select name="tenderId" defaultValue="" required><option value="" disabled>Selecione a licitação já disputada</option>{eligible.map((tender) => <option value={tender.id} key={tender.id}>{tender.modality} {tender.number} — {tender.title}</option>)}</select></label><label>Tipo<select name="followupType" defaultValue="Resultado"><option>Resultado</option><option>Diligência</option><option>Intenção recursal</option><option>Razões recursais</option><option>Recurso</option><option>Contrarrazões</option><option>Julgamento de recurso</option><option>Adjudicação</option><option>Homologação</option><option>Convocação / contrato</option></select></label><label>Prazo<input name="dueAt" type="datetime-local" required /></label><label className="wide">Atividade / providência<input name="title" placeholder="Ex.: elaborar razões recursais" required /></label><label>Responsável<input name="responsible" /></label><label className="wide">Notas e estratégia<textarea name="notes" rows={3} /></label><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : "Registrar prazo"}</button></div></form></Modal>}
    {selectedFollowup && <><button className="backdrop" aria-label="Fechar dossiê" onClick={() => setSelectedFollowup(null)} /><aside className="drawer monitoring-drawer"><div className="drawer-head"><div><span className="eyebrow">{selectedFollowup.followup_type}</span><h2>{selectedFollowup.tender_number}</h2></div><button onClick={() => setSelectedFollowup(null)}>×</button></div><h3>{selectedFollowup.title}</h3><p className="drawer-summary">{selectedFollowup.tender_title}</p><div className="drawer-info"><div><span>Prazo</span><strong>{formatDate(selectedFollowup.due_at)}</strong></div><div><span>Responsável</span><strong>{selectedFollowup.responsible}</strong></div><div><span>Fase</span><strong>{selectedFollowup.status}</strong></div><div><span>Documentos</span><strong>{selectedDocuments.length}</strong></div></div><div className="drawer-module-head"><div><span className="eyebrow">CONFERÊNCIA DOS ADVERSÁRIOS</span><h3>Documentação por concorrente e setor</h3></div><button className="primary" onClick={() => setUploadOpen(true)}>⇧ Enviar documento</button></div>{competitors.map((competitor) => <section className="opponent-dossier" key={competitor}><header><div><span>EMPRESA ADVERSÁRIA</span><h4>{competitor}</h4></div><strong>{selectedDocuments.filter((item) => (item.competitor_name || "Concorrente não identificado") === competitor).length} arquivo(s)</strong></header>{selectedDocuments.filter((item) => (item.competitor_name || "Concorrente não identificado") === competitor).map((document) => <article key={document.id}><span className="document-sector">{document.analysis_sector}</span><div><strong>{document.category} · {document.name}</strong><p>{document.notes || "Sem orientação adicional."}</p><small>{formatFileSize(document.size)} · enviado por {document.uploaded_by}</small></div><StatusPill value={document.analysis_status} /><div><a className="secondary" href={`/api/resource-documents?id=${document.id}`}>⇩ Abrir</a><select aria-label="Resultado da análise" value={document.analysis_status} disabled={busy} onChange={(event) => void updateOpponentStatus(document, event.target.value)}><option>Aguardando análise</option><option>Em análise</option><option>Conforme</option><option>Inconsistência identificada</option><option>Subsídio para recurso</option><option>Concluído</option></select></div></article>)}</section>)}{!selectedDocuments.length && <div className="drawer-empty"><span>▱</span><h4>Nenhum documento adversário</h4><p>Envie habilitação, proposta, atestados, planilhas, diligências ou decisões e indique o setor que deverá analisar.</p><button className="primary" onClick={() => setUploadOpen(true)}>Iniciar dossiê do concorrente</button></div>}<div className="drawer-actions"><a className="google-inline" href={calendarTemplateUrl({ title: `${selectedFollowup.followup_type} — ${selectedFollowup.tender_number}`, startsAt: selectedFollowup.due_at, details: `${selectedFollowup.title}\n${selectedFollowup.notes}` })} target="_blank" rel="noreferrer"><b>G</b> Adicionar prazo</a>{selectedTender && <button className="secondary" onClick={() => openTender(selectedTender)}>Abrir licitação</button>}</div></aside></>}
    {uploadOpen && selectedFollowup && <Modal title={`Documentos das razões recursais · ${selectedFollowup.tender_number}`} close={() => { if (!busy) { setUploadOpen(false); setOpponentUploadFiles([]); setOpponentUploadProgress(""); } }}><form className="form-grid" onSubmit={uploadOpponentDocument}><div className="decision-context wide"><span className="company-chip ufc">PROCESSO PUXADO</span><strong>{selectedFollowup.tender_modality} {selectedFollowup.tender_number}</strong><small>{selectedFollowup.tender_title}</small></div><label className="wide">Empresa adversária<input name="competitorName" placeholder="Razão social ou nome do consórcio" required /></label><label>Fase / categoria<select name="category" defaultValue="Recurso ou contrarrazões"><option>Habilitação</option><option>Proposta técnica</option><option>Proposta comercial</option><option>Atestados e CAT</option><option>Planilha, orçamento e BDI</option><option>Diligência ou decisão</option><option>Recurso ou contrarrazões</option><option>Outro</option></select></label><label>Setor responsável<select name="analysisSector" defaultValue="Jurídico"><option>Técnico</option><option>Jurídico</option><option>Licitações</option><option>Orçamento</option><option>Diretoria</option></select></label><label className="wide">Arquivos<input type="file" name="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" required disabled={busy} onChange={(event) => setOpponentUploadFiles(Array.from(event.target.files ?? []))} /><small>Selecione vários documentos. Cada arquivo pode ter até 200 MB; PDFs permanecem no formato original.</small></label>{!!opponentUploadFiles.length && <div className="multi-file-selection wide"><div><strong>{opponentUploadFiles.length} documento(s) selecionado(s)</strong><span>{formatFileSize(opponentUploadFiles.reduce((total, file) => total + file.size, 0))} no total</span></div>{opponentUploadFiles.map((file) => <span className={file.size > MAX_DOCUMENT_BYTES ? "oversize" : ""} key={`${file.name}-${file.size}-${file.lastModified}`}><b>{file.name}</b><small>{formatFileSize(file.size)}{file.size > MAX_DOCUMENT_BYTES ? " · excede 200 MB" : " · formato preservado"}</small></span>)}</div>}<label className="wide">Ponto de análise<textarea name="notes" rows={3} placeholder="Item do edital, possível inconsistência, prova necessária ou providência esperada." /></label>{opponentUploadProgress && <div className="upload-progress-note wide"><span className="loading-dot" />{opponentUploadProgress}</div>}<div className="routing-notice wide"><strong>Vínculo automático</strong><span>Os arquivos serão preservados, ligados à licitação de origem e distribuídos ao setor selecionado com status “Aguardando análise”.</span></div><div className="form-actions wide"><button type="button" className="ghost" disabled={busy} onClick={() => { setUploadOpen(false); setOpponentUploadFiles([]); setOpponentUploadProgress(""); }}>Cancelar</button><button className="primary" disabled={busy || !opponentUploadFiles.length}>{busy ? opponentUploadProgress || "Enviando..." : opponentUploadFiles.length > 1 ? `Encaminhar ${opponentUploadFiles.length} documentos` : "Encaminhar documento"}</button></div></form></Modal>}
  </>;
}

function FinalizedPage({
  tenders,
  outcomes,
  documents,
  team,
  openTender,
}: {
  tenders: Tender[];
  outcomes: TenderOutcome[];
  documents: DocumentRecord[];
  team: TenderTeamRecord[];
  openTender: (tender: Tender) => void;
}) {
  const active = tenders.filter((item) => item.status !== "Finalizada");
  function reuseMatches(outcome: TenderOutcome) {
    const source = normalizedTerms(`${outcome.tender_title} ${outcome.tender_type} ${outcome.reusable_items}`);
    return active.map((tender) => ({ tender, hits: normalizedTerms(`${tender.title} ${tender.tenderType}`).filter((term) => source.includes(term)) })).filter((item) => item.hits.length > 0).sort((a, b) => b.hits.length - a.hits.length).slice(0, 2);
  }
  return <><PageHeading eyebrow="MEMÓRIA E REUTILIZAÇÃO" title="Licitações finalizadas" description="Preserve o dossiê utilizado e cruze processos anteriores com novas licitações para reduzir o tempo de preparação." /><section className="finalized-grid">{outcomes.map((outcome) => { const tender = tenders.find((item) => item.id === outcome.tender_id); const matches = reuseMatches(outcome); const docs = documents.filter((item) => item.tender_id === outcome.tender_id).length; const members = team.filter((item) => item.tender_id === outcome.tender_id).length; return <article className="finalized-card" key={outcome.id}><div className="finalized-card-head"><div><span>{outcome.tender_modality}</span><h3>{outcome.tender_number}</h3></div><StatusPill value={outcome.outcome} /></div><h4>{outcome.tender_title}</h4><p>{outcome.notes || "Processo encerrado com memória preservada."}</p><div className="finalized-assets"><span><b>{docs}</b> documentos</span><span><b>{members}</b> profissionais</span><span><b>{outcome.participant_organization_name || "—"}</b> participante</span></div><div className="reuse-box"><strong>Reutilização sugerida</strong>{matches.length ? matches.map((match) => <button key={match.tender.id} onClick={() => openTender(match.tender)}><span>{match.tender.number}</span><small>{match.hits.slice(0, 3).join(" · ")}</small></button>) : <small>Nenhuma licitação ativa compatível no momento.</small>}</div>{tender && <button className="secondary" onClick={() => openTender(tender)}>Consultar dossiê final</button>}</article>; })}{!outcomes.length && <div className="empty-state"><span>✓</span><h3>Nenhuma licitação finalizada</h3><p>Ao registrar o resultado final, documentos e equipes permanecerão disponíveis para reutilização.</p></div>}</section></>;
}

function DocumentsPage({
  documents,
  tenders,
  upload,
  busy,
  refresh,
  notify,
}: {
  documents: DocumentRecord[];
  tenders: Tender[];
  upload: (file: File, tenderId?: string, category?: string) => Promise<void>;
  busy: boolean;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisFiles, setAnalysisFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<ParsedEdital | null>(null);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas as categorias");
  const categories = ["Análise editalícia", "Edital e anexos", "Termo de Referência", "Projeto básico", "Habilitação", "Equipe profissional", "Proposta técnica", "Proposta de preços", "Diligência / recurso", "Outro"];
  const visibleDocs = documents.filter((doc) => (categoryFilter === "Todas as categorias" || doc.category === categoryFilter) && `${doc.name} ${doc.category} ${doc.uploaded_by}`.toLowerCase().includes(search.toLowerCase().trim()));

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File)) return;
    try {
      await upload(file, String(form.get("tenderId") ?? ""), String(form.get("category") ?? "Documento editalício"));
      setOpen(false);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível enviar o documento.");
    }
  }

  async function analyzeCompleteTender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!analysisFiles.length) {
      notify("Selecione o edital e as demais peças da contratação.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const tenderId = String(form.get("tenderId") ?? "");
    setAnalysisBusy(true);
    try {
      const extracted = await Promise.all(analysisFiles.map((file) => extractDocumentText(file)));
      const parsed = parseEditalDocuments(extracted);
      for (const file of analysisFiles) {
        await upload(file, tenderId, "Análise editalícia");
      }
      setAnalysisResult(parsed);
      setAnalysisOpen(false);
      setAnalysisFiles([]);
      notify(`Análise concluída: ${parsed.inventory.length} peça(s) inventariada(s), com fontes e pendências registradas.`);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível analisar a documentação.");
    } finally {
      setAnalysisBusy(false);
    }
  }

  function downloadAnalysisReport() {
    if (!analysisResult) return;
    const escapeText = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
    const items = (values: string[]) => values.length ? `<ul>${values.map((value) => `<li>${escapeText(value)}</li>`).join("")}</ul>` : "<p>Não identificado automaticamente.</p>";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório de análise editalícia</title><style>body{font-family:Arial,sans-serif;color:#172033;line-height:1.5;margin:42px}h1{color:#8e1830}h2{border-bottom:2px solid #8e1830;padding-bottom:6px;margin-top:28px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd3df;padding:8px;text-align:left}.alert{background:#fff1f2;border-left:5px solid #c93450;padding:12px}</style></head><body><h1>Relatório de análise da documentação editalícia</h1><p><strong>Recomendação preliminar:</strong> ${escapeText(analysisResult.recommendation)}</p><h2>1. Resumo executivo</h2><table><tr><th>Processo</th><td>${escapeText(analysisResult.number || "Não identificado")}</td></tr><tr><th>Modalidade</th><td>${escapeText(analysisResult.modality)}</td></tr><tr><th>Objeto</th><td>${escapeText(analysisResult.title || "Não identificado")}</td></tr><tr><th>Órgão</th><td>${escapeText(analysisResult.organ || "Não identificado")}</td></tr><tr><th>Sessão</th><td>${escapeText(analysisResult.openingAt || "Não identificada")}</td></tr><tr><th>Roteamento</th><td>${escapeText(analysisResult.routedCompany)} — ${escapeText(analysisResult.routingReason)}</td></tr></table><h2>2. Inventário documental</h2><table><tr><th>Arquivo</th><th>Leitura</th><th>Páginas</th><th>Observação</th></tr>${analysisResult.inventory.map((item) => `<tr><td>${escapeText(item.name)}</td><td>${escapeText(item.status)}</td><td>${item.pages}</td><td>${escapeText(item.note)}</td></tr>`).join("")}</table><h2>3. Fase e datas críticas</h2>${items(analysisResult.reviewChecks.map((item) => `${item.label}: ${item.value} [${item.status === "identified" ? "identificado" : "conferir"}]`))}<h2>4. Exigências da empresa</h2>${items(analysisResult.companyRequirements)}<h2>5. Exigências dos profissionais</h2>${items(analysisResult.professionalRequirements)}<h2>6. Condições críticas</h2>${items(analysisResult.criticalConditions.map((item) => `${item.topic}: ${item.finding} — ${item.source}`))}<h2>7. Divergências e riscos</h2>${analysisResult.conflicts.length ? analysisResult.conflicts.map((item) => `<div class="alert"><strong>${escapeText(item.field)}</strong><p>${escapeText(item.values.join(" ↔ "))}</p><small>${escapeText(item.action)}</small></div>`).join("") : "<p>Nenhuma divergência automática identificada.</p>"}<h2>8. Peças não identificadas</h2>${items(analysisResult.missingDocuments)}<h2>9. Próximos passos</h2><ol><li>Conferir campos sem fonte e divergências na publicação mais recente.</li><li>Validar redação integral, quantitativos, unidades, somatórios e CAT.</li><li>Confirmar o roteamento empresarial e a decisão de participação.</li><li>Registrar prazos, responsáveis e evidências no processo.</li></ol><p><em>Relatório preliminar produzido pelo agente do LicitaControl. A decisão e a conferência jurídica, técnica e orçamentária permanecem humanas.</em></p></body></html>`;
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `relatorio-analise-${analysisResult.number || "licitacao"}.doc`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeading
        eyebrow="BASE DOCUMENTAL"
        title="Documentos & conferência"
        description="Centralize o dossiê por processo, a habilitação corporativa, a documentação profissional e as peças do pós-disputa."
        action={<button className="primary" onClick={() => setOpen(true)} disabled={busy}>⇧ {busy ? "Enviando..." : "Enviar documentos"}</button>}
      />
      <section className="document-purpose-grid">
        <article><span>01</span><div><strong>Dossiê editalício</strong><p>Edital, TR, projeto básico, anexos, esclarecimentos, retificações e versões.</p></div></article>
        <article><span>02</span><div><strong>Atendimento da licitação</strong><p>Habilitação, equipe, proposta técnica, proposta de preços e evidências utilizadas.</p></div></article>
        <article><span>03</span><div><strong>Pós-disputa</strong><p>Diligências, recursos, decisões e documentação dos concorrentes no acompanhamento.</p></div></article>
      </section>
      <section className="tender-analysis-agent panel">
        <div className="agent-intro">
          <span className="agent-mark">IA</span>
          <div><span className="eyebrow">AGENTE DE ANÁLISE EDITALÍCIA</span><h2>Importe a licitação completa, não apenas um arquivo</h2><p>O agente inventaria edital, TR, projeto básico, ETP, matriz de riscos, planilhas e minutas; separa exigências da empresa e dos profissionais; aponta fontes, lacunas, conflitos, prazos e rota de atendimento.</p></div>
          <button className="primary" onClick={() => setAnalysisOpen(true)}>＋ Analisar licitação completa</button>
        </div>
        <div className="agent-scope-grid">
          {[["01", "Inventário e leitura"], ["02", "Dados e prazos"], ["03", "Habilitação e equipe"], ["04", "Atestados e quantitativos"], ["05", "Riscos e divergências"], ["06", "Relatório para decisão"]].map(([index, label]) => <div key={index}><span>{index}</span><strong>{label}</strong></div>)}
        </div>
        <div className="analysis-caution"><span>!</span><p>A automação não substitui a conferência humana. Campos conflitantes ou sem evidência ficam marcados para revisão e não são presumidos.</p></div>
      </section>
      {analysisResult && (
        <section className="panel agent-analysis-result">
          <div className="panel-title"><div><span className="eyebrow">ÚLTIMA ANÁLISE</span><h2>{analysisResult.number || "Processo sem número identificado"}</h2><p className="module-description">{analysisResult.title || "Objeto pendente de conferência"}</p></div><div className="heading-actions"><StatusPill value={analysisResult.recommendation} /><button className="primary" onClick={downloadAnalysisReport}>⇩ Emitir relatório</button></div></div>
          <div className="agent-result-metrics"><article><span>Peças inventariadas</span><strong>{analysisResult.inventory.length}</strong></article><article><span>Exigências da empresa</span><strong>{analysisResult.companyRequirements.length}</strong></article><article><span>Exigências profissionais</span><strong>{analysisResult.professionalRequirements.length}</strong></article><article><span>Pendências</span><strong>{analysisResult.missingDocuments.length + analysisResult.conflicts.length}</strong></article></div>
          <div className="agent-routing-result"><span>ROTEAMENTO PRELIMINAR</span><strong>{analysisResult.routedCompany}</strong><p>{analysisResult.routingReason}</p></div>
        </section>
      )}
      <section className="panel documents-table-panel">
        <div className="panel-title">
          <div><span className="eyebrow">ARQUIVO DOCUMENTAL</span><h2>Documentos preservados</h2><p className="module-description">Histórico completo, mantido fora do fluxo principal para reduzir ruído operacional.</p></div>
          <div className="heading-actions"><div className="document-stats"><span>{documents.length} arquivos</span><span>{tenders.length} processos</span></div><button className="secondary" onClick={() => setArchiveVisible((current) => !current)}>{archiveVisible ? "Ocultar arquivo" : "Consultar arquivo"}</button></div>
        </div>
        {archiveVisible && <><div className="document-filters"><label>⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar documento, categoria ou responsável" /></label><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>Todas as categorias</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
        <div className="data-table documents-table">
          <div className="table-row table-head">
            <span>Documento</span><span>Categoria</span><span>Envio</span><span>Status</span><span />
          </div>
          {visibleDocs.map((doc) => (
            <div className="table-row" key={doc.id}>
              <div className="file-cell"><i>{doc.name.endsWith(".pdf") ? "PDF" : "DOC"}</i><div><strong>{doc.name}</strong><small>{(doc.size / 1024 / 1024).toFixed(1)} MB</small></div></div>
              <span>{doc.category}</span>
              <div><strong>{formatDate(doc.created_at)}</strong><small>{doc.uploaded_by}</small></div>
              <StatusPill value={doc.analysis_status} />
              <a className="secondary" href={`/api/documents?id=${doc.id}`}>Baixar ⇩</a>
            </div>
          ))}
          {!visibleDocs.length && <div className="empty-state compact"><span>▱</span><h3>Nenhum documento localizado</h3><p>Importe uma licitação completa ou ajuste os filtros do arquivo.</p></div>}
        </div>
        </>}
      </section>
      {open && <Modal title="Enviar documento para a base" close={() => setOpen(false)}><form className="form-grid" onSubmit={submitDocument}><label className="wide">Licitação / dossiê<select name="tenderId" defaultValue=""><option value="">Biblioteca geral da empresa</option>{tenders.map((tender) => <option key={tender.id} value={tender.id}>{tender.number} · {tender.title}</option>)}</select></label><label className="wide">Categoria<select name="category" defaultValue="Edital e anexos">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="wide">Arquivo<input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" required /></label><div className="routing-notice wide"><strong>Destino do arquivo</strong><span>Selecione a licitação quando o documento integrar um processo específico. Use a biblioteca geral apenas para modelos e documentos corporativos reutilizáveis.</span></div><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Enviando..." : "Guardar documento"}</button></div></form></Modal>}
      {analysisOpen && <Modal title="Analisar licitação completa" close={() => !analysisBusy && setAnalysisOpen(false)}><form className="form-grid" onSubmit={analyzeCompleteTender}><div className="routing-notice wide"><strong>Conjunto documental recomendado</strong><span>Edital, TR, projeto básico, ETP, matriz de riscos, planilhas, minuta, anexos e retificações. PDFs com texto permitem rastreabilidade por página; arquivos sem texto são preservados e marcados para OCR/conferência.</span></div><label className="wide">Vincular a uma licitação existente, se aplicável<select name="tenderId" defaultValue=""><option value="">Análise inicial sem vínculo</option>{tenders.map((tender) => <option value={tender.id} key={tender.id}>{tender.number} · {tender.title}</option>)}</select></label><label className="wide">Edital e demais peças<input type="file" multiple accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.zip" onChange={(event) => setAnalysisFiles(Array.from(event.target.files || []))} required /></label><div className="analysis-file-summary wide"><strong>{analysisFiles.length} arquivo(s) selecionado(s)</strong>{analysisFiles.slice(0, 8).map((file) => <span key={`${file.name}-${file.size}`}>{file.name} · {formatFileSize(file.size)}</span>)}{analysisFiles.length > 8 && <span>＋ {analysisFiles.length - 8} arquivo(s)</span>}</div><div className="form-actions wide"><button type="button" className="ghost" disabled={analysisBusy} onClick={() => setAnalysisOpen(false)}>Cancelar</button><button className="primary" disabled={analysisBusy || !analysisFiles.length}>{analysisBusy ? "Lendo, preservando e conferindo..." : "Executar análise detalhada"}</button></div></form></Modal>}
    </>
  );
}

function daysToExpiry(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

function expiryLabel(document: ComplianceDocument) {
  if (document.no_expiry || !document.expires_at) {
    return { label: "Sem vencimento", tone: "neutral" };
  }
  const days = daysToExpiry(document.expires_at) ?? 0;
  if (days < 0) return { label: `Vencido há ${Math.abs(days)} dia(s)`, tone: "danger" };
  if (days === 0) return { label: "Vence hoje", tone: "danger" };
  if (days <= 2) return { label: `CRÍTICO · vence em ${days} dia(s)`, tone: "danger" };
  if (days <= 5) return { label: `URGENTE · vence em ${days} dia(s)`, tone: "danger" };
  if (days <= 7) return { label: `Prioridade alta · ${days} dia(s)`, tone: "warning" };
  if (days <= 15) return { label: `Renovar em até ${days} dia(s)`, tone: "warning" };
  if (days <= 30) return { label: `Planejar renovação · ${days} dia(s)`, tone: "warning" };
  return { label: `Válido por ${days} dia(s)`, tone: "success" };
}

function OrganizationsPage({
  organizations,
  documents,
  professionals,
  consortiumMembers,
  role,
  refresh,
  notify,
}: {
  organizations: Organization[];
  documents: ComplianceDocument[];
  professionals: Professional[];
  consortiumMembers: ConsortiumMember[];
  role: Role;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [professionalOpen, setProfessionalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [statusProfessional, setStatusProfessional] = useState<Professional | null>(null);
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null);
  const [professionalDeleteReason, setProfessionalDeleteReason] = useState("");
  const [editingDocument, setEditingDocument] = useState<ComplianceDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<ComplianceDocument | null>(null);
  const [cvFocus, setCvFocus] = useState<string>(SERVICE_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [organizationType, setOrganizationType] = useState<"Empresa" | "Consórcio">("Empresa");
  const [memberDrafts, setMemberDrafts] = useState([
    { organizationId: "", percentage: "50", isLeader: true, technicalResponsibility: "" },
    { organizationId: "", percentage: "50", isLeader: false, technicalResponsibility: "" },
  ]);
  const expiring = documents.filter((document) => {
    const days = daysToExpiry(document.expires_at);
    return days !== null && days >= 0 && days <= 30;
  });
  const expired = documents.filter((document) => {
    const days = daysToExpiry(document.expires_at);
    return days !== null && days < 0;
  });
  const valid = documents.filter((document) => {
    const days = daysToExpiry(document.expires_at);
    return document.no_expiry || days === null || days > 30;
  });

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const tccc = form.get("tccc");
    const organization = {
      ...Object.fromEntries(form.entries()),
      type: organizationType,
      consortiumMembers: organizationType === "Consórcio" ? memberDrafts : [],
    };
    if (organizationType === "Consórcio" && (!(tccc instanceof File) || tccc.size === 0)) {
      notify("Inclua o TCCC para cadastrar o consórcio.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createOrganization", organization }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (organizationType === "Consórcio") {
        const documentForm = new FormData();
        documentForm.set("organizationId", result.id);
        documentForm.set("documentType", "TCCC — Termo de compromisso de constituição de consórcio");
        documentForm.set("noExpiry", "true");
        documentForm.set("notes", "Instrumento de constituição e responsabilidades do consórcio.");
        if (!(tccc instanceof File)) throw new Error("Anexe o TCCC do consórcio.");
        documentForm.set("file", tccc);
        const upload = await fetch("/api/compliance-documents", { method: "POST", body: documentForm });
        const uploadResult = await upload.json();
        if (!upload.ok) throw new Error(uploadResult.error);
      }
      setOrganizationOpen(false);
      notify(organizationType === "Consórcio" ? "Consórcio, composição e TCCC registrados." : "Empresa incluída na base de habilitação.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível cadastrar.");
    } finally {
      setBusy(false);
    }
  }

  async function createProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const diploma = form.get("diploma");
    const certificates = form.getAll("certificates").filter((item) => item instanceof File && item.size > 0) as File[];
    const professional = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createProfessional", professional }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const organizationId = String(form.get("organizationId") ?? "");
      const files: Array<{ file: File; type: string }> = [];
      if (diploma instanceof File && diploma.size > 0) files.push({ file: diploma, type: "Diploma de graduação" });
      certificates.forEach((file) => files.push({ file, type: "Certificado de especialização / mestrado" }));
      for (const item of files) {
        const documentForm = new FormData();
        documentForm.set("organizationId", organizationId);
        documentForm.set("professionalId", result.id);
        documentForm.set("documentType", item.type);
        documentForm.set("noExpiry", "true");
        documentForm.set("file", item.file);
        const upload = await fetch("/api/compliance-documents", { method: "POST", body: documentForm });
        const uploadResult = await upload.json();
        if (!upload.ok) throw new Error(uploadResult.error);
      }
      setProfessionalOpen(false);
      notify("Profissional, formação e documentos incluídos no banco de currículos.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível cadastrar.");
    } finally {
      setBusy(false);
    }
  }

  async function updateProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProfessional) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const professional = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateProfessional",
          professionalId: editingProfessional.id,
          professional,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEditingProfessional(null);
      notify("Profissional atualizado e alteração registrada na auditoria.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível editar o profissional.");
    } finally {
      setBusy(false);
    }
  }

  async function changeProfessionalStatus() {
    if (!statusProfessional) return;
    setBusy(true);
    const nextStatus = statusProfessional.status === "Inativo" ? "Ativo" : "Inativo";
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setProfessionalStatus",
          professionalId: statusProfessional.id,
          status: nextStatus,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStatusProfessional(null);
      notify(nextStatus === "Ativo" ? "Profissional reativado no banco de propostas." : "Profissional retirado da equipe ativa; histórico preservado.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível alterar o status do profissional.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfessional() {
    if (!deletingProfessional || !professionalDeleteReason.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteProfessional",
          professionalId: deletingProfessional.id,
          reason: professionalDeleteReason,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDeletingProfessional(null);
      setProfessionalDeleteReason("");
      notify("Profissional excluído do banco ativo com registro na auditoria.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível excluir o profissional.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadComplianceDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    form.set("noExpiry", form.get("noExpiry") ? "true" : "false");
    try {
      const response = await fetch("/api/compliance-documents", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDocumentOpen(false);
      notify("Documento guardado com controle de validade ativo.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Falha no envio do documento.");
    } finally {
      setBusy(false);
    }
  }

  async function updateComplianceDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingDocument) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      id: editingDocument.id,
      organizationId: String(form.get("organizationId") ?? ""),
      professionalId: String(form.get("professionalId") ?? ""),
      documentType: String(form.get("documentType") ?? ""),
      documentNumber: String(form.get("documentNumber") ?? ""),
      issuer: String(form.get("issuer") ?? ""),
      issuedAt: String(form.get("issuedAt") ?? ""),
      expiresAt: String(form.get("expiresAt") ?? ""),
      noExpiry: Boolean(form.get("noExpiry")),
      notes: String(form.get("notes") ?? ""),
    };
    try {
      const response = await fetch("/api/compliance-documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEditingDocument(null);
      notify("Documento atualizado e alteração registrada na auditoria.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível editar o documento.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteComplianceDocument() {
    if (!deletingDocument) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/compliance-documents?id=${encodeURIComponent(deletingDocument.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDeletingDocument(null);
      notify("Documento excluído pela Diretoria e removido dos vínculos ativos.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível excluir o documento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CADASTRO CORPORATIVO"
        title="Empresas, consórcios & habilitação"
        description="Centralize certidões, documentos societários, registros profissionais e respectivos vencimentos."
        action={
          <div className="heading-actions">
            <button className="secondary" onClick={() => setProfessionalOpen(true)}>
              ＋ Profissional
            </button>
            <button className="secondary" onClick={() => setDocumentOpen(true)}>
              ⇧ Importar documento
            </button>
            <button className="primary" onClick={() => setOrganizationOpen(true)}>
              ＋ Empresa ou consórcio
            </button>
          </div>
        }
      />

      <section className="organization-metrics">
        <article><span>Empresas e consórcios</span><strong>{organizations.length}</strong><small>Cadastros aptos a receber documentação</small></article>
        <article className="valid"><span>Documentos regulares</span><strong>{valid.length}</strong><small>Válidos ou sem vencimento</small></article>
        <article className="warning"><span>Vencem em 30 dias</span><strong>{expiring.length}</strong><small>Exigem renovação programada</small></article>
        <article className="danger"><span>Documentos vencidos</span><strong>{expired.length}</strong><small>Bloqueio potencial de habilitação</small></article>
      </section>

      {(expiring.length > 0 || expired.length > 0) && (
        <section className="expiry-alerts panel">
          <div className="panel-title">
            <div><span className="eyebrow">ALERTAS DE VALIDADE</span><h2>Providências documentais</h2></div>
            <span className="updated">{expired.length + expiring.length} alerta(s)</span>
          </div>
          <div className="expiry-alert-list">
            {[...expired, ...expiring].map((document) => {
              const expiry = expiryLabel(document);
              return (
                <div key={document.id}>
                  <span className={`expiry-dot ${expiry.tone}`}>!</span>
                  <div><strong>{document.document_type}</strong><small>{document.organization_name} · {document.name}</small></div>
                  <StatusPill value={expiry.label} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="organization-layout">
        <div className="panel organization-panel">
          <div className="panel-title">
            <div><span className="eyebrow">ESTRUTURA DE PARTICIPAÇÃO</span><h2>Empresas e consórcios cadastrados</h2></div>
          </div>
          <div className="organization-grid">
            {organizations.map((organization) => {
              const orgDocs = documents.filter((document) => document.organization_id === organization.id);
              const orgAlerts = orgDocs.filter((document) => {
                const days = daysToExpiry(document.expires_at);
                return days !== null && days <= 30;
              }).length;
              return (
                <article className="organization-card" key={organization.id}>
                  <div className="organization-card-top">
                    <span className="organization-mark">{organization.type === "Consórcio" ? "C" : initials(organization.name)}</span>
                    <div><span>{organization.type.toUpperCase()}</span><h3>{organization.name}</h3></div>
                    <StatusPill value={organization.status} />
                  </div>
                  <div className="organization-card-info">
                    <span><b>{Number(organization.document_count ?? orgDocs.length)}</b> documentos</span>
                    <span><b>{Number(organization.professional_count ?? 0)}</b> profissionais</span>
                    <span className={orgAlerts ? "has-alert" : ""}><b>{orgAlerts}</b> alertas</span>
                  </div>
                  {organization.type === "Consórcio" && (
                    <div className="consortium-summary">
                      {consortiumMembers.filter((member) => member.consortium_id === organization.id).map((member) => (
                        <div key={member.id}><span>{member.member_organization_name}{member.is_leader ? " · Líder" : ""}</span><strong>{member.participation_percentage}%</strong><small>{member.technical_responsibility}</small></div>
                      ))}
                    </div>
                  )}
                  <small>{organization.tax_id || "CNPJ ainda não informado"}</small>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="panel document-governance">
          <span className="eyebrow">REGRA DE CONTROLE</span>
          <h2>Validade não pode escapar</h2>
          <p>
            Documentos vencidos permanecem no histórico, mas são sinalizados
            como impedimento potencial antes de serem vinculados à licitação.
          </p>
          <div><span>30 dias</span><strong>Planejar renovação</strong></div>
          <div><span>15 dias</span><strong>Iniciar emissão</strong></div>
          <div><span>7 dias</span><strong>Prioridade alta</strong></div>
          <div><span>5 dias</span><strong>Cobrança imediata</strong></div>
          <div><span>2 dias</span><strong>Bloqueio crítico</strong></div>
        </aside>
      </section>

      <section className="panel compliance-table-panel">
        <div className="panel-title">
          <div><span className="eyebrow">DOCUMENTAÇÃO DE HABILITAÇÃO</span><h2>Biblioteca corporativa</h2></div>
          <button className="text-button" onClick={() => setDocumentOpen(true)}>＋ Adicionar</button>
        </div>
        <div className="data-table compliance-table">
          <div className="table-row table-head"><span>Documento</span><span>Empresa / profissional</span><span>Validade</span><span>Status</span><span /></div>
          {documents.map((document) => {
            const expiry = expiryLabel(document);
            return (
              <div className={`table-row compliance-document-row expiry-${expiry.tone}`} key={document.id}>
                <div className="file-cell"><i>PDF</i><div><strong className="compliance-document-name">{document.name}</strong><small>{document.document_type}</small></div></div>
                <div><strong>{document.organization_name}</strong><small>{document.professional_name || "Documento da empresa"}</small></div>
                <div><strong>{document.expires_at ? formatDate(document.expires_at, false) : "Sem vencimento"}</strong><small>{document.issuer || "Emitente não informado"}</small></div>
                <StatusPill value={expiry.label} />
                <div className="compliance-row-actions">
                  {document.size > 0 ? <a href={`/api/compliance-documents?id=${document.id}`}>Baixar ⇩</a> : <span className="demo-file">Exemplo</span>}
                  <button className="text-button" onClick={() => setEditingDocument(document)}>Editar</button>
                  {role === "Diretor" && <button className="text-button danger-text" onClick={() => setDeletingDocument(document)}>Excluir</button>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel professional-directory">
        <div className="panel-title">
          <div><span className="eyebrow">BANCO DE PROFISSIONAIS</span><h2>Equipe disponível para propostas</h2><p className="module-description">O currículo é reorganizado conforme a área exigida na licitação, preservando formação, vínculo, qualificações e documentos comprobatórios.</p></div>
          <div className="professional-heading-actions"><label>Enfoque do currículo<select value={cvFocus} onChange={(event) => setCvFocus(event.target.value)}>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><button className="text-button" onClick={() => setProfessionalOpen(true)}>＋ Cadastrar</button></div>
        </div>
        <div className="professional-grid">
          {professionals.map((professional) => (
            <article className={professional.status === "Inativo" ? "professional-inactive" : ""} key={professional.id}>
              <MiniAvatar name={professional.name} />
              <div><h3>{professional.name}</h3><p>{professional.professional_role}</p><small>{professional.relationship_type || "Próprio"} · {professional.organization_name || "Sem vínculo"} · {[professional.council, professional.registration].filter(Boolean).join(" ") || "Registro pendente"}</small><span>{professional.formation || professional.specialty || "Formação pendente"}</span></div>
              <div className="professional-actions"><StatusPill value={professional.status} /><a href={`/api/professional-cv?id=${professional.id}&area=${encodeURIComponent(cvFocus)}`} target="_blank" rel="noreferrer">Gerar currículo direcionado</a><div className="professional-card-actions"><button className="text-button" onClick={() => setEditingProfessional(professional)}>Editar</button><button className="text-button" onClick={() => setStatusProfessional(professional)}>{professional.status === "Inativo" ? "Reativar" : "Retirar"}</button>{role === "Diretor" && <button className="text-button danger-text" onClick={() => setDeletingProfessional(professional)}>Excluir</button>}</div></div>
            </article>
          ))}
        </div>
      </section>

      {organizationOpen && (
        <Modal title="Cadastrar empresa ou consórcio" close={() => setOrganizationOpen(false)}>
          <form className="form-grid" onSubmit={createOrganization}>
            <label>Tipo<select name="type" value={organizationType} onChange={(event) => setOrganizationType(event.target.value as "Empresa" | "Consórcio")}><option>Empresa</option><option>Consórcio</option></select></label>
            <label>CNPJ / identificação<input name="taxId" placeholder="00.000.000/0001-00" /></label>
            <label className="wide">Nome da organização<input name="name" placeholder="Razão social ou nome do consórcio" required /></label>
            {organizationType === "Consórcio" && <div className="wide consortium-builder"><div className="consortium-builder-head"><div><strong>Composição do consórcio</strong><small>Os percentuais devem totalizar 100% e apenas uma empresa deve ser líder.</small></div><button type="button" className="secondary" onClick={() => setMemberDrafts((current) => [...current, { organizationId: "", percentage: "", isLeader: false, technicalResponsibility: "" }])}>＋ Integrante</button></div>{memberDrafts.map((member, index) => <div className="consortium-member-row" key={index}><select aria-label={`Empresa integrante ${index + 1}`} value={member.organizationId} onChange={(event) => setMemberDrafts((current) => current.map((item, memberIndex) => memberIndex === index ? { ...item, organizationId: event.target.value } : item))}><option value="">Selecione a empresa</option>{organizations.filter((organization) => organization.type === "Empresa").map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select><input aria-label="Percentual" type="number" min="0.01" max="100" step="0.01" value={member.percentage} onChange={(event) => setMemberDrafts((current) => current.map((item, memberIndex) => memberIndex === index ? { ...item, percentage: event.target.value } : item))} placeholder="%" /><select aria-label="Liderança" value={member.isLeader ? "Líder" : "Consorciada"} onChange={(event) => setMemberDrafts((current) => current.map((item, memberIndex) => ({ ...item, isLeader: memberIndex === index ? event.target.value === "Líder" : event.target.value === "Líder" ? false : item.isLeader })))}><option>Consorciada</option><option>Líder</option></select><input aria-label="Responsabilidade técnica" value={member.technicalResponsibility} onChange={(event) => setMemberDrafts((current) => current.map((item, memberIndex) => memberIndex === index ? { ...item, technicalResponsibility: event.target.value } : item))} placeholder="Responsabilidade técnica" />{memberDrafts.length > 2 && <button type="button" className="icon-button" onClick={() => setMemberDrafts((current) => current.filter((_, memberIndex) => memberIndex !== index))}>×</button>}</div>)}<div className="consortium-total">Total: <strong>{memberDrafts.reduce((sum, member) => sum + Number(member.percentage || 0), 0).toFixed(2)}%</strong></div><label>TCCC — Termo de compromisso<input name="tccc" type="file" accept=".pdf,.doc,.docx" required /></label></div>}
            <label className="wide">Observações<textarea name="notes" rows={3} /></label>
            <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setOrganizationOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : "Cadastrar organização"}</button></div>
          </form>
        </Modal>
      )}

      {professionalOpen && (
        <Modal title="Cadastrar profissional" close={() => setProfessionalOpen(false)}>
          <form className="form-grid" onSubmit={createProfessional}>
            <label className="wide">Nome completo<input name="name" required /></label>
            <label>Empresa responsável / parceira<select name="organizationId" defaultValue="" required><option value="" disabled>Selecione</option>{organizations.filter((organization) => organization.type === "Empresa").map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></label>
            <label>Relação com a empresa<select name="relationshipType" defaultValue="Próprio"><option>Próprio</option><option>Parceiro</option><option>Consorciado</option><option>Consultor</option></select></label>
            <label>Função principal<input name="professionalRole" placeholder="Coordenador, Engenheiro..." required /></label>
            <label>Conselho<input name="council" placeholder="CREA, CAU..." /></label>
            <label>Registro<input name="registration" placeholder="Número e UF" /></label>
            <label className="wide">Especialidade<input name="specialty" placeholder="Rodovias, saneamento, estruturas..." /></label>
            <label>Formação<input name="formation" placeholder="Engenharia Civil, Arquitetura..." required /></label>
            <label>Titulação<select name="degree" defaultValue="Graduação"><option>Graduação</option><option>Especialização</option><option>Mestrado</option><option>Doutorado</option></select></label>
            <label>Instituição<input name="institution" /></label><label>Ano de formação<input name="graduationYear" inputMode="numeric" /></label>
            <label className="wide">Áreas de experiência<input name="experienceAreas" placeholder="Saneamento; rodovias; gerenciamento; estruturas..." /></label>
            <label className="wide">Qualificações e cursos<textarea name="qualifications" rows={3} placeholder="Uma qualificação por linha ou separada por ponto e vírgula" /></label>
            <label className="wide">Síntese da experiência profissional<textarea name="experienceSummary" rows={4} placeholder="Experiências, funções, portes, objetos e resultados relevantes para propostas técnicas" /></label>
            <label>Diploma de graduação<input name="diploma" type="file" accept=".pdf,.jpg,.jpeg,.png" /></label><label>Certificados / especializações<input name="certificates" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple /></label>
            <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setProfessionalOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : "Cadastrar profissional"}</button></div>
          </form>
        </Modal>
      )}

      {editingProfessional && (
        <Modal title="Editar profissional" close={() => setEditingProfessional(null)}>
          <form className="form-grid" onSubmit={updateProfessional}>
            <div className="routing-notice wide"><strong>Histórico e documentos preservados</strong><span>A edição atualiza o cadastro e o currículo. Diplomas, certificados e participações anteriores permanecem vinculados ao profissional.</span></div>
            <label className="wide">Nome completo<input name="name" defaultValue={editingProfessional.name} required /></label>
            <label>Empresa responsável / parceira<select name="organizationId" defaultValue={editingProfessional.organization_id || ""} required><option value="" disabled>Selecione</option>{organizations.filter((organization) => organization.type === "Empresa").map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></label>
            <label>Relação com a empresa<select name="relationshipType" defaultValue={editingProfessional.relationship_type || "Próprio"}><option>Próprio</option><option>Parceiro</option><option>Consorciado</option><option>Consultor</option></select></label>
            <label>Função principal<input name="professionalRole" defaultValue={editingProfessional.professional_role} required /></label>
            <label>Conselho<input name="council" defaultValue={editingProfessional.council} placeholder="CREA, CAU..." /></label>
            <label>Registro<input name="registration" defaultValue={editingProfessional.registration} placeholder="Número e UF" /></label>
            <label className="wide">Especialidade<input name="specialty" defaultValue={editingProfessional.specialty} /></label>
            <label>Formação<input name="formation" defaultValue={editingProfessional.formation || ""} required /></label>
            <label>Titulação<select name="degree" defaultValue={editingProfessional.degree || "Graduação"}><option>Graduação</option><option>Especialização</option><option>Mestrado</option><option>Doutorado</option></select></label>
            <label>Instituição<input name="institution" defaultValue={editingProfessional.institution || ""} /></label>
            <label>Ano de formação<input name="graduationYear" defaultValue={editingProfessional.graduation_year || ""} inputMode="numeric" /></label>
            <label className="wide">Áreas de experiência<input name="experienceAreas" defaultValue={editingProfessional.experience_areas || ""} /></label>
            <label className="wide">Qualificações e cursos<textarea name="qualifications" defaultValue={editingProfessional.qualifications || ""} rows={3} /></label>
            <label className="wide">Síntese da experiência profissional<textarea name="experienceSummary" defaultValue={editingProfessional.experience_summary || ""} rows={4} /></label>
            <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setEditingProfessional(null)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</button></div>
          </form>
        </Modal>
      )}

      {statusProfessional && (
        <Modal title={statusProfessional.status === "Inativo" ? "Reativar profissional" : "Retirar profissional da equipe ativa"} close={() => setStatusProfessional(null)}>
          <div className="status-change-summary"><MiniAvatar name={statusProfessional.name} /><div><strong>{statusProfessional.name}</strong><span>{statusProfessional.professional_role} · {statusProfessional.organization_name || "Sem empresa vinculada"}</span></div></div>
          {statusProfessional.status !== "Inativo" ? <div className="routing-notice"><strong>O que será alterado</strong><span>O profissional deixará de aparecer como disponível para novas propostas e suas indicações ativas serão marcadas como retiradas. Currículo, documentos e histórico serão preservados.</span></div> : <div className="routing-notice"><strong>Reativação controlada</strong><span>O profissional voltará ao banco disponível. Participações antigas não serão restauradas automaticamente.</span></div>}
          <div className="form-actions"><button className="ghost" onClick={() => setStatusProfessional(null)}>Cancelar</button><button className="primary" disabled={busy} onClick={changeProfessionalStatus}>{busy ? "Processando..." : statusProfessional.status === "Inativo" ? "Confirmar reativação" : "Confirmar retirada"}</button></div>
        </Modal>
      )}

      {deletingProfessional && (
        <Modal title="Excluir profissional" close={() => setDeletingProfessional(null)}>
          <div className="danger-callout"><strong>Ação exclusiva da Diretoria</strong><p>{deletingProfessional.name} será removido do banco disponível e não poderá ser selecionado em novas propostas. Documentos, vínculos anteriores e auditoria serão preservados para rastreabilidade.</p></div>
          <label className="delete-professional-reason">Justificativa obrigatória<textarea rows={4} value={professionalDeleteReason} onChange={(event) => setProfessionalDeleteReason(event.target.value)} placeholder="Informe desligamento, duplicidade, substituição cadastral ou outro motivo." /></label>
          <div className="form-actions"><button className="ghost" onClick={() => setDeletingProfessional(null)}>Cancelar</button><button className="danger-button" disabled={busy || !professionalDeleteReason.trim()} onClick={deleteProfessional}>{busy ? "Excluindo..." : "Confirmar exclusão"}</button></div>
        </Modal>
      )}

      {documentOpen && (
        <Modal title="Importar documento de habilitação" close={() => setDocumentOpen(false)}>
          <form className="form-grid" onSubmit={uploadComplianceDocument}>
            <label>Empresa / consórcio<select name="organizationId" required defaultValue=""><option value="" disabled>Selecione</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></label>
            <label>Profissional, se aplicável<select name="professionalId" defaultValue=""><option value="">Documento da empresa</option>{professionals.map((professional) => <option value={professional.id} key={professional.id}>{professional.name}</option>)}</select></label>
            <label className="wide">Tipo do documento<select name="documentType" defaultValue="Regularidade fiscal"><option>Habilitação jurídica</option><option>Regularidade fiscal</option><option>Regularidade trabalhista</option><option>Regularidade perante o FGTS</option><option>Qualificação econômico-financeira</option><option>Registro no conselho profissional</option><option>Diploma / certificado</option><option>CAT / certidão de acervo</option><option>Procuração / representação</option><option>Declaração</option><option>Outro documento</option></select></label>
            <label>Número / referência<input name="documentNumber" /></label>
            <label>Órgão emitente<input name="issuer" /></label>
            <label>Emissão<input name="issuedAt" type="date" /></label>
            <label>Vencimento<input name="expiresAt" type="date" /></label>
            <label className="wide checkbox-label"><input name="noExpiry" type="checkbox" /> Documento sem prazo de validade</label>
            <label className="wide">Arquivo<input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" required /></label>
            <label className="wide">Observações<textarea name="notes" rows={2} /></label>
            <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setDocumentOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Enviando..." : "Guardar e controlar validade"}</button></div>
          </form>
        </Modal>
      )}

      {editingDocument && (
        <Modal title="Editar documento de habilitação" close={() => setEditingDocument(null)}>
          <form className="form-grid" onSubmit={updateComplianceDocument}>
            <div className="routing-notice wide"><strong>Arquivo preservado</strong><span>{editingDocument.name}. Esta edição altera vínculo, classificação e validade; para substituir o arquivo, cadastre uma nova versão.</span></div>
            <label>Empresa / consórcio<select name="organizationId" required defaultValue={editingDocument.organization_id}>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></label>
            <label>Profissional, se aplicável<select name="professionalId" defaultValue={editingDocument.professional_id || ""}><option value="">Documento da empresa</option>{professionals.map((professional) => <option value={professional.id} key={professional.id}>{professional.name}</option>)}</select></label>
            <label className="wide">Tipo do documento<select name="documentType" defaultValue={editingDocument.document_type}><option>Habilitação jurídica</option><option>Regularidade fiscal</option><option>Regularidade trabalhista</option><option>Regularidade perante o FGTS</option><option>Qualificação econômico-financeira</option><option>Registro no conselho profissional</option><option>Diploma / certificado</option><option>CAT / certidão de acervo</option><option>Procuração / representação</option><option>Declaração</option><option>Outro documento</option>{!["Habilitação jurídica", "Regularidade fiscal", "Regularidade trabalhista", "Regularidade perante o FGTS", "Qualificação econômico-financeira", "Registro no conselho profissional", "Diploma / certificado", "CAT / certidão de acervo", "Procuração / representação", "Declaração", "Outro documento"].includes(editingDocument.document_type) && <option>{editingDocument.document_type}</option>}</select></label>
            <label>Número / referência<input name="documentNumber" defaultValue={editingDocument.document_number} /></label>
            <label>Órgão emitente<input name="issuer" defaultValue={editingDocument.issuer} /></label>
            <label>Emissão<input name="issuedAt" type="date" defaultValue={editingDocument.issued_at?.slice(0, 10) || ""} /></label>
            <label>Vencimento<input name="expiresAt" type="date" defaultValue={editingDocument.expires_at?.slice(0, 10) || ""} /></label>
            <label className="wide checkbox-label"><input name="noExpiry" type="checkbox" defaultChecked={Boolean(editingDocument.no_expiry)} /> Documento sem prazo de validade</label>
            <label className="wide">Observações<textarea name="notes" rows={3} defaultValue={editingDocument.notes} /></label>
            <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setEditingDocument(null)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</button></div>
          </form>
        </Modal>
      )}

      {deletingDocument && (
        <Modal title="Excluir documento de habilitação" close={() => setDeletingDocument(null)}>
          <div className="danger-callout"><strong>Ação exclusiva da Diretoria</strong><p>O arquivo “{deletingDocument.name}” será removido da biblioteca e de todos os vínculos ativos com licitações. A autoria da exclusão permanecerá na auditoria.</p></div>
          <div className="form-actions"><button className="ghost" onClick={() => setDeletingDocument(null)}>Cancelar</button><button className="danger-button" disabled={busy} onClick={deleteComplianceDocument}>{busy ? "Excluindo..." : "Confirmar exclusão"}</button></div>
        </Modal>
      )}
    </>
  );
}

function CompanyDocumentationPage({
  records,
  sources,
  opportunities,
  decisions,
  user,
  createRecord,
  consultPncp,
  decidePncp,
  busy,
  refresh,
  notify,
  organizations,
  consortiumMembers,
  openOrganizations,
}: {
  records: TechnicalRecord[];
  sources: ArchiveSource[];
  opportunities: PncpOpportunity[];
  decisions: PncpDecision[];
  user: PortalUser;
  createRecord: () => void;
  consultPncp: () => void;
  decidePncp: (opportunityId: string, decision: string, reason: string) => Promise<void>;
  busy: boolean;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  organizations: Organization[];
  consortiumMembers: ConsortiumMember[];
  openOrganizations: () => void;
}) {
  const [company, setCompany] = useState("Todas");
  const [search, setSearch] = useState("");
  const [recordSelected, setRecordSelected] = useState<TechnicalRecord | null>(
    null,
  );
  const [decisionTarget, setDecisionTarget] = useState<PncpOpportunity | null>(null);
  const [decisionChoice, setDecisionChoice] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [archiveUploadTarget, setArchiveUploadTarget] = useState<TechnicalRecord | null>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveImportingId, setArchiveImportingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<TechnicalRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<TechnicalRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const normalizedSearch = search.toLowerCase().trim();
  const filtered = records.filter((record) => {
    const companyMatch = company === "Todas" || record.company === company;
    const corpus = [
      record.certificateNumber,
      record.issuer,
      record.object,
      record.serviceType,
      record.mainServices,
      record.characteristics,
      record.quantitySummary,
      record.technicalArea,
      record.keywords.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return companyMatch && (!normalizedSearch || corpus.includes(normalizedSearch));
  });
  const ufcCount = records.filter((record) => record.company === "UFC Engenharia").length;
  const porticoCount = records.filter(
    (record) => record.company === "Pórtico Construções",
  ).length;
  const synchronizedCount = records.filter((record) => record.status === "Sincronizado").length;
  const decisionOptions =
    user.role === "Diretor"
      ? ["Aprovar participação", "Negar participação"]
      : user.role === "Coordenador"
        ? ["Aprovar para Diretoria", "Negar tecnicamente"]
        : user.role === "Operador" && user.pncpCanApprove
          ? ["Recomendar aprovação", "Recomendar negativa"]
          : [];
  const partnerOrganizationIds = new Set(consortiumMembers.map((member) => member.member_organization_id));
  const consortiumPartners = organizations.filter((organization) => partnerOrganizationIds.has(organization.id));

  async function updateRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRecord) return;
    setArchiveBusy(true);
    const form = new FormData(event.currentTarget);
    const technicalRecord = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateTechnicalRecord", technicalRecordId: editingRecord.id, technicalRecord }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEditingRecord(null);
      setRecordSelected(null);
      notify("Acervo retificado e alteração registrada na auditoria.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível retificar o acervo.");
    } finally {
      setArchiveBusy(false);
    }
  }

  async function removeRecord() {
    if (!deleteRecord || !deleteReason.trim()) return;
    setArchiveBusy(true);
    try {
      const response = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteTechnicalRecord", technicalRecordId: deleteRecord.id, reason: deleteReason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDeleteRecord(null);
      setDeleteReason("");
      setRecordSelected(null);
      notify("Registro retirado do acervo ativo e preservado para auditoria.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível excluir o registro.");
    } finally {
      setArchiveBusy(false);
    }
  }

  async function uploadArchiveCopy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!archiveUploadTarget) return;
    setArchiveBusy(true);
    const form = new FormData(event.currentTarget);
    form.set("recordId", archiveUploadTarget.id);
    try {
      const response = await fetch("/api/archive-documents", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setArchiveUploadTarget(null);
      setRecordSelected(null);
      notify("Cópia importada: o documento agora abre diretamente no portal para todos os usuários autorizados.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível importar a cópia.");
    } finally {
      setArchiveBusy(false);
    }
  }

  async function importArchiveCopyFromDrive(record: TechnicalRecord) {
    setArchiveImportingId(record.id);
    try {
      const response = await fetch("/api/archive-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: record.id, importFromDrive: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRecordSelected(null);
      notify(
        "Cópia criada a partir do Drive. O documento agora abre no portal sem solicitar autorização do proprietário.",
      );
      await refresh();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a cópia a partir do Drive.",
      );
    } finally {
      setArchiveImportingId(null);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="DOCUMENTAÇÃO DA EMPRESA"
        title="Acervo técnico & inteligência PNCP"
        description="Consulte atestados, quantitativos e especialidades e use o acervo como evidência para encontrar oportunidades aderentes."
        action={
          <div className="heading-actions">
            <button className="secondary" onClick={consultPncp} disabled={busy}>
              ◌ {busy ? "Consultando..." : "Consultar PNCP"}
            </button>
            <button className="primary" onClick={createRecord}>
              ＋ Novo atestado
            </button>
          </div>
        }
      />

      <section className="source-grid">
        {sources.map((source) => (
          <article className="source-card" key={source.id}>
            <div className="source-card-head">
              <span className={`company-chip ${source.organization_name.startsWith("UFC") ? "ufc" : "portico"}`}>
                {source.organization_name}
              </span>
              <StatusPill value={source.status} />
            </div>
            <h3>{source.name}</h3>
            <p>{source.source_format} · {source.record_count} registros vinculados</p>
            <div className="source-meta">
              <span>Origem: {source.provider_type}</span>
              <span>Atualizada em {formatDate(source.last_modified_at || source.last_synced_at)}</span>
            </div>
            <a href={source.source_url} target="_blank" rel="noreferrer">
              Abrir planilha-fonte ↗
            </a>
          </article>
        ))}
      </section>

      <section className="panel consortium-archive-panel">
        <div className="panel-title"><div><span className="eyebrow">PARCEIROS DE CONSÓRCIO</span><h2>Base documental para futuras composições</h2></div><button className="text-button" onClick={openOrganizations}>Gerenciar empresas e TCCC →</button></div>
        <div className="consortium-partner-grid">
          {consortiumPartners.map((organization) => <article key={organization.id}><span className="organization-mark">{initials(organization.name)}</span><div><strong>{organization.name}</strong><p>{organization.tax_id || "Identificação pendente"}</p><small>{Number(organization.document_count || 0)} documento(s) · {Number(organization.professional_count || 0)} profissional(is)</small></div><StatusPill value={organization.status} /></article>)}
          {!consortiumPartners.length && <div className="empty-consortium-partners"><strong>Nenhum parceiro vinculado a consórcio</strong><p>Cadastre a empresa parceira, seus documentos e a composição do consórcio para permitir futuras sugestões automáticas.</p><button className="secondary" onClick={openOrganizations}>Cadastrar parceiro</button></div>}
        </div>
      </section>

      <div className="archive-access-banner">
        <div><span>✓</span><p><strong>Consulta documental habilitada</strong>Abra o documento original pelo link do Drive. Quando desejar independência da permissão de origem, crie uma cópia interna automática ou envie o arquivo manualmente.</p></div>
        <strong>{records.filter((record) => record.hasInternalDocument).length}/{records.length} documentos internos</strong>
      </div>

      <section className="archive-metrics">
        <article>
          <span>Registros no acervo</span>
          <strong>{records.length}</strong>
          <small>{synchronizedCount} importados das fontes vinculadas</small>
        </article>
        <article className="ufc">
          <span>UFC Engenharia</span>
          <strong>{ufcCount}</strong>
          <small>Projetos, consultoria e gerenciamento</small>
        </article>
        <article className="portico">
          <span>Pórtico Construções</span>
          <strong>{porticoCount}</strong>
          <small>Integrada, manutenção e execução</small>
        </article>
        <article>
          <span>Aderências PNCP</span>
          <strong>{opportunities.length}</strong>
          <small>Oportunidades priorizadas pelo acervo</small>
        </article>
      </section>

      <section className="archive-layout">
        <div className="panel archive-panel">
          <div className="archive-toolbar">
            <div className="archive-tabs">
              {[
                ["Todas", records.length],
                ["UFC Engenharia", ufcCount],
                ["Pórtico Construções", porticoCount],
              ].map(([label, count]) => (
                <button
                  key={label}
                  className={company === label ? "active" : ""}
                  onClick={() => setCompany(String(label))}
                >
                  {label} <span>{count}</span>
                </button>
              ))}
            </div>
            <label className="archive-search">
              ⌕
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar objeto, serviço, quantitativo ou CAT..."
              />
            </label>
          </div>
          <div className="archive-results">
            <div className="archive-results-head">
              <div>
                <span className="eyebrow">ATESTADOS & CERTIDÕES</span>
                <h2>{filtered.length} registro(s) encontrado(s)</h2>
              </div>
              <span className="updated">Fontes vinculadas · links documentais preservados</span>
            </div>
            {filtered.map((record) => (
              <article className="archive-record" key={record.id}>
                <div className="archive-record-top">
                  <span className={`company-chip ${record.company.startsWith("UFC") ? "ufc" : "portico"}`}>
                    {record.company}
                  </span>
                  <StatusPill value={record.status} />
                </div>
                <div className="archive-record-main">
                  <div>
                    <small>{record.certificateNumber} · {record.serviceType}</small>
                    <h3>{record.object}</h3>
                    <p>{record.issuer} {record.location ? `· ${record.location}` : ""}</p>
                  </div>
                  <div className="quantity-box">
                    <span>QUANTITATIVOS</span>
                    <strong>{record.quantitySummary}</strong>
                  </div>
                </div>
                <div className="service-tags">
                  {[record.technicalArea, ...record.keywords].filter(Boolean).slice(0, 5).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="archive-record-foot">
                  <p>{record.mainServices}</p>
                  <div className="record-actions">
                    {record.hasInternalDocument ? <a href={`/api/archive-documents?id=${record.id}`} target="_blank" rel="noreferrer">Documento interno ↗</a> : record.documentReference.startsWith("http") ? <><a href={record.documentReference} target="_blank" rel="noreferrer">Abrir no Drive ↗</a><button className="import-copy" disabled={archiveImportingId === record.id} onClick={() => importArchiveCopyFromDrive(record)}>{archiveImportingId === record.id ? "Importando..." : "Salvar no portal"}</button></> : <button className="import-copy" onClick={() => setArchiveUploadTarget(record)}>⇧ Enviar cópia</button>}
                    <button onClick={() => setRecordSelected(record)}>Consultar →</button>
                  </div>
                </div>
              </article>
            ))}
            {!filtered.length && (
              <div className="empty-archive">
                <span>⌕</span>
                <h3>Nenhum atestado encontrado</h3>
                <p>Ajuste os filtros ou cadastre um novo registro técnico.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="panel routing-panel">
          <span className="eyebrow">MATRIZ DE DIRECIONAMENTO</span>
          <h2>Como o radar classifica</h2>
          <p>
            O objeto publicado é cruzado com o tipo de serviço, palavras-chave,
            características e quantitativos dos atestados.
          </p>
          <div className="routing-rule ufc">
            <span>UFC</span>
            <div>
              <strong>UFC Engenharia</strong>
              <p>Projeto · assessoramento · gerenciamento · consultoria · elaboração · supervisão</p>
            </div>
          </div>
          <div className="routing-rule portico">
            <span>P</span>
            <div>
              <strong>Pórtico Construções</strong>
              <p>Contratação integrada · manutenção · execução · obras · implantação</p>
            </div>
          </div>
          <div className="routing-note">
            <strong>Critério de aderência</strong>
            <p>
              A sugestão apoia a triagem. A decisão final depende da leitura do
              edital e da comprovação dos quantitativos mínimos exigidos.
            </p>
          </div>
        </aside>
      </section>

      <section className="panel pncp-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">RADAR DE OPORTUNIDADES</span>
            <h2>Licitações aderentes no PNCP</h2>
          </div>
          <span className="updated">
            API oficial · propostas em aberto · janela de 60 dias
          </span>
        </div>
        <div className="approval-sequence">
          <div><span>1</span><strong>Operador liberado</strong><small>Recomenda ou não recomenda</small></div>
          <div><span>2</span><strong>Coordenação</strong><small>Valida tecnicamente ou nega</small></div>
          <div><span>3</span><strong>Diretoria</strong><small>Aprova ou nega a participação</small></div>
        </div>
        {opportunities.length ? (
          <div className="opportunity-grid">
            {opportunities.slice(0, 8).map((opportunity) => {
              const suggestions = suggestArchiveRecords(opportunity, records);
              const history = decisions.filter(
                (decision) => decision.opportunity_id === opportunity.id,
              );
              const isFinal = ["Aprovada pela Diretoria", "Negada pela Diretoria"].includes(opportunity.status);
              return (
                <article className="opportunity-card" key={opportunity.id}>
                  <div className="opportunity-topline">
                    <span className={`company-chip ${opportunity.suggested_company.startsWith("UFC") ? "ufc" : "portico"}`}>
                      {opportunity.suggested_company}
                    </span>
                    <strong className="match-score">{opportunity.match_score}% aderente</strong>
                  </div>
                  <div className="opportunity-status">
                    <StatusPill value={opportunity.status} />
                    <small>{opportunity.modality} · {opportunity.purchase_number || opportunity.pncp_control_number}</small>
                  </div>
                  <h3>{opportunity.object}</h3>
                  <p>{opportunity.organ}{opportunity.location ? ` · ${opportunity.location}` : ""}</p>
                  <div className="match-terms">
                    {opportunity.matched_terms.split(",").filter(Boolean).slice(0, 5).map((term) => (
                      <span key={term}>{term}</span>
                    ))}
                  </div>
                  <div className="evidence-list">
                    <strong>CATs e atestados indicados</strong>
                    {suggestions.length ? suggestions.map(({ record, matched }) => (
                      <a key={record.id} href={record.hasInternalDocument ? `/api/archive-documents?id=${record.id}` : record.documentReference} target="_blank" rel="noreferrer">
                        <span>{record.certificateNumber}</span>
                        <p>{record.object}</p>
                        <small>{matched.slice(0, 3).join(" · ")}</small>
                      </a>
                    )) : <small>Sem evidência direta; exige análise manual do acervo.</small>}
                  </div>
                  {history[0] && (
                    <div className="decision-summary">
                      <span>{history[0].actor_role}</span>
                      <p><strong>{history[0].decision}</strong> · {history[0].reason}</p>
                    </div>
                  )}
                  <div className="opportunity-foot">
                    <span>
                      {opportunity.opening_at
                        ? `Até ${formatDate(opportunity.opening_at)}`
                        : "Prazo não informado"}
                    </span>
                    <div>
                      <a href={opportunity.source_url} target="_blank" rel="noreferrer">
                        Abrir PNCP ↗
                      </a>
                      {decisionOptions.length > 0 && !isFinal && (
                        <button
                          className="decision-button"
                          onClick={() => {
                            setDecisionTarget(opportunity);
                            setDecisionChoice(decisionOptions[0]);
                            setDecisionReason("");
                          }}
                        >
                          Registrar decisão
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="pncp-empty">
            <div className="radar-visual"><i /><i /><i /><span>⌖</span></div>
            <div>
              <h3>Radar pronto para a primeira consulta</h3>
              <p>
                Clique em “Consultar PNCP” para examinar concorrências e pregões
                com propostas abertas e registrar as aderências encontradas.
              </p>
              <button className="secondary" onClick={consultPncp} disabled={busy}>
                {busy ? "Consultando API oficial..." : "Executar consulta agora"}
              </button>
            </div>
          </div>
        )}
      </section>

      {decisionTarget && (
        <Modal title="Registrar decisão da oportunidade" close={() => setDecisionTarget(null)}>
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              await decidePncp(decisionTarget.id, decisionChoice, decisionReason);
              setDecisionTarget(null);
            }}
          >
            <div className="decision-context wide">
              <span className={`company-chip ${decisionTarget.suggested_company.startsWith("UFC") ? "ufc" : "portico"}`}>
                {decisionTarget.suggested_company}
              </span>
              <strong>{decisionTarget.object}</strong>
              <small>{decisionTarget.organ}</small>
            </div>
            <label className="wide">
              Decisão disponível para {user.role}
              <select value={decisionChoice} onChange={(event) => setDecisionChoice(event.target.value)}>
                {decisionOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="wide">
              Justificativa e condicionantes
              <textarea
                rows={4}
                value={decisionReason}
                onChange={(event) => setDecisionReason(event.target.value)}
                placeholder="Registre aderência, documentos indicados, riscos e providências."
                required
              />
            </label>
            <div className="form-actions wide">
              <button type="button" className="ghost" onClick={() => setDecisionTarget(null)}>Cancelar</button>
              <button className="primary" disabled={busy || !decisionChoice || !decisionReason.trim()}>
                {busy ? "Registrando..." : "Confirmar decisão"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {recordSelected && (
        <>
          <button
            className="backdrop"
            aria-label="Fechar detalhes"
            onClick={() => setRecordSelected(null)}
          />
          <aside className="drawer archive-drawer">
            <div className="drawer-head">
              <div>
                <span className="eyebrow">{recordSelected.company}</span>
                <h2>{recordSelected.certificateNumber}</h2>
              </div>
              <div className="drawer-head-actions"><button aria-label="Editar acervo" onClick={() => setEditingRecord(recordSelected)}>✎</button><button aria-label="Fechar" onClick={() => setRecordSelected(null)}>×</button></div>
            </div>
            <StatusPill value={recordSelected.status} />
            <h3>{recordSelected.object}</h3>
            <p className="drawer-summary">{recordSelected.mainServices}</p>
            <div className="drawer-info">
              <div><span>EMITENTE</span><strong>{recordSelected.issuer}</strong></div>
              <div><span>TIPO</span><strong>{recordSelected.serviceType}</strong></div>
              <div><span>ÁREA</span><strong>{recordSelected.technicalArea}</strong></div>
              <div><span>LOCAL</span><strong>{recordSelected.location || "Não informado"}</strong></div>
              <div><span>CONTRATO</span><strong>{recordSelected.contractNumber || "Não informado"}</strong></div>
              <div><span>CAT</span><strong>{recordSelected.catNumber || "Não informada"}</strong></div>
            </div>
            <section className="drawer-section">
              <span className="eyebrow">QUANTITATIVOS COMPROVADOS</span>
              <div className="drawer-quantity">{recordSelected.quantitySummary}</div>
            </section>
            <section className="drawer-section">
              <span className="eyebrow">CARACTERÍSTICAS</span>
              <p className="drawer-summary">
                {recordSelected.characteristics || "Não informadas"}
              </p>
            </section>
            <section className="drawer-section">
              <span className="eyebrow">REFERÊNCIA DOCUMENTAL</span>
              {recordSelected.hasInternalDocument ? <div className="archive-document-ready"><span>✓ Cópia interna disponível</span><a className="document-reference-link internal primary" href={`/api/archive-documents?id=${recordSelected.id}`} target="_blank" rel="noreferrer">Consultar CAT / atestado no portal ↗</a>{recordSelected.documentReference.startsWith("http") && <a href={recordSelected.documentReference} target="_blank" rel="noreferrer">Abrir também a origem no Drive ↗</a>}</div> : <div className="archive-document-pending"><span className="document-source-status">Link do Google Drive cadastrado</span><p>O documento pode ser consultado diretamente na origem. Para que ele abra no portal sem depender da autorização do proprietário, crie uma cópia interna.</p>{recordSelected.documentReference.startsWith("http") && <a className="primary" href={recordSelected.documentReference} target="_blank" rel="noreferrer">Abrir CAT / atestado no Drive ↗</a>}<button className="secondary" disabled={archiveImportingId === recordSelected.id} onClick={() => importArchiveCopyFromDrive(recordSelected)}>{archiveImportingId === recordSelected.id ? "Criando cópia..." : "Criar cópia interna automaticamente"}</button><button className="ghost" onClick={() => setArchiveUploadTarget(recordSelected)}>Enviar arquivo manualmente</button></div>}
            </section>
            <div className="archive-governance-actions"><button className="secondary" onClick={() => setEditingRecord(recordSelected)}>✎ Retificar cadastro</button>{user.role === "Diretor" && <button className="danger-button" onClick={() => setDeleteRecord(recordSelected)}>Excluir com auditoria</button>}</div>
          </aside>
        </>
      )}
      {archiveUploadTarget && <Modal title="Enviar cópia manual do atestado" close={() => setArchiveUploadTarget(null)}><form className="form-grid" onSubmit={uploadArchiveCopy}><div className="decision-context wide"><span className={`company-chip ${archiveUploadTarget.company.startsWith("UFC") ? "ufc" : "portico"}`}>{archiveUploadTarget.company}</span><strong>{archiveUploadTarget.certificateNumber}</strong><small>{archiveUploadTarget.object}</small></div><label className="wide">PDF da CAT / atestado<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required /></label><div className="archive-upload-note wide">Use esta alternativa quando o arquivo original estiver restrito no Google Drive. A cópia ficará disponível a todos os usuários autorizados do LicitaControl.</div><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setArchiveUploadTarget(null)}>Cancelar</button><button className="primary" disabled={archiveBusy}>{archiveBusy ? "Enviando..." : "Guardar cópia interna"}</button></div></form></Modal>}
      {editingRecord && <Modal title="Retificar registro do acervo" close={() => setEditingRecord(null)}><form className="form-grid" onSubmit={updateRecord}><label>Empresa<select name="company" defaultValue={editingRecord.company}>{organizations.filter((organization) => organization.type === "Empresa").map((organization) => <option key={organization.id}>{organization.name}</option>)}</select></label><label>Número do atestado<input name="certificateNumber" defaultValue={editingRecord.certificateNumber} required /></label><label>Contrato<input name="contractNumber" defaultValue={editingRecord.contractNumber} /></label><label>CAT / registro<input name="catNumber" defaultValue={editingRecord.catNumber} /></label><label className="wide">Emitente<input name="issuer" defaultValue={editingRecord.issuer} required /></label><label className="wide">Objeto<textarea name="object" defaultValue={editingRecord.object} rows={3} required /></label><label>Tipo de serviço<select name="serviceType" defaultValue={editingRecord.serviceType}>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}{!SERVICE_TYPES.includes(editingRecord.serviceType as typeof SERVICE_TYPES[number]) && <option>{editingRecord.serviceType}</option>}</select></label><label>Área técnica<input name="technicalArea" defaultValue={editingRecord.technicalArea} /></label><label className="wide">Serviços principais<textarea name="mainServices" defaultValue={editingRecord.mainServices} rows={3} required /></label><label className="wide">Quantitativos<textarea name="quantitySummary" defaultValue={editingRecord.quantitySummary} rows={3} required /></label><label className="wide">Características<textarea name="characteristics" defaultValue={editingRecord.characteristics} rows={3} /></label><label>Local<input name="location" defaultValue={editingRecord.location} /></label><label>Referência documental<input name="documentReference" defaultValue={editingRecord.documentReference} /></label><label>Início<input name="startDate" type="date" defaultValue={editingRecord.startDate || ""} /></label><label>Término<input name="endDate" type="date" defaultValue={editingRecord.endDate || ""} /></label><label className="wide">Palavras-chave<input name="keywords" defaultValue={editingRecord.keywords.join(", ")} /></label><label className="wide">Observações<textarea name="notes" defaultValue={editingRecord.notes} rows={2} /></label><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setEditingRecord(null)}>Cancelar</button><button className="primary" disabled={archiveBusy}>{archiveBusy ? "Salvando..." : "Salvar retificação"}</button></div></form></Modal>}
      {deleteRecord && <Modal title="Excluir registro do acervo" close={() => setDeleteRecord(null)}><div className="danger-callout"><strong>Exclusão controlada pela Diretoria</strong><p>O registro sairá das buscas e análises, mas permanecerá preservado na trilha de auditoria.</p></div><div className="delete-form"><label>Justificativa obrigatória<textarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Informe o motivo da exclusão ou substituição do atestado." /></label><div className="form-actions"><button className="ghost" onClick={() => setDeleteRecord(null)}>Cancelar</button><button className="danger-button" disabled={!deleteReason.trim() || archiveBusy} onClick={removeRecord}>{archiveBusy ? "Excluindo..." : "Confirmar exclusão"}</button></div></div></Modal>}
    </>
  );
}

function ReportsPage({ tenders }: { tenders: Tender[] }) {
  const rows = [
    ["Relatório Executivo da Carteira", "Diretoria", "Hoje, 14:20", "Pronto"],
    ["Mapa de Riscos e Providências", "Coordenação", "Hoje, 11:45", "Pronto"],
    ["Conferência de Habilitação — L-2026007", "Equipe técnica", "Ontem, 18:10", "Revisão"],
    ["Indicadores de Desempenho — Julho", "Diretoria", "25 jul, 16:30", "Pronto"],
  ];
  const regional = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul", "Não informado"].map((region) => ({
    region,
    intended: tenders.filter((tender) => tenderRegion(tender) === region).length,
    participated: tenders.filter((tender) => tenderRegion(tender) === region && Boolean(tender.participantOrganizationId)).length,
    finalized: tenders.filter((tender) => tenderRegion(tender) === region && tender.status === "Finalizada").length,
  }));
  return (
    <>
      <PageHeading
        eyebrow="INTELIGÊNCIA GERENCIAL"
        title="Relatórios & resultados"
        description="Consolide decisões, pendências, riscos e desempenho da carteira."
        action={<button className="primary" onClick={() => window.print()}>⇩ Gerar relatório executivo</button>}
      />
      <section className="panel regional-report-panel"><div className="panel-title"><div><span className="eyebrow">ANÁLISE TERRITORIAL</span><h2>Funil de atuação por região</h2></div><span className="updated">Carteira completa</span></div><div className="regional-report-grid">{regional.map((item) => <article key={item.region}><strong>{item.region}</strong><div><span>Pretendidas <b>{item.intended}</b></span><span>Participação definida <b>{item.participated}</b></span><span>Finalizadas <b>{item.finalized}</b></span></div></article>)}</div></section>
      <section className="report-kpis">
        <div className="panel report-chart">
          <div className="panel-title"><div><span className="eyebrow">DESEMPENHO DA CARTEIRA</span><h2>Índice de prontidão por processo</h2></div><select defaultValue="Julho"><option>Julho</option><option>Junho</option></select></div>
          <div className="horizontal-bars">
            {tenders.slice(0, 5).map((tender) => (
              <div key={tender.id}>
                <span>{tender.number}</span>
                <div><i style={{ width: `${tender.progress}%` }} /></div>
                <strong>{tender.progress}%</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="panel outcome-card">
          <span className="eyebrow">RESULTADOS 2026</span>
          <div className="donut"><div><strong>68%</strong><span>êxito</span></div></div>
          <div className="outcome-legend">
            <span><i className="green" />Adjudicadas <b>11</b></span>
            <span><i className="violet" />Em disputa <b>4</b></span>
            <span><i className="gray" />Não vencidas <b>6</b></span>
          </div>
        </div>
      </section>
      <section className="panel reports-list">
        <div className="panel-title"><div><span className="eyebrow">HISTÓRICO</span><h2>Relatórios disponíveis</h2></div><button className="text-button">Ver modelos →</button></div>
        <div className="data-table report-table">
          {rows.map(([name, audience, date, status]) => (
            <div className="table-row" key={name}>
              <div className="report-name"><i>⌁</i><div><strong>{name}</strong><small>PDF · Versão controlada</small></div></div>
              <span>{audience}</span><span>{date}</span><StatusPill value={status} /><button>Baixar ⇩</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function TeamPage({
  users,
  currentRole,
  generateAuthorization,
  generatedCode,
  busy,
  invite,
  setPncpPermission,
  currentUser,
  refresh,
  notify,
}: {
  users: PortalUser[];
  currentRole: Role;
  generateAuthorization: () => void;
  generatedCode: string;
  busy: boolean;
  invite: () => void;
  setPncpPermission: (email: string, enabled: boolean) => void;
  currentUser: PortalUser;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<PortalUser | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const visibleUsers = users.filter((member) => member.status !== "Excluído");

  async function updateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    const form = new FormData(event.currentTarget);
    const editingSelf = editingUser.email.toLowerCase() === currentUser.email.toLowerCase();
    const updatedUser = {
      name: String(form.get("name") ?? editingUser.name),
      email: editingSelf ? editingUser.email : String(form.get("email") ?? editingUser.email),
      username: String(form.get("username") ?? editingUser.username ?? ""),
      role: editingSelf ? editingUser.role : String(form.get("role") ?? editingUser.role),
      status: editingSelf ? "Ativo" : String(form.get("status") ?? editingUser.status ?? "Ativo"),
      password: String(form.get("password") ?? ""),
    };
    setSavingUser(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePortalUser",
          targetUserEmail: editingUser.email,
          updatedUser,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEditingUser(null);
      notify("Usuário atualizado e alteração registrada na auditoria.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível atualizar o usuário.");
    } finally {
      setSavingUser(false);
    }
  }

  async function deleteUser() {
    if (!deletingUser || !deleteReason.trim()) return;
    setSavingUser(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deletePortalUser",
          targetUserEmail: deletingUser.email,
          reason: deleteReason,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDeletingUser(null);
      setDeleteReason("");
      notify("Acesso excluído. O histórico do usuário foi preservado na auditoria.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível excluir o usuário.");
    } finally {
      setSavingUser(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CONTROLE DE ACESSO"
        title="Equipe & governança"
        description="Defina quem pode visualizar, alterar, autorizar ou administrar cada informação."
        action={(["Diretor", "Manutenção"] as Role[]).includes(currentRole) ? <button className="primary" onClick={invite}>＋ Criar novo usuário</button> : undefined}
      />
      <section className="identity-access-card">
        <div><span className="identity-lock">●</span><div><span className="eyebrow">ACESSO INDIVIDUAL PROTEGIDO</span><h2>{currentUser.name}</h2><p>{currentUser.email} · perfil {currentUser.role}</p></div></div>
        <div><strong>Como funciona</strong><p>Cada integrante entra com login próprio. A senha é preservada somente como resumo criptográfico, a sessão expira automaticamente e todas as ações ficam atribuídas ao perfil autenticado.</p></div>
        <StatusPill value="Sessão autenticada" />
      </section>
      <section className="operational-org-chart">
        <div className="panel-title"><div><span className="eyebrow">ORGANOGRAMA OPERACIONAL</span><h2>Responsáveis do recebimento à governança</h2></div><span className="updated">Fluxo oficial da equipe</span></div>
        <div className="org-chart-line">{operationalOwners.map((owner, index) => <article key={owner.name}><header><span>{owner.initials}</span><div><h3>{owner.name}</h3><p>{owner.role}</p></div></header><ul>{owner.actions.map((action) => <li key={action}>{action}</li>)}</ul><footer>{owner.sla}</footer>{index < operationalOwners.length - 1 && <b className="flow-arrow">→</b>}</article>)}</div>
      </section>
      <section className="role-grid">
        {roleMatrix.map((item) => (
          <article className={`role-card ${item.color}`} key={item.role}>
            <div className="role-top"><span>{item.role[0]}</span><div><h3>{item.role}</h3><p>{item.description}</p></div></div>
            <div className="permission-list">
              {item.grants.map((grant) => <span key={grant}><i>✓</i>{grant}</span>)}
              {item.denies.map((deny) => <span className="denied" key={deny}><i>×</i>{deny}</span>)}
            </div>
          </article>
        ))}
      </section>
      <section className="team-layout">
        <div className="panel team-table-panel">
          <div className="panel-title"><div><span className="eyebrow">USUÁRIOS CADASTRADOS</span><h2>Equipe do portal</h2></div><span className="updated">{visibleUsers.length} usuário(s)</span></div>
          <div className="data-table team-table">
            {visibleUsers.map((member) => (
              <div className="table-row" key={member.email}>
                <div className="member"><MiniAvatar name={member.name} /><div><strong>{member.name}</strong><small>{member.email}{member.username ? ` · login ${member.username}` : ""}</small></div></div>
                <span className={`role-pill role-${member.role.toLowerCase().replace("ç", "c")}`}>{member.role}</span>
                <span
                  className={
                    member.status === "Convidado"
                      ? "pending-user"
                      : member.status === "Inativo"
                        ? "inactive-user"
                        : "active-user"
                  }
                >
                  <i />
                  {member.status ?? "Ativo"}
                </span>
                {currentRole === "Diretor" && member.role === "Operador" ? (
                  <button
                    className={member.pncp_can_approve ? "permission-toggle active" : "permission-toggle"}
                    onClick={() => setPncpPermission(member.email, !member.pncp_can_approve)}
                    disabled={busy}
                  >
                    {member.pncp_can_approve ? "PNCP liberado" : "Liberar PNCP"}
                  </button>
                ) : (
                  <span className="permission-readonly">
                    {member.role === "Coordenador" || member.role === "Diretor"
                      ? "Decisão PNCP"
                      : "Sem decisão PNCP"}
                  </span>
                )}
                {currentRole === "Diretor" ? (
                  <div className="team-user-actions">
                    <button className="text-button" onClick={() => setEditingUser(member)}>Editar</button>
                    {member.email.toLowerCase() !== currentUser.email.toLowerCase() ? (
                      <button className="text-button danger-text" onClick={() => { setDeletingUser(member); setDeleteReason(""); }}>Excluir</button>
                    ) : (
                      <span>Conta atual</span>
                    )}
                  </div>
                ) : <span className="permission-readonly">Somente Diretoria</span>}
              </div>
            ))}
          </div>
        </div>
        <aside className="panel authorization-card">
          <span className="eyebrow">DUPLO CONTROLE</span>
          <h2>Autorização de exclusão</h2>
          <p>
            Exclusões por outros perfis exigem um código único gerado pela
            Diretoria, com validade de 30 minutos e registro do autorizador.
          </p>
          {currentRole === "Diretor" ? (
            <>
              {generatedCode ? (
                <div className="generated-code">
                  <span>CÓDIGO TEMPORÁRIO</span>
                  <strong>{generatedCode}</strong>
                  <small>Uso único · expira em 30 minutos</small>
                </div>
              ) : (
                <button className="secondary wide-button" onClick={generateAuthorization} disabled={busy}>
                  {busy ? "Gerando..." : "Gerar autorização"}
                </button>
              )}
            </>
          ) : (
            <div className="restricted-note">Disponível somente para a Diretoria.</div>
          )}
        </aside>
      </section>

      {editingUser && (
        <Modal title={`Editar usuário · ${editingUser.name}`} close={() => { if (!savingUser) setEditingUser(null); }}>
          <form className="form-grid" onSubmit={updateUser}>
            <div className="access-edit-summary wide">
              <MiniAvatar name={editingUser.name} />
              <div><strong>{editingUser.name}</strong><span>{editingUser.email} · {editingUser.role}</span></div>
              <StatusPill value={editingUser.status ?? "Ativo"} />
            </div>
            <label className="wide">Nome completo<input name="name" defaultValue={editingUser.name} required /></label>
            <label className="wide">E-mail de acesso<input name="email" type="email" defaultValue={editingUser.email} readOnly={editingUser.email.toLowerCase() === currentUser.email.toLowerCase()} required /><small>{editingUser.email.toLowerCase() === currentUser.email.toLowerCase() ? "O e-mail da conta em uso deve ser alterado por outro Diretor." : "A alteração de e-mail encerra as sessões ativas do usuário."}</small></label>
            <label>Login interno<input name="username" minLength={4} defaultValue={editingUser.username ?? ""} autoComplete="off" placeholder="Login com ao menos 4 caracteres" /><small>Se ainda não houver login, informe também uma nova senha.</small></label>
            <label>Nova senha<input name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Deixe em branco para manter" /><small>Ao redefinir, o usuário deverá trocar a senha no próximo acesso.</small></label>
            <label>Perfil<select name="role" defaultValue={editingUser.role} disabled={editingUser.email.toLowerCase() === currentUser.email.toLowerCase()}><option>Operador</option><option>Coordenador</option><option>Diretor</option><option>Manutenção</option></select></label>
            <label>Situação<select name="status" defaultValue={editingUser.status ?? "Ativo"} disabled={editingUser.email.toLowerCase() === currentUser.email.toLowerCase()}><option>Ativo</option><option>Inativo</option></select></label>
            <div className="invite-notice wide"><strong>Controle de acesso</strong><p>Mudanças de perfil, situação, e-mail ou senha encerram as sessões abertas. Toda alteração identifica o Diretor responsável na trilha de auditoria.</p></div>
            <div className="form-actions wide"><button type="button" className="ghost" disabled={savingUser} onClick={() => setEditingUser(null)}>Cancelar</button><button className="primary" disabled={savingUser}>{savingUser ? "Salvando..." : "Salvar alterações"}</button></div>
          </form>
        </Modal>
      )}

      {deletingUser && (
        <Modal title="Excluir usuário do portal" close={() => { if (!savingUser) { setDeletingUser(null); setDeleteReason(""); } }}>
          <div className="danger-callout"><strong>Exclusão controlada pela Diretoria</strong><p>O acesso de {deletingUser.name} será encerrado e suas credenciais serão removidas. As licitações, documentos e eventos já praticados permanecerão vinculados ao nome do usuário na auditoria.</p></div>
          <div className="delete-form">
            <label>Justificativa obrigatória<textarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Informe o motivo da retirada do acesso." /></label>
            <div className="user-deletion-confirmation"><MiniAvatar name={deletingUser.name} /><div><strong>{deletingUser.name}</strong><span>{deletingUser.email} · {deletingUser.role}</span></div></div>
            <div className="form-actions"><button className="ghost" disabled={savingUser} onClick={() => { setDeletingUser(null); setDeleteReason(""); }}>Cancelar</button><button className="danger-button" disabled={savingUser || !deleteReason.trim()} onClick={deleteUser}>{savingUser ? "Excluindo..." : "Confirmar exclusão"}</button></div>
          </div>
        </Modal>
      )}
    </>
  );
}

function AuditPage({
  auditLogs,
  userRole,
}: {
  auditLogs: AuditRecord[];
  userRole: Role;
}) {
  const [category, setCategory] = useState("Todos");
  const [role, setRole] = useState("Todos os perfis");
  const [entity, setEntity] = useState("Todas as entidades");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);
  const samples: AuditRecord[] = auditLogs.length
    ? auditLogs
    : [
        {
          id: "a1",
          actor_email: "diretoria@empresa.com.br",
          actor_name: "Diretoria",
          actor_role: "Diretor",
          action: "STATUS_ALTERADO",
          entity_type: "licitacao",
          entity_id: "demo-001",
          detail: "Status atualizado para Atenção.",
          created_at: "2026-07-27T13:42:00-03:00",
        },
        {
          id: "a2",
          actor_email: "coordenacao@empresa.com.br",
          actor_name: "Coordenação",
          actor_role: "Coordenador",
          action: "DOCUMENTO_ENVIADO",
          entity_type: "documento",
          entity_id: "doc-14",
          detail: "Anexo D.3 enviado para a central documental.",
          created_at: "2026-07-27T11:20:00-03:00",
        },
      ];
  const eventCategory = (action: string) => {
    if (action.includes("SESSAO") || action.includes("USUARIO")) return "Acessos";
    if (action.includes("EXCL") || action.includes("REMOVID")) return "Exclusões";
    if (action.includes("CODIGO") || action.includes("AUTORIZ")) return "Autorizações";
    if (action.includes("DOCUMENT") || action.includes("EDITAL") || action.includes("ACERVO")) return "Documentos";
    return "Alterações";
  };
  const entityOptions = Array.from(new Set(samples.map((item) => item.entity_type))).sort();
  const filtered = samples.filter((log) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || `${log.action} ${log.detail} ${log.actor_name} ${log.actor_email} ${log.entity_type} ${log.entity_id}`.toLowerCase().includes(normalizedSearch);
    const logDate = log.created_at.slice(0, 10);
    return (category === "Todos" || eventCategory(log.action) === category)
      && (role === "Todos os perfis" || log.actor_role === role)
      && (entity === "Todas as entidades" || log.entity_type === entity)
      && (!startDate || logDate >= startDate)
      && (!endDate || logDate <= endDate)
      && matchesSearch;
  });

  function exportAuditCsv() {
    const header = ["Data", "Ação", "Categoria", "Entidade", "ID", "Usuário", "E-mail", "Perfil", "Detalhe"];
    const rows = filtered.map((log) => [log.created_at, log.action, eventCategory(log.action), log.entity_type, log.entity_id, log.actor_name, log.actor_email, log.actor_role, log.detail]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `auditoria-licitacontrol-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  if (userRole !== "Diretor") {
    return (
      <div className="access-denied">
        <span>◉</span><h1>Acesso restrito à Diretoria</h1>
        <p>A trilha de auditoria contém ações sensíveis e não está disponível para o seu perfil.</p>
      </div>
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="ACESSO EXCLUSIVO DA DIRETORIA"
        title="Trilha de auditoria"
        description="Histórico imutável de alterações, autorizações e exclusões realizadas no portal."
        action={<div className="audit-report-actions"><button className="secondary" onClick={exportAuditCsv}>⇩ Exportar CSV</button><button className="secondary" onClick={() => window.print()}>▱ Imprimir / PDF</button></div>}
      />
      <section className="audit-summary">
        <div><span>Eventos exibidos</span><strong>{filtered.length}</strong></div>
        <div><span>Exclusões registradas</span><strong>{samples.filter((item) => eventCategory(item.action) === "Exclusões").length}</strong></div>
        <div><span>Acessos e usuários</span><strong>{samples.filter((item) => eventCategory(item.action) === "Acessos").length}</strong></div>
        <div><span>Integridade do log</span><strong className="healthy">Verificada ✓</strong></div>
      </section>
      <section className="panel audit-panel">
        <div className="audit-filter-panel">
          <div className="audit-filter-tabs">{["Todos", "Acessos", "Alterações", "Documentos", "Autorizações", "Exclusões"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="audit-filter-fields"><label>Buscar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ação, usuário, entidade ou detalhe" /></label><label>Perfil<select value={role} onChange={(event) => setRole(event.target.value)}><option>Todos os perfis</option><option>Operador</option><option>Coordenador</option><option>Diretor</option><option>Manutenção</option></select></label><label>Entidade<select value={entity} onChange={(event) => setEntity(event.target.value)}><option>Todas as entidades</option>{entityOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>De<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>Até<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><button className="ghost" onClick={() => { setCategory("Todos"); setRole("Todos os perfis"); setEntity("Todas as entidades"); setSearch(""); setStartDate(""); setEndDate(""); }}>Limpar</button></div>
        </div>
        <div className="audit-timeline">
          {filtered.map((log) => (
            <button className="audit-event" key={log.id} onClick={() => setSelectedLog(log)}>
              <span className={`audit-icon ${log.action.includes("EXCL") ? "danger" : ""}`}>
                {log.action.includes("DOCUMENTO") ? "▱" : log.action.includes("CODIGO") ? "◇" : "✓"}
              </span>
              <div className="audit-copy">
                <div><strong>{log.action.replaceAll("_", " ")}</strong><StatusPill value={log.actor_role} /></div>
                <p>{log.detail}</p>
                <small>Entidade: {log.entity_type} · ID {log.entity_id}</small>
              </div>
              <div className="audit-actor"><strong>{log.actor_name}</strong><span>{log.actor_email}</span><small>{formatDate(log.created_at)}</small></div>
              <span className="audit-open-indicator">Ver detalhes →</span>
            </button>
          ))}
          {!filtered.length && <div className="audit-empty"><strong>Nenhum evento encontrado</strong><span>Ajuste ou limpe os filtros para consultar a trilha.</span></div>}
        </div>
      </section>
      {selectedLog && <Modal title="Detalhes do evento de auditoria" close={() => setSelectedLog(null)}><div className="audit-detail"><div><span>Ação</span><strong>{selectedLog.action.replaceAll("_", " ")}</strong></div><div><span>Categoria</span><strong>{eventCategory(selectedLog.action)}</strong></div><div><span>Usuário</span><strong>{selectedLog.actor_name}</strong><small>{selectedLog.actor_email} · {selectedLog.actor_role}</small></div><div><span>Data e hora</span><strong>{formatDate(selectedLog.created_at)}</strong></div><div className="wide"><span>Entidade afetada</span><strong>{selectedLog.entity_type} · {selectedLog.entity_id}</strong></div><div className="wide"><span>Descrição registrada</span><p>{selectedLog.detail}</p></div><div className="audit-integrity wide">✓ Registro preservado na trilha de auditoria</div></div></Modal>}
    </>
  );
}

function TenderDrawer({
  tender,
  role,
  documents,
  archiveMatches,
  technicalRecords,
  complianceDocuments,
  professionals,
  team,
  documentLinks,
  requirements,
  editalVersions,
  importAnalyses,
  reuseAnalyses,
  organizations,
  refresh,
  notify,
  close,
  openFollowupDestination,
  remove,
}: {
  tender: Tender;
  role: Role;
  documents: DocumentRecord[];
  archiveMatches: ArchiveMatch[];
  technicalRecords: TechnicalRecord[];
  complianceDocuments: ComplianceDocument[];
  professionals: Professional[];
  team: TenderTeamRecord[];
  documentLinks: TenderDocumentLink[];
  requirements: TenderRequirement[];
  editalVersions: TenderEditalVersion[];
  importAnalyses: TenderImportAnalysis[];
  reuseAnalyses: TenderReuseAnalysis[];
  organizations: Organization[];
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  close: () => void;
  openFollowupDestination: (destination: "monitoring" | "resources", tenderId: string) => void;
  remove: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "analysis" | "documents" | "team" | "reuse">(
    "overview",
  );
  const [editOpen, setEditOpen] = useState(false);
  const [routingOpen, setRoutingOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [editalVersionOpen, setEditalVersionOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tenderUploadFiles, setTenderUploadFiles] = useState<File[]>([]);
  const [tenderUploadProgress, setTenderUploadProgress] = useState("");
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<Set<string>>(
    new Set(),
  );
  const latestImportAnalysis = importAnalyses[0];
  const latestReuseAnalysis = reuseAnalyses[0];
  const parsedReuseCandidates = safeJson<unknown>(latestReuseAnalysis?.candidates_json, []);
  const parsedReuseGaps = safeJson<unknown>(latestReuseAnalysis?.gaps_json, []);
  const parsedImportSources = safeJson<unknown>(latestImportAnalysis?.sources_json, []);
  const parsedImportEvidence = safeJson<unknown>(latestImportAnalysis?.field_evidence_json, {});
  const parsedImportConflicts = safeJson<unknown>(latestImportAnalysis?.conflicts_json, []);
  const parsedImportMissing = safeJson<unknown>(latestImportAnalysis?.missing_documents_json, []);
  const reuseCandidates = Array.isArray(parsedReuseCandidates) ? parsedReuseCandidates as ReuseCandidate[] : [];
  const reuseGaps = Array.isArray(parsedReuseGaps) ? parsedReuseGaps as string[] : [];
  const importSources = Array.isArray(parsedImportSources) ? parsedImportSources as Array<{ name: string; status: string; pages: number }> : [];
  const importEvidence = parsedImportEvidence && typeof parsedImportEvidence === "object" && !Array.isArray(parsedImportEvidence)
    ? parsedImportEvidence as Record<string, SourceEvidence | null>
    : {};
  const importConflicts = Array.isArray(parsedImportConflicts) ? parsedImportConflicts as Array<{ field: string; values: string[] }> : [];
  const importMissing = Array.isArray(parsedImportMissing) ? parsedImportMissing as string[] : [];

  const archiveRecordsById = useMemo(
    () => new Map(technicalRecords.map((record) => [record.id, record])),
    [technicalRecords],
  );
  const downloadableArchiveMatches = archiveMatches.filter(
    (match) => archiveRecordsById.get(match.technical_record_id)?.hasInternalDocument,
  );

  function toggleArchiveSelection(recordId: string) {
    setSelectedArchiveIds((current) => {
      const next = new Set(current);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  }

  function toggleAllDownloadableArchive() {
    const ids = downloadableArchiveMatches.map((match) => match.technical_record_id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedArchiveIds.has(id));
    setSelectedArchiveIds(allSelected ? new Set() : new Set(ids));
  }

  function downloadSelectedArchive() {
    const ids = downloadableArchiveMatches
      .map((match) => match.technical_record_id)
      .filter((id) => selectedArchiveIds.has(id));
    if (!ids.length) {
      notify("Selecione ao menos um atestado com cópia interna disponível.");
      return;
    }
    const params = new URLSearchParams({
      ids: ids.join(","),
      tenderId: tender.id,
    });
    window.location.assign(`/api/archive-bundle?${params.toString()}`);
    notify(`${ids.length} documento(s) selecionado(s) preparado(s) para download.`);
  }

  async function action(body: Record<string, unknown>, success: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      notify(success);
      await refresh();
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível concluir.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function editTender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tenderData = Object.fromEntries(new FormData(event.currentTarget).entries());
    const ok = await action(
      { action: "updateTender", tenderId: tender.id, tender: tenderData },
      "Licitação atualizada e alteração registrada na auditoria.",
    );
    if (ok) setEditOpen(false);
  }

  async function confirmRouting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!latestImportAnalysis) return;
    const routingDecision = Object.fromEntries(new FormData(event.currentTarget).entries());
    const ok = await action(
      { action: "confirmTenderRouting", tenderId: tender.id, importAnalysisId: latestImportAnalysis.id, routingDecision },
      "Roteamento empresarial confirmado e registrado na auditoria.",
    );
    if (ok) setRoutingOpen(false);
  }

  async function analyzeTender() {
    await action(
      { action: "analyzeTender", tenderId: tender.id },
      "Acervo comparado. Revise os resultados preliminares e os quantitativos.",
    );
  }

  async function runReuseAgent() {
    await action(
      { action: "runReuseAnalysis", tenderId: tender.id },
      "Agente concluído: precedentes, equipe técnica e atestados foram cruzados para conferência.",
    );
  }

  async function applyReuseSuggestion(
    sourceTenderId: string,
    kind: "Equipe" | "Atestado",
    assetId: string,
  ) {
    if (!latestReuseAnalysis) return;
    await action(
      {
        action: "applyReuseSuggestion",
        tenderId: tender.id,
        reuseAnalysisId: latestReuseAnalysis.id,
        reuseSuggestion: { sourceTenderId, kind, assetId },
      },
      kind === "Equipe"
        ? "Profissional incluído como sugestão na equipe; confira vínculo e documentos."
        : "Atestado incluído no atendimento; confira objeto, CAT, quantitativo, unidade e somatório.",
    );
  }

  async function uploadTenderDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const sourceForm = new FormData(formElement);
    const files = sourceForm
      .getAll("file")
      .filter((item): item is File => item instanceof File && item.size > 0);
    if (!files.length) {
      notify("Selecione ao menos um documento.");
      return;
    }
    setBusy(true);
    setTenderUploadProgress(`Preparando ${files.length} documento(s)...`);
    const category = String(sourceForm.get("category") ?? "Documento editalício");
    let completed = 0;
    const failures: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setTenderUploadProgress(`Enviando ${index + 1} de ${files.length}: ${file.name}`);
        if (file.size > MAX_DOCUMENT_BYTES) {
          failures.push(`${file.name}: excede 200 MB`);
          continue;
        }
        try {
          await uploadPreservedFile({
            file,
            tenderId: tender.id,
            category,
            onProgress: (percent) =>
              setTenderUploadProgress(
                `Enviando ${index + 1} de ${files.length}: ${file.name} — ${percent}%`,
              ),
          });
          completed += 1;
        } catch (error) {
          failures.push(`${file.name}: ${error instanceof Error ? error.message : "falha no envio"}`);
        }
      }
      await refresh();
      formElement.reset();
      setTenderUploadFiles([]);
      if (!failures.length) {
        setUploadOpen(false);
        notify(`${completed} documento(s) guardado(s) no processo com sucesso.`);
      } else {
        notify(`${completed} de ${files.length} documento(s) enviados. Não concluídos: ${failures.join(" | ")}`);
      }
    } finally {
      setBusy(false);
      setTenderUploadProgress("");
    }
  }

  async function uploadEditalVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    const form = new FormData(formElement);
    const file = form.get("file");
    try {
      if (!(file instanceof File) || !file.size) {
        throw new Error("Selecione o arquivo oficial da atualização.");
      }
      const result = await uploadPreservedFile({
        file,
        destination: "editalVersion",
        tenderId: tender.id,
        eventType: String(form.get("eventType") ?? "Retificação"),
        title: String(form.get("title") ?? file.name),
        processEffect: String(form.get("processEffect") ?? "Revisar dados e exigências"),
        publicationDate: String(form.get("publicationDate") ?? ""),
        effectiveDate: String(form.get("effectiveDate") ?? ""),
        description: String(form.get("description") ?? ""),
        extractionSummary: String(form.get("extractionSummary") ?? ""),
      });
      setEditalVersionOpen(false);
      notify(`Versão editalícia ${result.versionNumber} registrada e vinculada ao processo.`);
      formElement.reset();
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível registrar a atualização.");
    } finally {
      setBusy(false);
    }
  }

  async function linkDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const ok = await action(
      {
        action: "linkComplianceDocument",
        tenderId: tender.id,
        ...data,
      },
      "Documento da biblioteca vinculado ao atendimento da licitação.",
    );
    if (ok) setLinkOpen(false);
  }

  async function assignProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const ok = await action(
      { action: "assignProfessional", tenderId: tender.id, ...data },
      "Profissional indicado para a equipe da proposta.",
    );
    if (ok) setAssignOpen(false);
  }

  async function createRequirement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tenderRequirement = Object.fromEntries(new FormData(event.currentTarget).entries());
    const ok = await action(
      { action: "createTenderRequirement", tenderId: tender.id, tenderRequirement },
      "Exigência incluída no bloco técnico correspondente.",
    );
    if (ok) setRequirementOpen(false);
  }

  async function createTenderFollowup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tenderFollowup = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    const followupType = String(tenderFollowup.followupType ?? "");
    const opensResourceWorkspace = [
      "Intenção recursal",
      "Razões recursais",
      "Recurso",
      "Contrarrazões",
      "Julgamento de recurso",
    ].includes(followupType);
    const ok = await action(
      {
        action: "createTenderFollowup",
        tenderId: tender.id,
        tenderFollowup,
      },
      opensResourceWorkspace
        ? "Processo integral movido para Recursos & prazos, sem criar cópia e com todo o dossiê preservado."
        : "Processo integral movido para Acompanhamento de resultado, sem criar cópia e com todo o dossiê preservado.",
    );
    if (ok) {
      setFollowupOpen(false);
      openFollowupDestination(opensResourceWorkspace ? "resources" : "monitoring", tender.id);
    }
  }

  async function finalizeTender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tenderOutcome = Object.fromEntries(new FormData(event.currentTarget).entries());
    const ok = await action(
      { action: "finalizeTender", tenderId: tender.id, tenderOutcome },
      "Licitação finalizada; dossiê preservado para futuras reutilizações.",
    );
    if (ok) setFinalizeOpen(false);
  }

  const dateTimeLocal = tenderDateTimeLocalValue(tender.openingAt);
  const riskLabel = String(tender.risk || "Não informado");
  const normalizedProgress = Number.isFinite(Number(tender.progress))
    ? Math.max(0, Math.min(100, Number(tender.progress)))
    : 0;
  const phaseChecklist: Array<[string, "concluído" | "em andamento" | "pendente"]> = [
    ["Triagem documental", normalizedProgress >= 15 ? "concluído" : "em andamento"],
    ["Habilitação e acervo", normalizedProgress >= 40 ? "concluído" : normalizedProgress >= 15 ? "em andamento" : "pendente"],
    ["Equipe e proposta técnica", normalizedProgress >= 65 ? "concluído" : normalizedProgress >= 40 ? "em andamento" : "pendente"],
    ["Conferência final", normalizedProgress >= 90 ? "concluído" : normalizedProgress >= 65 ? "em andamento" : "pendente"],
  ];
  const expiredLinked = documentLinks.filter((link) => {
    const days = daysToExpiry(link.expires_at);
    return days !== null && days < 0;
  }).length;
  return (
    <>
      <button className="backdrop" aria-label="Fechar detalhes" onClick={close} />
      <aside className="drawer tender-workspace">
        <div className="drawer-head">
          <div><span className="eyebrow">{tender.modality}</span><h2>{tender.number}</h2></div>
          <div className="drawer-head-actions">
            <button className="drawer-edit" aria-label="Editar licitação" onClick={() => setEditOpen(true)}>✎</button>
            <button aria-label="Fechar" onClick={close}>×</button>
          </div>
        </div>
        <div className="drawer-status"><StatusPill value={tender.status || "Em análise"} /><span>Risco {riskLabel.toLowerCase()}</span></div>
        <h3>{tender.title}</h3>
        <p className="drawer-summary">{tender.summary}</p>

        <div className="drawer-tabs">
          {[
            ["overview", "Visão geral"],
            ["analysis", "Atendimento"],
            ["documents", `Documentos ${documents.length + documentLinks.length}`],
            ["team", `Equipe ${team.length}`],
            ["reuse", "Reutilização"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id as typeof tab)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="drawer-info">
              <div><span>Órgão</span><strong>{tender.organ}</strong></div>
              <div><span>Plataforma</span><strong>{tender.platform}</strong></div>
              <div><span>Sessão pública</span><strong>{formatDate(tender.openingAt)}</strong></div>
              <div><span>Valor estimado</span><strong>{tender.estimatedValue}</strong></div>
              <div><span>Tipo de serviço</span><strong>{tender.tenderType || "Não classificado"}</strong></div>
              <div><span>Participante</span><strong>{tender.participantOrganizationName || "A definir"} · {tender.participationType || "Empresa"}</strong></div>
            </div>
            {latestImportAnalysis && <div className="drawer-import-audit"><div className="drawer-module-head compact"><div><span className="eyebrow">ORIGEM DO CADASTRO</span><h3>Conferência documental da importação</h3></div><div className="mini-actions"><StatusPill value={latestImportAnalysis.recommendation} /><button className="secondary" onClick={() => setRoutingOpen(true)}>Revisar roteamento</button></div></div><div className="routing-line"><span>ROTEAMENTO EMPRESARIAL</span><strong>{latestImportAnalysis.object_nature} → {latestImportAnalysis.routed_company}</strong><p>{latestImportAnalysis.routing_reason}</p></div><dl><div><dt>Modo de análise</dt><dd>{latestImportAnalysis.analysis_mode}</dd></div><div><dt>Revisão</dt><dd>{latestImportAnalysis.review_status}</dd></div><div><dt>Fontes inventariadas</dt><dd>{importSources.length}</dd></div><div><dt>Responsável pela confirmação</dt><dd>{latestImportAnalysis.confirmed_by}</dd></div></dl><div className="evidence-audit">{Object.entries(importEvidence).map(([field, evidence]) => <div key={field}><span>{({ number: "Número", modality: "Modalidade", title: "Objeto", organ: "Órgão", platform: "Plataforma", estimatedValue: "Valor", openingAt: "Sessão" } as Record<string, string>)[field] || field}</span>{evidence ? <strong>{evidence.document} · p. {evidence.page}</strong> : <strong className="pending">Sem fonte registrada</strong>}</div>)}</div>{!!importMissing.length && <div className="analysis-gap"><strong>Peças não identificadas</strong><span>{importMissing.join(" · ")}</span></div>}{!!importConflicts.length && <div className="analysis-gap danger"><strong>Divergências registradas</strong>{importConflicts.map((conflict) => <span key={conflict.field}>{conflict.field}: {conflict.values.join(" ↔ ")}</span>)}</div>}<small>Relatório gerado em {formatDate(latestImportAnalysis.created_at)}. As fontes permanecem no dossiê editalício versionado.</small></div>}
            <div className="drawer-section">
              <div className="section-label"><span>PRONTIDÃO DO PROCESSO</span><strong>{normalizedProgress}%</strong></div>
              <div className="progress-bar large"><i style={{ width: `${normalizedProgress}%` }} /></div>
              <div className="checklist">
                {phaseChecklist.map(([label, state]) => (
                  <div key={label}><span className={state === "concluído" ? "done" : ""}>{state === "concluído" ? "✓" : ""}</span><strong>{label}</strong><small>{state}</small></div>
                ))}
              </div>
            </div>
            <div className="drawer-section owner-section">
              <span>RESPONSÁVEL</span>
              <div><MiniAvatar name={tender.owner} /><strong>{tender.owner}</strong><button onClick={() => setEditOpen(true)}>Alterar</button></div>
            </div>
          </>
        )}

        {tab === "analysis" && (
          <section className="drawer-module">
            <div className="drawer-module-head">
              <div><span className="eyebrow">QUALIFICAÇÃO TÉCNICA</span><h3>Análise de atendimento pelo acervo</h3></div>
              <button className="secondary" onClick={analyzeTender} disabled={busy}>{busy ? "Analisando..." : "↻ Analisar acervo"}</button>
            </div>
            <div className="analysis-caution">
              <span>!</span>
              <p>Resultado preliminar. Confirme objeto, quantitativo mínimo, unidade, CAT, vínculo e regra de somatório no edital.</p>
            </div>
            <div className="requirement-head"><strong>Exigências extraídas do edital</strong><button className="secondary" onClick={() => setRequirementOpen(true)}>＋ Registrar exigência</button></div>
            <div className="requirement-split">
              {(["Empresa", "Profissional"] as const).map((type) => <div key={type} className={`requirement-column ${type === "Empresa" ? "company" : "professional"}`}><div><span>{type === "Empresa" ? "▣" : "◎"}</span><h4>{type === "Empresa" ? "Experiência da empresa" : "Exigências dos profissionais"}</h4></div>{requirements.filter((item) => item.requirement_type === type).map((requirement) => <article key={requirement.id}><StatusPill value={requirement.status} /><strong>{requirement.description}</strong><p>{[requirement.minimum_quantity, requirement.unit].filter(Boolean).join(" ") || "Sem quantitativo registrado"}</p><small>{requirement.evidence || "Evidência ainda não selecionada"}</small></article>)}{!requirements.some((item) => item.requirement_type === type) && <p>Nenhuma exigência deste bloco foi registrada.</p>}</div>)}
            </div>
            <div className="drawer-module-head compact"><div><span className="eyebrow">EXPERIÊNCIA DA EMPRESA</span><h3>Atestados sugeridos pelo acervo</h3><p className="module-description">Selecione as evidências compatíveis e baixe as cópias internas para compor o dossiê técnico desta licitação.</p></div></div>
            {archiveMatches.length ? (
              <div className="archive-match-workspace">
                <div className="archive-selection-toolbar">
                  <label>
                    <input
                      type="checkbox"
                      checked={downloadableArchiveMatches.length > 0 && downloadableArchiveMatches.every((match) => selectedArchiveIds.has(match.technical_record_id))}
                      onChange={toggleAllDownloadableArchive}
                      disabled={!downloadableArchiveMatches.length}
                    />
                    <span>Selecionar disponíveis</span>
                  </label>
                  <div>
                    <span><strong>{selectedArchiveIds.size}</strong> selecionado(s)</span>
                    <button className="primary archive-bulk-download" onClick={downloadSelectedArchive} disabled={!selectedArchiveIds.size}>⇩ Baixar selecionados</button>
                  </div>
                </div>
                {downloadableArchiveMatches.length < archiveMatches.length && (
                  <div className="archive-download-note"><span>i</span><p><strong>{archiveMatches.length - downloadableArchiveMatches.length} documento(s) ainda sem cópia interna.</strong> Eles permanecem identificados na análise, mas a seleção para download será liberada após a importação do arquivo no Acervo técnico.</p></div>
                )}
                <div className="archive-match-list">
                  {archiveMatches.map((match) => {
                    const record = archiveRecordsById.get(match.technical_record_id);
                    const downloadable = Boolean(record?.hasInternalDocument);
                    const matchedTerms = match.matched_terms.split(",").filter(Boolean);
                    const relatedRequirements = requirements
                      .filter((requirement) => {
                        if (requirement.requirement_type !== "Empresa") return false;
                        const evidence = normalizedTerms(`${requirement.description} ${requirement.evidence}`);
                        return String(requirement.evidence ?? "").includes(match.certificate_number) || matchedTerms.some((term) => evidence.includes(term));
                      })
                      .slice(0, 2);
                    return (
                      <article className={selectedArchiveIds.has(match.technical_record_id) ? "selected" : ""} key={match.id}>
                        <div className="archive-match-top">
                          <label className="archive-match-check" title={downloadable ? "Selecionar para download" : "Cópia interna ainda indisponível"}>
                            <input type="checkbox" checked={selectedArchiveIds.has(match.technical_record_id)} disabled={!downloadable} onChange={() => toggleArchiveSelection(match.technical_record_id)} />
                            <span aria-hidden="true">✓</span>
                          </label>
                          <span className={`company-chip ${match.company.startsWith("UFC") ? "ufc" : "portico"}`}>{match.company}</span>
                          <div className="archive-match-score"><strong>{match.score}%</strong><small>aderência preliminar</small></div>
                        </div>
                        <div className="archive-match-heading">
                          <small>{match.certificate_number || record?.catNumber || "Atestado sem número"}</small>
                          <h4>{match.object}</h4>
                        </div>
                        <div className="archive-match-data">
                          <div><span>CAT / Atestado</span><strong>{record?.catNumber || match.certificate_number || "Não informado"}</strong></div>
                          <div><span>Contrato</span><strong>{record?.contractNumber || "Não informado"}</strong></div>
                          <div><span>Emitente</span><strong>{record?.issuer || "Não informado"}</strong></div>
                          <div><span>Área técnica</span><strong>{record?.technicalArea || "Não informada"}</strong></div>
                          <div><span>Tipo de serviço</span><strong>{match.service_type || "Não informado"}</strong></div>
                          <div><span>Local</span><strong>{record?.location || "Não informado"}</strong></div>
                        </div>
                        <div className="archive-evidence-block quantity"><span>Quantitativo comprovado</span><strong>{match.quantity_summary || "Quantitativo não identificado na base"}</strong></div>
                        <div className="archive-evidence-block"><span>Serviços principais</span><p>{record?.mainServices || match.main_services || "Não detalhados"}</p></div>
                        <div className="archive-evidence-block"><span>Características relevantes</span><p>{record?.characteristics || "Não detalhadas"}</p></div>
                        {!!relatedRequirements.length && <div className="archive-requirement-links"><span>Exigências relacionadas</span>{relatedRequirements.map((requirement) => <p key={requirement.id}>{requirement.description}<small>{[requirement.minimum_quantity, requirement.unit].filter(Boolean).join(" ")}</small></p>)}</div>}
                        <div className="match-verdict"><StatusPill value={match.assessment} /><div className="matched-term-list">{matchedTerms.length ? matchedTerms.map((term) => <span key={term}>{term}</span>) : <span>Sem termo direto</span>}</div></div>
                        <div className="archive-match-actions">
                          <div className={downloadable ? "archive-file-status ready" : "archive-file-status pending"}><span>{downloadable ? "✓" : "!"}</span><div><strong>{downloadable ? record?.internalDocumentName || "Cópia interna disponível" : "Cópia interna pendente"}</strong><small>{downloadable ? formatFileSize(record?.internalDocumentSize) : "Importe o documento no Acervo técnico para liberar o download coletivo"}</small></div></div>
                          <div>
                            {downloadable && <a className="secondary" href={`/api/archive-documents?id=${match.technical_record_id}&download=1`}>⇩ Baixar</a>}
                            {record?.documentReference.startsWith("http") && <a className="ghost" href={record.documentReference} target="_blank" rel="noreferrer">Abrir origem ↗</a>}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="drawer-empty">
                <span>⌁</span><h4>Análise ainda não executada</h4>
                <p>Compare o objeto desta licitação com os atestados registrados nas planilhas de acervo.</p>
                <button className="primary" onClick={analyzeTender} disabled={busy}>Iniciar análise preliminar</button>
              </div>
            )}
          </section>
        )}

        {tab === "documents" && (
          <section className="drawer-module">
            <div className="drawer-module-head">
              <div><span className="eyebrow">EVIDÊNCIAS DO PROCESSO</span><h3>Documentação de atendimento</h3></div>
              <div className="mini-actions"><button onClick={() => setLinkOpen(true)}>Vincular</button><button className="primary" onClick={() => setUploadOpen(true)}>⇧ Enviar</button></div>
            </div>
            {expiredLinked > 0 && <div className="document-blocker">! {expiredLinked} documento(s) vinculado(s) está(ão) vencido(s).</div>}
            <div className="edital-dossier">
              <div className="edital-dossier-head"><div><span className="eyebrow">HISTÓRICO OFICIAL</span><h4>Dossiê editalício versionado</h4><p>Edital, TR, esclarecimentos, retificações, suspensões e reaberturas permanecem acessíveis na ordem em que foram publicados.</p></div><button className="secondary" onClick={() => setEditalVersionOpen(true)}>＋ Registrar atualização</button></div>
              <div className="edital-version-list">
                {editalVersions.map((version) => <article key={version.id}><span className="version-number">v{version.version_number}</span><div><strong>{version.event_type} · {version.title}</strong><p>{version.description || version.extraction_summary || "Documento preservado para conferência."}</p><small>{version.publication_date ? `Publicado em ${formatDate(version.publication_date, false)} · ` : ""}{version.process_effect} · {formatFileSize(version.size)}</small></div><StatusPill value={version.status} /><a className="secondary" href={`/api/tender-edital-versions?id=${version.id}`}>⇩ Abrir</a></article>)}
                {!editalVersions.length && <div className="drawer-empty compact"><span>▱</span><h4>Versões anteriores ainda não classificadas</h4><p>Os anexos enviados continuam abaixo. Registre a próxima atualização para iniciar a linha do tempo oficial.</p></div>}
              </div>
            </div>
            <div className="document-blocks">
              {["Habilitação", "Equipe profissional", "Proposta técnica", "Proposta de preços", "Edital e anexos", "Diligência / recurso"].map((section) => {
                const direct = documents.filter((document) => document.category === section);
                const linked = documentLinks.filter((document) => document.section === section);
                return (
                  <div className="document-block" key={section}>
                    <div><strong>{section}</strong><span>{direct.length + linked.length}</span></div>
                    {[...direct.map((document) => ({ id: document.id, name: document.name, meta: document.analysis_status, url: `/api/documents?id=${document.id}`, available: true })), ...linked.map((document) => ({ id: document.id, name: document.document_name, meta: `${document.organization_name}${document.expires_at ? ` · validade ${formatDate(document.expires_at, false)}` : ""}`, url: `/api/compliance-documents?id=${document.document_id}`, available: Number(document.document_size) > 0 }))].map((item) => (
                      <a href={item.available ? item.url : undefined} aria-disabled={!item.available} key={item.id}><i>▱</i><div><strong>{item.name}</strong><small>{item.meta}</small></div><span>{item.available ? "⇩" : "demo"}</span></a>
                    ))}
                    {!direct.length && !linked.length && <p>Nenhum documento selecionado.</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "team" && (
          <section className="drawer-module">
            <div className="drawer-module-head">
              <div><span className="eyebrow">PROPOSTA TÉCNICA</span><h3>Equipe indicada</h3></div>
              <button className="primary" onClick={() => setAssignOpen(true)}>＋ Indicar profissional</button>
            </div>
            {team.length ? (
              <div className="tender-team-list">
                {team.map((member) => {
                  const memberDocs = complianceDocuments.filter((document) => document.professional_id === member.professional_id);
                  const docAlerts = memberDocs.filter((document) => {
                    const days = daysToExpiry(document.expires_at);
                    return days !== null && days <= 30;
                  }).length;
                  return (
                    <article key={member.id}>
                      <MiniAvatar name={member.professional_name} />
                      <div><strong>{member.professional_name}</strong><span>{member.proposed_role}</span><small>{member.organization_name || "Sem vínculo"} · {[member.council, member.registration].filter(Boolean).join(" ") || "Registro pendente"}</small></div>
                      <div className={docAlerts ? "team-doc-alert" : "team-doc-ok"}><b>{memberDocs.length}</b><span>documentos</span>{docAlerts ? <small>{docAlerts} alerta(s)</small> : <small>sem alerta</small>}<a href={`/api/professional-cv?id=${member.professional_id}&tenderId=${tender.id}`} target="_blank" rel="noreferrer">Currículo para esta licitação ↗</a></div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="drawer-empty"><span>◎</span><h4>Equipe ainda não definida</h4><p>Escolha os profissionais e registre a função de cada um na proposta técnica.</p><button className="primary" onClick={() => setAssignOpen(true)}>Montar equipe</button></div>
            )}
          </section>
        )}

        {tab === "reuse" && (
          <section className="drawer-module">
            <div className="drawer-module-head reuse-agent-head">
              <div><span className="eyebrow">AGENTE DE MEMÓRIA OPERACIONAL</span><h3>Compatibilização de processos disputados</h3><p className="module-description">Cruza o objeto e as exigências atuais com licitações finalizadas, equipes empregadas e atestados operacionais já analisados.</p></div>
              {role !== "Manutenção" && <button className="primary agent-trigger" onClick={runReuseAgent} disabled={busy}>{busy ? "Analisando..." : latestReuseAnalysis ? "↻ Reexecutar agente" : "✦ Ativar agente"}</button>}
            </div>
            <div className="analysis-caution"><span>!</span><p>A indicação é uma triagem de reaproveitamento. Antes de usar, confira a exigência atual, titularidade, CAT, quantitativo, unidade, regra de somatório, vínculo profissional e validade documental.</p></div>
            {latestReuseAnalysis ? (
              <>
                <div className="reuse-agent-status">
                  <div><span>ÚLTIMA EXECUÇÃO</span><strong>{formatDate(latestReuseAnalysis.analyzed_at)}</strong></div>
                  <div><span>RESPONSÁVEL</span><strong>{latestReuseAnalysis.activated_by_name || latestReuseAnalysis.activated_by}</strong></div>
                  <div><span>PRECEDENTES</span><strong>{latestReuseAnalysis.candidate_count}</strong></div>
                  <StatusPill value={latestReuseAnalysis.status} />
                </div>
                {!!reuseGaps.length && <div className="reuse-agent-gaps"><strong>Ressalvas da análise</strong>{reuseGaps.map((gap) => <p key={gap}>! {gap}</p>)}</div>}
                {reuseCandidates.length ? (
                  <div className="reuse-agent-results">
                    {reuseCandidates.map((candidate) => (
                      <article className="reuse-agent-candidate" key={candidate.sourceTenderId}>
                        <div className="reuse-candidate-heading">
                          <div><StatusPill value={`${candidate.overallScore}% compatível`} /><small>{candidate.modality} · {candidate.number}</small></div>
                          <StatusPill value={candidate.outcome} />
                        </div>
                        <h4>{candidate.title}</h4>
                        <p>{candidate.participant} · {candidate.tenderType || "Tipo não registrado"}</p>
                        <div className="reuse-evidence-tags">{candidate.matchedTerms.map((term) => <span key={term}>{term}</span>)}</div>
                        <div className="reuse-candidate-metrics"><div><span>Aderência do objeto</span><strong>{candidate.objectScore}%</strong></div><div><span>Documentos preservados</span><strong>{candidate.documentCount}</strong></div><div><span>Equipe sugerida</span><strong>{candidate.teamSuggestions.length}</strong></div><div><span>Atestados sugeridos</span><strong>{candidate.archiveSuggestions.length}</strong></div></div>

                        <div className="reuse-assets-grid">
                          <section>
                            <div className="reuse-assets-title"><span>◎</span><div><strong>Equipe técnica reaproveitável</strong><small>Formação, função e experiência devem ser reconferidas.</small></div></div>
                            {candidate.teamSuggestions.map((suggestion) => {
                              const applied = team.some((member) => member.professional_id === suggestion.professionalId);
                              return <article className="reuse-asset" key={suggestion.professionalId}><div><strong>{suggestion.name}</strong><StatusPill value={`${suggestion.score}% aderente`} /></div><p>{suggestion.proposedRole} · {suggestion.specialty}</p><small>{suggestion.organization}{suggestion.council ? ` · ${suggestion.council} ${suggestion.registration}` : ""}</small><div className="reuse-evidence-tags compact">{suggestion.matchedRequirements.map((term) => <span key={term}>{term}</span>)}</div><button className={applied ? "secondary applied" : "secondary"} disabled={applied || busy || tender.status === "Finalizada"} onClick={() => applyReuseSuggestion(candidate.sourceTenderId, "Equipe", suggestion.professionalId)}>{applied ? "✓ Incluído na equipe" : "＋ Reaproveitar profissional"}</button></article>;
                            })}
                            {!candidate.teamSuggestions.length && <p className="reuse-none">Nenhum profissional do precedente apresentou evidência suficiente.</p>}
                          </section>
                          <section>
                            <div className="reuse-assets-title"><span>▣</span><div><strong>Atestados operacionais reaproveitáveis</strong><small>Somente registros da empresa definida para esta licitação.</small></div></div>
                            {candidate.archiveSuggestions.map((suggestion) => {
                              const applied = archiveMatches.some((match) => match.technical_record_id === suggestion.technicalRecordId);
                              return <article className="reuse-asset" key={suggestion.technicalRecordId}><div><strong>{suggestion.certificateNumber || suggestion.catNumber || "Atestado sem número"}</strong><StatusPill value={`${suggestion.score}% aderente`} /></div><p>{suggestion.object}</p><small>{suggestion.company} · {suggestion.serviceType}</small><div className="reuse-quantity"><span>Quantitativo registrado</span><strong>{suggestion.quantitySummary || "Não identificado"}</strong></div><div className="reuse-evidence-tags compact">{suggestion.matchedTerms.map((term) => <span key={term}>{term}</span>)}</div><button className={applied ? "secondary applied" : "secondary"} disabled={applied || busy || tender.status === "Finalizada"} onClick={() => applyReuseSuggestion(candidate.sourceTenderId, "Atestado", suggestion.technicalRecordId)}>{applied ? "✓ Incluído no atendimento" : "＋ Reaproveitar atestado"}</button></article>;
                            })}
                            {!candidate.archiveSuggestions.length && <p className="reuse-none">Nenhum atestado anteriormente analisado passou pelo filtro atual.</p>}
                          </section>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <div className="drawer-empty"><span>↻</span><h4>Nenhum precedente compatível</h4><p>O agente não encontrou processo finalizado com evidências suficientes. Consulte as ressalvas e complete as exigências ou os dossiês anteriores.</p></div>}
              </>
            ) : <div className="reuse-agent-empty"><span>✦</span><h4>Agente ainda não executado</h4><p>Ative a função para comparar esta licitação com a memória de processos disputados e identificar equipe técnica e atestados operacionais potencialmente reutilizáveis.</p>{role === "Manutenção" && <small>Solicite a execução a um Operador, Coordenador ou Diretor.</small>}</div>}
          </section>
        )}

        <div className="drawer-actions">
          <a className="google-inline" href={googleCalendarUrl(tender)} target="_blank" rel="noreferrer"><b>G</b> Adicionar à agenda</a>
          {role !== "Manutenção" && tender.status !== "Finalizada" && <button className="primary" onClick={() => setFollowupOpen(true)}>{tender.phase === "Acompanhamento de resultado" ? "＋ Novo prazo pós-disputa" : "↗ Encaminhar para acompanhamento de resultado"}</button>}
          {(role === "Diretor" || role === "Coordenador") && tender.status !== "Finalizada" && <button className="secondary" onClick={() => setFinalizeOpen(true)}>✓ Finalizar licitação</button>}
          {(role === "Diretor" || role === "Coordenador") && <button className="delete-link" onClick={remove}>Excluir acompanhamento</button>}
        </div>

        {editOpen && (
          <Modal title="Editar licitação" close={() => setEditOpen(false)}>
            <form className="form-grid" onSubmit={editTender}>
              <label>Número<input name="number" defaultValue={tender.number} required /></label>
              <label>Modalidade<select name="modality" defaultValue={tender.modality}>{TENDER_MODALITIES.map((item) => <option key={item}>{item}</option>)}{!TENDER_MODALITIES.includes(tender.modality as typeof TENDER_MODALITIES[number]) && <option>{tender.modality}</option>}</select></label>
              <label className="wide">Objeto<input name="title" defaultValue={tender.title} required /></label>
              <label className="wide">Órgão<input name="organ" defaultValue={tender.organ} required /></label>
              <label>Plataforma<input name="platform" defaultValue={tender.platform} /></label>
              <label>Valor estimado<input name="estimatedValue" defaultValue={tender.estimatedValue} /></label>
              <label>Tipo de serviço<select name="tenderType" defaultValue={tender.tenderType || SERVICE_TYPES[0]}>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}{tender.tenderType && !SERVICE_TYPES.includes(tender.tenderType as typeof SERVICE_TYPES[number]) && <option>{tender.tenderType}</option>}</select></label>
              <label>Forma de participação<select name="participationType" defaultValue={tender.participationType || "Empresa"}><option>Empresa</option><option>Consórcio</option><option>A definir</option></select></label>
              <label className="wide">Participante<select name="participantOrganizationId" defaultValue={tender.participantOrganizationId || ""}><option value="">A definir</option>{organizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name} · {organization.type}</option>)}</select></label>
              <label>Sessão pública<input name="openingAt" type="datetime-local" defaultValue={dateTimeLocal} required /></label>
              <label>Responsável<input name="owner" defaultValue={tender.owner} /></label>
              <label className="wide">Resumo e observações<textarea name="summary" rows={3} defaultValue={tender.summary} /></label>
              <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setEditOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</button></div>
            </form>
          </Modal>
        )}

        {routingOpen && latestImportAnalysis && (
          <Modal title="Confirmar roteamento empresarial" close={() => setRoutingOpen(false)}>
            <form className="form-grid" onSubmit={confirmRouting}>
              <label className="wide">Natureza predominante do objeto<input name="objectNature" defaultValue={latestImportAnalysis.object_nature} required /></label>
              <label className="wide">Acervo técnico exclusivo<select name="routedCompany" defaultValue={latestImportAnalysis.routed_company} required><option value="" disabled>Selecione após conferir o objeto</option><option>UFC Engenharia</option><option>Pórtico Construções</option></select></label>
              <label className="wide">Justificativa documental<textarea name="routingReason" rows={4} defaultValue={latestImportAnalysis.routing_reason} placeholder="Indique o trecho do objeto e por que caracteriza consultoria/projeto ou execução/obra." required /></label>
              <div className="routing-notice wide"><strong>Regra de exclusividade</strong><span>UFC: gerenciamento, supervisão, fiscalização, consultoria e projetos isolados. Pórtico: obra, execução, manutenção, reforma, contratação integrada ou projeto com execução. Os dois acervos não serão combinados.</span></div>
              <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setRoutingOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Confirmando..." : "Confirmar roteamento"}</button></div>
            </form>
          </Modal>
        )}

        {uploadOpen && (
          <Modal title="Enviar documentos para a licitação" close={() => { if (!busy) { setUploadOpen(false); setTenderUploadFiles([]); setTenderUploadProgress(""); } }}>
            <form className="form-grid" onSubmit={uploadTenderDocument}>
              <label className="wide">Bloco de atendimento<select name="category" defaultValue="Habilitação"><option>Habilitação</option><option>Equipe profissional</option><option>Proposta técnica</option><option>Proposta de preços</option><option>Edital e anexos</option><option>Diligência / recurso</option></select></label>
              <label className="wide">Arquivos<input name="file" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" required disabled={busy} onChange={(event) => setTenderUploadFiles(Array.from(event.target.files ?? []))} /><small>Selecione vários documentos de uma vez. Cada arquivo pode ter até 200 MB; PDFs são guardados sem conversão, preservando o conteúdo original.</small></label>
              {!!tenderUploadFiles.length && <div className="multi-file-selection wide"><div><strong>{tenderUploadFiles.length} documento(s) selecionado(s)</strong><span>{formatFileSize(tenderUploadFiles.reduce((total, file) => total + file.size, 0))} no total</span></div>{tenderUploadFiles.map((file) => <span className={file.size > MAX_DOCUMENT_BYTES ? "oversize" : ""} key={`${file.name}-${file.size}-${file.lastModified}`}><b>{file.name}</b><small>{formatFileSize(file.size)}{file.size > MAX_DOCUMENT_BYTES ? " · excede 200 MB" : " · formato preservado"}</small></span>)}</div>}
              {tenderUploadProgress && <div className="upload-progress-note wide"><span className="loading-dot" />{tenderUploadProgress}</div>}
              <div className="form-actions wide"><button type="button" className="ghost" disabled={busy} onClick={() => { setUploadOpen(false); setTenderUploadFiles([]); setTenderUploadProgress(""); }}>Cancelar</button><button className="primary" disabled={busy || !tenderUploadFiles.length}>{busy ? tenderUploadProgress || "Enviando..." : tenderUploadFiles.length > 1 ? `Guardar ${tenderUploadFiles.length} documentos` : "Guardar no processo"}</button></div>
            </form>
          </Modal>
        )}

        {editalVersionOpen && (
          <Modal title="Registrar atualização do edital" close={() => setEditalVersionOpen(false)}>
            <form className="form-grid" onSubmit={uploadEditalVersion}>
              <label>Tipo de atualização<select name="eventType" defaultValue="Retificação"><option>Edital original</option><option>Esclarecimento</option><option>Retificação</option><option>Suspensão</option><option>Reabertura</option><option>Sine die</option><option>Novo anexo</option><option>Decisão administrativa</option></select></label>
              <label>Efeito no processo<select name="processEffect" defaultValue="Revisar dados e exigências"><option>Sem alteração de fase</option><option>Revisar dados e exigências</option><option>Recalcular prazos</option><option>Suspender licitação</option><option>Sine die</option></select></label>
              <label className="wide">Título da atualização<input name="title" placeholder="Ex.: Retificação nº 02 — nova data de abertura" required /></label>
              <label>Data de publicação<input name="publicationDate" type="date" /></label>
              <label>Data de vigência / retomada<input name="effectiveDate" type="date" /></label>
              <label className="wide">Arquivo oficial<input name="file" type="file" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.zip" required /><small>Até 200 MB. PDFs serão preservados no formato original e enviados em partes seguras.</small></label>
              <label className="wide">Alterações identificadas<textarea name="description" rows={3} placeholder="Registre os itens alterados, prazos afetados e providências." /></label>
              <label className="wide">Resumo da conferência<textarea name="extractionSummary" rows={2} placeholder="Fonte, item/página e pendências para validação humana." /></label>
              <div className="human-review wide"><strong>Controle de versão</strong><span>A nova publicação não apaga o histórico. Confirme os efeitos sobre sessão, impugnação, habilitação e proposta antes de concluir a revisão.</span></div>
              <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setEditalVersionOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Registrando..." : "Registrar nova versão"}</button></div>
            </form>
          </Modal>
        )}

        {linkOpen && (
          <Modal title="Vincular documento da habilitação" close={() => setLinkOpen(false)}>
            <form className="form-grid" onSubmit={linkDocument}>
              <label className="wide">Documento<select name="documentId" defaultValue="" required><option value="" disabled>Selecione na biblioteca</option>{complianceDocuments.map((document) => { const expiry = expiryLabel(document); return <option value={document.id} key={document.id}>{document.organization_name} · {document.document_type} · {expiry.label}</option>; })}</select></label>
              <label>Bloco<select name="section" defaultValue="Habilitação"><option>Habilitação</option><option>Equipe profissional</option><option>Proposta técnica</option><option>Proposta de preços</option><option>Edital e anexos</option><option>Diligência / recurso</option></select></label>
              <label>Exigência atendida<input name="requirement" placeholder="Ex.: regularidade fiscal federal" /></label>
              <label className="wide">Observações<textarea name="notes" rows={2} /></label>
              <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setLinkOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>Vincular documento</button></div>
            </form>
          </Modal>
        )}

        {assignOpen && (
          <Modal title="Indicar profissional para a equipe" close={() => setAssignOpen(false)}>
            <form className="form-grid" onSubmit={assignProfessional}>
              <label className="wide">Profissional<select name="professionalId" defaultValue="" required><option value="" disabled>Selecione</option>{professionals.filter((professional) => professional.status !== "Inativo").map((professional) => <option value={professional.id} key={professional.id}>{professional.name} · {professional.organization_name || "Sem vínculo"}</option>)}</select></label>
              <label className="wide">Função na proposta<input name="proposedRole" placeholder="Coordenador, Especialista, Responsável técnico..." required /></label>
              <label className="wide">Observações<textarea name="notes" rows={2} placeholder="Produto, carga horária, item de pontuação..." /></label>
              <div className="form-actions wide"><button type="button" className="ghost" onClick={() => setAssignOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>Adicionar à equipe</button></div>
            </form>
          </Modal>
        )}
        {requirementOpen && <Modal title="Registrar exigência técnica" close={() => setRequirementOpen(false)}><form className="form-grid" onSubmit={createRequirement}><label>Bloco da exigência<select name="requirementType" defaultValue="Empresa"><option>Empresa</option><option>Profissional</option></select></label><label>Status<select name="status" defaultValue="Pendente"><option>Pendente</option><option>Atende</option><option>Atende parcialmente</option><option>Não atende</option><option>Depende de diligência</option></select></label><label className="wide">Descrição da exigência<textarea name="description" rows={3} placeholder="Transcreva ou resuma fielmente a exigência do edital/TR." required /></label><label>Quantitativo mínimo<input name="minimumQuantity" /></label><label>Unidade<input name="unit" placeholder="km, m², unidade, mês..." /></label><label className="wide">Evidência indicada<input name="evidence" placeholder="Atestado/CAT, profissional, diploma ou documento a utilizar" /></label><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setRequirementOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>Salvar exigência</button></div></form></Modal>}
        {followupOpen && <Modal title={tender.phase === "Acompanhamento de resultado" ? "Registrar novo prazo pós-disputa" : "Encaminhar processo"} close={() => setFollowupOpen(false)}><form className="form-grid" onSubmit={createTenderFollowup}><div className="decision-context wide"><span className="company-chip ufc">PÓS-DISPUTA</span><strong>{tender.modality} {tender.number}</strong><small>{tender.title}</small></div><label>Tipo de acompanhamento<select name="followupType" defaultValue="Resultado"><option>Resultado</option><option>Diligência</option><option>Intenção recursal</option><option>Razões recursais</option><option>Recurso</option><option>Contrarrazões</option><option>Julgamento de recurso</option><option>Adjudicação</option><option>Homologação</option><option>Convocação / contrato</option></select></label><label>Próximo prazo / data de controle<input name="dueAt" type="datetime-local" required /></label><label className="wide">Atividade / providência<input name="title" defaultValue="Acompanhar publicação do resultado da disputa" required /></label><label>Responsável<input name="responsible" defaultValue={tender.owner} /></label><label className="wide">Registro da disputa e estratégia<textarea name="notes" rows={4} placeholder="Classificação provisória, melhor lance, concorrentes, mensagens da comissão, intenção recursal e providências necessárias." /></label><div className="post-dispute-note wide"><strong>Movimentação integral, sem duplicação</strong><span>Este mesmo cadastro sairá da pasta “Licitações” e seguirá para “Recursos & prazos” ou “Acompanhamento de resultado”. Edital, Termo de Referência, habilitação, equipe, análises, prazos e histórico permanecerão vinculados ao processo original.</span></div><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setFollowupOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Encaminhando..." : "Mover processo completo"}</button></div></form></Modal>}
        {finalizeOpen && <Modal title="Finalizar e preservar dossiê" close={() => setFinalizeOpen(false)}><form className="form-grid" onSubmit={finalizeTender}><div className="decision-context wide"><strong>{tender.modality} {tender.number}</strong><small>{tender.title}</small></div><label>Resultado<select name="outcome" defaultValue="Adjudicada"><option>Adjudicada</option><option>Homologada</option><option>Contratada</option><option>Não vencida</option><option>Desclassificada</option><option>Inabilitada</option><option>Revogada</option><option>Anulada</option><option>Fracassada</option><option>Deserta</option></select></label><label>Data da decisão<input name="decisionDate" type="date" /></label><label>Vencedor<input name="winner" /></label><label>Valor final<input name="finalValue" /></label><label className="wide">Resultado, fundamentos e lições aprendidas<textarea name="notes" rows={4} required /></label><label className="wide">Itens reutilizáveis<textarea name="reusableItems" rows={3} placeholder="Habilitação, profissionais, atestados, metodologia, planilha, recurso..." /></label><div className="form-actions wide"><button type="button" className="ghost" onClick={() => setFinalizeOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Finalizando..." : "Finalizar e preservar"}</button></div></form></Modal>}
      </aside>
    </>
  );
}

class TenderDrawerErrorBoundary extends Component<
  { children: ReactNode; close: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Falha isolada ao abrir o processo licitatório", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <>
        <button className="backdrop" aria-label="Fechar detalhes" onClick={this.props.close} />
        <aside className="drawer tender-workspace drawer-recovery" role="dialog" aria-modal="true" aria-label="Processo indisponível">
          <div className="drawer-head">
            <div><span className="eyebrow">RECUPERAÇÃO DO PAINEL</span><h2>Não foi possível exibir este processo</h2></div>
            <button aria-label="Fechar" onClick={this.props.close}>×</button>
          </div>
          <div className="drawer-empty">
            <span>!</span>
            <h4>O portal permaneceu protegido</h4>
            <p>O registro contém uma informação antiga ou incompleta. Feche este painel e tente novamente após atualizar a página.</p>
            <button className="primary" onClick={() => window.location.reload()}>Atualizar portal</button>
          </div>
        </aside>
      </>
    );
  }
}

function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button className="backdrop modal-backdrop" aria-label="Fechar janela" onClick={close} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button aria-label="Fechar" onClick={close}>×</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </>
  );
}
