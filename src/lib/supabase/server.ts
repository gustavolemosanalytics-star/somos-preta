import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Cliente Supabase para Server Components, Route Handlers e Server Actions.
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Chamado de um Server Component — pode ser ignorado
                        // se houver middleware atualizando a sessão.
                    }
                },
            },
        }
    )
}

// Cliente com privilégio de service_role (bypassa RLS). Use SOMENTE no servidor,
// para operações administrativas (ex.: gravar creator conectado via OAuth).
export function createAdminClient() {
    const { createClient: createSbClient } = require("@supabase/supabase-js")
    return createSbClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}
