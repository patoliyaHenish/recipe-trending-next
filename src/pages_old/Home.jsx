"use client";
import React, { useEffect } from 'react'
import Banner from '../components/home-page/Banner'
import SearchByIngredients from '../components/home-page/SearchByIngredients'
import HomeSections from '../components/home-page/HomeSections'
import { AdsterraBanner728x90, AdsterraNativeBanner } from '../components/ads'
import { trackEvent, trackLandingPage } from '../utils/analytics'

const Home = () => {
    useEffect(() => {
        trackEvent("page_view", { page: "home" });
        trackLandingPage("home", "Recipe Trending | Find Your Next Favorite Recipe");

        const title = "Recipe Trending | Find Your Next Favorite Recipe";
        const metaDesc = "Join Recipe Trending to find amazing recipes based on ingredients you have. Explore diverse cuisines, save your favorites, and enjoy cooking made simple.";
        
        document.title = title;

        let metaDescriptionTag = document.querySelector('meta[name="description"]');
        if (!metaDescriptionTag) {
            metaDescriptionTag = document.createElement('meta');
            metaDescriptionTag.name = "description";
            document.head.appendChild(metaDescriptionTag);
        }
        metaDescriptionTag.setAttribute('content', metaDesc);

        return () => {
            document.title = "Recipe Trending";
        };
    }, []);

  return (
    <div className="w-full">
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Banner />
        <SearchByIngredients />

        {/* Ad between SearchByIngredients and First Home Section */}
        <div className="flex justify-center my-0 w-full">
          <div className="block md:hidden w-full">
            <AdsterraNativeBanner />
          </div>
          <div className="hidden md:block">
            <AdsterraBanner728x90 />
          </div>
        </div>

        <HomeSections />
      </div>
    </div>
  )
}

export default Home
