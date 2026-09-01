import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getSessionUser } from "@/lib/supabase/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, Pencil, ExternalLink } from "lucide-react"
import { CopyLinkButton } from "../copy-link-button"
import type { MidiaKit } from "@/lib/db/types"

export default async function CriadorDashboardPage() {
    const user = await getSessionUser()
    const supabase = await createClient()

    const { data: kit } = user
        ? await supabase
            .from("somos_preta_midia_kits")
            .select("*")
            .eq("cadastrado_por", user.id)
            .maybeSingle<MidiaKit>()
        : { data: null }

    if (!kit) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="border-border/60 rounded-3xl max-w-md w-full text-center">
                    <CardContent className="pt-10 pb-8 space-y-5">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                            <Sparkles className="h-7 w-7 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-semibold tracking-tight">Você ainda não tem um Media Kit</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Monte seu perfil profissional para compartilhar com marcas e agências.
                            </p>
                        </div>
                        <Button asChild className="rounded-xl h-11 px-6">
                            <Link href="/criador/media-kit">Criar meu Media Kit</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const iniciais = kit.nome.slice(0, 2).toUpperCase()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Meu Media Kit</h1>
                <p className="text-muted-foreground text-sm mt-1">Gerencie seu perfil profissional</p>
            </div>

            <Card className="border-border/60 rounded-3xl overflow-hidden">
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 min-w-0">
                            <Avatar className="h-16 w-16">
                                {kit.avatar_url && <AvatarImage src={kit.avatar_url} alt={kit.nome} />}
                                <AvatarFallback className="text-lg">{iniciais}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-semibold truncate">{kit.nome}</h2>
                                    {kit.publicado ? (
                                        <Badge variant="secondary">Publicado</Badge>
                                    ) : (
                                        <Badge variant="outline">Rascunho</Badge>
                                    )}
                                </div>
                                {kit.bio && (
                                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2 max-w-md">
                                        {kit.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/60">
                        <Button asChild className="rounded-xl">
                            <Link href="/criador/media-kit">
                                <Pencil className="h-4 w-4" />
                                Editar Media Kit
                            </Link>
                        </Button>
                        {kit.publicado && (
                            <>
                                <Button asChild variant="outline" className="rounded-xl">
                                    <Link href={`/kit/${kit.slug}`} target="_blank">
                                        <ExternalLink className="h-4 w-4" />
                                        Ver página pública
                                    </Link>
                                </Button>
                                <CopyLinkButton path={`/kit/${kit.slug}`} />
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
