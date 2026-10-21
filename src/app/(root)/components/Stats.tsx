import { STATS } from '@/lib/constants';

export const Stats: React.FC = () => {
    return (
        <section aria-label="UNIZIK in numbers" className="relative overflow-hidden bg-brand-navy text-white">
            <div aria-hidden className="bg-grid-faint absolute inset-0" />
            <div className="container-page relative">
                <dl className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="flex flex-col-reverse items-center px-2 py-12 text-center sm:py-16">
                            <dt className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-white/55">{stat.label}</dt>
                            <dd className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                                {stat.number.replace(/\+$/, '')}
                                {stat.number.endsWith('+') && <span className="text-accent">+</span>}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
};
