import Image from "next/image";
import { CAMPUSHIGHLIGHTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

// Editorial mosaic: the first image is the large tile.
const TILE = [
    "sm:col-span-2 sm:row-span-2 min-h-[320px]",
    "sm:col-span-2 min-h-[220px]",
    "min-h-[220px]",
    "min-h-[220px]",
];

export default function CampusHighlights() {
    return (
        <section id="campus_highlight" className="relative bg-background py-24 sm:py-28">
            <div className="container-page">
                <SectionHeading
                    eyebrow="Life at UNIZIK"
                    title="A campus worth coming back to"
                    description="Online or on site, you are part of a vibrant community with world-class facilities in Awka."
                />

                <ul className="grid auto-rows-[minmax(220px,auto)] gap-4 sm:grid-cols-4">
                    {CAMPUSHIGHLIGHTS.map((ch, index) => (
                        <li key={ch.title} className={cn("group relative overflow-hidden rounded-3xl bg-muted", TILE[index % TILE.length])}>
                            <Image
                                src={ch.imageUrl}
                                fill
                                alt={ch.title}
                                sizes={index === 0 ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 25vw, 100vw"}
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-950)]/85 via-[var(--navy-950)]/10 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                                    0{index + 1}
                                </span>
                                <h3
                                    className={cn(
                                        "font-display mt-1 font-semibold text-balance text-white",
                                        index === 0 ? "text-2xl sm:text-3xl" : "text-lg",
                                    )}
                                >
                                    {ch.title}
                                </h3>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
