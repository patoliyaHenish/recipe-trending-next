import BannerRecipes from '../../../pages_old/users/BannerRecipes';

export async function generateMetadata({ params }) {
  const { collectionName } = params;
  const name = collectionName?.split('-').join(' ') || 'Collection';
  return {
    title: `${name} | Recipe Trending`,
    description: `Explore the ${name} collection on Recipe Trending.`,
  };
}

export default async function CollectionSpotlightPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const image = typeof resolvedParams?.image === 'string' ? resolvedParams.image : '';

  return <BannerRecipes bannerImage={image} />;
}
