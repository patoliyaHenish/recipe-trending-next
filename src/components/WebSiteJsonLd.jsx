const WebSiteJsonLd = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Recipe Trending",
    url: "https://www.recipetrending.com",
    description:
      "Join Recipe Trending to find amazing recipes based on ingredients you have. Explore diverse cuisines, save your favorites, and enjoy cooking made simple.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default WebSiteJsonLd;
