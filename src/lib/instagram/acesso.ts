import { getProfile } from "@/lib/supabase/auth"

/**
 * Guarda das rotas do painel que usam service_role.
 *
 * Essas rotas passam por cima da RLS para escrever métrica, então a conferência
 * de papel que a RLS faria precisa acontecer aqui, antes.
 */
export async function exigirEquipe(): Promise<{ ok: true } | { ok: false; http: number; mensagem: string }> {
    const perfil = await getProfile()
    if (!perfil) return { ok: false, http: 401, mensagem: "Sessão expirada. Entre de novo." }
    if (!["admin", "gestor", "analista"].includes(perfil.role)) {
        return { ok: false, http: 403, mensagem: "Só a equipe da Somos Preta pode fazer isso." }
    }
    return { ok: true }
}

/**
 * A rotina agendada se identifica pelo segredo. A Vercel envia
 * `Authorization: Bearer <CRON_SECRET>` sozinha quando a variável existe.
 */
export function chamadaDaRotina(req: Request): boolean {
    const segredo = process.env.CRON_SECRET
    if (!segredo) return false
    return req.headers.get("authorization") === `Bearer ${segredo}`
}
