'use client';

import { useEffect, useState } from 'react';

export const useScrollAnimation = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        // The app scrolls <body> (html/body have height: 100%), not the window, so read both.
        const handleScroll = () => {
            setIsScrolled(Math.max(window.scrollY, document.body.scrollTop) > 24);
        };

        handleScroll();
        document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        return () => document.removeEventListener('scroll', handleScroll, { capture: true });
    }, []);

    return { isScrolled };
};

export const useIntersectionObserver = (
    elementRef: React.RefObject<HTMLElement>,
    threshold: number = 0.1
) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold }
        );

        observer.observe(element);
        return () => observer.unobserve(element);
    }, [elementRef, threshold]);

    return isVisible;
};