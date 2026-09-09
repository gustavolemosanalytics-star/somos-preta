"use client"

import * as React from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider as NextThemesProvider } from "next-themes"

function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => new QueryClient())

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                {/*
                  A identidade "Conexões que Transformam" é clara e não define
                  variante escura, e não há toggle de tema na interface. Com
                  enableSystem, quem estivesse com o SO em modo escuro via o
                  site inteiro em #1F1F1F. forcedTheme ignora tanto o SO quanto
                  o que já estiver salvo no localStorage de visitas anteriores.
                  Para reativar o tema escuro um dia: troque forcedTheme por
                  defaultTheme/enableSystem — o bloco .dark do globals.css já
                  está derivado desta paleta.
                */}
                <ThemeProvider
                    attribute="class"
                    forcedTheme="light"
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </QueryClientProvider>
        </SessionProvider>
    )
}
