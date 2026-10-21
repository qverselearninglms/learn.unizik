import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';
import { SITE_TITLE } from '@/config';
import { FEATURES } from '@/lib/constants';
import { SectionHeading } from './SectionHeading';

export const Features: React.FC = () => {
    return (
        <section id="features" className="relative bg-[var(--ivory)] py-24 sm:py-28">
            <div className="container-page">
                <SectionHeading
                    eyebrow={`Why ${SITE_TITLE}`}
                    title={
                        <>
                            A university education, <span className="text-accent">without the distance</span>
                        </>
                    }
                    description="Built with the faculties of Nnamdi Azikiwe University to keep teaching rigorous and learning flexible."
                />

                <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                    {/* Feature image */}
                    <figure className="group relative min-h-[380px] overflow-hidden rounded-[28px] bg-brand-navy text-white shadow-lift">
                        <Image
                            src="/slides/ai3.jpg"
                            alt="Open books stacked in a circle"
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover opacity-55 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-950)] via-[var(--navy-950)]/40 to-transparent" />
                        <figcaption className="absolute inset-x-0 bottom-0 p-8 sm:p-10">
                            <p className="font-display text-2xl leading-snug text-balance sm:text-3xl">
                                “Ut Prosit”, learning that is of use to you, your community and the world.
                            </p>
                            <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/55">University motto</p>
                        </figcaption>
                    </figure>

                    {/* Feature list */}
                    <ul className="flex flex-col gap-5">
                        {FEATURES.map(({ icon: Icon, title, description }) => (
                            <li
                                key={title}
                                className="flex flex-1 gap-5 rounded-3xl border border-[var(--hairline)] bg-card p-7 shadow-soft transition-shadow duration-300 hover:shadow-lift"
                            >
                                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                                    <HugeiconsIcon icon={Icon} className="size-5" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                                    <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};
