
export const config = {
  runtime: 'edge',
};

// A Vercel Edge Function to handle bookmarking logic using Vercel KV.
export default async function handler(req: Request) {
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return new Response(JSON.stringify({ error: 'Storage not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type') || 'vn'; // Default to 'vn' for backward compatibility
  const key = `bookmarks:${type}`;

  const kvFetch = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${KV_REST_API_URL}/${path}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`KV Error: ${errorText}`);
      throw new Error(`KV Error (${response.status})`);
    }
    return response.json();
  };



  try {
    switch (req.method) {
      case 'GET': {
        const { result } = await kvFetch(`smembers/${key}`);
        // Clean up malformed data from previous versions by attempting to parse each item.
        const bookmarks = (result || []).map((item: string) => {
          try {
            // Malformed items look like '["v24"]'. Parsing gives ['v24'].
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return String(parsed[0]);
            }
          } catch (e) {
            // This is not a JSON string, so it's probably a correct item like 'v24'.
          }
          return item; // Return the item as is if it's not a parsable array.
        }).filter(Boolean);

        // Ensure we only return unique IDs after cleanup.
        const uniqueBookmarks = [...new Set(bookmarks)];

        return new Response(JSON.stringify(uniqueBookmarks), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'POST': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
        }
        // Use the path-based SADD command to prevent any body serialization issues.

        await kvFetch(`sadd/${key}/${id}`, {
          method: 'POST',
        });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      case 'DELETE': {
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
        }
        // When unbookmarking, the client sends the clean ID.

        // We must attempt to remove both the clean ID and the old malformed ID 

        // to handle and clean up old data. The SREM command accepts multiple members.

        await kvFetch(`srem/${key}/${id}`, {
            method: 'POST',
        });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      default:
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { 'Allow': 'GET, POST, DELETE' },
        });
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}