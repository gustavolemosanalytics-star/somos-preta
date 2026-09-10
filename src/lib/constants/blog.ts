/**
 * Categorias do blog — fonte única para o editor e para o site.
 *
 * O admin gravava categoria como texto livre, então "creators", "Creators " ou
 * "TESTE" entravam no banco e nunca casavam com o filtro do site, que compara
 * strings. Com a lista aqui, o editor escolhe e o filtro sempre encontra.
 */
export const BLOG_CATEGORIAS = [
    "Creators",
    "Marcas",
    "Campanhas",
    "Mercado",
    "Cultura",
    "Bastidores",
    "Norte e Nordeste",
] as const

export type BlogCategoria = (typeof BLOG_CATEGORIAS)[number]

/** A opção "Todos" só existe nos filtros do site, não como valor gravado. */
export const BLOG_FILTROS = ["Todos", ...BLOG_CATEGORIAS] as const
