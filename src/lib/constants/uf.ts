export type Regiao = "N" | "NE" | "CO" | "SE" | "S"

export type UF = {
    sigla: string
    nome: string
    regiao: Regiao
}

/**
 * Regiões, para o seletor do dashboard.
 *
 * "Norte / Nordeste" é o recorte de atuação da PRETA e por isso vem primeiro —
 * o resto do país existe na lista, mas não é o foco.
 */
export const REGIOES: { valor: string; label: string; ufs: Regiao[] }[] = [
    { valor: "norte-nordeste", label: "Norte / Nordeste", ufs: ["N", "NE"] },
    { valor: "todas", label: "Todo o Brasil", ufs: ["N", "NE", "CO", "SE", "S"] },
    { valor: "nordeste", label: "Nordeste", ufs: ["NE"] },
    { valor: "norte", label: "Norte", ufs: ["N"] },
]

/**
 * As 27 unidades federativas do Brasil (26 estados + Distrito Federal),
 * ordenadas alfabeticamente pelo nome. `sigla` é o valor de 2 letras
 * armazenado no banco (mesmo formato usado em `somos_preta_influencers.estado`).
 */
export const UFS: UF[] = [
    { sigla: "AC", nome: "Acre", regiao: "N" },
    { sigla: "AL", nome: "Alagoas", regiao: "NE" },
    { sigla: "AP", nome: "Amapá", regiao: "N" },
    { sigla: "AM", nome: "Amazonas", regiao: "N" },
    { sigla: "BA", nome: "Bahia", regiao: "NE" },
    { sigla: "CE", nome: "Ceará", regiao: "NE" },
    { sigla: "DF", nome: "Distrito Federal", regiao: "CO" },
    { sigla: "ES", nome: "Espírito Santo", regiao: "SE" },
    { sigla: "GO", nome: "Goiás", regiao: "CO" },
    { sigla: "MA", nome: "Maranhão", regiao: "NE" },
    { sigla: "MT", nome: "Mato Grosso", regiao: "CO" },
    { sigla: "MS", nome: "Mato Grosso do Sul", regiao: "CO" },
    { sigla: "MG", nome: "Minas Gerais", regiao: "SE" },
    { sigla: "PA", nome: "Pará", regiao: "N" },
    { sigla: "PB", nome: "Paraíba", regiao: "NE" },
    { sigla: "PR", nome: "Paraná", regiao: "S" },
    { sigla: "PE", nome: "Pernambuco", regiao: "NE" },
    { sigla: "PI", nome: "Piauí", regiao: "NE" },
    { sigla: "RJ", nome: "Rio de Janeiro", regiao: "SE" },
    { sigla: "RN", nome: "Rio Grande do Norte", regiao: "NE" },
    { sigla: "RS", nome: "Rio Grande do Sul", regiao: "S" },
    { sigla: "RO", nome: "Rondônia", regiao: "N" },
    { sigla: "RR", nome: "Roraima", regiao: "N" },
    { sigla: "SC", nome: "Santa Catarina", regiao: "S" },
    { sigla: "SP", nome: "São Paulo", regiao: "SE" },
    { sigla: "SE", nome: "Sergipe", regiao: "NE" },
    { sigla: "TO", nome: "Tocantins", regiao: "N" },
]
