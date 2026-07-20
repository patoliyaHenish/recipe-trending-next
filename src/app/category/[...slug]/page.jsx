import React from 'react';
import CategoryPage from '../../../pages_old/users/CategoryPage';
import { notFound } from 'next/navigation';


import { cookies } from 'next/headers';

// Fetch category/subcategory details directly on the server for SEO
async function getCategoryDetails(slugArray) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
    let url = '';
    
    // Read user preference from cookies if available
    const cookieStore = await cookies();
    const preference = cookieStore.get('userPreference')?.value || '';
    
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '12'); // Same as RECIPES_PER_PAGE in CategoryPage
    if (preference) params.append('preference', preference);

    if (slugArray.length === 1) {
      // Category
      url = `${backendUrl}/api/recipe/category/${slugArray[0]}?${params.toString()}`;
    } else if (slugArray.length === 2) {
      // SubCategory
      url = `${backendUrl}/api/recipe/sub-category/${slugArray[1]}?${params.toString()}`;
    } else {
      return null;
    }

    const res = await fetch(url, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return { data, preference };
  } catch (err) {
    console.error("Error fetching category:", err);
    return null;
  }
}

// Generate Metadata for SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await getCategoryDetails(slug);
  const data = result?.data;
  
  if (!data?.data) {
    return { title: 'Category Not Found' };
  }
  
  let pageTitle = 'Category';
  let pageDesc = 'Delicious recipes from Recipe Trending';
  let imageUrl = '';

  if (slug.length === 1 && data.data.category) {
    pageTitle = data.data.category.meta_title || data.data.category.name;
    pageDesc = data.data.category.meta_description || data.data.category.description || pageDesc;
    imageUrl = data.data.category.image || '';
  } else if (slug.length === 2 && data.data.subCategory) {
    pageTitle = data.data.subCategory.meta_title || data.data.subCategory.name;
    pageDesc = data.data.subCategory.meta_description || data.data.subCategory.description || pageDesc;
    imageUrl = data.data.subCategory.image || '';
  }

  return {
    title: `${pageTitle} | Recipe Trending`,
    description: pageDesc,
    openGraph: {
      title: `${pageTitle} | Recipe Trending`,
      description: pageDesc,
      images: imageUrl ? [imageUrl] : [],
      type: 'website',
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
  
  if (!slug || slug.length > 2) {
    notFound();
  }

  const categorySlug = slug[0];
  const subCategorySlug = slug.length > 1 ? slug[1] : undefined;

  // Fetch initial data for True SSR
  const result = await getCategoryDetails(slug);
  const initialData = result?.data || null;
  const initialPreference = result?.preference || '';

  return (
    <CategoryPage 
      key={slug.join('/')}
      categorySlug={categorySlug} 
      subCategorySlug={subCategorySlug} 
      initialData={initialData}
      initialPreference={initialPreference}
    />
  );
}
