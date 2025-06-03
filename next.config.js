/** @type {import("next").NextConfig} */
const nextConfig = {
  // ... outras configurações ...

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dgctteiqpysmyffubifh.supabase.co", // <<< VERIFIQUE SE ESTE HOSTNAME ESTÁ CORRETO E PRESENTE
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ... outras configurações ...
};

module.exports = nextConfig;
