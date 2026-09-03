import {
  authenticatePortalCredentials,
  createPortalSession,
  getAuthenticatedPortalUser,
  initDatabase,
  logAudit,
  revokePortalSession,
} from "../../../db";

export async function GET(request: Request) {
  await initDatabase();
  const user = await getAuthenticatedPortalUser(request);
  if (!user) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  return Response.json({ authenticated: true, user });
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = (await request.json()) as { username?: string; password?: string };
    if (!body.username?.trim() || !body.password) {
      return Response.json({ error: "Informe login e senha." }, { status: 400 });
    }
    const authenticated = await authenticatePortalCredentials(body.username, body.password);
    if (!authenticated?.user) {
      return Response.json(
        { error: authenticated?.locked ? "Acesso temporariamente bloqueado após tentativas inválidas." : "Login ou senha inválidos." },
        { status: 401 },
      );
    }
    const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    const session = await createPortalSession(authenticated.user, secure);
    await logAudit(
      authenticated.user,
      "SESSAO_INICIADA",
      "acesso",
      authenticated.user.id,
      `Entrada realizada no portal com o perfil ${authenticated.user.role}.`,
    );
    return Response.json(
      { authenticated: true, user: authenticated.user },
      { headers: { "Set-Cookie": session.cookie } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível iniciar a sessão." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase();
    const user = await getAuthenticatedPortalUser(request);
    if (user) {
      await logAudit(user, "SESSAO_ENCERRADA", "acesso", user.id, "Saída voluntária do portal.");
    }
    const cookie = await revokePortalSession(request);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie } });
  } catch {
    return Response.json({ ok: true });
  }
}
