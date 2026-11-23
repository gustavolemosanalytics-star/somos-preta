import { AtSign, Images, Instagram, MessageCircle, Music2, Palette, Rocket, Tag, Twitter, UserRound, Youtube } from "lucide-react"

/**
 * Vocabulário do Media Kit — o que o editor e a vitrine pública precisam
 * concordar para não se desencontrarem.
 *
 * Mora aqui porque as duas pontas leem o mesmo jsonb: o editor grava `redes`,
 * `portfolio` e `pacotes` e a página /kit/[slug] desenha a partir deles. Quando
 * o formato vivia solto dentro de cada arquivo, uma ponta mudava e a outra
 * parava de desenhar sem erro nenhum — a vitrine só ficava vazia.
 */

/** Uma rede social no jsonb `redes`, indexada pela chave da rede. */
export type RedeInfo = {
    handle: string
    followers?: number | null
    engagement_rate?: number | null
    /** true só quando os números vieram da nossa consulta, não digitados à mão. */
    verificado?: boolean
}

export type PortfolioItem = {
    /** Gerado no cliente. Serve de key estável e de alvo da reordenação. */
    id: string
    titulo: string
    imagem: string
    descricao: string
    link: string
}

export type Pacote = {
    id: string
    nome: string
    preco: string
    descricao: string
    itens: string[]
}

export const REDES_CONFIG = [
    { chave: "instagram", label: "Instagram", icone: Instagram, buscavel: true, dica: "O @ do seu perfil, sem o arroba." },
    { chave: "tiktok", label: "TikTok", icone: Music2, buscavel: false, dica: "Copie os números do seu painel do TikTok." },
    { chave: "youtube", label: "YouTube", icone: Youtube, buscavel: false, dica: "O @ do canal, do jeito que aparece na URL." },
    { chave: "twitter", label: "Twitter", icone: Twitter, buscavel: false, dica: "Se você não usa, pode deixar em branco." },
] as const

/**
 * As paletas que a vitrine sabe desenhar. Moram na coluna `tema`, que sempre
 * foi a escolha de cor do kit.
 *
 * Cada paleta é um conjunto fechado, e não uma cor solta, porque cor de
 * destaque boa para desenho raramente é boa para texto: o terracota #E07A5F dá
 * 2,76:1 sobre o off-white. Por isso existem papéis separados —
 *   `acento` / `acento2`  grafismo, gráfico, ornamento (pode ser vibrante)
 *   `leitura`             texto na cor da marca sobre o fundo (≥ 4,5:1)
 *   `botao` / `sobreBotao` o par do botão de contato (≥ 4,5:1)
 * Todos os pares de texto foram medidos contra WCAG AA em fundo e superfície.
 *
 * `teal` é chave de kits antigos (era pintada com uma cor de hover, ilegível)
 * e cai no coral, que é cor de marca de verdade.
 */
export type Paleta = {
    valor: string
    label: string
    descricao: string
    escuro: boolean
    fundo: string
    superficie: string
    tinta: string
    suave: string
    linha: string
    acento: string
    acento2: string
    leitura: string
    botao: string
    sobreBotao: string
}

