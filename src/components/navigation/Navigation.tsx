'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Logout03Icon, Menu01Icon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';
import { NAV_ITEMS } from '@/lib/constants';
import { useAuthContext } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';
import { usePortalHome } from '@/hooks/use-portal-home';

interface NavigationProps {
    /** Header is transparent over the navy hero: use light text. */
    onDark?: boolean;
}

function ThemeToggle({ onDark }: NavigationProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                'grid size-9 place-items-center rounded-full border transition-colors',
                onDark
                    ? 'border-white/15 text-white/80 hover:bg-white/10 hover:text-white'
                    : 'border-[var(--hairline)] text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
        >
            {isDark ? <HugeiconsIcon icon={Sun03Icon} className="size-4" /> : <HugeiconsIcon icon={Moon02Icon} className="size-4" />}
        </button>
    );
}

export const Navigation = ({ onDark = false }: NavigationProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout, isLoggingOut } = useAuthContext();
    const pathname = usePathname();
    const isHomepage = pathname === '/';
    const isOnEnrollmentPage = pathname === '/enrollment';
    const portal = usePortalHome();
    const showPortalButton = portal && pathname !== portal.href;

    const handleNavClick = (href: string) => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
    };

    const linkClass = cn(
        'relative rounded-full px-3 py-2 text-sm font-medium transition-colors',
        onDark ? 'text-white/75 hover:text-white' : 'text-muted-foreground hover:text-foreground',
    );

    return (
        <>
            {/* Desktop */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
                {isHomepage &&
                    NAV_ITEMS.map((item) => (
                        <button key={item.href} type="button" onClick={() => handleNavClick(item.href)} className={linkClass}>
                            {item.label}
                        </button>
                    ))}
                {user && !isOnEnrollmentPage && (
                    <Link href="/enrollment" className={linkClass}>
                        Enroll In Courses
                    </Link>
                )}
            </nav>

            <div className="flex items-center gap-2">
                <ThemeToggle onDark={onDark} />

                {showPortalButton && (
                    <Button asChild size="sm" variant="brand" className="hidden h-9 rounded-full px-4 sm:inline-flex">
                        <Link href={portal.href}>
                            {portal.label} <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                        </Link>
                    </Button>
                )}

                {user ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => logout()}
                        loading={isLoggingOut}
                        className={cn(
                            'hidden rounded-full sm:inline-flex',
                            onDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground',
                        )}
                    >
                        <HugeiconsIcon icon={Logout03Icon} className="size-4" />
                        Sign out
                    </Button>
                ) : (
                    <Button asChild size="sm" variant="brand" className="hidden h-9 rounded-full px-4 sm:inline-flex">
                        <Link href="/auth/signin">
                            Sign in <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                        </Link>
                    </Button>
                )}

                {/* Mobile */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            aria-label="Open menu"
                            className={cn(
                                'grid size-9 place-items-center rounded-full border lg:hidden',
                                onDark ? 'border-white/15 text-white' : 'border-[var(--hairline)] text-foreground',
                            )}
                        >
                            <HugeiconsIcon icon={Menu01Icon} className="size-4" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[86vw] max-w-sm gap-0 p-0">
                        <SheetHeader className="border-b border-[var(--hairline)] p-5">
                            <SheetTitle className="sr-only">Menu</SheetTitle>
                            <Logo size="sm" />
                        </SheetHeader>
                        <nav className="flex flex-col p-3" aria-label="Mobile">
                            {isHomepage &&
                                NAV_ITEMS.map((item) => (
                                    <button
                                        key={item.href}
                                        type="button"
                                        onClick={() => handleNavClick(item.href)}
                                        className="rounded-lg px-3 py-3 text-left text-[15px] font-medium hover:bg-muted"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            {user && (
                                <Link href="/enrollment" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-muted">
                                    Enroll In Courses
                                </Link>
                            )}
                        </nav>
                        <div className="mt-auto border-t border-[var(--hairline)] p-5">
                            {user ? (
                                <div className="flex flex-col gap-2">
                                    {showPortalButton && (
                                        <Button asChild variant="brand" className="h-11 w-full rounded-full">
                                            <Link href={portal.href} onClick={() => setIsMobileMenuOpen(false)}>
                                                {portal.label} <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    <Button variant="outline" className="w-full rounded-full" onClick={() => logout()} loading={isLoggingOut}>
                                        <HugeiconsIcon icon={Logout03Icon} className="size-4" /> Sign out
                                    </Button>
                                </div>
                            ) : (
                                <Button asChild variant="brand" className="h-11 w-full rounded-full">
                                    <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                                        Sign in to the portal <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};
