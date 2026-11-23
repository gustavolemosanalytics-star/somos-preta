import { createAdminClient } from "@/lib/supabase/server"

import type { ConexaoInstagram } from "./tipos"

/**
 * O estado da conexão de uma criadora, SEM o token — só servidor.
 *
 * A tabela de conexões não tem política de RLS nenhuma (o token mora lá), então
 * nem a própria criadora a lê pela API do Supabase. As telas perguntam por
 * aqui, que escolhe a dedo as colunas que podem sair.
 */
export async function lerConexao(profileId: string): Promise<ConexaoInstagram | null> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("somos_preta_instagram_conexoes")
        .select("ig_user_id, username, status, conectado_em, ultima_coleta_em, ultimo_erro")
        .eq("profile_id", profileId)
        .maybeSingle()
    // Tabela inexistente (migration 0025 pendente) conta como "não conectado".
    if (error || !data) return null
    return data as ConexaoInstagram
}
