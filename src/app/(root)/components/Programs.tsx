import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Clock01Icon } from '@hugeicons/core-free-icons';
import { PROGRAMS } from '@/lib/constants';
import { SectionHeading } from './SectionHeading';

export const Programs: React.FC = () => {
    return (
        <section id="programs" className="relative bg-background py-24 sm:py-28">
            <div className="container-page">
                <SectionHeading
                    eyebrow="Academic programmes"
                    title="Explore programmes across our faculties"
                    description="From the sciences to the humanities, study a curriculum shaped by decades of academic excellence."
                    action={
                        <Link
                            href="/enrollment"
                            className="group inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                            Browse all courses
                            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    }
                />

                <ul className="grid overflow-hidden rounded-[28px] border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-2 lg:grid-cols-3 [&>li]:bg-card gap-px">
                    {PROGRAMS.map(({ icon: Icon, title, description, duration }) => (
                        <li key={title} className="group relative p-8 transition-colors duration-300 hover:bg-[var(--ivory)]">
                            <div className="flex items-center justify-between">
                                <span className="grid size-11 place-items-center rounded-xl border border-[var(--hairline)] text-primary transition-colors group-hover:border-accent/30 group-hover:text-accent dark:text-[oklch(0.8_0.08_250)]">
                                    <HugeiconsIcon icon={Icon} className="size-5" />
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <HugeiconsIcon icon={Clock01Icon} className="size-3.5" /> {duration}
                                </span>
                            </div>
                            <h3 className="font-display mt-7 text-2xl font-semibold text-foreground">{title}</h3>
                            <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
                            <span
                                aria-hidden
                                className="absolute inset-x-8 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100"
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};
