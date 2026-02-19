"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Users2, GraduationCap, FileImage, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
    { href: "/busca", label: "Busca", icon: Search },
    { href: "/comunidade", label: "Comunidade", icon: Users2 },
    { href: "/cursos", label: "Cursos", icon: GraduationCap },
    { href: "/midia-kit", label: "Mídia Kit", icon: FileImage },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const isLoginPage = pathname?.startsWith("/login")

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                            Somos Preta
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>

                    <div className="flex md:hidden items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center justify-center p-2 rounded-xl transition-all",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <link.icon className="h-5 w-5" />
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Somos Preta.
                    </span>
                    <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Link href="#" className="hover:text-primary transition-colors">Instagram</Link>
                        <Link href="#" className="hover:text-primary transition-colors">LinkedIn</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Contato</Link>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        &copy; 2025 Somos Preta. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
