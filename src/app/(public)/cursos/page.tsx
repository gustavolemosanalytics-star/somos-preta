"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Play, Clock, BookOpen, Star, Search, Users, TrendingUp, GraduationCap, Loader2, ArrowRight } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { mockDb, type Course } from "@/lib/mock-db"
import { motion } from "framer-motion"

const categories = ["Todos", "Profissionalização", "Business", "Regional", "Criatividade"]

const testimonials = [
    { name: "Fernanda T.", text: "O curso de Mídia Kit mudou minha carreira! Consegui fechar 3 contratos no primeiro mês.", rating: 5 },
    { name: "Lucas M.", text: "Aprendi a precificar meu trabalho de verdade. Recomendo demais!", rating: 5 },
    { name: "Amanda B.", text: "Os cursos são práticos e direto ao ponto. Perfeito para quem tem pouco tempo.", rating: 5 },
]

function CourseCard({ course }: { course: Course }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="overflow-hidden group hover:shadow-xl transition-all border-none bg-card/80 h-full flex flex-col">
                <div className="aspect-video bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 relative">
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="icon" className="rounded-full h-14 w-14 bg-white/20 backdrop-blur-sm hover:bg-white/30">
                            <Play className="h-7 w-7 text-white" />
                        </Button>
                    </div>
                    <Badge className="absolute top-3 left-3 rounded-lg">{course.category}</Badge>
                    {course.price && (
                        <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 font-bold text-sm text-primary">
                            {course.price}
                        </div>
                    )}
                </div>
                <CardContent className="p-5 flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < Math.floor(course.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{course.rating} ({course.enrolled || 0} alunos)</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {course.title}
                    </h3>
                    {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    )}
                    {course.instructor && (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                    {course.instructor.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{course.instructor}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</div>
                        <div className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.lessons} aulas</div>
                    </div>
                </CardContent>
                <CardFooter className="p-5 pt-0">
                    <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold">
                        Acessar Curso
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    )
}

export default function CursosPage() {
    const [selectedCategory, setSelectedCategory] = useState("Todos")
    const [searchQuery, setSearchQuery] = useState("")

    const { data: courses, isLoading } = useQuery({
        queryKey: ["public-courses"],
        queryFn: () => mockDb.course.findMany(),
    })

    const filteredCourses = courses?.filter((course) => {
        const matchesCategory = selectedCategory === "Todos" || course.category === selectedCategory
        const matchesSearch = !searchQuery ||
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="relative py-16 lg:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Badge className="bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30 mb-4 px-4 py-1.5">
                                <GraduationCap className="h-3 w-3 mr-2" /> Somos Preta Academy
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                                Aprenda com os{" "}
                                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    melhores creators
                                </span>
                            </h1>
                            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                                Cursos exclusivos para influenciadores digitais que querem ser e que querem melhorar sua carreira.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4">
                            {[
                                { icon: BookOpen, value: "8+", label: "Cursos" },
                                { icon: Users, value: "15K+", label: "Alunos" },
                                { icon: TrendingUp, value: "4.8", label: "Avaliação" },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <stat.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                                    <p className="font-bold text-lg">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Search & Filters */}
            <section className="container mx-auto px-4 -mt-4 relative z-10">
                <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar cursos ou instrutores..."
                                className="pl-10 rounded-xl border-border/50"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {categories.map((cat) => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? "default" : "outline"}
                                    size="sm"
                                    className={`rounded-xl text-xs ${selectedCategory === cat ? "bg-gradient-to-r from-primary to-secondary hover:opacity-90" : ""}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Course Grid */}
            <section className="container mx-auto px-4 py-12">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCourses?.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}

                {filteredCourses?.length === 0 && !isLoading && (
                    <div className="text-center py-20">
                        <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-muted-foreground">Nenhum curso encontrado</h3>
                        <p className="text-sm text-muted-foreground mt-2">Tente outra categoria ou termo de busca.</p>
                    </div>
                )}
            </section>

            {/* Featured Workshop */}
            <section className="container mx-auto px-4 pb-12">
                <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 p-8 md:p-12 text-white relative overflow-hidden">
                    <div className="relative z-10 max-w-lg">
                        <Badge className="bg-white/20 text-white border-white/30 mb-4">Ao Vivo</Badge>
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">Próximo Workshop</h2>
                        <p className="text-purple-100 mb-6 text-lg">
                            &quot;Como fechar contratos de 1 ano com marcas de varejo&quot; com @LuisaAlves
                        </p>
                        <Button variant="secondary" size="lg" className="rounded-xl font-bold">
                            Garantir minha vaga <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4">
                        <GraduationCap className="h-64 w-64" />
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="container mx-auto px-4 pb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                    O que nossos alunos dizem
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Card className="border-none bg-card/50 h-full">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: testimonial.rating }).map((_, j) => (
                                            <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">&quot;{testimonial.text}&quot;</p>
                                    <p className="text-sm font-bold">{testimonial.name}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}
