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
    role: "admin" | "gestor" | "analista" | "creator"
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

    // Ajusta nome/papel do perfil criado pelo trigger.
    await admin
        .from("somos_preta_profiles")
        .update({ nome: input.nome, role: input.role })
        .eq("id", data.user.id)

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
