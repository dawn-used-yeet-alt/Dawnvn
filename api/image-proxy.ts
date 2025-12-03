
export const config = {
  runtime: 'edge',
};

// This function acts as a proxy to bypass potential hotlinking protection on VNDB's image servers.
export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing "url" query parameter', { status: 400 });
  }

  // Security: Only allow proxying images from vndb.org subdomains to prevent abuse.
  try {
    const url = new URL(imageUrl);
    if (!url.hostname.endsWith('.vndb.org')) {
      return new Response('Invalid host for image proxy', { status: 400 });
    }
  } catch (e) {
    return new Response('Invalid URL format', { status: 400 });
  }

  try {
    // Fetch the image from the original source
    const imageResponse = await fetch(imageUrl, {
        headers: {
            // Some servers require a user-agent to serve images
            'User-Agent': 'VNDB-Explorer-Bot/1.0',
        }
    });

    if (!imageResponse.ok) {
        console.error(`Failed to fetch image from source: ${imageResponse.status} ${imageResponse.statusText}`);
      return new Response('Failed to fetch image from source', { status: imageResponse.status });
    }
    
    // Create a new response with the image data and appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', imageResponse.headers.get('Content-Type') || 'image/jpeg');
    // Cache the image on the browser and CDN for 1 week
    headers.set('Cache-Control', 'public, max-age=604800, immutable'); 

    return new Response(imageResponse.body, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}