export const PALETAS: Paleta[] = [
    {
        valor: "terracota", label: "Terracota", descricao: "Quente e acolhedor", escuro: false,
        fundo: "#FAF7F2", superficie: "#FFFFFF", tinta: "#1F1F1F", suave: "#6B625A", linha: "#E8DDD1",
        acento: "#E07A5F", acento2: "#F2B33D", leitura: "#B5401F", botao: "#C04625", sobreBotao: "#FFFFFF",
    },
    {
        valor: "coral", label: "Coral", descricao: "Vivo e direto", escuro: false,
        fundo: "#FFF5F0", superficie: "#FFFFFF", tinta: "#22160F", suave: "#6F5D54", linha: "#F3DDD3",
        acento: "#F26D4F", acento2: "#FFB4A2", leitura: "#B83A1E", botao: "#F26D4F", sobreBotao: "#22160F",
    },
    {
        valor: "oliva", label: "Verde-oliva", descricao: "Sóbrio e elegante", escuro: false,
        fundo: "#F3F1EA", superficie: "#FFFFFF", tinta: "#17241D", suave: "#5E6A62", linha: "#DCD8CB",
        acento: "#2F4F3E", acento2: "#A3B18A", leitura: "#2F4F3E", botao: "#2F4F3E", sobreBotao: "#FAF7F2",
    },
    {
        valor: "anil", label: "Anil", descricao: "Elétrico e moderno", escuro: false,
        fundo: "#F4F5FB", superficie: "#FFFFFF", tinta: "#12142B", suave: "#5A5E7A", linha: "#DFE2F2",
        acento: "#3A4BD6", acento2: "#8FA2FF", leitura: "#3A4BD6", botao: "#3A4BD6", sobreBotao: "#FFFFFF",
    },
    {
        valor: "orquidea", label: "Orquídea", descricao: "Ousado e afetivo", escuro: false,
        fundo: "#FBF3F7", superficie: "#FFFFFF", tinta: "#2A1020", suave: "#765466", linha: "#F0DCE6",
        acento: "#C2387F", acento2: "#F5A3C7", leitura: "#A62B6B", botao: "#A62B6B", sobreBotao: "#FFFFFF",
    },
    {
        valor: "grafite", label: "Grafite", descricao: "Minimalista", escuro: false,
        fundo: "#F5F4F1", superficie: "#FFFFFF", tinta: "#111111", suave: "#66625D", linha: "#E2DFD9",
        acento: "#111111", acento2: "#BDB6AC", leitura: "#111111", botao: "#111111", sobreBotao: "#FFFFFF",
    },
    {
        valor: "noite", label: "Noite", descricao: "Escuro com terracota", escuro: true,
        fundo: "#121110", superficie: "#1D1B19", tinta: "#F6F1EA", suave: "#A39A90", linha: "#2E2A26",
        acento: "#E07A5F", acento2: "#F2B33D", leitura: "#EE9A82", botao: "#E07A5F", sobreBotao: "#121110",
    },
    {
        valor: "ouro", label: "Ouro", descricao: "Escuro e luxuoso", escuro: true,
        fundo: "#0E0C08", superficie: "#1A1712", tinta: "#F7F0DF", suave: "#A89F8A", linha: "#2D281E",
        acento: "#D9A23C", acento2: "#8C5A1F", leitura: "#E5B95C", botao: "#D9A23C", sobreBotao: "#0E0C08",
    },
    {
        valor: "mangue", label: "Mangue", descricao: "Escuro e natural", escuro: true,
        fundo: "#0D1A15", superficie: "#142620", tinta: "#EAF4EE", suave: "#93AA9E", linha: "#213A31",
        acento: "#4FBF8A", acento2: "#C9E265", leitura: "#7FD8AC", botao: "#4FBF8A", sobreBotao: "#0D1A15",
    },
]

export function paletaDoTema(tema: string | null | undefined): Paleta {
    const chave = tema === "teal" ? "coral" : tema
    return PALETAS.find((p) => p.valor === chave) ?? PALETAS[0]
}

/* ------------------------------------------------------------------------- */
/* Personalização: o que a criadora escolhe além da cor                        */
/* ------------------------------------------------------------------------- */

export const FONTES = [
    { valor: "moderna", label: "Moderna", descricao: "Limpa e direta" },
    { valor: "editorial", label: "Editorial", descricao: "Serifa de revista" },
    { valor: "expressiva", label: "Expressiva", descricao: "Com personalidade" },
] as const

export const GRAFISMOS = [
    { valor: "aurora", label: "Aurora", descricao: "Luz difusa em movimento" },
    { valor: "aneis", label: "Anéis", descricao: "Órbitas concêntricas" },
    { valor: "grade", label: "Grade", descricao: "Linhas finas de estúdio" },
    { valor: "pontos", label: "Pontos", descricao: "Trama pontilhada" },
    { valor: "liso", label: "Liso", descricao: "Sem ornamento" },
] as const

export const ABERTURAS = [
    { valor: "retrato", label: "Retrato", descricao: "Sua foto grande ao lado do nome" },
    { valor: "capa", label: "Capa", descricao: "Imagem de capa no topo" },
    { valor: "central", label: "Central", descricao: "Tudo centralizado" },
] as const

