/** @type {import('next').NextConfig} */

// CSP report-only del audit de seguridad del modulo 1 (deuda capturada). Se
// observa sin bloquear; frame-src cubre los embeds YouTube/Vimeo de biblioteca.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseHost = supabaseUrl.startsWith('https://')
  ? supabaseUrl.slice(8).replace(/\/+$/, '')
  : null;

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.google.com/s2",
  "font-src 'self'",
  `connect-src 'self'${supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : ''}`,
  'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'"
].join('; ') + ';';

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
        ],
      },
    ];
  },
};
export default nextConfig;
