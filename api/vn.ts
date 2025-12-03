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

interface VnImage {
  url: string;
  thumbnail?: string;
}

interface VnTag {
  id: string;
  name: string;
  rating: number;
  spoiler: number;
  category: string;
}

interface VisualNovel {
  id: string;
  title: string;
  description: string | null;
  image?: VnImage;
  rating: number | null;
  votecount: number;
  length_minutes?: number;
  released?: string;
  tags?: VnTag[];
}

async function getVnById(id: string): Promise<VisualNovel | null> {
  try {
    const response = await fetch('https://api.vndb.org/kana/vn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: ['id', '=', id],
        fields: 'id, title, description, image{url}, rating, votecount, length_minutes, released, tags{name,rating,category,spoiler}',
      }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`VNDB API Error (${response.status}): ${errorText}`);
        return null;
    }
    const data = await response.json();
    return data.results.length > 0 ? data.results[0] : null;
  } catch (error) {
    console.error('Error fetching from VNDB API:', error);
    return null;
  }
}

function sanitize(text: string | null | undefined, maxLength: number): string {
    if (!text) return '';
    const cleaned = text.replace(/\[.*?\]/g, ' ').replace(/\n/g, ' ').replace(/\s\s+/g, ' ').trim();
    if (cleaned.length > maxLength) {
        return cleaned.substring(0, maxLength - 3) + '...';
    }
    return cleaned;
}

function escapeHtml(text: string) {
    return text
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function createHtmlResponse(vn: VisualNovel | null, originalUrl: string) {
    const defaultTitle = 'Sister Sex';
    const defaultDescription = 'A sexy and web application to search VNDB.';
    const defaultImageUrl = new URL('/vite.svg', originalUrl).toString();
    const themeColor = '#1f2937';

    const title = escapeHtml(vn?.title || defaultTitle);
    
    let description = defaultDescription;
    if (vn) {
        const sanitizedDesc = sanitize(vn.description, 900);
        description = sanitizedDesc || `Rating: ${(vn.rating ? (vn.rating / 10).toFixed(2) : 'N/A')} | Votes: ${vn.votecount || 0}`;
    }
    description = escapeHtml(description);

    let imageUrl = defaultImageUrl;
    if (vn) {
        const ogImageUrl = new URL('/api/og-image', originalUrl);
        ogImageUrl.searchParams.set('title', vn.title);
        
        if (vn.image?.url) {
            ogImageUrl.searchParams.set('cover', vn.image.url);
        }
        
        if (vn.rating) {
            ogImageUrl.searchParams.set('rating', vn.rating.toString());
        }
        
        ogImageUrl.searchParams.set('votes', vn.votecount.toString());
        
        if (vn.length_minutes) {
            ogImageUrl.searchParams.set('lengthMinutes', vn.length_minutes.toString());
        }
        
        if (vn.released) {
            const year = vn.released.split('-')[0];
            ogImageUrl.searchParams.set('released', year);
        }
        
        // Improved tag filtering - get content tags, no spoilers, good ratings
        if (vn.tags && vn.tags.length > 0) {
            const topTags = vn.tags
                .filter(tag => 
                    tag.category === 'cont' && 
                    tag.spoiler === 0 && 
                    tag.rating >= 1.5
                )
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 6)
                .map(t => t.name);
            
            if (topTags.length > 0) {
                ogImageUrl.searchParams.set('tags', topTags.join(','));
            }
        }
        
        imageUrl = ogImageUrl.toString();
    }

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="theme-color" content="${themeColor}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${originalUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${title}" />
    <meta property="og:site_name" content="Sister Sex" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${originalUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="${title}" />

    <link rel="stylesheet" href="${CSS_PATH}">
    <script type="module" crossorigin src="${SCRIPT_PATH}"></script>
  </head>
  <body class="bg-gray-900 text-gray-200">
    <div id="root"></div>
  </body>
</html>`;
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const vnId = url.searchParams.get('vn');

  if (!vnId) {
    return new Response('Missing vnId parameter', { status: 400 });
  }

  const vnData = await getVnById(vnId);

  if (!vnData) {
    return new Response('Visual Novel not found', { status: 404 });
  }

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || url.host;
  
  const pathSegment = url.searchParams.get('original_path') ?? '';
  const originalPath = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;
  
  const originalSearchParams = new URLSearchParams(url.search);
  originalSearchParams.delete('original_path');
  const searchString = originalSearchParams.toString();
  
  const originalUrlString = `${proto}://${host}${originalPath}${searchString ? `?${searchString}` : ''}`;

  const html = createHtmlResponse(vnData, originalUrlString);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
