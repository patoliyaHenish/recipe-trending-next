import BannerRecipes from '../../pages_old/users/BannerRecipes';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Recipe Spotlight | Recipe Trending',
  description: 'View highlighted and spotlight recipes on Recipe Trending.',
};

export default async function RecipeSpotlightPage({ searchParams }) {
  const params = await searchParams;
  const title = typeof params?.title === 'string' ? params.title : '';
  const image = typeof params?.image === 'string' ? params.image : '';

  return <BannerRecipes bannerTitle={title} bannerImage={image} />;
}