export const SECOES = [
    { valor: "numeros", label: "Números", descricao: "Seguidores, alcance, engajamento e crescimento" },
    { valor: "audiencia", label: "Audiência", descricao: "Gênero, idade e cidades de quem te segue" },
    { valor: "destaques", label: "Destaques do Instagram", descricao: "Suas publicações de melhor resultado" },
    { valor: "portfolio", label: "Portfólio", descricao: "Trabalhos que você já fez" },
    { valor: "marcas", label: "Marcas", descricao: "Com quem você já trabalhou" },
    { valor: "pacotes", label: "Pacotes", descricao: "Como você cobra" },
] as const

export type ChaveFonte = (typeof FONTES)[number]["valor"]
export type ChaveGrafismo = (typeof GRAFISMOS)[number]["valor"]
export type ChaveAbertura = (typeof ABERTURAS)[number]["valor"]
export type ChaveSecao = (typeof SECOES)[number]["valor"]

export type Aparencia = {
    fonte: ChaveFonte
    grafismo: ChaveGrafismo
    abertura: ChaveAbertura
    /** A ordem do array é a ordem na página. */
    secoes: { chave: ChaveSecao; visivel: boolean }[]
}

/** O padrão de todo kit novo é o modelo Editorial com a paleta terracota. */
export const APARENCIA_PADRAO: Aparencia = {
    fonte: "editorial",
    grafismo: "aurora",
    abertura: "retrato",
    secoes: SECOES.map((s) => ({ chave: s.valor, visivel: true })),
}

/**
 * Lê o jsonb `aparencia` sem confiar nele.
 *
 * A coluna nasce `{}` em todo kit antigo, e um valor que deixou de existir
 * (uma tipografia aposentada, uma seção renomeada) não pode derrubar a página
 * pública — cai no padrão. Seções novas que o kit salvo não conhece entram no
 * fim, visíveis, para quem personalizou antes de elas existirem não as perder.
 */
export function lerAparencia(valor: unknown): Aparencia {
    const bruto = (valor && typeof valor === "object" ? valor : {}) as Record<string, unknown>
    const escolher = <T extends string>(lista: readonly { valor: T }[], v: unknown, padrao: T): T =>
        lista.some((o) => o.valor === v) ? (v as T) : padrao

    const vistas = new Set<string>()
    const secoes: Aparencia["secoes"] = []
    if (Array.isArray(bruto.secoes)) {
        for (const item of bruto.secoes) {
            const chave = (item as { chave?: unknown })?.chave
            if (typeof chave !== "string" || vistas.has(chave)) continue
            if (!SECOES.some((s) => s.valor === chave)) continue
            vistas.add(chave)
            secoes.push({ chave: chave as ChaveSecao, visivel: (item as { visivel?: unknown }).visivel !== false })
        }
    }
    for (const s of SECOES) {
        if (!vistas.has(s.valor)) secoes.push({ chave: s.valor, visivel: true })
    }

    return {
        fonte: escolher(FONTES, bruto.fonte, APARENCIA_PADRAO.fonte),
        grafismo: escolher(GRAFISMOS, bruto.grafismo, APARENCIA_PADRAO.grafismo),
        abertura: escolher(ABERTURAS, bruto.abertura, APARENCIA_PADRAO.abertura),
        secoes,
    }
}

export const MAX_CHAMADA = 90

/* ------------------------------------------------------------------------- */
/* Modelos: pontos de partida prontos                                          */
/* ------------------------------------------------------------------------- */

/**
 * Um modelo é uma combinação pronta de paleta, tipografia, grafismo, abertura
 * e ordem das seções. A criadora escolhe um na galeria e, se quiser, ajusta
 * peça por peça depois — o modelo é o começo, não uma gaiola.
 *
 * Não existe coluna "modelo" no banco: o modelo atual é DEDUZIDO das escolhas
 * (modeloAtual). Assim, mexer numa peça vira "Personalizado" sozinho, sem
 * estado duplicado para desencontrar.
 */
type Modelo = {
    valor: string
    label: string
    descricao: string
    tema: string
    fonte: ChaveFonte
    grafismo: ChaveGrafismo
    abertura: ChaveAbertura
    ordem: ChaveSecao[]
}

