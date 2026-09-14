import { redirect } from "next/navigation"
import { getProfile } from "@/lib/supabase/auth"
import { UsuariosClient } from "./usuarios-client"

export default async function UsuariosPage() {
    const profile = await getProfile()
    if (!profile) redirect("/login")
    // Tela exclusiva de administradores
    if (profile.role !== "admin") redirect("/dashboard")

    return <UsuariosClient meId={profile.id} />
}
