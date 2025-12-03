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

interface CharacterImage {
    url: string;
}

interface CharacterTrait {
    id: string;
    name: string;
    spoiler: number;
    group_name?: string;
    category?: string;
}

interface Character {
    id: string;
    name: string;
    original: string | null;
    aliases: string[];
    description: string | null;
    image: CharacterImage | null;
    blood_type: string | null;
    height: number | null;
    weight: number | null;
    bust: number | null;
    waist: number | null;
    hips: number | null;
    cup: string | null;
    age: number | null;
    birthday: number[] | null; // [month, day]
    sex: string[] | null;
    gender: string | null;
    traits: CharacterTrait[];
}

async function getCharacterById(id: string): Promise<Character | null> {
    try {
        const response = await fetch('https://api.vndb.org/kana/character', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters: ['id', '=', id],
                fields: 'id, name, original, aliases, description, image.url, blood_type, height, weight, bust, waist, hips, cup, age, birthday, sex, gender, traits{id, name, spoiler, group_name}',
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`VNDB API Error (${response.status}): ${errorText}`);
            return null;
        }
        const data = await response.json();
        if (data.results.length > 0) {
            const char = data.results[0];
            // Map group_name to category for traits to match service logic
            if (char.traits) {
                char.traits = char.traits.map((trait: any) => ({
                    ...trait,
                    category: trait.group_name || 'general'
                }));
            }
            return char;
        }
        return null;
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

function createHtmlResponse(char: Character | null, originalUrl: string) {
    const defaultTitle = 'Sister Sex';
    const defaultDescription = 'A sexy and web application to search VNDB.';
    const defaultImageUrl = new URL('/vite.svg', originalUrl).toString();
    const themeColor = '#1f2937';

    const title = escapeHtml(char?.name || defaultTitle);

    let description = defaultDescription;
    if (char) {
        const sanitizedDesc = sanitize(char.description, 900);
        if (sanitizedDesc) {
            description = sanitizedDesc;
        } else {
            description = "No description available, You can add some on vndb if you want";
        }
    }
    description = escapeHtml(description);

    let imageUrl = defaultImageUrl;
    if (char) {
        const ogImageUrl = new URL('/api/og-image', originalUrl);
        ogImageUrl.searchParams.set('title', char.name);

        if (char.image?.url) {
            ogImageUrl.searchParams.set('cover', char.image.url);
        }

        if (char.age) ogImageUrl.searchParams.set('age', char.age.toString());
        if (char.height) ogImageUrl.searchParams.set('height', char.height.toString());
        if (char.blood_type) ogImageUrl.searchParams.set('blood_type', char.blood_type);
        if (char.bust) ogImageUrl.searchParams.set('bust', char.bust.toString());
        if (char.waist) ogImageUrl.searchParams.set('waist', char.waist.toString());
        if (char.hips) ogImageUrl.searchParams.set('hips', char.hips.toString());
        if (char.cup) ogImageUrl.searchParams.set('cup', char.cup);

        if (char.birthday && char.birthday.length === 2) {
            // Format birthday as Month Day (e.g. "10-25" -> "October 25")
            // Just passing the array string for now, can format in OG handler
            ogImageUrl.searchParams.set('birthday', `${char.birthday[0]}-${char.birthday[1]}`);
        }

        if (char.traits && char.traits.length > 0) {
            const topTraits = char.traits
                .filter(t => t.spoiler === 0) // No spoilers
                .slice(0, 20)
                .map(t => t.name);

            if (topTraits.length > 0) {
                ogImageUrl.searchParams.set('tags', topTraits.join(','));
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
    const charId = url.searchParams.get('char');

    if (!charId) {
        return new Response('Missing char parameter', { status: 400 });
    }

    const charData = await getCharacterById(charId);

    if (!charData) {
        return new Response('Character not found', { status: 404 });
    }

    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || url.host;

    const pathSegment = url.searchParams.get('original_path') ?? '';
    const originalPath = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;

    const originalSearchParams = new URLSearchParams(url.search);
    originalSearchParams.delete('original_path');
    const searchString = originalSearchParams.toString();

    const originalUrlString = `${proto}://${host}${originalPath}${searchString ? `?${searchString}` : ''}`;

    const html = createHtmlResponse(charData, originalUrlString);

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
    });
}
