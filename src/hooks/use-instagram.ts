"use client"

import { useQuery } from "@tanstack/react-query"
import type { InstagramProfile } from "@/app/api/instagram/route"

async function fetchInstagramProfile(username: string): Promise<InstagramProfile> {
    const res = await fetch(`/api/instagram?username=${encodeURIComponent(username)}`)
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(error.error || "Erro ao buscar perfil")
    }
    return res.json()
}

export function useInstagramSearch(query: string) {
    // Only trigger when query starts with @ and has at least 2 chars after it
    const isInstagramSearch = query.startsWith("@") && query.length >= 3
    const username = isInstagramSearch ? query.slice(1) : ""

    return useQuery<InstagramProfile, Error>({
        queryKey: ["instagram-profile", username],
        queryFn: () => fetchInstagramProfile(username),
        enabled: isInstagramSearch,
        staleTime: 1000 * 60 * 60, // 1 hour
        retry: false,
    })
}
