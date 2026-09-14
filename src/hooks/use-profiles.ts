"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/db/types"

/**
 * Perfis da equipe, para os seletores de responsável e solicitante.
 *
 * `erro` existe separado de "lista vazia" de propósito: quando a leitura
 * falhava, os seletores ficavam vazios e o campo aparecia em branco, como se a
 * empresa não tivesse ninguém cadastrado. Quem consome decide o que dizer.
 *
 * O estado é escrito dentro do `.then`, e não depois de um `await` no corpo do
 * efeito: setState alcançável de forma síncrona a partir do efeito dispara
 * renderização em cascata.
 */
export function useProfiles() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState(false)

    useEffect(() => {
        createClient()
            .from("somos_preta_profiles")
            .select("id, nome, email, avatar_url, role, cargo, created_at, updated_at")
            .order("nome")
            .then(({ data, error }) => {
                if (error) {
                    setErro(true)
                    setLoading(false)
                    return
                }
                setErro(false)
                setProfiles((data as Profile[]) ?? [])
                setLoading(false)
            })
    }, [])

    return { profiles, loading, erro }
}
