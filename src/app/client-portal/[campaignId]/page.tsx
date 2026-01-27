"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink,
    MessageSquare,
    Eye,
    ThumbsUp,
    ThumbsDown
} from "lucide-react"

export default function ClientPortalPage({ params }: { params: { campaignId: string } }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border">
                    <div>
                        <Badge className="mb-2">Portal do Cliente</Badge>
                        <h1 className="text-3xl font-bold tracking-tight">Campanha: Verão Coca-Cola 2025</h1>
                        <p className="text-muted-foreground">Monitoramento em tempo real para: <strong>Coca-Cola Brasil</strong></p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Falar com Agência</Button>
                        <Button><ExternalLink className="mr-2 h-4 w-4" /> Exportar Relatório</Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-2">65%</div>
                            <Progress value={65} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">24 de 36 entregas concluídas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">03</div>
                            <p className="text-xs text-muted-foreground mt-2">Aguardando seu feedback</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">12.4k</div>
                            <p className="text-xs text-muted-foreground mt-2">Através de links de trackeamento</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Entregues para Aprovação</CardTitle>
                        <CardDescription>Revise e aprove os conteúdos antes da publicação final.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Influenciador</TableHead>
                                    <TableHead>Entregável</TableHead>
                                    <TableHead>Preview</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarFallback>AS</AvatarFallback></Avatar>
                                            <span>Ana Silva</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>Reel: Unboxing Verão</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="text-blue-500"><Eye className="h-4 w-4 mr-1" /> Ver Link</Button>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Aguardando Aprovação</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="outline" className="text-red-500"><ThumbsDown className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="outline" className="text-green-500"><ThumbsUp className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarFallback>MC</AvatarFallback></Avatar>
                                            <span>Maria Costa</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>Story: Lifestyle Praia</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="text-blue-500"><Eye className="h-4 w-4 mr-1" /> Ver Link</Button>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovado</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
