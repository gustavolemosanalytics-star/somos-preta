import {
    BarChart3, Building2, ClipboardList, FileText, LayoutDashboard, Megaphone,
    MessageSquare, Newspaper, Settings2, ShieldCheck, Users, type LucideIcon,
} from "lucide-react"

/**
 * Navegação do painel — fonte única para a barra lateral e para o breadcrumb.
 *
 * O mapa vivia dentro de app-sidebar.tsx, e o breadcrumb do layout era texto
 * fixo ("Dashboard / Visão Geral") em todas as telas. Com a lista aqui, os dois
 * leem do mesmo lugar e não voltam a divergir.
 *
 * Hierarquia principal: Cliente > Campanhas > Tarefas.
 */
export type ItemNav = {
    title: string
    url: string
    icon: LucideIcon
    /** Segundo nível do breadcrumb: o que a tela mostra dentro da seção. */
    sub: string
}

export const NAV_PLATAFORMA: ItemNav[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, sub: "Visão geral" },
    { title: "Clientes", url: "/clientes", icon: Building2, sub: "Todos os clientes" },
    { title: "Campanhas", url: "/campanhas", icon: Megaphone, sub: "Todas as campanhas" },
    { title: "Tarefas", url: "/tarefas", icon: ClipboardList, sub: "Quadro" },
    { title: "Criadores", url: "/criadores", icon: Users, sub: "Base" },
    { title: "Contratos", url: "/contratos", icon: FileText, sub: "Todos os contratos" },
    { title: "Mensagens", url: "/mensagens", icon: MessageSquare, sub: "Caixa de entrada" },
    { title: "Blog", url: "/blog", icon: Newspaper, sub: "Publicações" },
    { title: "Relatórios", url: "/relatorios", icon: BarChart3, sub: "Visão geral" },
    { title: "Configurações", url: "/configuracoes", icon: Settings2, sub: "Perfil e áreas" },
]

/** Só admins enxergam. */
export const NAV_ADMIN: ItemNav = {
    title: "Usuários", url: "/usuarios", icon: ShieldCheck, sub: "Acessos",
}

const TODOS = [...NAV_PLATAFORMA, NAV_ADMIN]

/**
 * URL pública correspondente ao caminho que o Next enxerga.
 *
 * As rotas do painel moram em src/app/app/(painel)/ — a pasta precisa do
 * prefixo porque /blog do painel colidiria com o /blog do site — mas quem
 * navega vê /blog, /clientes, /tarefas. No subdomínio o middleware já entrega
 * o caminho limpo; em acesso direto a /app/... esta função o normaliza, para os
 * dois casos casarem com a mesma lista de rotas.
 */
export function rotaLimpa(pathname: string) {
    if (pathname === "/app") return "/dashboard"
    if (pathname.startsWith("/app/")) return pathname.slice(4)
    return pathname
}

/**
 * Trilha do breadcrumb a partir da rota.
 *
 * Rotas de detalhe (/app/clientes/<uuid>) não têm o nome do registro no
 * pathname, então o segundo nível vira "Detalhe" — melhor do que exibir um id.
 */
export function trilhaDoPainel(caminho: string) {
    const pathname = rotaLimpa(caminho)
    const item = TODOS.find((i) => pathname === i.url || pathname.startsWith(`${i.url}/`))
    if (!item) return null
    return {
        secao: { title: item.title, url: item.url },
        pagina: pathname === item.url ? item.sub : "Detalhe",
    }
}
