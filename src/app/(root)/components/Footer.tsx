import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Call02Icon, Globe02Icon, Location01Icon, Mail01Icon } from '@hugeicons/core-free-icons';
import { SITE_TITLE } from '@/config';
import { FOOTER_SECTIONS } from '@/lib/constants';
import { Logo } from '@/components/layout/Logo';

const CONTACT = [
    { icon: Location01Icon, label: 'Awka, Anambra State, Nigeria' },
    { icon: Call02Icon, label: '+234 (0) 48 550 940', href: 'tel:+23448550940' },
    { icon: Mail01Icon, label: 'info@unizik.edu.ng', href: 'mailto:info@unizik.edu.ng' },
    { icon: Globe02Icon, label: 'learn.unizik.edu.ng', href: 'https://learn.unizik.edu.ng' },
];

export const Footer: React.FC = () => {
    return (
        <footer className="relative overflow-hidden bg-[var(--navy-950)] text-white">
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-20">
                <div>
                    <Logo tone="light" />
                    <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">
                        The e-learning portal of Nnamdi Azikiwe University, Awka. Course registration and
                        teaching for every Zikite, wherever they are.
                    </p>
                    <p className="font-display mt-6 text-lg text-white/80">Discipline · Self-reliance · Excellence</p>
                </div>

                {FOOTER_SECTIONS.map((section) => (
                    <nav key={section.title} aria-label={section.title}>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{section.title}</h3>
                        <ul className="mt-5 space-y-3">
                            {section.links.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-white/75 transition-colors hover:text-white">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}

                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Contact</h3>
                    <ul className="mt-5 space-y-3">
                        {CONTACT.map(({ icon: Icon, label, href }) => (
                            <li key={label} className="flex items-start gap-3 text-sm text-white/75">
                                <HugeiconsIcon icon={Icon} className="mt-0.5 size-4 shrink-0 text-accent" />
                                {href ? (
                                    <a href={href} className="transition-colors hover:text-white">
                                        {label}
                                    </a>
                                ) : (
                                    label
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="container-page flex flex-col gap-3 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        &copy; {new Date().getFullYear()} {SITE_TITLE}, Nnamdi Azikiwe University. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-white">
                            Privacy policy
                        </Link>
                        <Link href="#" className="hover:text-white">
                            Terms of service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
