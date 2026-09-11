export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.api.recipetrending.com';
  const response = await fetch(`${apiUrl}/api/sitemap`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }

  const xml = await response.text();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
