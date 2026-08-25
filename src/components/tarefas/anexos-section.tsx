"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { TarefaAnexo } from "@/lib/db/types"
import { FileUploader } from "./file-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Film, Image as ImageIcon, Link as LinkIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"

const ICONE = {
    imagem: ImageIcon, pdf_documento: FileText, video: Film, link: LinkIcon,
} as const

export function AnexosSection({ tarefaId, apenasEvidencia, onChange }: {
    tarefaId: string
    apenasEvidencia?: boolean
    onChange?: (anexos: TarefaAnexo[]) => void
}) {
    const [supabase] = useState(() => createClient())
    const [anexos, setAnexos] = useState<(TarefaAnexo & { signedUrl?: string })[]>([])
    const [linkAberto, setLinkAberto] = useState(false)
    const [link, setLink] = useState("")

    async function load() {
        const { data } = await supabase
            .from("somos_preta_tarefa_anexos")
            .select("*")
            .eq("tarefa_id", tarefaId)
            .is("subtarefa_id", null)
            .order("created_at", { ascending: false })
        const lista = (data as TarefaAnexo[]) ?? []
        const comUrl = await Promise.all(lista.map(async (a) => {
            if (a.storage_path) {
                const { data: signed } = await supabase.storage.from("tarefa-anexos").createSignedUrl(a.storage_path, 3600)
                return { ...a, signedUrl: signed?.signedUrl }
            }
            return a
        }))
        setAnexos(comUrl)
        onChange?.(lista)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tarefaId])

    async function adicionarLink() {
        if (!link.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_tarefa_anexos").insert({
            tarefa_id: tarefaId, tipo: "link", link_externo: link.trim(),
            is_evidencia: !!apenasEvidencia, autor_id: user?.id ?? null,
        })
        if (error) { toast.error("Erro ao adicionar link"); return }
        setLink("")
        setLinkAberto(false)
        toast.success("Link adicionado")
        load()
    }

    async function excluir(id: string) {
        const { error } = await supabase.from("somos_preta_tarefa_anexos").delete().eq("id", id)
        if (error) { toast.error("Erro ao excluir"); return }
        load()
    }

    const visiveis = apenasEvidencia ? anexos.filter((a) => a.is_evidencia) : anexos

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <FileUploader tarefaId={tarefaId} isEvidencia={apenasEvidencia} onUploaded={load} />
                {linkAberto ? (
                    <div className="flex items-center gap-1.5">
                        <Input className="h-8 w-48" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
                        <Button size="sm" variant="outline" onClick={adicionarLink}>Adicionar</Button>
                    </div>
                ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => setLinkAberto(true)}>
                        <LinkIcon className="h-4 w-4" /> Link
                    </Button>
                )}
            </div>
            {visiveis.length > 0 && (
                <ul className="space-y-1.5">
                    {visiveis.map((a) => {
                        const Icone = ICONE[a.tipo]
                        const href = a.tipo === "link" ? (a.link_externo ?? "#") : (a.signedUrl ?? "#")
                        return (
                            <li key={a.id} className="flex items-center gap-2 text-sm border rounded-lg px-2.5 py-1.5">
                                <Icone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <a href={href} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:text-primary hover:underline">
                                    {a.nome ?? a.link_externo}
                                </a>
                                {a.is_evidencia && <span className="text-[10px] uppercase text-green-600 font-medium shrink-0">Evidência</span>}
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600 shrink-0" onClick={() => excluir(a.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
