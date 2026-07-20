import React from 'react';
import RecipeDetail from '../../../pages_old/users/RecipeDetail';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // ISR: Revalidate every hour

// Fetch recipe details directly on the server for SEO
async function getRecipeDetails(slug) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
    const res = await fetch(`${backendUrl}/api/v1/recipes/slug/${slug}`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching recipe:", err);
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
  return {
    title: recipe.meta_title || recipe.title || 'Recipe Trending',
    description: recipe.meta_description || recipe.description || 'Delicious recipe from Recipe Trending',
    keywords: recipe.keywords?.join(', ') || 'recipe, food',
    openGraph: {
      title: recipe.meta_title || recipe.title,
      description: recipe.meta_description || recipe.description,
      images: recipe.image ? [recipe.image] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.meta_title || recipe.title,
      description: recipe.meta_description || recipe.description,
      images: recipe.image ? [recipe.image] : [],
    }
  };
}

// Optional: Pre-render top recipes at build time
export async function generateStaticParams() {
  return []; // We can add popular slugs here, otherwise they render on demand
}

export default async function RecipePage({ params }) {
  const { slug } = await params;
  
  // We fetch data on server just to confirm it exists, 
  // but we pass control to the client component to preserve interactivity.
  const data = await getRecipeDetails(slug);
  
  if (!data || !data.data) {
    notFound();
  }
  
  const recipe = data.data;

  // Fetch suggestions and fallback in parallel
  const [initialSuggestions, initialFallback] = await Promise.all([
    getRecipeSuggestions(recipe.recipe_id),
    getFallbackRecipes(recipe.food_type)
  ]);

  return (
    <RecipeDetail 
      preloadedSlug={slug} 
      initialData={data} 
      initialSuggestions={initialSuggestions}
      initialFallback={initialFallback}
    />
  );
}
