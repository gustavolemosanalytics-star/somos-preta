import { TopNavbar } from "@/components/top-navbar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <TopNavbar />
            <main className="pt-16">
                {children}
            </main>
        </div>
    )
}
