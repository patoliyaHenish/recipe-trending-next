export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.api.recipetrending.com';
  const sitemapBase = `${apiUrl}/api/sitemap`;

  const childSitemapPaths = [
    'static',
    'categories',
    'subcategories',
    'collections',
  ];

  const resolveChildHref = (path) => {
    if (path === 'static') {
      return `${sitemapBase}/static`;
    }
    if (path === 'recipes') {
      return `${sitemapBase}/recipes/1`;
    }
    return `${sitemapBase}/${path}`;
  };

  const checkSitemapOk = async (href) => {
    try {
      const response = await fetch(href, { method: 'GET', headers: { Accept: 'application/xml' } });
      const text = await response.text();
      const contentType = response.headers.get('content-type') || '';
      const isXml = contentType.includes('xml') || text.trim().startsWith('<?xml');
      const hasUrls = isXml && /<urlset|<\/urlset>|<sitemapindex|<\/sitemapindex>/.test(text);
      return { ok: response.ok && isXml && hasUrls, href, text };
    } catch {
      return { ok: false, href, text: '' };
    }
  };

  let backendIndexResponse = null;

  try {
    backendIndexResponse = await fetch(`${sitemapBase}/`, { method: 'GET', headers: { Accept: 'application/xml' } });
    if (backendIndexResponse.ok) {
      const xml = await backendIndexResponse.text();
      const contentType = backendIndexResponse.headers.get('content-type') || '';
      if ((contentType.includes('xml') || xml.trim().startsWith('<?xml')) && /<sitemapindex|<\/sitemapindex>|<urlset|<\/urlset>/.test(xml)) {
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
          },
        });
      }
    }
  } catch {
    // ignore and fall back to direct children
  }

  const childResults = await Promise.all(childSitemapPaths.map((path) => checkSitemapOk(resolveChildHref(path))));

  const recipesOk = await checkSitemapOk(`${sitemapBase}/recipes/1`);
  if (recipesOk.ok) {
    childResults.push(recipesOk);
  }

  const validChildren = childResults.filter((item) => item.ok);
  if (!validChildren.length) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>', {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }

  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  validChildren.forEach((item) => {
    xml += `<sitemap><loc>${item.href}</loc><lastmod>${today}</lastmod></sitemap>`;
  });
  xml += `</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
