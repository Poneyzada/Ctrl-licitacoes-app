import { getAuthenticatedPortalUser, getD1, initDatabase } from "../../../db";

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function event({
  id,
  title,
  startsAt,
  endsAt,
  durationMinutes,
  description,
  location,
  reminderMinutes = [1440],
}: {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  durationMinutes?: number;
  description: string;
  location?: string;
  reminderMinutes?: number[];
}) {
  const start = new Date(startsAt);
  const suppliedEnd = new Date(endsAt ?? "");
  const end = Number.isNaN(suppliedEnd.getTime())
    ? new Date(start.getTime() + (durationMinutes ?? 30) * 60000)
    : suppliedEnd;
  if (Number.isNaN(start.getTime())) return "";
  return [
    "BEGIN:VEVENT",
    `UID:${escapeIcs(id)}@licitacontrol`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(start.toISOString())}`,
    `DTEND:${icsDate(end.toISOString())}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    ...(location ? [`LOCATION:${escapeIcs(location)}`] : []),
    ...reminderMinutes.flatMap((minutes) => [
      "BEGIN:VALARM",
      `TRIGGER:-PT${Math.max(0, minutes)}M`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs(title)}`,
      "END:VALARM",
    ]),
    "END:VEVENT",
  ].join("\r\n");
}

function minutesFromDays(value: unknown, fallback: number[]) {
  const parsed = String(value ?? "")
    .split(",")
    .map((item) => Number(item.trim()) * 1440)
    .filter((item) => Number.isFinite(item) && item >= 0);
  return parsed.length ? parsed : fallback;
}

function minutesList(value: unknown, fallback: number[]) {
  const parsed = String(value ?? "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item >= 0);
  return parsed.length ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
    const db = getD1();
    const [tenders, followups, resources, platforms, platformDocuments, documents, ownEvents, rules] = await Promise.all([
      db.prepare(
        `SELECT id, number, modality, title, organ, platform, opening_at, owner
         FROM tenders WHERE deleted_at IS NULL AND status <> 'Finalizada'`,
      ).all<Record<string, unknown>>(),
      db.prepare(
        `SELECT tf.*, t.number, t.title AS tender_title
         FROM tender_followups tf JOIN tenders t ON t.id = tf.tender_id
         WHERE tf.status <> 'Concluído' AND t.deleted_at IS NULL`,
      ).all<Record<string, unknown>>(),
      db.prepare(
        `SELECT rc.*, t.number, t.title AS tender_title
         FROM resource_cases rc JOIN tenders t ON t.id = rc.tender_id
         WHERE rc.status <> 'Concluído' AND t.deleted_at IS NULL`,
      ).all<Record<string, unknown>>(),
      db.prepare(
        `SELECT pr.*, o.name AS organization_name
         FROM platform_registrations pr JOIN organizations o ON o.id = pr.organization_id
         WHERE pr.status = 'Ativo'`,
      ).all<Record<string, unknown>>(),
      db.prepare(
        `SELECT pd.id, pd.name, pd.document_type, pd.expires_at,
                o.name AS organization_name, pr.platform_name, pr.responsible,
                pr.reminder_days
         FROM platform_documents pd
         JOIN organizations o ON o.id = pd.organization_id
         JOIN platform_registrations pr ON pr.id = pd.platform_registration_id
         WHERE pd.status = 'Ativo' AND pd.expires_at IS NOT NULL`,
      ).all<Record<string, unknown>>(),
      db.prepare(
        `SELECT cd.id, cd.name, cd.document_type, cd.expires_at,
                o.name AS organization_name
         FROM compliance_documents cd
         JOIN organizations o ON o.id = cd.organization_id
         WHERE cd.status = 'Ativo' AND cd.no_expiry = 0
           AND cd.expires_at IS NOT NULL`,
      ).all<Record<string, unknown>>(),
      db.prepare(
        `SELECT ce.*, t.number AS tender_number, t.title AS tender_title
         FROM calendar_events ce
         LEFT JOIN tenders t ON t.id = ce.tender_id
         WHERE ce.status = 'Agendado'
           AND (ce.visibility = 'Equipe' OR ce.owner_email = ?)`,
      ).bind(user.email).all<Record<string, unknown>>(),
      db.prepare(
        `SELECT event_type, reminder_minutes, active
         FROM alert_rules WHERE user_email = ?`,
      ).bind(user.email).all<Record<string, unknown>>(),
    ]);
    const remindersFor = (eventType: string, fallback: number[]) => {
      const rule = (rules.results as Record<string, unknown>[]).find(
        (item) => String(item.event_type) === eventType,
      );
      if (rule && !Number(rule.active)) return [];
      return rule ? minutesList(rule.reminder_minutes, fallback) : fallback;
    };
    const entries = [
      ...(tenders.results as Record<string, unknown>[]).map((row) => event({
        id: `sessao-${row.id}`,
        title: `${row.modality} ${row.number} — Sessão pública`,
        startsAt: String(row.opening_at),
        durationMinutes: 90,
        description: `${row.title}\nÓrgão: ${row.organ}\nPlataforma: ${row.platform}\nResponsável: ${row.owner}`,
        reminderMinutes: remindersFor("Sessão pública", [10080, 2880, 120]),
      })),
      ...(followups.results as Record<string, unknown>[]).map((row) => event({
        id: `acompanhamento-${row.id}`,
        title: `${row.followup_type} — ${row.number}`,
        startsAt: String(row.due_at),
        durationMinutes: 30,
        description: `${row.title}\n${row.tender_title}\nResponsável: ${row.responsible}\n${row.notes}`,
        reminderMinutes: remindersFor("Recurso", [1440, 120]),
      })),
      ...(resources.results as Record<string, unknown>[]).map((row) => event({
        id: `recurso-${row.id}`,
        title: `${row.resource_type} — ${row.number}`,
        startsAt: String(row.deadline),
        durationMinutes: 45,
        description: `${row.tender_title}\nPosição: ${row.position}\nResponsável: ${row.responsible}\nPróxima ação: ${row.next_action}`,
        reminderMinutes: remindersFor("Recurso", [1440, 120, 30]),
      })),
      ...(platforms.results as Record<string, unknown>[]).map((row) => event({
        id: `plataforma-${row.id}`,
        title: `Renovar cadastro — ${row.platform_name}`,
        startsAt: `${String(row.expires_at).slice(0, 10)}T09:00:00-03:00`,
        durationMinutes: 30,
        description: `${row.organization_name}\nResponsável: ${row.responsible}\nAlertas previstos: ${row.reminder_days} dias antes`,
        reminderMinutes: remindersFor("Plataformas", minutesFromDays(row.reminder_days, [43200, 21600, 10080])),
      })),
      ...(platformDocuments.results as Record<string, unknown>[]).map((row) => event({
        id: `documento-plataforma-${row.id}`,
        title: `Renovar ${row.document_type} — ${row.platform_name}`,
        startsAt: `${String(row.expires_at).slice(0, 10)}T09:00:00-03:00`,
        durationMinutes: 30,
        description: `${row.name}\n${row.organization_name}\nResponsável: ${row.responsible}\nDocumento de credenciamento controlado pelo LicitaControl`,
        reminderMinutes: remindersFor("Plataformas", minutesFromDays(row.reminder_days, [43200, 21600, 10080])),
      })),
      ...(documents.results as Record<string, unknown>[]).map((row) => event({
        id: `documento-${row.id}`,
        title: `Renovar documento — ${row.document_type}`,
        startsAt: `${String(row.expires_at).slice(0, 10)}T09:00:00-03:00`,
        durationMinutes: 30,
        description: `${row.name}\n${row.organization_name}\nValidade documental controlada pelo LicitaControl`,
        reminderMinutes: remindersFor("Certidões", [43200, 21600, 10080, 7200, 2880]),
      })),
      ...(ownEvents.results as Record<string, unknown>[]).map((row) => event({
        id: `agenda-${row.id}`,
        title: String(row.title),
        startsAt: String(row.starts_at),
        endsAt: String(row.ends_at),
        description: `${row.description ?? ""}${row.tender_number ? `\nLicitação: ${row.tender_number} — ${row.tender_title}` : ""}\nResponsável: ${row.responsible}`,
        location: String(row.location ?? ""),
        reminderMinutes: minutesList(row.reminder_minutes, [1440, 120]),
      })),
    ].filter(Boolean);
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LicitaControl//Agenda Operacional//PT-BR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:LicitaControl — Agenda operacional",
      ...entries,
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    const inline = new URL(request.url).searchParams.get("disposition") === "inline";
    return new Response(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="licitacontrol-agenda.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar a agenda." },
      { status: 500 },
    );
  }
}
