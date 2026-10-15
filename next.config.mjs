function supabaseOrigin() {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (raw) return new URL(raw).origin;
  } catch {
    // ignore — fall back to the known project URL below
  }
  return "https://fvvretvbeiovjozpqbyk.supabase.co";
}

const SUPABASE_ORIGIN = supabaseOrigin();

const csp = [
  "default-src 'self'",
  // Next.js needs 'unsafe-inline' (+ 'unsafe-eval' in dev) for its scripts.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_ORIGIN} https://*.supabase.co wss://*.supabase.co`,
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  // Image uploads go through server actions (admin only, max 5 MB files).
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
