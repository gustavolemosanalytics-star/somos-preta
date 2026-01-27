
import { mockDb } from "@/lib/mock-db"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Instagram, Youtube, Twitter } from "lucide-react"

export default async function PublicMediaKitPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params

    const influencer = await mockDb.influencer.findUnique({
        where: { username },
    })

    // Basic console log for debugging server side
    console.log(`Looking for influencer: ${username}`, influencer ? 'FOUND' : 'NOT FOUND')

    if (!influencer) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Header / Cover */}
            <div className="h-64 bg-gradient-to-r from-purple-600 to-pink-600 relative">
                <div className="container mx-auto px-4 h-full flex items-end pb-8">
                    <div className="bg-white dark:bg-slate-900 p-1 rounded-full absolute -bottom-16 left-4 md:left-8 shadow-lg">
                        <div className="h-32 w-32 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            <span className="text-4xl text-slate-500 font-bold">{influencer.name.charAt(0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-20 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">{influencer.name}</h1>
                        <p className="text-lg text-muted-foreground mt-2">{influencer.instagram}</p>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {influencer.niche.map((tag: string) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                            <Badge variant="outline">{influencer.state}</Badge>
                        </div>

                        <p className="mt-6 max-w-2xl text-lg leading-relaxed">
                            {influencer.bio || "Olá! Sou um criador de conteúdo apaixonado por conectar marcas ao meu público de forma autêntica."}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button size="lg" className="bg-green-600 hover:bg-green-700">
                            Contratar via WhatsApp
                        </Button>
                        <Button size="lg" variant="outline">
                            Baixar PDF
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <Instagram className="h-8 w-8 mx-auto text-pink-600 mb-2" />
                        <div className="text-3xl font-bold">
                            {new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(influencer.followers)}
                        </div>
                        <div className="text-sm text-muted-foreground">Seguidores</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            {influencer.engagement}%
                        </div>
                        <div className="text-sm text-muted-foreground">Engajamento</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <Youtube className="h-8 w-8 mx-auto text-red-600 mb-2" />
                        <div className="text-3xl font-bold">
                            -
                        </div>
                        <div className="text-sm text-muted-foreground">Inscritos</div>
                    </div>
                </div>

                {/* Portfolio Section */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6">Portfólio & Cases</h2>

                    {influencer.portfolio && influencer.portfolio.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {influencer.portfolio.map((item: any, idx: number) => (
                                <div key={idx} className="group relative overflow-hidden rounded-lg border bg-background shadow-sm hover:shadow-md transition-all">
                                    <div className="aspect-video bg-slate-100 flex items-center justify-center">
                                        <span className="text-slate-400">Image: {item.title}</span>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold">{item.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                            <p className="text-muted-foreground">Nenhum case adicionado ainda.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