const ORDEM_NUMEROS: ChaveSecao[] = ["numeros", "audiencia", "destaques", "portfolio", "marcas", "pacotes"]
const ORDEM_TRABALHO: ChaveSecao[] = ["portfolio", "marcas", "numeros", "audiencia", "destaques", "pacotes"]
const ORDEM_CONTEUDO: ChaveSecao[] = ["destaques", "numeros", "audiencia", "portfolio", "marcas", "pacotes"]

export const MODELOS: Modelo[] = [
    { valor: "editorial", label: "Editorial", descricao: "Revista de moda, foto em destaque", tema: "terracota", fonte: "editorial", grafismo: "aurora", abertura: "retrato", ordem: ORDEM_NUMEROS },
    { valor: "noturno", label: "Noturno", descricao: "Escuro, ousado, centralizado", tema: "noite", fonte: "expressiva", grafismo: "aneis", abertura: "central", ordem: ORDEM_CONTEUDO },
    { valor: "luxo", label: "Luxo", descricao: "Preto e dourado, com capa", tema: "ouro", fonte: "editorial", grafismo: "grade", abertura: "capa", ordem: ORDEM_TRABALHO },
    { valor: "minimal", label: "Minimal", descricao: "Limpo, só o essencial", tema: "grafite", fonte: "moderna", grafismo: "liso", abertura: "retrato", ordem: ORDEM_NUMEROS },
    { valor: "vibrante", label: "Vibrante", descricao: "Cor forte e movimento", tema: "orquidea", fonte: "expressiva", grafismo: "aurora", abertura: "central", ordem: ORDEM_CONTEUDO },
    { valor: "eletrico", label: "Elétrico", descricao: "Azul, tech e direto", tema: "anil", fonte: "moderna", grafismo: "pontos", abertura: "retrato", ordem: ORDEM_NUMEROS },
    { valor: "raiz", label: "Raiz", descricao: "Verde profundo, natural", tema: "mangue", fonte: "editorial", grafismo: "pontos", abertura: "capa", ordem: ORDEM_TRABALHO },
    { valor: "verao", label: "Verão", descricao: "Coral, leve, com capa", tema: "coral", fonte: "expressiva", grafismo: "aneis", abertura: "capa", ordem: ORDEM_CONTEUDO },
    { valor: "classico", label: "Clássico", descricao: "Oliva sóbrio, centralizado", tema: "oliva", fonte: "editorial", grafismo: "grade", abertura: "central", ordem: ORDEM_TRABALHO },
]

/** Aplica um modelo mantendo o que a criadora desligou desligado. */
export function aplicarModelo(modelo: Modelo, atual: Aparencia): { tema: string; aparencia: Aparencia } {
    const visivel = new Map(atual.secoes.map((s) => [s.chave, s.visivel]))
    return {
        tema: modelo.tema,
        aparencia: {
            fonte: modelo.fonte,
            grafismo: modelo.grafismo,
            abertura: modelo.abertura,
            secoes: modelo.ordem.map((chave) => ({ chave, visivel: visivel.get(chave) ?? true })),
        },
    }
}

/** O modelo cujas escolhas batem com as atuais, ou null ("Personalizado"). */
export function modeloAtual(tema: string | null | undefined, aparencia: Aparencia): Modelo | null {
    const paleta = paletaDoTema(tema).valor
    const ordem = aparencia.secoes.map((s) => s.chave).join(",")
    return (
        MODELOS.find(
            (m) =>
                m.tema === paleta &&
                m.fonte === aparencia.fonte &&
                m.grafismo === aparencia.grafismo &&
                m.abertura === aparencia.abertura &&
                m.ordem.join(",") === ordem,
        ) ?? null
    )
}

/** Atalhos de nicho. É sugestão, não catálogo fechado: dá para escrever o seu. */
export const NICHOS_SUGERIDOS = [
    "Moda", "Beleza", "Lifestyle", "Gastronomia", "Viagem", "Maternidade",
    "Humor", "Dança", "Música", "Esporte", "Games", "Tecnologia",
    "Educação", "Finanças", "Saúde", "Bem-estar", "Cultura", "Ativismo",
]

