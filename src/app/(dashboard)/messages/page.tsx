"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { mockDb } from "@/lib/mock-db"
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Video,
    Info,
    MessageSquare,
    Plus,
    CheckCheck,
    Loader2,
    Smile,
    Paperclip,
    Mic,
    ArrowLeft,
    ImageIcon,
} from "lucide-react"

const contacts = [
    { id: 1, name: "Ana Silva", avatar: "AS", lastMessage: "Pode me enviar o contrato corrigido?", time: "10:30", unread: 2, status: "online", instagram: "@anasilva" },
    { id: 2, name: "João Victor", avatar: "JV", lastMessage: "O briefing está aprovado!", time: "Ontem", unread: 0, status: "offline", instagram: "@joaov" },
    { id: 3, name: "Maria Costa", avatar: "MC", lastMessage: "Vou postar o reel amanhã às 18h.", time: "Ontem", unread: 0, status: "online", instagram: "@mariac" },
    { id: 4, name: "Carlos Tech", avatar: "CT", lastMessage: "Obrigado pelo retorno.", time: "2 dias", unread: 0, status: "offline", instagram: "@carlostech" },
    { id: 5, name: "Beatriz Lopes", avatar: "BL", lastMessage: "Adorei o briefing! Quando começamos?", time: "3 dias", unread: 1, status: "online", instagram: "@bialopes" },
    { id: 6, name: "Rafael Duarte", avatar: "RD", lastMessage: "Enviei as fotos editadas.", time: "4 dias", unread: 0, status: "offline", instagram: "@rafaduarte" },
]

function Separator({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
    return <div className={`bg-border ${orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"} ${className}`} />
}

export default function MessagesPage() {
    const queryClient = useQueryClient()
    const [selectedContact, setSelectedContact] = useState(contacts[0])
    const [newMessage, setNewMessage] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [showMobile, setShowMobile] = useState(false) // for mobile sidebar toggle
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { data: messages, isLoading } = useQuery({
        queryKey: ["messages", selectedContact.id],
        queryFn: () => mockDb.message.findMany({ where: { contactId: selectedContact.id } }),
    })

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault()
        if (!newMessage.trim()) return

        await mockDb.message.create({
            contactId: selectedContact.id,
            text: newMessage.trim(),
            sender: "USER",
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            read: true,
        })

        setNewMessage("")
        queryClient.invalidateQueries({ queryKey: ["messages", selectedContact.id] })

        // Auto-reply after 1.5s
        setTimeout(async () => {
            const replies = [
                "Entendi, vou verificar!",
                "Perfeito, obrigado!",
                "Pode deixar, vou resolver.",
                "Show! Combinado então.",
                "Beleza, me atualiza depois.",
                "Top! Vou preparar o material.",
            ]
            await mockDb.message.create({
                contactId: selectedContact.id,
                text: replies[Math.floor(Math.random() * replies.length)],
                sender: "INFLUENCER",
                time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                read: false,
            })
            queryClient.invalidateQueries({ queryKey: ["messages", selectedContact.id] })
        }, 1500)
    }

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex h-[calc(100vh-140px)] border rounded-xl overflow-hidden bg-background shadow-sm">
            {/* Sidebar - Contact List */}
            <div className={`${showMobile ? "hidden md:flex" : "flex"} w-full md:w-[350px] border-r flex-col bg-background`}>
                <div className="p-4 border-b space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Mensagens</h2>
                        <Button size="icon" variant="ghost" className="rounded-full">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar conversas..."
                            className="pl-9 bg-muted/50 rounded-xl"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y">
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                onClick={() => { setSelectedContact(contact); setShowMobile(true) }}
                                className={`p-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedContact.id === contact.id ? "bg-muted" : ""}`}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-semibold">
                                            {contact.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    {contact.status === "online" && (
                                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-semibold text-sm truncate">{contact.name}</span>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{contact.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-muted-foreground truncate pr-2">{contact.lastMessage}</p>
                                        {contact.unread > 0 && (
                                            <Badge className="h-5 min-w-5 p-0 flex items-center justify-center rounded-full bg-green-500 text-white text-[10px]">
                                                {contact.unread}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`${!showMobile ? "hidden md:flex" : "flex"} flex-1 flex-col`}>
                {/* Chat Header */}
                <div className="p-3 border-b bg-background flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="md:hidden rounded-full"
                            onClick={() => setShowMobile(false)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="relative">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-semibold text-sm">
                                    {selectedContact.avatar}
                                </AvatarFallback>
                            </Avatar>
                            {selectedContact.status === "online" && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background" />
                            )}
                        </div>
                        <div>
                            <div className="font-semibold text-sm leading-none mb-1">{selectedContact.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                                {selectedContact.status === "online" ? (
                                    <span className="text-green-500">Online</span>
                                ) : (
                                    "Offline"
                                )}
                                {" · "}{selectedContact.instagram}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="rounded-full h-9 w-9"><Phone className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="rounded-full h-9 w-9"><Video className="h-4 w-4" /></Button>
                        <Separator orientation="vertical" className="h-6 mx-1" />
                        <Button size="icon" variant="ghost" className="rounded-full h-9 w-9"><Info className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="rounded-full h-9 w-9"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    className="flex-1 overflow-y-auto p-4 space-y-3"
                    style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                    }}
                >
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            {/* Date separator */}
                            <div className="flex items-center justify-center">
                                <span className="text-[11px] text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
                                    Hoje
                                </span>
                            </div>

                            {messages?.map((m) => (
                                <div key={m.id} className={`flex ${m.sender === "USER" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[75%] ${m.sender === "USER"
                                        ? "bg-green-600 dark:bg-green-700 text-white"
                                        : "bg-white dark:bg-slate-800 border"
                                        } px-3 py-2 rounded-xl ${m.sender === "USER" ? "rounded-tr-sm" : "rounded-tl-sm"
                                        } shadow-sm`}
                                    >
                                        <p className="text-sm leading-relaxed">{m.text}</p>
                                        <div className={`flex items-center gap-1 justify-end mt-0.5 ${m.sender === "USER" ? "text-green-200" : "text-muted-foreground"}`}>
                                            <span className="text-[10px]">{m.time}</span>
                                            {m.sender === "USER" && <CheckCheck className="h-3 w-3" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Message Input - WhatsApp style */}
                <form onSubmit={sendMessage} className="p-3 bg-background border-t">
                    <div className="flex items-center gap-2">
                        <Button type="button" size="icon" variant="ghost" className="rounded-full h-10 w-10 shrink-0">
                            <Smile className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="rounded-full h-10 w-10 shrink-0">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Input
                            placeholder="Escreva uma mensagem..."
                            className="flex-1 rounded-full bg-muted/50 h-10 px-4"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                        />
                        {newMessage.trim() ? (
                            <Button type="submit" size="icon" className="rounded-full h-10 w-10 bg-green-600 hover:bg-green-700 shrink-0">
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        ) : (
                            <Button type="button" size="icon" variant="ghost" className="rounded-full h-10 w-10 shrink-0">
                                <Mic className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
