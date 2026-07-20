"use client";
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const useTrackEngagement = (pageData) => {
    const scrollDepthRef = useRef(0);
    const startTimeRef = useRef(Date.now());
    const pathname = usePathname();

    useEffect(() => {
        scrollDepthRef.current = 0;
        startTimeRef.current = Date.now();

        const calculateScrollDepth = () => {
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

            const scrollable = scrollHeight - clientHeight;
            if (scrollable > 0) {
                let depth = Math.round((scrollTop / scrollable) * 100);
                if (depth > scrollDepthRef.current) {
                    scrollDepthRef.current = Math.min(depth, 100);
                }
            } else {
                scrollDepthRef.current = 100;
            }
        };

        window.addEventListener('scroll', calculateScrollDepth);

        calculateScrollDepth();

        return () => {
            window.removeEventListener('scroll', calculateScrollDepth);

            const timeSpent = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
            const finalScrollDepth = scrollDepthRef.current;

            if (window.gtag && pageData) {
                window.gtag("event", "content_engagement", {
                    ...pageData,
                    scroll_depth: finalScrollDepth,
                    reading_time: timeSpent
                });
            }
        };
    }, [pathname, pageData]);
};

export default useTrackEngagement;


