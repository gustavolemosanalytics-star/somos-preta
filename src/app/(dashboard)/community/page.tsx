"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, Heart, Share2, Plus, Users, Award, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { mockDb } from "@/lib/mock-db"

export default function CommunityPage() {
    const { data: posts, isLoading } = useQuery({
        queryKey: ['posts'],
        queryFn: () => mockDb.post.findMany()
    })

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Comunidade Creators</h2>
                    <p className="text-muted-foreground">O maior hub de networking para creators de todo o Nordeste.</p>
                </div>
                <Button><Plus className="mr-2 h-4 w-4" /> Nova Publicação</Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-6">
                    <Card className="shadow-sm">
                        <CardContent className="p-4 pt-6">
                            <div className="flex gap-4">
                                <Avatar><AvatarFallback>EU</AvatarFallback></Avatar>
                                <Input placeholder="Qual a novidade de hoje?" className="bg-muted/50 border-none h-12 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        posts?.map((post) => (
                            <Card key={post.id} className="shadow-sm overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                    <Avatar>
                                        <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{post.user.name}</span>
                                        <span className="text-xs text-muted-foreground">{post.user.handle} • {post.time}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <p className="text-sm leading-relaxed">{post.content}</p>
                                </CardContent>
                                <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/50 py-2 flex justify-between">
                                    <div className="flex gap-6">
                                        <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                                            <Heart className="h-4 w-4" /> {post.likes}
                                        </button>
                                        <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                                            <MessageSquare className="h-4 w-4" /> {post.comments}
                                        </button>
                                    </div>
                                    <button className="text-muted-foreground hover:text-primary transition-colors">
                                        <Share2 className="h-4 w-4" />
                                    </button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-none">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Sugestões de Networking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8"><AvatarFallback>CR</AvatarFallback></Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">Creator {i}</span>
                                            <span className="text-[10px] text-muted-foreground">Fortaleza, CE</span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px]">Conectar</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Award className="h-4 w-4" /> Top Engajadores da Semana
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs opacity-90">Participe da comunidade para ganhar pontos e subir no ranking!</p>
                            <Button variant="secondary" className="w-full h-8 text-xs">Ver Ranking Completo</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
