'use client';

import Link from 'next/link';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowUpRight01Icon, BookOpen01Icon, ComputerVideoIcon, FileValidationIcon } from '@hugeicons/core-free-icons';
import { SectionHeading } from './SectionHeading';
import { usePortalHome } from '@/hooks/use-portal-home';

interface Service {
    title: string;
    description: string;
    href: string;
    icon: IconSvgElement;
    tag?: string;
}

const SERVICES: Service[] = [
    {
        title: 'GS registration',
        description: 'Pick your General Studies courses for the session in a few taps.',
        href: '/gs-registration',
        icon: FileValidationIcon,
        tag: 'Open',
    },
    {
        title: 'My courses',
        description: 'See every course you are enrolled in and pick up where you left off.',
        href: '/enrollment',
        icon: BookOpen01Icon,
    },
    {
        title: 'Virtual classroom',
        description: 'Join lectures, read materials and submit assessments in one place.',
        href: '/auth/signin',
        icon: ComputerVideoIcon,
    },
];

export function Services() {
    const portal = usePortalHome();
    return (
        <section id="services" className="relative bg-background py-24 sm:py-28">
            <div className="container-page">
                <SectionHeading
                    eyebrow="Student services"
                    title="Everything you need for the session, in one place"
                    description="Sign in once and move from registration to class without queues or paperwork."
                />

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.map(({ title, description, href, icon: Icon, tag }, i) => (
                        <li key={title}>
                            <Link
                                href={portal && href === '/auth/signin' ? portal.href : href}
                                className="group relative flex h-full flex-col rounded-3xl border border-[var(--hairline)] bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="grid size-12 place-items-center rounded-2xl bg-primary/[0.07] text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white dark:bg-white/[0.06] dark:text-[oklch(0.8_0.08_250)]">
                                        <HugeiconsIcon icon={Icon} className="size-5" />
                                    </span>
                                    <span className="font-display text-sm text-muted-foreground/70">0{i + 1}</span>
                                </div>
                                <h3 className="mt-8 flex items-center gap-2 text-lg font-semibold text-foreground">
                                    {title}
                                    {tag && (
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                            {tag}
                                        </span>
                                    )}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-primary dark:text-[oklch(0.8_0.08_250)]">
                                    Open
                                    <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
