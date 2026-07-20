import Home from "../pages_old/Home";

export const metadata = {
  title: "Recipe Trending | Find Your Next Favorite Recipe",
  description: "Join Recipe Trending to find amazing recipes based on ingredients you have. Explore diverse cuisines, save your favorites, and enjoy cooking made simple.",
  openGraph: {
    title: "Recipe Trending | Find Your Next Favorite Recipe",
    description: "Join Recipe Trending to find amazing recipes based on ingredients you have. Explore diverse cuisines, save your favorites, and enjoy cooking made simple.",
    type: "website",
  },
};

export const revalidate = 3600; // ISR for the home page

export default function Page() {
  return <Home />;
}
