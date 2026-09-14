"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"

// Retorna o usuário atual se ele for admin; senão null.
async function getAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
        .from("somos_preta_profiles")
        .select("role")
        .eq("id", user.id)
        .single()
    return data?.role === "admin" ? user : null
}

function semServiceKey() {
    return !process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function criarUsuario(input: {
    email: string
    senha: string
    nome: string
    role: "admin" | "gestor" | "analista" | "creator" | "pendente"
}): Promise<{ ok?: true; error?: string }> {
    const me = await getAdmin()
    if (!me) return { error: "Acesso restrito a administradores." }
    if (semServiceKey()) return { error: "Configure a SUPABASE_SERVICE_ROLE_KEY (secret key) para criar usuários." }

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
        email: input.email,
        password: input.senha,
        email_confirm: true,
        user_metadata: { nome: input.nome },
    })
    if (error) return { error: error.message }

    // O trigger cria o perfil com role "pendente": sem este UPDATE a pessoa entra sem acesso a nada.
    const { data: perfil, error: erroPerfil } = await admin
        .from("somos_preta_profiles")
        .update({ nome: input.nome.trim() || null, role: input.role })
        .eq("id", data.user.id)
        .select("id")
    if (erroPerfil || perfil?.length !== 1) {
        return { error: "Usuário criado no acesso, mas o papel não foi aplicado — ajuste o papel na lista." }
    }

    revalidatePath("/usuarios")
    return { ok: true }
}

export async function atualizarPapel(
    userId: string,
    role: "admin" | "gestor" | "analista" | "creator" | "pendente"
): Promise<{ ok?: true; error?: string }> {
    const me = await getAdmin()
    if (!me) return { error: "Acesso restrito a administradores." }
    if (semServiceKey()) {
        return { error: "Sem permissão (RLS) e a SUPABASE_SERVICE_ROLE_KEY não está configurada. Rode a migração 0003 no Supabase ou configure a secret key na Vercel." }
    }
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("somos_preta_profiles")
        .update({ role })
        .eq("id", userId)
        .select("id")
    if (error) return { error: error.message }
    if (!data?.length) return { error: "Usuário não encontrado — a lista pode estar desatualizada." }
    revalidatePath("/usuarios")
    return { ok: true }
}

export async function excluirUsuario(id: string): Promise<{ ok?: true; error?: string }> {
    const me = await getAdmin()
    if (!me) return { error: "Acesso restrito a administradores." }
    if (me.id === id) return { error: "Você não pode excluir a si mesmo." }
    if (semServiceKey()) return { error: "Configure a SUPABASE_SERVICE_ROLE_KEY (secret key) para excluir usuários." }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return { error: error.message }

    revalidatePath("/usuarios")
    return { ok: true }
}
