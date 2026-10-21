'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { usePortalHome } from '@/hooks/use-portal-home';

export function CallToAction() {
    const portal = usePortalHome();
    return (
        <section className="bg-background py-24 sm:py-28">
            <div className="container-page">
                <div className="relative overflow-hidden rounded-[32px] border border-[var(--hairline)] bg-[var(--ivory)] px-6 py-16 text-center sm:px-16">
                    <div
                        aria-hidden
                        className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
                    />
                    <p className="eyebrow relative">Ready when you are</p>
                    <h2 className="font-display relative mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] text-balance text-foreground sm:text-5xl">
                        Start your session the <span className="text-accent">smart</span> way
                    </h2>
                    <p className="relative mx-auto mt-5 max-w-xl text-muted-foreground sm:text-lg">
                        Sign in with your university email to choose your courses and join your classes.
                    </p>
                    <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                        <Button asChild variant="gradient" size="xl" className="rounded-full px-8">
                            <Link href={portal?.href ?? '/auth/signin'}>
                                {portal?.label ?? 'Sign in'} <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                            </Link>
                        </Button>
                        {!portal && (
                            <Button asChild variant="outline" size="xl" className="rounded-full px-8">
                                <Link href="/auth/create-account">Create an account</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
