import Home from "../pages_old/Home";

export const metadata = {
  title: "Recipe Trending",
  description: "Join Recipe Trending to find amazing recipes based on ingredients you have. Explore diverse cuisines, save your favorites, and enjoy cooking made simple.",
  openGraph: {
    title: "Recipe Trending",
    description: "Join Recipe Trending to find amazing recipes based on ingredients you have. Explore diverse cuisines, save your favorites, and enjoy cooking made simple.",
    type: "website",
    siteName: "Recipe Trending",
    url: "https://www.recipetrending.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipe Trending",
    description: "Join Recipe Trending to find amazing recipes based on ingredients you have. Explore diverse cuisines, save your favorites, and enjoy cooking made simple.",
  },
};

export const dynamic = 'force-dynamic';

export default function Page() {
  return <Home />;
}
