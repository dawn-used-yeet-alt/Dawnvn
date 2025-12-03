export const config = {
  runtime: 'edge',
};

import manifest from '../dist/.vite/manifest.json';

const entry = Object.values(manifest).find(
  (m: any) => m.isEntry && m.file.includes('index') && m.file.endsWith('.js')
);
const SCRIPT_PATH = '/' + ((entry as any)?.file || 'assets/index.js');
const CSS_PATH =
  '/' + (((entry as any)?.css && (entry as any).css[0]) || 'assets/index.css');

// Simple bot detection
function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const botPattern =
    /bot|crawler|spider|crawling|facebookexternalhit|discordbot|twitterbot|slackbot|embedly|imouto|whatsapp|telegram|onee|pinterest|redditbot/i;
  return botPattern.test(userAgent);
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const ua = req.headers.get('user-agent') || '';
  const path = url.pathname;

  // Check for VN ID in the path, e.g., /v123
  const vnIdFromPath = path.startsWith('/v') ? path.substring(1) : null;
  const charIdFromPath = path.startsWith('/c') ? path.substring(1) : null;

  // Redirect legacy URLs with ?char=... to /c...
  const charIdParam = url.searchParams.get('char');
  if (charIdParam && !charIdFromPath) {
    const newUrl = new URL(`/${charIdParam}`, url.origin);
    return Response.redirect(newUrl, 301);
  }

  // If it's a bot and has a VN ID from the path or the `vn` param, fetch SSR HTML
  if (isBot(ua)) {
    const charId = charIdFromPath;
    const vnId = vnIdFromPath || url.searchParams.get('vn');

    if (charId) {
      const charUrl = new URL('/api/character', url.origin);
      charUrl.searchParams.set('char', charId);
      charUrl.searchParams.set('original_path', url.pathname);

      // forward any other params
      url.searchParams.forEach((value, key) => {
        if (key !== 'char') charUrl.searchParams.set(key, value);
      });

      const response = await fetch(charUrl);
      return response;
    }

    if (vnId) {
      const vnUrl = new URL('/api/vn', url.origin);
      vnUrl.searchParams.set('vn', vnId);
      vnUrl.searchParams.set('original_path', url.pathname);

      // forward any other params
      url.searchParams.forEach((value, key) => {
        if (key !== 'vn') vnUrl.searchParams.set(key, value);
      });

      const response = await fetch(vnUrl);
      return response;
    }
  }

  // Regular ni-chans just get the SPA index
  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Sister Sex</title>
      <link rel="stylesheet" crossorigin href="${CSS_PATH}" />
      <script type="module" crossorigin src="${SCRIPT_PATH}"></script>
    </head>
    <body class="bg-gray-900 text-gray-200">
      <div id="root"></div>
    </body>
  </html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
