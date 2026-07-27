import { slugify } from "@/lib/slug"

// Recebe o client do Supabase (browser) e devolve o caminho da área do creator logado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function creatorAreaPath(supabase: any): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return "/criador/login"
    const { data } = await supabase
        .from("somos_preta_profiles")
        .select("nome")
        .eq("id", user.id)
        .single()
    return `/criador/midia-kit/${slugify(data?.nome ?? "")}`
}
