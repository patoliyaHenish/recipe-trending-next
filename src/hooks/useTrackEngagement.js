"use client";
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '../utils/analytics';

const useTrackEngagement = (pageData = {}) => {
    const scrollTracker = useRef({
        25: false,
        50: false,
        75: false,
        90: false
    });
    
    const pathname = usePathname();

    useEffect(() => {
        // Reset trackers on route change
        scrollTracker.current = {
            25: false,
            50: false,
            75: false,
            90: false
        };

        // Time tracking
        const timer30s = setTimeout(() => {
            trackEvent("time_on_recipe_30s", pageData);
        }, 30000);

        const timer2m = setTimeout(() => {
            trackEvent("time_on_recipe_2min", pageData);
        }, 120000);

        // Scroll tracking
        const calculateScrollDepth = () => {
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollable = scrollHeight - clientHeight;

            if (scrollable > 0) {
                const depth = (scrollTop / scrollable) * 100;

                const thresholds = [25, 50, 75, 90];
                thresholds.forEach((threshold) => {
                    if (depth >= threshold && !scrollTracker.current[threshold]) {
                        scrollTracker.current[threshold] = true;
                        trackEvent(`scroll_${threshold}`, pageData);
                    }
                });
            }
        };

        window.addEventListener('scroll', calculateScrollDepth);
        calculateScrollDepth();

        return () => {
            window.removeEventListener('scroll', calculateScrollDepth);
            clearTimeout(timer30s);
            clearTimeout(timer2m);
        };
    }, [pathname, JSON.stringify(pageData)]);
};

export default useTrackEngagement;
