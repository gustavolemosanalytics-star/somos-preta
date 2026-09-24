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
    avatar_url: "/media-kit/perfil.webp",
    cover_url: "/hero/paisagem-falesias.webp",
    // Sem WhatsApp de propósito: um botão de contato num exemplo abriria uma
    // conversa com número inventado. O convite do topo faz esse papel.
    whatsapp: null,
    redes: {
        instagram: { handle: "dandaranunes", followers: 128000, engagement_rate: 4.8 },
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
