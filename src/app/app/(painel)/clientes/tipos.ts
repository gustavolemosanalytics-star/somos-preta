import type { Campanha, Cliente, Tarefa } from "@/lib/db/types"

/** Responsável resolvido pelo join com somos_preta_profiles. */
export type ResponsavelResumo = {
    id: string
    nome: string | null
    email: string | null
    avatar_url: string | null
    cargo: string | null
}

export type ClienteDaLista = Cliente & {
    responsavel: ResponsavelResumo | null
}

/** Só o que a tela usa das campanhas — o briefing inteiro não vem. */
export type CampanhaResumo = Pick<
    Campanha,
    "id" | "nome" | "cliente_id" | "status" | "capa_url" | "data_inicio" | "data_fim"
>

export type TarefaResumo = Pick<
    Tarefa,
    "id" | "titulo" | "campanha_id" | "status" | "data_entrega" | "horario"
>

/** Última linha do feed para um cliente, usada na coluna "Última atividade". */
export type UltimaAtividade = { resumo: string; created_at: string }

export const ORDENAVEIS = [
    "nome", "segmento", "local", "campanhas", "responsavel", "atividade", "status",
] as const

export type ColunaOrdenavel = (typeof ORDENAVEIS)[number]

export type Ordenacao = { coluna: ColunaOrdenavel; direcao: "asc" | "desc" }
