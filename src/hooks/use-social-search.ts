"use client"

import { useQuery } from "@tanstack/react-query"
import type { InstagramProfile } from "@/app/api/instagram/route"
import type { TikTokProfile } from "@/app/api/tiktok/route"

async function fetchInstagramProfile(username: string): Promise<InstagramProfile> {
    const res = await fetch(`/api/instagram?username=${encodeURIComponent(username)}`)
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(error.error || "Erro ao buscar perfil")
    }
    return res.json()
}

async function fetchTikTokProfile(username: string): Promise<TikTokProfile> {
    const res = await fetch(`/api/tiktok?username=${encodeURIComponent(username)}`)
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(error.error || "Erro ao buscar perfil")
    }
    return res.json()
}

export function useInstagramSearch(query: string) {
    const isSearch = query.startsWith("@") && query.length >= 3
    const username = isSearch ? query.slice(1) : ""

    return useQuery<InstagramProfile, Error>({
        queryKey: ["instagram-profile", username],
        queryFn: () => fetchInstagramProfile(username),
        enabled: isSearch,
        staleTime: 1000 * 60 * 60,
        retry: false,
    })
}

export function useTikTokSearch(query: string) {
    const isSearch = query.startsWith("@") && query.length >= 3
    const username = isSearch ? query.slice(1) : ""

    return useQuery<TikTokProfile, Error>({
        queryKey: ["tiktok-profile", username],
        queryFn: () => fetchTikTokProfile(username),
        enabled: isSearch,
        staleTime: 1000 * 60 * 60,
        retry: false,
    })
}
