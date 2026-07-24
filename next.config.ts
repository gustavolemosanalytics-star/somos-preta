import type { NextConfig } from "next";

// Redireciona as URLs antigas (EN) para as novas em português, preservando
// sub-caminhos (ex.: /campaigns/123 -> /campanhas/123).
const routeMap: [string, string][] = [
  ["/campaigns", "/campanhas"],
  ["/contracts", "/contratos"],
  ["/messages", "/mensagens"],
  ["/media-kits", "/midia-kits"],
  ["/creators", "/descobrir"],
  ["/influencers", "/influenciadores"],
  ["/analytics", "/relatorios"],
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
