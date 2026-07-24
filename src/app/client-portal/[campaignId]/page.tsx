import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

type Vinculo = {
    vinculo: { pagamento: number | null; status: string; geo_percent: number | null; status_bia: string | null }
    influencer: { nome: string; instagram: string | null; followers: number; engagement: number; estado: string | null }
}
type Portal = {
    campanha: { nome: string; objetivo: string | null; budget: number; status: string; data_inicio: string | null; data_fim: string | null }
    influencers: Vinculo[]
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const fmt = (n: number) => n.toLocaleString("pt-BR")

export default async function ClientPortalPage({ params }: { params: Promise<{ campaignId: string }> }) {
    const { campaignId } = await params
    const supabase = await createClient()
    const { data } = await supabase.rpc("somos_preta_portal_campanha", { p_token: campaignId })

    const portal = data as Portal | null
    if (!portal || !portal.campanha) notFound()

    const { campanha, influencers } = portal
    const alcance = influencers.reduce((s, v) => s + (v.influencer.followers || 0), 0)
    const engMedio = influencers.length
        ? (influencers.reduce((s, v) => s + Number(v.influencer.engagement || 0), 0) / influencers.length).toFixed(1)
        : "0"

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border/60">
                <div className="container mx-auto px-4 py-5 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">S</span>
                    </div>
                    <span className="font-semibold tracking-tight">Somos Preta</span>
                    <span className="text-muted-foreground text-sm ml-auto">Relatório de campanha</span>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <p className="text-sm text-muted-foreground">Campanha</p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">{campanha.nome}</h1>
                {campanha.objetivo && <p className="text-muted-foreground mt-2">{campanha.objetivo}</p>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                    {[
                        { label: "Creators", value: String(influencers.length) },
                        { label: "Alcance total", value: fmt(alcance) },
                        { label: "Engajamento médio", value: `${engMedio}%` },
                        { label: "Budget", value: brl(Number(campanha.budget)) },
                    ].map((k) => (
                        <div key={k.label} className="rounded-2xl border border-border/60 p-5">
                            <p className="text-2xl font-semibold tracking-tight">{k.value}</p>
                            <p className="text-sm text-muted-foreground mt-1">{k.label}</p>
                        </div>
                    ))}
                </div>

                <h2 className="text-lg font-semibold mt-12 mb-4">Creators da campanha</h2>
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">Creator</th>
                                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Local</th>
                                <th className="text-right font-medium px-4 py-3">Seguidores</th>
                                <th className="text-right font-medium px-4 py-3">Eng.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {influencers.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum creator vinculado ainda.</td></tr>
                            ) : influencers.map((v, i) => (
                                <tr key={i} className="border-t border-border/60">
                                    <td className="px-4 py-3 font-medium">
                                        {v.influencer.nome}
                                        {v.influencer.instagram && <span className="text-muted-foreground font-normal"> · {v.influencer.instagram}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{v.influencer.estado ?? "—"}</td>
                                    <td className="px-4 py-3 text-right">{fmt(v.influencer.followers)}</td>
                                    <td className="px-4 py-3 text-right">{Number(v.influencer.engagement)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}
