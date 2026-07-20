import React from 'react';
import RecipeDetail from '../../pages_old/users/RecipeDetail';
import { notFound } from 'next/navigation';

// Fetch recipe details directly on the server for SEO
async function getRecipeDetails(slug) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
    const url = `${backendUrl}/api/recipe/slug/${slug}`;

    const res = await fetch(url, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching recipe details:", err);
    return null;
  }
}

async function getRecipeSuggestions(recipeId) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
    const res = await fetch(`${backendUrl}/api/recipe/get-recipe-suggestions?recipeId=${recipeId}&limit=16`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

async function getFallbackRecipes(foodType) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
    const res = await fetch(`${backendUrl}/api/search/recipes?preference=${foodType || ''}&limit=12&sortBy=total_views`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// Generate Metadata for SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getRecipeDetails(slug);
  
  if (!data?.data) {
    return { title: 'Recipe Not Found' };
  }
  
  const recipe = data.data;
  const pageTitle = recipe.meta_title || recipe.title || 'Recipe Details';
  const pageDesc = recipe.meta_description || recipe.description || 'Delicious recipe from Recipe Trending';
  const imageUrl = recipe.image_url || '';

  return {
    title: `${pageTitle} | Recipe Trending`,
    description: pageDesc,
    openGraph: {
      title: `${pageTitle} | Recipe Trending`,
      description: pageDesc,
      images: imageUrl ? [imageUrl] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pageTitle} | Recipe Trending`,
      description: pageDesc,
      images: imageUrl ? [imageUrl] : [],
    }
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  
  if (!slug) {
    notFound();
  }

  // Fetch initial data for True SSR
  const initialData = await getRecipeDetails(slug);
  
  if (!initialData || !initialData.data) {
    notFound();
  }

  const recipe = initialData.data;
  
  // Fetch suggestions and fallback in parallel
  const [initialSuggestions, initialFallback] = await Promise.all([
    getRecipeSuggestions(recipe.recipe_id),
    getFallbackRecipes(recipe.food_type)
  ]);

  return (
    <RecipeDetail 
      key={slug}
      recipeSlug={slug} 
      initialData={initialData}
      initialSuggestions={initialSuggestions}
      initialFallback={initialFallback}
    />
  );
}
