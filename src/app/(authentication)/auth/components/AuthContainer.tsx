'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { BrandingPanel } from '@/components/global/generic-componenets';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';

interface AuthContainerProps {
    children: ReactNode;
    className?: string;
    /** `wide` gives multi-step forms (sign-up) more room. */
    width?: 'default' | 'wide';
    variant?: 'signin' | 'signup';
}

/** Full-screen split layout shared by sign-in, sign-up and the password pages. */
const AuthContainer = ({ children, className, width = 'default', variant = 'signin' }: AuthContainerProps) => {
    return (
        <div className={cn("grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]", className)}>
            <BrandingPanel variant={variant} className="sticky top-0 hidden h-screen lg:flex" />

            <div className="relative flex min-h-screen flex-col">
                <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
                <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
                    <div className="lg:invisible">
                        <Logo size="sm" />
                    </div>
                    <Link
                        href="/"
                        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--hairline)] px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                        <span className="hidden sm:inline">Back to home</span>
                        <span className="sm:hidden">Home</span>
                    </Link>
                </header>

                <main className="relative flex flex-1 items-center justify-center px-6 pb-12 pt-4 sm:px-10">
                    <div
                        className={cn(
                            'w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-700',
                            width === 'wide' ? 'max-w-2xl' : 'max-w-md',
                        )}
                    >
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AuthContainer
