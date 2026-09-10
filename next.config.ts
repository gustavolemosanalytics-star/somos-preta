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

// Condição para excluir o subdomínio da plataforma de um redirect.
const HOST_PLATAFORMA = [{ type: "host" as const, value: "plataforma.somospreta.com" }]

// A área do creator saiu de /criador para /creator; estes redirects preservam
// links, bookmarks e e-mails já enviados apontando para a rota antiga.
const criadorParaCreator: [string, string][] = [
  ["/criador", "/creator"],
]

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...legacyMidiaKitPaths.map((source) => ({
        source,
        destination: "/",
        permanent: false,
      })),
      ...criadorParaCreator.flatMap(([from, to]) => [
        { source: from, destination: to, permanent: false },
        { source: `${from}/:path*`, destination: `${to}/:path*`, permanent: false },
      ]),
      // Estes redirects levam rotas antigas para o prefixo /app. No subdomínio da
      // plataforma o prefixo não existe na URL — /dashboard já É o dashboard —,
      // então ali eles não podem valer: rodam antes do middleware e roubariam a
      // rota antes do rewrite acontecer.
      ...routeMap.flatMap(([from, to]) => [
        { source: from, destination: to, permanent: false, missing: HOST_PLATAFORMA },
        { source: `${from}/:path*`, destination: `${to}/:path*`, permanent: false, missing: HOST_PLATAFORMA },
      ]),
    ];
  },
};

export default nextConfig;
