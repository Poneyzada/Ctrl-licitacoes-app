export type UserRole = "Operador" | "Coordenador" | "Diretor" | "Manutenção";

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
};

const PORTAL_SESSION_COOKIE = "licitacontrol_session";
const PORTAL_SESSION_HOURS = 12;
const DEFAULT_PORTAL_USERS: Array<{
  username: string;
  password: string;
  email: string;
  name: string;
  role: UserRole;
}> = [
  { username: "operador", password: "Operador@2026", email: "operador@licitacontrol.local", name: "Operador Padrão", role: "Operador" },
  { username: "coordenador", password: "Coordenador@2026", email: "coordenador@licitacontrol.local", name: "Coordenador Padrão", role: "Coordenador" },
  { username: "diretor", password: "Diretor@2026", email: "diretor@licitacontrol.local", name: "Diretor Padrão", role: "Diretor" },
  { username: "manutencao", password: "Master@2026", email: "manutencao@licitacontrol.local", name: "Manutenção Master", role: "Manutenção" },
];

import { d1Database } from '@/lib/d1-adapter';

export class MemoryBucket {
  private files = new Map<string, { data: Uint8Array; httpMetadata?: any; customMetadata?: any }>();
  private multipart = new Map<string, { key: string; parts: Map<number, Uint8Array>; options?: any }>();

  async put(key: string, data: any, options: any = {}) {
    let buf: Uint8Array;
    if (data instanceof Uint8Array) buf = data;
    else if (data instanceof ArrayBuffer) buf = new Uint8Array(data);
    else if (typeof data === 'string') buf = new TextEncoder().encode(data);
    else if (data && typeof data.arrayBuffer === 'function') buf = new Uint8Array(await data.arrayBuffer());
    else buf = new Uint8Array(0);
    this.files.set(key, { data: buf, ...options });
  }

  async get(key: string) {
    const f = this.files.get(key);
    if (!f) return null;
    return {
      body: f.data,
      arrayBuffer: async () => f.data.buffer,
      text: async () => new TextDecoder().decode(f.data),
      httpMetadata: f.httpMetadata,
      customMetadata: f.customMetadata,
    };
  }

  async delete(key: string) {
    this.files.delete(key);
  }

  async createMultipartUpload(key: string, options: any = {}) {
    const uploadId = crypto.randomUUID();
    this.multipart.set(uploadId, { key, parts: new Map(), options });
    return { uploadId, key };
  }

  resumeMultipartUpload(key: string, uploadId: string) {
    const session = this.multipart.get(uploadId) || { key, parts: new Map<number, Uint8Array>(), options: undefined };
    this.multipart.set(uploadId, session);
    return {
      uploadPart: async (partNumber: number, data: any) => {
        let buf: Uint8Array;
        if (data instanceof Uint8Array) buf = data;
        else if (data instanceof ArrayBuffer) buf = new Uint8Array(data);
        else if (typeof data === 'string') buf = new TextEncoder().encode(data);
        else if (data && typeof data.arrayBuffer === 'function') buf = new Uint8Array(await data.arrayBuffer());
        else buf = new Uint8Array(0);
        session.parts.set(partNumber, buf);
        return { partNumber, etag: `etag-${uploadId}-${partNumber}` };
      },
      complete: async (uploadedParts: Array<{ partNumber: number; etag: string }>) => {
        const sorted = uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
        const totalLength = sorted.reduce((sum, p) => sum + (session.parts.get(p.partNumber)?.length || 0), 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const p of sorted) {
          const part = session.parts.get(p.partNumber);
          if (part) {
            combined.set(part, offset);
            offset += part.length;
          }
        }
        this.files.set(key, { data: combined, ...session.options });
        this.multipart.delete(uploadId);
        return { key, etag: `complete-${uploadId}` };
      },
      abort: async () => {
        this.multipart.delete(uploadId);
      }
    };
  }
}

const globalBucket = new MemoryBucket();

export function getD1() {
  return d1Database;
}

export function getBucket() {
  return globalBucket;
}

