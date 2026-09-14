import type { NextConfig } from "next";

// Redirects de compatibilidade. Rodam ANTES do middleware, então aqui só entram
// renomeações de caminho que valem em QUALQUER host. O roteamento por host —
// decidir se /clientes é o painel ou não existe — é do middleware, que é quem
// sabe em que domínio a requisição chegou.
//
// Todo destino aponta para a forma interna /app/..., e não para a limpa. É de
// propósito: o middleware traduz /app/x para /x no subdomínio do painel e manda
// para o subdomínio quando o pedido chegou pelo site. Apontar direto para /x
// criaria laço no painel (/x volta a virar /app/x no rewrite) e cairia no site
// errado quando o nome é ambíguo — /blog existe nos dois lugares.
const routeMap: [string, string][] = [
  // Nomes em inglês, da primeira versão do hub
  ["/campaigns", "/app/campanhas"],
  ["/contracts", "/app/contratos"],
  ["/messages", "/app/mensagens"],
  ["/creators", "/app/descobrir"],
  ["/influencers", "/app/criadores"],
  ["/analytics", "/app/relatorios"],

  // Renomeações internas
  ["/app/influenciadores", "/app/criadores"],
  ["/blog-admin", "/app/blog"],
  ["/registro", "/app/criar-conta"],
];

// URLs antigas do produto "Mídia Kit" (removido). Mantidas como redirect
// simples para a home em vez de 404, cobrindo links/bookmarks externos
// antigos. Precisam vir ANTES do routeMap: sem isso, o wildcard genérico
// capturaria "/login/midia-kit" primeiro.
const legacyMidiaKitPaths = [
  "/midia-kit",
  "/login/midia-kit",
  "/midia-kit/registro",
  "/midia-kit/criar",
];

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
      ...routeMap.flatMap(([from, to]) => [
        { source: from, destination: to, permanent: false },
        { source: `${from}/:path*`, destination: `${to}/:path*`, permanent: false },
      ]),
    ];
  },
};

export default nextConfig;
