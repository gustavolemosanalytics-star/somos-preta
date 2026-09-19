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
 * As cores que a vitrine sabe desenhar. Inventar uma quarta não quebra nada
 * visivelmente — só cai no terracota em silêncio, que é pior que quebrar.
 *
 * O terceiro tema era `teal`, que a vitrine pintava com `text-accent` — e
 * `--accent` é #F1EAE1, superfície de hover, não cor de texto: o título saía
 * branco sobre off-white, ilegível. Nunca houve teal na identidade. O tema
 * virou coral (cor real da marca) e `teal` segue aceito como chave antiga de
 * kits já salvos, desenhada como coral.
 */
export const TEMAS = [
    { valor: "terracota", label: "Terracota", amostra: "#E07A5F", descricao: "Quente e acolhedor" },
    { valor: "oliva", label: "Verde-oliva", amostra: "#2F4F3E", descricao: "Sóbrio e elegante" },
    { valor: "coral", label: "Coral", amostra: "#F26D4F", descricao: "Vivo e direto" },
] as const

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
        titulo: "Tema",
        chamada: "A cara da sua página",
        icone: Palette,
        // Todo kit nasce com tema terracota, então esta etapa já começa pronta:
        // ela existe para ser visitada, não para ser cobrada.
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
