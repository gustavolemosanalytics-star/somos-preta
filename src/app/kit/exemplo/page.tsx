import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { KitVitrine, type DadosVitrine } from "@/components/public/kit-vitrine"

/**
 * Exemplo de Media Kit — o destino do botão "Ver exemplo" da landing.
 *
 * Antes esse botão apontava para /kit/exemplo esperando encontrar um kit de
 * slug "exemplo" no banco. Nunca existiu: a página caía direto no "Media Kit
 * não encontrado". Em vez de cadastrar um criador de mentira na base — que
 * dispararia o gatilho de sincronia e sujaria a lista de criadores da equipe —
 * o exemplo mora aqui, como página estática.
 *
 * O segmento fixo "exemplo" tem precedência sobre o dinâmico [slug] no roteador
 * do Next, então esta página responde sem tocar no banco e sem risco de alguém
 * publicar um kit com esse endereço e sequestrar a vitrine.
 *
 * A pessoa é fictícia de propósito e a faixa do topo diz isso em voz alta: uma
 * página que se parece com o kit de alguém real, sem ser, é o tipo de coisa que
 * a gente não publica.
 */

const EXEMPLO: DadosVitrine = {
    nome: "Dandara Nunes",
    bio:
        "Crio sobre beleza e autoestima para mulheres pretas de 25 a 40 anos, de Salvador para o Brasil. " +
        "Faço review honesto de produto, tutorial de cabelo cacheado e conversa sobre representatividade.",
    cidade: "Salvador",
    estado: "BA",
    nichos: ["Beleza", "Lifestyle", "Cultura"],
    tema: "terracota",
    chamada: "Beleza real, de Salvador para o Brasil.",
    aparencia: { fonte: "editorial", grafismo: "aurora", abertura: "retrato" },
    // Marcas inventadas: num kit fictício, nome de empresa real seria uma
    // parceria que nunca existiu.
    marcas: ["Casa Dendê", "Maré Beauty", "Raiz Hair", "Ilê Moda", "Aurora Cosméticos", "Banzo Café"],
    avatar_url: "/media-kit/perfil.webp",
    cover_url: "/hero/paisagem-falesias.webp",
    // Sem WhatsApp de propósito: um botão de contato num exemplo abriria uma
    // conversa com número inventado. O convite do topo faz esse papel.
    whatsapp: null,
    redes: {
        instagram: { handle: "dandaranunes", followers: 128400, engagement_rate: 4.8, verificado: true },
        tiktok: { handle: "dandaranunes", followers: 74300, engagement_rate: 6.2 },
        youtube: { handle: "dandaranunes", followers: 21500, engagement_rate: 3.1 },
    },
    portfolio: [
        {
            titulo: "Campanha de verão — marca de cosméticos",
            imagem: "/media-kit/territorio-salvador.webp",
            descricao: "3 Reels e 1 carrossel sobre cuidado com cacho no calor. 180 mil visualizações somadas.",
            link: "",
        },
        {
            titulo: "Série Trança é território",
            imagem: "/media-kit/territorio-sao-luis.webp",
            descricao: "Cinco vídeos sobre penteados afro e o que cada um conta da história de quem usa.",
            link: "",
        },
        {
            titulo: "Live de lançamento — linha de hidratação",
            imagem: "/media-kit/territorio-manaus.webp",
            descricao: "1 hora ao vivo com a marca, 4,2 mil espectadores únicos e 900 comentários.",
            link: "",
        },
    ],
    pacotes: [
        {
            nome: "Combo Reels + Stories",
            preco: "R$ 1.800",
            descricao: "Para marcas que querem alcance rápido em lançamento.",
            itens: ["1 Reels no feed", "3 Stories com link", "1 rodada de ajuste"],
        },
        {
            nome: "Review completo",
            preco: "R$ 3.200",
            descricao: "Teste de verdade, com antes e depois ao longo de duas semanas.",
            itens: ["1 vídeo de review no YouTube", "1 Reels de corte", "5 Stories de acompanhamento"],
        },
        {
            nome: "Presença em evento",
            preco: "Sob consulta",
            descricao: "Cobertura ao vivo, com deslocamento combinado à parte.",
            itens: ["Cobertura em Stories", "1 Reels pós-evento", "Fotos liberadas para a marca"],
        },
    ],
}

/**
 * Métricas fictícias no formato exato que a coleta grava quando a criadora
 * conecta o Instagram, para o exemplo mostrar números e audiência completos.
 * Sem destaques: as capas de publicação seriam imagens de alguém real.
 */
