"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageSquare, Repeat2, Share, Home, Compass, Hash, Bell, Loader2, ImagePlus, Smile } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { mockDb, type Post } from "@/lib/mock-db"
import { motion } from "framer-motion"

const trendingTopics = [
    { tag: "#CreatorsNE", posts: "2.4K posts" },
    { tag: "#MidiaKit", posts: "1.8K posts" },
    { tag: "#ColabNordeste", posts: "1.2K posts" },
    { tag: "#InfluencerTips", posts: "987 posts" },
    { tag: "#MarketingDigital", posts: "3.1K posts" },
]

const suggestedProfiles = [
    { name: "Camila Fortal", handle: "@camilafortal", followers: "67K" },
    { name: "Isabela Santos", handle: "@isabelasantos", followers: "120K" },
    { name: "Thiago Recife", handle: "@thiagorecife", followers: "41K" },
    { name: "Priscila Natal", handle: "@priscilanatal", followers: "19.5K" },
]

const navItems = [
    { icon: Home, label: "Home", active: true },
    { icon: Compass, label: "Explorar", active: false },
    { icon: Hash, label: "Trending", active: false },
    { icon: Bell, label: "Notificações", active: false },
]

function PostCard({ post }: { post: Post }) {
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(post.likes)

    const handleLike = () => {
        setLiked(!liked)
        setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    }

    const initials = post.user.name.split(" ").map(n => n[0]).join("").slice(0, 2)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-border/50 px-4 py-4 hover:bg-muted/30 transition-colors"
        >
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xs font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{post.user.name}</span>
                        <span className="text-sm text-muted-foreground truncate">{post.user.handle}</span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground shrink-0">{post.time}</span>
                    </div>
                    <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-8 mt-3">
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors group">
                            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <span className="text-xs">{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-emerald-500 transition-colors group">
                            <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                                <Repeat2 className="h-4 w-4" />
                            </div>
                            <span className="text-xs">{post.shares || 0}</span>
                        </button>
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-colors group ${liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`}
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition-colors">
                                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                            </div>
                            <span className="text-xs">{likeCount}</span>
                        </button>
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                            <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                                <Share className="h-4 w-4" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default function ComunidadePage() {
    const [newPost, setNewPost] = useState("")

    const { data: posts, isLoading } = useQuery({
        queryKey: ["community-posts"],
        queryFn: () => mockDb.post.findMany(),
    })

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6">
                    {/* Left Sidebar - Navigation */}
                    <aside className="hidden lg:block lg:col-span-3 py-4">
                        <div className="sticky top-20 space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.label}
                                    className={`flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-left transition-all ${
                                        item.active
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-lg">{item.label}</span>
                                </button>
                            ))}
                            <Button className="w-full mt-4 h-12 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold text-lg">
                                Publicar
                            </Button>
                        </div>
                    </aside>

                    {/* Main Feed */}
                    <main className="lg:col-span-5 border-x border-border/50 min-h-screen">
                        {/* Header */}
                        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
                            <h1 className="text-xl font-bold">Comunidade</h1>
                        </div>

                        {/* Composer */}
                        <div className="border-b border-border/50 p-4">
                            <div className="flex gap-3">
                                <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold">
                                        VC
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <Input
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        placeholder="O que está acontecendo?"
                                        className="border-none bg-transparent text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0 px-0 h-12"
                                    />
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                        <div className="flex gap-1">
                                            <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
                                                <ImagePlus className="h-5 w-5" />
                                            </button>
                                            <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
                                                <Smile className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <Button
                                            disabled={!newPost.trim()}
                                            className="rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold px-6"
                                        >
                                            Publicar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Posts */}
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            posts?.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))
                        )}
                    </main>

                    {/* Right Sidebar */}
                    <aside className="hidden lg:block lg:col-span-4 py-4">
                        <div className="sticky top-20 space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Input
                                    placeholder="Buscar na comunidade"
                                    className="h-11 rounded-2xl bg-muted/50 border-none pl-4"
                                />
                            </div>

                            {/* Trending */}
                            <Card className="border-none bg-muted/30 rounded-2xl overflow-hidden">
                                <CardContent className="p-0">
                                    <h3 className="font-bold text-lg px-4 pt-4 pb-2">Trending</h3>
                                    {trendingTopics.map((topic) => (
                                        <button
                                            key={topic.tag}
                                            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                                        >
                                            <p className="font-bold text-sm text-primary">{topic.tag}</p>
                                            <p className="text-xs text-muted-foreground">{topic.posts}</p>
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Suggested Profiles */}
                            <Card className="border-none bg-muted/30 rounded-2xl overflow-hidden">
                                <CardContent className="p-0">
                                    <h3 className="font-bold text-lg px-4 pt-4 pb-2">Quem seguir</h3>
                                    {suggestedProfiles.map((profile) => (
                                        <div
                                            key={profile.handle}
                                            className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xs font-bold">
                                                        {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-bold">{profile.name}</p>
                                                    <p className="text-xs text-muted-foreground">{profile.handle} · {profile.followers}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="rounded-2xl text-xs font-bold h-8">
                                                Seguir
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 px-2">
                                {["Creators", "Nordeste", "Dicas", "Collabs", "Campanhas"].map((tag) => (
                                    <Badge key={tag} variant="secondary" className="rounded-2xl px-3 py-1 text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
