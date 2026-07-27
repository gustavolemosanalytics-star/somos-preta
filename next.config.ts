import type { NextConfig } from "next";

// Redireciona URLs antigas para a nova estrutura (hub sob /app, creator sob /criador),
// preservando sub-caminhos. Config redirects rodam ANTES do middleware.
// Ordem importa: rotas mais específicas (ex.: /login/midia-kit) vêm antes das genéricas.
const routeMap: [string, string][] = [
  // Creator (subpaths de /login e /midia-kit) — precisam vir antes de /login
  ["/login/midia-kit", "/criador/login"],
  ["/midia-kit/registro", "/criador/criar-conta"],
  ["/midia-kit/criar", "/criador/login"],

  // Hub — EN antigo -> /app
  ["/campaigns", "/app/campanhas"],
  ["/contracts", "/app/contratos"],
  ["/messages", "/app/mensagens"],
  ["/media-kits", "/app/midia-kits"],
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
  ["/midia-kits", "/app/midia-kits"],
  ["/contratos", "/app/contratos"],
  ["/mensagens", "/app/mensagens"],
  ["/relatorios", "/app/relatorios"],
  ["/usuarios", "/app/usuarios"],
  ["/blog-admin", "/app/blog"],
  ["/login", "/app/login"],
  ["/registro", "/app/criar-conta"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return routeMap.flatMap(([from, to]) => [
      { source: from, destination: to, permanent: false },
      { source: `${from}/:path*`, destination: `${to}/:path*`, permanent: false },
    ]);
  },
};

export default nextConfig;
