/**
 * Segmentos de negócio padronizados para a base de clientes (marcas/contas
 * atendidas por uma agência de marketing de influência). A opção "Outro"
 * deve ser sempre a última: ao ser selecionada, o formulário revela um
 * campo de texto livre e o valor digitado ali é salvo em `segmento`
 * (nunca o literal "Outro").
 */
export const SEGMENTOS = [
    "Moda",
    "Beleza e Cosméticos",
    "Alimentação e Bebidas",
    "Varejo",
    "Educação",
    "Saúde e Bem-estar",
    "Tecnologia",
    "Finanças",
    "Turismo e Hospitalidade",
    "Entretenimento",
    "Automotivo",
    "Imóveis",
    "Esporte",
    "Serviços",
    "Outro",
] as const

export type Segmento = (typeof SEGMENTOS)[number]

export const SEGMENTO_OUTRO: Segmento = "Outro"
