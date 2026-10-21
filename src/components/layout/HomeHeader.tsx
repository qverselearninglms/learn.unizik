'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useScrollAnimation } from '@/hooks/animations/useScrollAnimation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/Logo';
import { Navigation } from '../navigation/Navigation';

export const HomeHeader: React.FC = () => {
    const { isScrolled } = useScrollAnimation();
    const isHomepage = usePathname() === '/';
    // Transparent over the navy hero; frosted glass everywhere else.
    const onDark = isHomepage && !isScrolled;

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300',
                onDark
                    ? 'border-b border-transparent bg-transparent'
                    : 'border-b border-[var(--hairline)] bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70',
                isScrolled && 'shadow-soft',
            )}
        >
            <div className="container-page flex h-[76px] items-center justify-between gap-6">
                <Logo size="md" tone={onDark ? 'light' : 'dark'} />
                <Navigation onDark={onDark} />
            </div>
        </header>
    );
};