export async function initDatabase() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Operador',
      status TEXT NOT NULL DEFAULT 'Ativo',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS portal_credentials (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      last_login_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS portal_credentials_username_idx
      ON portal_credentials (username)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS portal_sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      user_email TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS portal_sessions_token_idx
      ON portal_sessions (token_hash, expires_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tenders (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      modality TEXT NOT NULL,
      title TEXT NOT NULL,
      organ TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'Portal do órgão',
      estimated_value TEXT NOT NULL DEFAULT 'Não informado',
      status TEXT NOT NULL DEFAULT 'Em análise',
      phase TEXT NOT NULL DEFAULT 'Triagem',
      opening_at TEXT NOT NULL,
      risk TEXT NOT NULL DEFAULT 'Médio',
      progress INTEGER NOT NULL DEFAULT 10,
      owner TEXT NOT NULL DEFAULT 'Não atribuído',
      tags TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      tender_type TEXT NOT NULL DEFAULT 'Outros serviços de engenharia',
      participation_type TEXT NOT NULL DEFAULT 'Empresa',
      participant_organization_id TEXT,
      final_result TEXT NOT NULL DEFAULT '',
      winner TEXT NOT NULL DEFAULT '',
      result_notes TEXT NOT NULL DEFAULT '',
      finalized_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tenders_status_idx
      ON tenders (status, opening_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_email TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS audit_created_idx
      ON audit_logs (created_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS delete_authorizations (
      id TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      created_by TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      used_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      tender_id TEXT,
      name TEXT NOT NULL,
      object_key TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'Documento editalício',
      analysis_status TEXT NOT NULL DEFAULT 'Aguardando análise',
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS technical_records (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      certificate_number TEXT NOT NULL,
      contract_number TEXT NOT NULL DEFAULT '',
      issuer TEXT NOT NULL,
      object TEXT NOT NULL,
      service_type TEXT NOT NULL,
      main_services TEXT NOT NULL,
      characteristics TEXT NOT NULL DEFAULT '',
      quantity_summary TEXT NOT NULL,
      technical_area TEXT NOT NULL DEFAULT 'Engenharia',
      location TEXT NOT NULL DEFAULT '',
      start_date TEXT,
      end_date TEXT,
      cat_number TEXT NOT NULL DEFAULT '',
      document_reference TEXT NOT NULL DEFAULT '',
      internal_document_key TEXT NOT NULL DEFAULT '',
      internal_document_name TEXT NOT NULL DEFAULT '',
      internal_document_type TEXT NOT NULL DEFAULT '',
      internal_document_size INTEGER NOT NULL DEFAULT 0,
      keywords TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Ativo',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS technical_records_company_idx
      ON technical_records (company, service_type)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS pncp_opportunities (
      id TEXT PRIMARY KEY,
      pncp_control_number TEXT NOT NULL UNIQUE,
      purchase_number TEXT NOT NULL DEFAULT '',
      modality TEXT NOT NULL DEFAULT '',
      object TEXT NOT NULL,
      organ TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      opening_at TEXT,
      source_url TEXT NOT NULL DEFAULT '',
      suggested_company TEXT NOT NULL,
      match_score INTEGER NOT NULL DEFAULT 0,
      matched_terms TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Nova',
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS pncp_opportunities_match_idx
      ON pncp_opportunities (suggested_company, match_score DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS archive_sources (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      provider_type TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_file_id TEXT NOT NULL,
      source_format TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Vinculada',
      record_count INTEGER NOT NULL DEFAULT 0,
      last_modified_at TEXT,
      last_synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT NOT NULL DEFAULT ''
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS archive_sources_org_idx
      ON archive_sources (organization_id, status)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS pncp_decisions (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT NOT NULL,
      previous_status TEXT NOT NULL DEFAULT 'Nova',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS pncp_decisions_opportunity_idx
      ON pncp_decisions (opportunity_id, created_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS pncp_operator_permissions (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL UNIQUE,
      enabled INTEGER NOT NULL DEFAULT 1,
      granted_by TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'Empresa',
      tax_id TEXT NOT NULL DEFAULT '',
      members TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Ativa',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS organizations_type_idx
      ON organizations (type, status)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS professionals (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      name TEXT NOT NULL,
      professional_role TEXT NOT NULL,
      council TEXT NOT NULL DEFAULT '',
      registration TEXT NOT NULL DEFAULT '',
      specialty TEXT NOT NULL DEFAULT '',
      relationship_type TEXT NOT NULL DEFAULT 'Próprio',
      formation TEXT NOT NULL DEFAULT '',
      degree TEXT NOT NULL DEFAULT 'Graduação',
      institution TEXT NOT NULL DEFAULT '',
      graduation_year TEXT NOT NULL DEFAULT '',
      qualifications TEXT NOT NULL DEFAULT '',
      experience_areas TEXT NOT NULL DEFAULT '',
      experience_summary TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Ativo',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS professionals_org_idx
      ON professionals (organization_id, status)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS compliance_documents (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      professional_id TEXT,
      name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT NOT NULL DEFAULT '',
      object_key TEXT NOT NULL DEFAULT '',
      content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      size INTEGER NOT NULL DEFAULT 0,
      issuer TEXT NOT NULL DEFAULT '',
      issued_at TEXT,
      expires_at TEXT,
      no_expiry INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Ativo',
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS compliance_documents_expiry_idx
      ON compliance_documents (organization_id, expires_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_document_links (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      section TEXT NOT NULL,
      requirement TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Selecionado',
      notes TEXT NOT NULL DEFAULT '',
      linked_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tender_id, document_id, section)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tender_document_links_idx
      ON tender_document_links (tender_id, section)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_team (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      professional_id TEXT NOT NULL,
      proposed_role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Indicado',
      notes TEXT NOT NULL DEFAULT '',
      assigned_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tender_id, professional_id)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tender_team_idx
      ON tender_team (tender_id, status)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_archive_matches (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      technical_record_id TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      matched_terms TEXT NOT NULL DEFAULT '',
      assessment TEXT NOT NULL DEFAULT 'Depende de análise',
      notes TEXT NOT NULL DEFAULT '',
      analyzed_by TEXT NOT NULL,
      analyzed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tender_id, technical_record_id)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tender_archive_matches_idx
      ON tender_archive_matches (tender_id, score DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS consortium_members (
      id TEXT PRIMARY KEY,
      consortium_id TEXT NOT NULL,
      member_organization_id TEXT NOT NULL,
      participation_percentage TEXT NOT NULL,
      is_leader INTEGER NOT NULL DEFAULT 0,
      technical_responsibility TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(consortium_id, member_organization_id)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS consortium_members_idx
      ON consortium_members (consortium_id, is_leader DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS platform_registrations (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      platform_name TEXT NOT NULL,
      registration_code TEXT NOT NULL DEFAULT '',
      access_email TEXT NOT NULL DEFAULT '',
      expires_at TEXT NOT NULL,
      responsible TEXT NOT NULL DEFAULT '',
      reminder_days TEXT NOT NULL DEFAULT '30,15,7',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Ativo',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS platform_registrations_expiry_idx
      ON platform_registrations (organization_id, expires_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS platform_documents (
      id TEXT PRIMARY KEY,
      platform_registration_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT NOT NULL DEFAULT '',
      object_key TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      issued_at TEXT,
      expires_at TEXT,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Ativo',
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS platform_documents_expiry_idx
      ON platform_documents (platform_registration_id, expires_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_edital_versions (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      version_number INTEGER NOT NULL DEFAULT 1,
      event_type TEXT NOT NULL DEFAULT 'Edital original',
      title TEXT NOT NULL,
      publication_date TEXT,
      effective_date TEXT,
      description TEXT NOT NULL DEFAULT '',
      process_effect TEXT NOT NULL DEFAULT 'Sem alteração de fase',
      status TEXT NOT NULL DEFAULT 'Vigente',
      object_key TEXT NOT NULL,
      name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      extraction_summary TEXT NOT NULL DEFAULT '',
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tender_edital_versions_idx
      ON tender_edital_versions (tender_id, version_number DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_import_analyses (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      analysis_mode TEXT NOT NULL DEFAULT 'Opção D – Indeterminado',
      object_nature TEXT NOT NULL DEFAULT 'Não identificada',
      routed_company TEXT NOT NULL DEFAULT 'Indeterminado',
      routing_reason TEXT NOT NULL DEFAULT '',
      recommendation TEXT NOT NULL DEFAULT 'INDETERMINADO',
      sources_json TEXT NOT NULL DEFAULT '[]',
      field_evidence_json TEXT NOT NULL DEFAULT '{}',
      missing_documents_json TEXT NOT NULL DEFAULT '[]',
      conflicts_json TEXT NOT NULL DEFAULT '[]',
      critical_conditions_json TEXT NOT NULL DEFAULT '[]',
      review_status TEXT NOT NULL DEFAULT 'Conferência humana registrada',
      confirmed_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tender_import_analyses_idx
      ON tender_import_analyses (tender_id, created_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_requirements (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      description TEXT NOT NULL,
      minimum_quantity TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT '',
      evidence TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pendente',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tender_requirements_idx
      ON tender_requirements (tender_id, requirement_type)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_followups (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      followup_type TEXT NOT NULL,
      title TEXT NOT NULL,
      due_at TEXT NOT NULL,
      responsible TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pendente',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tender_followups_due_idx
      ON tender_followups (status, due_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_outcomes (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL UNIQUE,
      outcome TEXT NOT NULL,
      winner TEXT NOT NULL DEFAULT '',
      final_value TEXT NOT NULL DEFAULT '',
      decision_date TEXT,
      notes TEXT NOT NULL DEFAULT '',
      reusable_items TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tender_reuse_analyses (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Concluída',
      method_version TEXT NOT NULL DEFAULT 'reuso-v1',
      candidate_count INTEGER NOT NULL DEFAULT 0,
      candidates_json TEXT NOT NULL DEFAULT '[]',
      gaps_json TEXT NOT NULL DEFAULT '[]',
      activated_by TEXT NOT NULL,
      analyzed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS tender_reuse_analyses_idx
      ON tender_reuse_analyses (tender_id, analyzed_at DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS resource_cases (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT 'A definir',
      deadline TEXT NOT NULL,
      responsible TEXT NOT NULL,
      competitor_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Triagem',
      summary TEXT NOT NULL DEFAULT '',
      legal_ground TEXT NOT NULL DEFAULT '',
      next_action TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS resource_cases_deadline_idx
      ON resource_cases (status, deadline)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS opponent_documents (
      id TEXT PRIMARY KEY,
      resource_case_id TEXT NOT NULL,
      tender_id TEXT NOT NULL,
      competitor_name TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      object_key TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      category TEXT NOT NULL,
      analysis_sector TEXT NOT NULL,
      analysis_status TEXT NOT NULL DEFAULT 'Aguardando análise',
      notes TEXT NOT NULL DEFAULT '',
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS opponent_documents_case_idx
      ON opponent_documents (resource_case_id, analysis_sector, analysis_status)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      tender_id TEXT,
      owner_email TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'Equipe',
      event_type TEXT NOT NULL DEFAULT 'Compromisso',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      responsible TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'Média',
      reminder_minutes TEXT NOT NULL DEFAULT '1440,120',
      status TEXT NOT NULL DEFAULT 'Agendado',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS calendar_events_start_idx
      ON calendar_events (status, starts_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      event_type TEXT NOT NULL,
      name TEXT NOT NULL,
      cadence TEXT NOT NULL,
      reminder_minutes TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_email, event_type)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS alert_rules_user_idx
      ON alert_rules (user_email, active)`),
  ]);
  await seedDefaultPortalUsers();
}

async function passwordDigest(password: string, salt: string) {
  return sha256(`${salt}:${password}`);
}

async function seedDefaultPortalUsers() {
  const db = getD1();
  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM users")
    .first<{ total: number }>();
  if (Number(count?.total ?? 0) > 0) return;
  for (const account of DEFAULT_PORTAL_USERS) {
    const existing = await db
      .prepare("SELECT id FROM portal_credentials WHERE username = ? LIMIT 1")
      .bind(account.username)
      .first<{ id: string }>();
    if (existing) continue;
    const user = await db
      .prepare("SELECT id, email, name, role, status FROM users WHERE email = ? LIMIT 1")
      .bind(account.email)
      .first<PortalUser>();
    const portalUser: PortalUser = user ?? {
      id: crypto.randomUUID(),
      email: account.email,
      name: account.name,
      role: account.role,
      status: "Ativo",
    };
    if (!user) {
      await db
        .prepare("INSERT INTO users (id, email, name, role, status) VALUES (?, ?, ?, ?, 'Ativo')")
        .bind(portalUser.id, portalUser.email, portalUser.name, portalUser.role)
        .run();
    }
    const salt = crypto.randomUUID();
    await db
      .prepare(`INSERT INTO portal_credentials
        (id, user_email, username, password_hash, password_salt, must_change_password, created_by)
        VALUES (?, ?, ?, ?, ?, 1, 'sistema')`)
      .bind(
        crypto.randomUUID(),
        account.email,
        account.username,
        await passwordDigest(account.password, salt),
        salt,
      )
      .run();
  }
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  const found = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

export async function authenticatePortalCredentials(username: string, password: string) {
  const db = getD1();
  const normalizedUsername = username.trim().toLowerCase();
  const credential = await db
    .prepare(`SELECT pc.*, u.id AS user_id, u.email, u.name, u.role, u.status
      FROM portal_credentials pc
      JOIN users u ON u.email = pc.user_email
      WHERE lower(pc.username) = ? LIMIT 1`)
    .bind(normalizedUsername)
    .first<Record<string, unknown>>();
  if (!credential || credential.status !== "Ativo") return null;
  const lockedUntil = credential.locked_until ? new Date(String(credential.locked_until)) : null;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return { locked: true as const, user: null };
  }
  const digest = await passwordDigest(password, String(credential.password_salt));
  if (digest !== credential.password_hash) {
    const attempts = Number(credential.failed_attempts ?? 0) + 1;
    await db
      .prepare(`UPDATE portal_credentials
        SET failed_attempts = ?, locked_until = CASE WHEN ? >= 5 THEN datetime('now', '+15 minutes') ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`)
      .bind(attempts, attempts, credential.id)
      .run();
    return { locked: attempts >= 5, user: null };
  }
  await db
    .prepare(`UPDATE portal_credentials
      SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(credential.id)
    .run();
  return {
    locked: false as const,
    user: {
      id: String(credential.user_id),
      email: String(credential.email),
      name: String(credential.name),
      role: credential.role as UserRole,
      status: String(credential.status),
    } satisfies PortalUser,
  };
}

export async function createPortalSession(user: PortalUser, secure = true) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-", "")}`;
  const tokenHash = await sha256(token);
  const id = crypto.randomUUID();
  await getD1()
    .prepare(`INSERT INTO portal_sessions (id, token_hash, user_email, expires_at)
      VALUES (?, ?, ?, datetime('now', ?))`)
    .bind(id, tokenHash, user.email, `+${PORTAL_SESSION_HOURS} hours`)
    .run();
  return {
    token,
    cookie: `${PORTAL_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Strict; Max-Age=${PORTAL_SESSION_HOURS * 3600}`,
  };
}

export async function getAuthenticatedPortalUser(request: Request): Promise<PortalUser | null> {
  const token = readCookie(request, PORTAL_SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await getD1()
    .prepare(`SELECT u.id, u.email, u.name, u.role, u.status
      FROM portal_sessions ps
      JOIN users u ON u.email = ps.user_email
      WHERE ps.token_hash = ? AND datetime(ps.expires_at) > datetime('now')
        AND u.status = 'Ativo' LIMIT 1`)
    .bind(tokenHash)
    .first<PortalUser>();
  if (row) {
    await getD1()
      .prepare("UPDATE portal_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }
  return row ?? null;
}

export async function revokePortalSession(request: Request) {
  const token = readCookie(request, PORTAL_SESSION_COOKIE);
  if (token) {
    await getD1()
      .prepare("DELETE FROM portal_sessions WHERE token_hash = ?")
      .bind(await sha256(token))
      .run();
  }
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  return `${PORTAL_SESSION_COOKIE}=; Path=/; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Strict; Max-Age=0`;
}

export async function createPortalCredentialUser(input: {
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  createdBy: string;
}) {
  const db = getD1();
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  const existing = await db
    .prepare("SELECT id FROM portal_credentials WHERE lower(username) = ? OR lower(user_email) = ? LIMIT 1")
    .bind(username, email)
    .first<{ id: string }>();
  if (existing) throw new Error("Já existe um usuário com este login ou e-mail.");
  const userId = crypto.randomUUID();
  await db
    .prepare(`INSERT INTO users (id, email, name, role, status)
      VALUES (?, ?, ?, ?, 'Ativo')
      ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = excluded.role, status = 'Ativo'`)
    .bind(userId, email, input.name.trim(), input.role)
    .run();
  const salt = crypto.randomUUID();
  await db
    .prepare(`INSERT INTO portal_credentials
      (id, user_email, username, password_hash, password_salt, must_change_password, created_by)
      VALUES (?, ?, ?, ?, ?, 1, ?)`)
    .bind(
      crypto.randomUUID(),
      email,
      username,
      await passwordDigest(input.password, salt),
      salt,
      input.createdBy,
    )
    .run();
  return { email, username };
}

export async function getOrCreateUser(
  email: string,
  name: string,
): Promise<PortalUser> {
  const db = getD1();
  const existing = await db
    .prepare(
      "SELECT id, email, name, role, status FROM users WHERE email = ? LIMIT 1",
    )
    .bind(email)
    .first<PortalUser>();
  if (existing) return existing;

  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM users")
    .first<{ total: number }>();
  const role: UserRole = Number(count?.total ?? 0) === 0 ? "Diretor" : "Operador";
  const user: PortalUser = {
    id: crypto.randomUUID(),
    email,
    name,
    role,
    status: "Ativo",
  };
  await db
    .prepare(
      "INSERT INTO users (id, email, name, role, status) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(user.id, user.email, user.name, user.role, user.status)
    .run();
  return user;
}

export async function logAudit(
  user: PortalUser,
  action: string,
  entityType: string,
  entityId: string,
  detail: string,
) {
  await getD1()
    .prepare(
      `INSERT INTO audit_logs
      (id, actor_email, actor_name, actor_role, action, entity_type, entity_id, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      user.email,
      user.name,
      user.role,
      action,
      entityType,
      entityId,
      detail,
    )
    .run();
}

export async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