function historicoFicticio() {
    const hoje = new Date()
    return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(hoje.getTime() - (29 - i) * 86_400_000)
        // Crescimento constante com uma oscilação pequena: o desenho de uma
        // conta saudável, sem fingir precisão.
        const seguidores = Math.round(121_900 + i * 220 + Math.sin(i / 2.5) * 260)
        return { data: d.toISOString().slice(0, 10), seguidores }
    })
}

const historico = historicoFicticio()

const alcanceDiario = historico.map((p, i) => ({
    data: p.data,
    alcance: Math.round(38_000 + Math.sin(i / 1.7) * 9_000 + (i % 6 === 0 ? 22_000 : 0)),
}))

EXEMPLO.metricas_instagram = {
    fonte: "instagram",
    username: "dandaranunes",
    ig_user_id: null,
    nome: "Dandara Nunes",
    biografia: null,
    foto_url: null,
    seguidores: historico[historico.length - 1].seguidores,
    seguindo: 812,
    publicacoes: 1430,
    media_curtidas: 5480,
    media_comentarios: 312,
    media_visualizacoes: 64200,
    media_alcance: 41300,
    media_salvamentos: 690,
    media_compartilhamentos: 410,
    media_tempo_reels_s: 14.2,
    taxa_engajamento: 4.51,
    taxa_engajamento_alcance: 16.7,
    posts_por_semana: 4.2,
    publicacoes_analisadas: 12,
    formatos: { reel: 58, carrossel: 29, foto: 13, video: 0 },
    insights_30d: {
        alcance: 612_000,
        visualizacoes: 2_340_000,
        contas_engajadas: 48_900,
        interacoes: 212_000,
        curtidas: 171_000,
        comentarios: 9_800,
        compartilhamentos: 12_300,
        salvamentos: 18_900,
        respostas: 2_100,
        cliques_links: 3_450,
        novos_seguidores: 7_300,
        deixaram_de_seguir: 790,
        alcance_nao_seguidores_pct: 62,
    },
    alcance_diario: alcanceDiario,
    audiencia: {
        genero: [
            { rotulo: "Mulheres", pct: 78.4 },
            { rotulo: "Homens", pct: 20.1 },
            { rotulo: "Não informado", pct: 1.5 },
        ],
        idade: [
            { rotulo: "13-17", pct: 2.1 },
            { rotulo: "18-24", pct: 19.6 },
            { rotulo: "25-34", pct: 44.8 },
            { rotulo: "35-44", pct: 23.5 },
            { rotulo: "45-54", pct: 7.2 },
            { rotulo: "55-64", pct: 2.1 },
            { rotulo: "65+", pct: 0.7 },
        ],
        cidades: [
            { rotulo: "Salvador", pct: 21.4 },
            { rotulo: "São Paulo", pct: 12.9 },
            { rotulo: "Rio de Janeiro", pct: 9.6 },
            { rotulo: "Feira de Santana", pct: 4.1 },
            { rotulo: "Recife", pct: 3.3 },
        ],
        paises: [
            { rotulo: "Brasil", pct: 94.2 },
            { rotulo: "Portugal", pct: 2.1 },
            { rotulo: "Estados Unidos", pct: 1.3 },
        ],
    },
    audiencia_engajada: null,
    stories: [],
    destaques: [],
    historico,
    crescimento_30d: 5.3,
    atualizado_em: new Date().toISOString(),
    status: "ok",
    ultima_tentativa: new Date().toISOString(),
}

export const metadata: Metadata = {
    title: "Exemplo de Media Kit — Somos Preta",
    description:
        "Veja como fica o Media Kit de um criador na Somos Preta: redes, métricas, portfólio e pacotes em um link só.",
    // Exemplo não é conteúdo de busca: quem procurar "media kit" no Google deve
    // achar a landing ou o kit de um criador de verdade, não esta demonstração.
    robots: { index: false, follow: true },
}

export default function ExemploDeMediaKitPage() {
    return (
        <div className="min-h-dvh bg-background">
            {/* ---------- aviso de exemplo ---------- */}
            <div className="border-b border-border bg-brand-terracota/10">
                <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-[13px] leading-relaxed text-foreground">
                        <strong className="font-semibold">Isto é um exemplo.</strong> A criadora abaixo é
                        fictícia — é assim que o seu Media Kit fica.
                    </p>

                    <Link
                        href="/creator/criar-conta"
                        className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-terracota px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-coral"
                    >
                        Criar o meu
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                </div>
            </div>

            <KitVitrine kit={EXEMPLO} />
        </div>
    )
}
