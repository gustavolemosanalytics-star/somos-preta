"use client"

import { useState, useRef } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Plus, Clock, AlertCircle, CheckCircle2, Loader2, Upload, Eye, X, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { mockDb, type Contract } from "@/lib/mock-db"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

function statusLabel(status: string) {
    const map: Record<string, string> = { SIGNED: "Assinado", PENDING: "Pendente", EXPIRED: "Expirado", CANCELLED: "Cancelado" }
    return map[status] || status
}

export default function ContractsPage() {
    const queryClient = useQueryClient()
    const [showCreate, setShowCreate] = useState(false)
    const [viewingPdf, setViewingPdf] = useState<string | null>(null)
    const [viewingTitle, setViewingTitle] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { data: contracts, isLoading } = useQuery({
        queryKey: ["contracts"],
        queryFn: () => mockDb.contract.findMany()
    })

    // Create contract form state
    const [form, setForm] = useState({
        title: "",
        influencer: "",
        status: "PENDING" as Contract["status"],
        expiresAt: "",
    })
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [creating, setCreating] = useState(false)

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)

        let pdfUrl = ""
        let pdfName = ""

        if (pdfFile) {
            // Create a blob URL for the PDF (in production this would be an upload to S3/R2)
            pdfUrl = URL.createObjectURL(pdfFile)
            pdfName = pdfFile.name
        }

        await mockDb.contract.create({
            title: form.title,
            influencer: form.influencer,
            status: form.status,
            createdAt: new Date().toISOString().split("T")[0],
            expiresAt: form.expiresAt,
            pdfUrl,
            pdfName,
        })

        queryClient.invalidateQueries({ queryKey: ["contracts"] })
        setCreating(false)
        setForm({ title: "", influencer: "", status: "PENDING", expiresAt: "" })
        setPdfFile(null)
        setShowCreate(false)
    }

    const columns: ColumnDef<Contract>[] = [
        {
            accessorKey: "title",
            header: "Título / Objeto",
            cell: ({ row }) => (
                <div>
                    <div className="font-semibold">{row.getValue("title")}</div>
                    {row.original.pdfName && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <FileText className="h-3 w-3" /> {row.original.pdfName}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "influencer",
            header: "Influenciador",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge variant={
                        status === "SIGNED" ? "default" :
                            status === "PENDING" ? "secondary" :
                                "destructive"
                    }>
                        {statusLabel(status)}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "createdAt",
            header: "Criado em",
        },
        {
            accessorKey: "expiresAt",
            header: "Expira em",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const contract = row.original
                return (
                    <div className="flex gap-1">
                        {contract.pdfUrl && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                    setViewingPdf(contract.pdfUrl!)
                                    setViewingTitle(contract.title)
                                }}
                            >
                                <Eye className="h-4 w-4" /> Ver PDF
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

    // PDF Viewer
    if (viewingPdf) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-6 lg:p-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setViewingPdf(null)} className="rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{viewingTitle}</h2>
                        <p className="text-sm text-muted-foreground">Visualizando contrato em PDF</p>
                    </div>
                    <Button variant="outline" onClick={() => setViewingPdf(null)} className="gap-2">
                        <X className="h-4 w-4" /> Fechar
                    </Button>
                </div>
                <Card className="flex-1">
                    <CardContent className="p-0 h-[calc(100vh-220px)]">
                        <iframe
                            src={viewingPdf}
                            className="w-full h-full rounded-xl"
                            title="PDF Viewer"
                        />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Rastreabilidade de Contratos
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-lg">Gestão centralizada de conformidade e assinaturas digitais.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl">Templates</Button>
                    <Button className="bg-gradient-to-r from-primary to-secondary rounded-xl" onClick={() => setShowCreate(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Contrato
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-xl">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                        <div className="text-2xl font-bold">{contracts?.filter(c => c.status === "SIGNED").length || 0}</div>
                        <p className="text-xs text-muted-foreground">Assinados</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-xl">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                        <Clock className="h-8 w-8 text-blue-500 mb-2" />
                        <div className="text-2xl font-bold">{contracts?.filter(c => c.status === "PENDING").length || 0}</div>
                        <p className="text-xs text-muted-foreground">Aguardando assinatura</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-xl">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                        <AlertCircle className="h-8 w-8 text-orange-500 mb-2" />
                        <div className="text-2xl font-bold">{contracts?.filter(c => c.status === "EXPIRED").length || 0}</div>
                        <p className="text-xs text-muted-foreground">Expirados</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-xl">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                        <FileText className="h-8 w-8 text-primary mb-2" />
                        <div className="text-2xl font-bold">{contracts?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <DataTable columns={columns} data={contracts || []} searchKey="title" />
            )}

            {/* Create Contract Dialog */}
            <Dialog open={showCreate} onOpenChange={(v) => !v && setShowCreate(false)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Novo Contrato</DialogTitle>
                        <DialogDescription>Cadastre um novo contrato e anexe o PDF.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título do Contrato</Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="rounded-xl" placeholder="Ex: Campanha Verão - Exclusividade" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Influenciador</Label>
                                <Input value={form.influencer} onChange={e => setForm({ ...form, influencer: e.target.value })} required className="rounded-xl" placeholder="Nome do influencer" />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Contract["status"] })}>
                                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pendente</SelectItem>
                                        <SelectItem value="SIGNED">Assinado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Data de Expiração</Label>
                            <Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Arquivo PDF do Contrato</Label>
                            <div
                                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) setPdfFile(file)
                                    }}
                                />
                                {pdfFile ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium">{pdfFile.name}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setPdfFile(null) }}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Clique para fazer upload do PDF</p>
                                        <p className="text-xs text-muted-foreground">ou arraste e solte aqui</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancelar</Button>
                            <Button type="submit" disabled={creating} className="rounded-xl bg-gradient-to-r from-primary to-secondary">
                                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar Contrato"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
