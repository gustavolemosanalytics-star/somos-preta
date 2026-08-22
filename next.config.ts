import type { NextConfig } from "next";

// Redireciona URLs antigas para a nova estrutura (hub sob /app),
// preservando sub-caminhos. Config redirects rodam ANTES do middleware.
// Ordem importa: rotas mais específicas vêm antes das genéricas.
const routeMap: [string, string][] = [
  // Hub — EN antigo -> /app
  ["/campaigns", "/app/campanhas"],
  ["/contracts", "/app/contratos"],
  ["/messages", "/app/mensagens"],
  ["/creators", "/app/descobrir"],
  ["/influencers", "/app/criadores"],
  ["/analytics", "/app/relatorios"],

  // Hub — PT na raiz (antes do prefixo /app) -> /app
  ["/dashboard", "/app/dashboard"],
  ["/clientes", "/app/clientes"],
  ["/campanhas", "/app/campanhas"],
  ["/tarefas", "/app/tarefas"],
  ["/influenciadores", "/app/criadores"],
  ["/app/influenciadores", "/app/criadores"],
  ["/descobrir", "/app/descobrir"],
  ["/contratos", "/app/contratos"],
  ["/mensagens", "/app/mensagens"],
  ["/relatorios", "/app/relatorios"],
  ["/usuarios", "/app/usuarios"],
  ["/blog-admin", "/app/blog"],
  ["/login", "/app/login"],
  ["/registro", "/app/criar-conta"],
];

// URLs antigas do produto "Mídia Kit" (removido). Mantidas como redirect
// simples para a home em vez de 404, cobrindo links/bookmarks externos
// antigos. Precisam vir ANTES do routeMap: sem isso, o wildcard genérico
// de "/login" (via routeMap) capturaria "/login/midia-kit" primeiro.
const legacyMidiaKitPaths = [
  "/midia-kit",
  "/login/midia-kit",
  "/midia-kit/registro",
  "/midia-kit/criar",
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...legacyMidiaKitPaths.map((source) => ({
        source,
        destination: "/",
        permanent: false,
      })),
      ...routeMap.flatMap(([from, to]) => [
        { source: from, destination: to, permanent: false },
        { source: `${from}/:path*`, destination: `${to}/:path*`, permanent: false },
      ]),
    ];
  },
};

export default nextConfig;
