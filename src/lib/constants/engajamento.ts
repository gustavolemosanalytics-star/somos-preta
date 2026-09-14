/**
 * Faixas de taxa de engajamento no Instagram.
 *
 * Os limites seguem as referências usuais de mercado para perfis de creator.
 * São uma régua de leitura, não uma medição: por isso a tela mostra a faixa
 * ("Bom") e não uma comparação inventada com outros perfis.
 */
export const FAIXAS_ENGAJAMENTO = [
    { nome: "Muito baixo", ate: 0.5 },
    { nome: "Baixo", ate: 1 },
    { nome: "Médio", ate: 3 },
    { nome: "Bom", ate: 6 },
    { nome: "Excelente", ate: Infinity },
] as const

export type FaixaEngajamento = (typeof FAIXAS_ENGAJAMENTO)[number]["nome"]

export function faixaDaTaxa(taxa: number | null): FaixaEngajamento | null {
    if (taxa == null) return null
    return FAIXAS_ENGAJAMENTO.find((f) => taxa <= f.ate)!.nome
}

/** Texto de leitura para cada faixa, exibido no card de diagnóstico. */
export const LEITURA_POR_FAIXA: Record<FaixaEngajamento, string> = {
    "Muito baixo":
        "A taxa está abaixo do que se espera para perfis de creator. Pode indicar audiência pouco ativa ou crescimento recente de seguidores.",
    Baixo: "A taxa está abaixo da média de creators deste porte. Vale olhar a consistência das publicações e o formato do conteúdo.",
    Médio: "A taxa está dentro da média de creators deste porte, com interações regulares.",
    Bom: "Taxa de engajamento saudável para creators deste porte, com boa consistência nas interações e sinais de uma audiência ativa.",
    Excelente:
        "Taxa bem acima da média para creators deste porte — sinal de uma audiência muito engajada com o conteúdo.",
}
