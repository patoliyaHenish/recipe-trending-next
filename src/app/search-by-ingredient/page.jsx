import SearchByIngredientPage from '../../pages_old/users/SearchByIngredientPage';

export const metadata = {
  title: 'Search by Ingredient | Recipe Trending',
  description: 'Find recipes based on the ingredients you already have in your kitchen. Search by ingredient on Recipe Trending.',
  openGraph: {
    title: 'Search by Ingredient | Recipe Trending',
    description: 'Find recipes based on the ingredients you already have in your kitchen.',
  },
};

export default function Page() {
  return <SearchByIngredientPage />;
}

