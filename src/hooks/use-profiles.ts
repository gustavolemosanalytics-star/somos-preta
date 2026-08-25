"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/db/types"

export function useProfiles() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        supabase
            .from("somos_preta_profiles")
            .select("id, nome, email, avatar_url, role, created_at, updated_at")
            .order("nome")
            .then(({ data }) => {
                setProfiles((data as Profile[]) ?? [])
                setLoading(false)
            })
    }, [])

    return { profiles, loading }
}
