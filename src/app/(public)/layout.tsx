"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navLinks = [
    { href: "/blog", label: "Blog" },
    { href: "/criador/criar-conta", label: "Sou criador" },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname?.startsWith("/login")

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <nav className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">S</span>
                        </div>
                        <span className="text-lg font-semibold tracking-tight">Somos Preta</span>
                    </Link>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border/60">
                <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xs">S</span>
                        </div>
                        <span className="font-semibold tracking-tight">Somos Preta</span>
                    </div>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                    </div>
                    <p className="text-xs text-muted-foreground">&copy; 2026 Somos Preta</p>
                </div>
            </footer>
        </div>
    )
}
