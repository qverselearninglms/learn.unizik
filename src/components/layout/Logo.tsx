import { SITE_TITLE } from '@/config';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface LogoProps {
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** `light` = for dark backgrounds (hero, footer). */
    tone?: 'dark' | 'light';
    className?: string;
}

const SIZES = {
    sm: { crest: 'size-9', title: 'text-sm', sub: 'text-[10px]' },
    md: { crest: 'size-11', title: 'text-base', sub: 'text-[11px]' },
    lg: { crest: 'size-12', title: 'text-lg', sub: 'text-xs' },
};

export const Logo: React.FC<LogoProps> = ({ showText = true, size = 'md', tone = 'dark', className }) => {
    const s = SIZES[size];
    return (
        <Link href="/" className={cn('group flex items-center gap-3 no-underline', className)} aria-label={`${SITE_TITLE} home`}>
            <span className={cn('relative shrink-0 transition-transform duration-300 group-hover:scale-105', s.crest)}>
                <Image src="/logo/logo-removebg-preview.png" alt="" fill sizes="48px" className="object-contain" priority />
            </span>
            {showText && (
                <span className="flex flex-col leading-none">
                    <span
                        className={cn(
                            'font-display font-semibold tracking-tight',
                            s.title,
                            tone === 'light' ? 'text-white' : 'text-foreground',
                        )}
                    >
                        {SITE_TITLE}
                    </span>
                    <span
                        className={cn(
                            'mt-1 whitespace-nowrap font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em]',
                            s.sub,
                            tone === 'light' ? 'text-white/60' : 'text-muted-foreground',
                        )}
                    >
                        Nnamdi Azikiwe University
                    </span>
                </span>
            )}
        </Link>
    );
};