/**
 * Tira o @ de qualquer forma que ele apareça — digitado, colado com arroba ou
 * dentro de uma URL de perfil.
 *
 * Existia um @ tratado de três jeitos diferentes na mesma tela: o botão de
 * buscar dados removia antes de consultar, o salvamento manual gravava cru, e
 * a vitrine removia de novo na hora de imprimir. O mesmo perfil ficava "maria"
 * ou "@maria" no banco dependendo de a criadora ter clicado no botão ou não.
 */
export function normalizarHandle(valor: string): string {
    const bruto = (valor ?? "").trim()
    if (!bruto) return ""

    // Colou o link do perfil? Pega só o usuário.
    const daUrl = bruto.match(/(?:instagram|tiktok|youtube|twitter|x)\.com\/(?:@)?([\w.-]+)/i)
    const alvo = daUrl ? daUrl[1] : bruto

    return alvo
        .split(/[?#/]/)[0]
        .replace(/[@\s]/g, "")
        .slice(0, 30)
}

/** Só os dígitos, do jeito que o wa.me/ espera. */
export function digitosDoWhatsapp(valor: string): string {
    return (valor ?? "").replace(/\D/g, "")
}

/**
 * Guarda sempre com o 55 na frente, porque é assim que a vitrine monta o
 * `wa.me/` — sem o DDI o link abre uma conversa com o número errado.
 */
export function whatsappParaBanco(valor: string): string | null {
    const digitos = digitosDoWhatsapp(valor)
    if (!digitos) return null
    if (digitos.length <= 11) return `55${digitos}`
    return digitos
}

/** Desenha (71) 98888-7777 a partir do que estiver salvo, com ou sem DDI. */
export function formatarWhatsapp(valor: string | null | undefined): string {
    const digitos = digitosDoWhatsapp(valor ?? "")
    if (!digitos) return ""

    const nacional = digitos.startsWith("55") && digitos.length > 11 ? digitos.slice(2) : digitos
    const ddd = nacional.slice(0, 2)
    const resto = nacional.slice(2)

    if (!resto) return ddd
    if (resto.length <= 4) return `(${ddd}) ${resto}`
    if (resto.length <= 8) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`
    return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5, 9)}`
}

/** Um número brasileiro tem 10 (fixo) ou 11 (celular) dígitos, sem o DDI. */
export function whatsappValido(valor: string | null | undefined): boolean {
    const digitos = digitosDoWhatsapp(valor ?? "")
    const nacional = digitos.startsWith("55") && digitos.length > 11 ? digitos.slice(2) : digitos
    return nacional.length === 10 || nacional.length === 11
}

/**
 * Quem digita "instagram.com/p/xyz" — o jeito natural de escrever — grava um
 * valor sem esquema. Como ele vai direto num href, o navegador resolve como
 * caminho relativo e o "Ver mais" da vitrine leva para somospreta.com/instagram.com/...
 */
export function normalizarLink(valor: string): string {
    const bruto = (valor ?? "").trim()
    if (!bruto) return ""
    const comEsquema = /^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`
    try {
        return new URL(comEsquema).toString()
    } catch {
        return bruto
    }
}

/** Dados mínimos para julgar se uma etapa está pronta. */
type KitAvaliavel = {
    publicado?: boolean | null
    nome?: string | null
    bio?: string | null
    avatar_url?: string | null
    cover_url?: string | null
    cidade?: string | null
    estado?: string | null
    whatsapp?: string | null
    nichos?: string[] | null
    redes?: Record<string, RedeInfo | undefined> | null
    portfolio?: PortfolioItem[] | null
    pacotes?: Pacote[] | null
}

export type ChaveEtapa = "identidade" | "contato" | "redes" | "portfolio" | "pacotes" | "tema" | "publicar"

/**
 * Fonte única do progresso: a trilha, a barra, a lista de prontidão e o botão
 * de publicar leem todos daqui. Dois lugares calculando "está pronto?" sempre
 * acabam discordando em algum caso de borda.
 */
export const ETAPAS: {
    chave: ChaveEtapa
    numero: string
    titulo: string
    chamada: string
    icone: typeof UserRound
    pronta: (k: KitAvaliavel) => boolean
}[] = [
    {
        chave: "identidade",
        numero: "01",
        titulo: "Identidade",
        chamada: "Quem você é",
        icone: UserRound,
        pronta: (k) => Boolean(k.nome?.trim() && k.bio?.trim() && k.avatar_url),
    },
    {
        chave: "contato",
        numero: "02",
        titulo: "Contato",
        chamada: "Como a marca te chama",
        icone: MessageCircle,
        pronta: (k) => whatsappValido(k.whatsapp),
    },
    {
        chave: "redes",
        numero: "03",
        titulo: "Redes",
        chamada: "Seus números",
        icone: AtSign,
        pronta: (k) => Object.values(k.redes ?? {}).some((r) => Boolean(r?.handle)),
    },
    {
        chave: "portfolio",
        numero: "04",
        titulo: "Portfólio",
        chamada: "O que você já fez",
        icone: Images,
        pronta: (k) => (k.portfolio ?? []).length > 0,
    },
    {
        chave: "pacotes",
        numero: "05",
        titulo: "Pacotes",
        chamada: "Como você trabalha",
        icone: Tag,
        pronta: (k) => (k.pacotes ?? []).length > 0,
    },
    {
        chave: "tema",
        numero: "06",
        titulo: "Visual",
        chamada: "A cara da sua página",
        icone: Palette,
        // Todo kit nasce com uma paleta e uma aparência padrão, então esta etapa
        // já começa pronta: ela existe para ser visitada, não para ser cobrada.
        // A chave segue "tema" para não quebrar links ?etapa=tema já enviados.
        pronta: () => true,
    },
    {
        chave: "publicar",
        numero: "07",
        titulo: "Publicar",
        chamada: "Seu link no mundo",
        icone: Rocket,
        // Só conta como concluída quando o kit está mesmo no ar: marcar o
        // check aqui num rascunho seria dizer que o trabalho acabou quando
        // ninguém consegue abrir o link ainda.
        pronta: (k) => Boolean(k.publicado),
    },
]

/**
 * O que a marca precisa encontrar para o kit funcionar, e o que só deixa
 * melhor. A separação importa: publicar sem WhatsApp é publicar uma rua sem
 * saída, enquanto publicar sem capa é só um kit mais simples.
 */
export const ESSENCIAIS: { rotulo: string; etapa: ChaveEtapa; ok: (k: KitAvaliavel) => boolean }[] = [
    { rotulo: "Foto de perfil", etapa: "identidade", ok: (k) => Boolean(k.avatar_url) },
    { rotulo: "Seu nome", etapa: "identidade", ok: (k) => Boolean(k.nome?.trim()) },
    { rotulo: "Uma frase sobre você", etapa: "identidade", ok: (k) => Boolean(k.bio?.trim()) },
    { rotulo: "WhatsApp para contato", etapa: "contato", ok: (k) => whatsappValido(k.whatsapp) },
    { rotulo: "Pelo menos uma rede", etapa: "redes", ok: (k) => Object.values(k.redes ?? {}).some((r) => Boolean(r?.handle)) },
]

export const RECOMENDADOS: { rotulo: string; etapa: ChaveEtapa; ok: (k: KitAvaliavel) => boolean }[] = [
    { rotulo: "Imagem de capa", etapa: "identidade", ok: (k) => Boolean(k.cover_url) },
    { rotulo: "Cidade e estado", etapa: "identidade", ok: (k) => Boolean(k.cidade?.trim() && k.estado?.trim()) },
    { rotulo: "Pelo menos um nicho", etapa: "identidade", ok: (k) => (k.nichos ?? []).length > 0 },
    { rotulo: "Um trabalho no portfólio", etapa: "portfolio", ok: (k) => (k.portfolio ?? []).length > 0 },
    { rotulo: "Um pacote com preço", etapa: "pacotes", ok: (k) => (k.pacotes ?? []).length > 0 },
]

/** Percentual de prontidão: essenciais e recomendados pesam igual. */
export function percentualPronto(kit: KitAvaliavel): number {
    const todos = [...ESSENCIAIS, ...RECOMENDADOS]
    const prontos = todos.filter((item) => item.ok(kit)).length
    return Math.round((prontos / todos.length) * 100)
}
