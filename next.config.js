/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removendo output: 'export' para permitir funcionalidades dinâmicas
  images: {
    domains: ['localhost', 'supabase.co'],
    unoptimized: false,
  },
};

module.exports = nextConfig;
