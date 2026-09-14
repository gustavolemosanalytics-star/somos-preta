import type { BlogStatus } from "@/lib/db/types"

/**
 * Categorias de partida do blog.
 *
 * O catálogo de verdade agora é a tabela somos_preta_blog_categorias, editável
 * pela tela de publicações (0018_blog_editorial.sql semeia exatamente esta
 * lista). Estas constantes continuam aqui como rede de segurança: se a consulta
 * falhar ou o schema ainda não tiver sido aplicado, o site e o editor mostram
 * algo em vez de uma lista vazia.
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

/** A opção "Todos" só existe nos filtros do site, não como valor gravado. */
export const BLOG_FILTROS = ["Todos", ...BLOG_CATEGORIAS] as const

// ----------------------------------------------------------------------------
// Status
// ----------------------------------------------------------------------------

/** Ordem do funil editorial — usada nas pílulas de filtro e no menu de status. */
export const BLOG_STATUS_ORDEM: BlogStatus[] = [
    "rascunho", "em_revisao", "agendado", "publicado", "despublicado", "arquivado",
]

export const BLOG_STATUS: Record<BlogStatus, { label: string; className: string }> = {
    rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
    em_revisao: { label: "Em revisão", className: "bg-status-info/12 text-status-info" },
    agendado: { label: "Agendado", className: "bg-status-atencao/12 text-status-atencao" },
    publicado: { label: "Publicado", className: "bg-status-sucesso/12 text-status-sucesso" },
    despublicado: { label: "Despublicado", className: "bg-transparent text-muted-foreground border-border" },
    arquivado: { label: "Arquivado", className: "bg-transparent text-status-erro border-status-erro/40" },
}

/** Só estes aparecem no site; o resto é bastidor da redação. */
export const BLOG_STATUS_PUBLICOS: BlogStatus[] = ["publicado"]

// ----------------------------------------------------------------------------
// Cores das categorias
// ----------------------------------------------------------------------------

/**
 * A categoria guarda o NOME do token (não um hex) para a etiqueta acompanhar a
 * paleta em qualquer tema. As classes precisam estar escritas por extenso aqui:
 * o Tailwind varre o código-fonte e não enxerga classe montada por concatenação.
 */
export const BLOG_CORES = [
    { valor: "terracota", label: "Terracota", className: "bg-primary/12 text-primary" },
    { valor: "sucesso", label: "Verde", className: "bg-status-sucesso/12 text-status-sucesso" },
    { valor: "info", label: "Azul", className: "bg-status-info/12 text-status-info" },
    { valor: "atencao", label: "Âmbar", className: "bg-status-atencao/12 text-status-atencao" },
    { valor: "erro", label: "Vinho", className: "bg-status-erro/12 text-status-erro" },
    { valor: "progresso", label: "Coral", className: "bg-status-progresso/12 text-status-progresso" },
    { valor: "neutro", label: "Neutro", className: "bg-muted text-muted-foreground" },
] as const

export type BlogCor = (typeof BLOG_CORES)[number]["valor"]

const COR_PADRAO = "bg-muted text-muted-foreground"

/** Classes da etiqueta a partir do token gravado na categoria. */
export function classeDaCor(cor: string | null | undefined) {
    return BLOG_CORES.find((c) => c.valor === cor)?.className ?? COR_PADRAO
}

// ----------------------------------------------------------------------------
// Datas
// ----------------------------------------------------------------------------

// Formatação manual em vez de toLocaleDateString: o ICU do Node devolve
// "06 de set. de 2026" para pt-BR, e a tabela precisa da forma curta "06 set 2026".
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

function mesmaData(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
}

export function dataCurta(iso: string) {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function hora(iso: string) {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

/**
 * Data em duas linhas, como a tabela mostra: "06 set 2026" / "14:30".
 * Edições recentes viram "Hoje" e "Ontem" — quem acabou de mexer num post quer
 * reconhecê-lo de relance, não converter uma data na cabeça.
 */
export function dataEmDuasLinhas(iso: string | null, relativa = false) {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null

    if (relativa) {
        const hoje = new Date()
        const ontem = new Date(hoje)
        ontem.setDate(hoje.getDate() - 1)
        if (mesmaData(d, hoje)) return { data: "Hoje", hora: hora(iso) }
        if (mesmaData(d, ontem)) return { data: "Ontem", hora: hora(iso) }
    }

    return { data: dataCurta(iso), hora: hora(iso) }
}

/** ISO → valor aceito por <input type="datetime-local">, no fuso do navegador. */
export function paraDatetimeLocal(iso: string | null) {
    if (!iso) return ""
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ----------------------------------------------------------------------------
// Período
// ----------------------------------------------------------------------------

export const BLOG_PERIODOS = [
    { value: "todos", label: "Todo o período" },
    { value: "7", label: "Últimos 7 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "90", label: "Últimos 90 dias" },
    { value: "365", label: "Últimos 12 meses" },
] as const

export type BlogPeriodo = (typeof BLOG_PERIODOS)[number]["value"]
