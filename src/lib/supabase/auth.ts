import { createClient } from "./server"

export type Profile = {
    id: string
    nome: string | null
    email: string | null
    avatar_url: string | null
    role: "admin" | "gestor" | "analista" | "creator"
}

const STAFF_ROLES = ["admin", "gestor", "analista"]

// Usuário autenticado (ou null). Use em Server Components / Route Handlers.
export async function getSessionUser() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    return user
}

// Perfil do usuário atual, incluindo o papel (role).
export async function getProfile(): Promise<Profile | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from("somos_preta_profiles")
        .select("id, nome, email, avatar_url, role")
        .eq("id", user.id)
        .single()

    return (data as Profile) ?? null
}

export async function isStaff(): Promise<boolean> {
    const profile = await getProfile()
    return !!profile && STAFF_ROLES.includes(profile.role)
}
