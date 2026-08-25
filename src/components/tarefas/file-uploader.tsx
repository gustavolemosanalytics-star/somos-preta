"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Paperclip } from "lucide-react"
import { toast } from "sonner"
import type { TarefaAnexoTipo } from "@/lib/db/types"

const LIMITES_MB: Record<Exclude<TarefaAnexoTipo, "link">, number> = {
    imagem: 50,
    pdf_documento: 50,
    video: 100,
}

function tipoPorMime(mime: string): Exclude<TarefaAnexoTipo, "link"> {
    if (mime.startsWith("image/")) return "imagem"
    if (mime.startsWith("video/")) return "video"
    return "pdf_documento"
}

export function FileUploader({ tarefaId, subtarefaId, isEvidencia, onUploaded, label = "Anexar arquivo" }: {
    tarefaId: string
    subtarefaId?: string | null
    isEvidencia?: boolean
    onUploaded: () => void
    label?: string
}) {
    const [supabase] = useState(() => createClient())
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleFile(file: File) {
        const tipo = tipoPorMime(file.type)
        const limite = LIMITES_MB[tipo]
        if (file.size > limite * 1024 * 1024) {
            toast.error(`Arquivo muito grande (máx. ${limite}MB para ${tipo === "video" ? "vídeo" : "esse tipo de arquivo"})`)
            return
        }
        setUploading(true)
        const path = `${tarefaId}/${crypto.randomUUID()}-${file.name}`
        const { error: upErr } = await supabase.storage.from("tarefa-anexos").upload(path, file)
        if (upErr) { toast.error("Erro ao enviar arquivo"); setUploading(false); return }

        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_tarefa_anexos").insert({
            tarefa_id: tarefaId,
            subtarefa_id: subtarefaId ?? null,
            tipo,
            storage_path: path,
            nome: file.name,
            is_evidencia: !!isEvidencia,
            autor_id: user?.id ?? null,
        })
        setUploading(false)
        if (error) { toast.error("Erro ao registrar anexo"); return }
        toast.success("Arquivo anexado")
        onUploaded()
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
            />
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                {label}
            </Button>
        </>
    )
}
