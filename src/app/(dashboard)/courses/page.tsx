"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, BookOpen, Star, GraduationCap, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { mockDb } from "@/lib/mock-db"

export default function CoursesPage() {
    const { data: courses, isLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: () => mockDb.course.findMany()
    })

    return (
        <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Educação & Academy</h2>
                    <p className="text-muted-foreground">Capacite-se para o mercado e aumente seu valor como creator.</p>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-primary">Nível 4: Creator Senior</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {courses?.map((course) => (
                        <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-all border-none bg-slate-50 dark:bg-slate-900">
                            <div className="aspect-video bg-slate-200 relative">
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button size="icon" className="rounded-full h-12 w-12"><Play className="h-6 w-6" /></Button>
                                </div>
                                <Badge className="absolute top-2 right-2">{course.category}</Badge>
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{course.rating} (120 reviews)</span>
                                </div>
                                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{course.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</div>
                                    <div className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.lessons} aulas</div>
                                </div>
                                {course.progress > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px]">
                                            <span>Progresso</span>
                                            <span>{course.progress}%</span>
                                        </div>
                                        <Progress value={course.progress} className="h-1" />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button className="w-full" variant={course.progress === 100 ? "outline" : "default"}>
                                    {course.progress === 100 ? "Revisar Aula" : course.progress > 0 ? "Continuar Assindo" : "Começar Agora"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                <div className="relative z-10 max-w-lg">
                    <h3 className="text-2xl font-bold mb-2">Próximo Workshop Ao Vivo</h3>
                    <p className="text-purple-100 mb-6">"Como fechar contratos de 1 ano com marcas de varejo" com @LuisaAlves</p>
                    <Button variant="secondary">Garantir minha vaga</Button>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4">
                    <GraduationCap className="h-64 w-64" />
                </div>
            </div>
        </div>
    )
}
