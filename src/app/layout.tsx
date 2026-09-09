import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

// Manuscrita usada nas assinaturas editoriais da landing ("Nossa influência move territórios").
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Somos Preta - Hub de Creators",
  description: "Plataforma de Gestão de Influenciadores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={caveat.variable}>
      <body className={inter.className}>
        <Providers>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
