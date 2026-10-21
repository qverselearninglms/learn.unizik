'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
    ArrowLeft01Icon,
    ArrowRight01Icon,
    BookOpen01Icon,
    FileEditIcon,
    Login03Icon,
    MortarboardIcon,
    UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { gsConfig } from '@/modules/gs-registration/gs.config';
import { usePortalHome } from '@/hooks/use-portal-home';

interface Cta {
    label: string;
    href: string;
    icon: IconSvgElement;
}

interface HeroSlide {
    image: string;
    tag: string;
    titleTop: string;
    titleAccent: string;
    titleBottom?: string;
    subtitle: string;
    description: string;
    primaryCta: Cta;
    secondaryCta: Cta;
}

const SLIDES: HeroSlide[] = [
    {
        image: '/slides/ai4.jpg',
        tag: `${gsConfig.defaults.session} Registration Now Open`,
        titleTop: 'Start Your',
        titleAccent: 'Learning',
        titleBottom: 'Journey',
        subtitle: 'Choose Your GS Courses and Start Learning Online',
        description:
            'Pick your General Studies courses and go straight to your virtual classroom, all from one portal built for Zikites.',
        primaryCta: { label: 'Begin GS Registration', href: '/gs-registration', icon: FileEditIcon },
        secondaryCta: { label: 'Sign in to the Portal', href: '/auth/signin', icon: Login03Icon },
    },
    {
        image: '/slides/ai2.jpg',
        tag: 'Flexible Learning',
        titleTop: 'Flexible Learning',
        titleAccent: 'for Busy People',
        subtitle: 'Study On Campus, Online or Through Blended Learning',
        description:
            'Access quality university education through flexible delivery designed for students, workers, business owners and every adult learner.',
        primaryCta: { label: 'View Programmes', href: '/#programs', icon: MortarboardIcon },
        secondaryCta: { label: 'Enroll in Courses', href: '/enrollment', icon: BookOpen01Icon },
    },
    {
        image: '/campus/ca-1.jpeg',
        tag: 'Academic Excellence',
        titleTop: 'Learn From',
        titleAccent: 'Great',
        titleBottom: 'Minds',
        subtitle: 'Taught by UNIZIK Faculty, Built for the Real World',
        description:
            'Every course is designed and delivered by the lecturers who teach on campus, so you get the same standard wherever you study.',
        primaryCta: { label: 'Why UNIZIK Learning', href: '/#features', icon: MortarboardIcon },
        secondaryCta: { label: 'Create an Account', href: '/auth/create-account', icon: UserGroupIcon },
    },
    {
        image: '/slides/ai1.jpg',
        tag: 'Student Life',
        titleTop: 'The Full',
        titleAccent: 'Zikite',
        titleBottom: 'Experience',
        subtitle: 'From the Temp Site to the Perm Site',
        description:
            'From SUG week to inter-faculty sports, discover your passion, build lifelong friendships and grow with a community of disciplined scholars.',
        primaryCta: { label: 'Explore Campus Life', href: '/#campus_highlight', icon: UserGroupIcon },
        secondaryCta: { label: 'Latest Updates', href: '/#calender_view', icon: BookOpen01Icon },
    },
];

const AUTOPLAY_MS = 5000;

const slideVariants: Variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', scale: 1.05, opacity: 0 }),
    center: { x: '0%', scale: 1, opacity: 1, transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: (dir: number) => ({
        x: dir > 0 ? '-100%' : '100%',
        scale: 0.98,
        opacity: 0,
        transition: { duration: 0.7, ease: [0.55, 0, 1, 0.45] },
    }),
};

export function Hero() {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [paused, setPaused] = useState(false);
    const [touchX, setTouchX] = useState<number | null>(null);
    const reduceMotion = useReducedMotion();
    const portal = usePortalHome();
    // Signed-in visitors get their portal instead of "Sign in".
    const resolve = (cta: Cta): Cta =>
        portal && cta.href === '/auth/signin' ? { ...cta, href: portal.href, label: portal.label } : cta;
    const total = SLIDES.length;
    const slide = SLIDES[index];
    const primaryCta = resolve(slide.primaryCta);
    const secondaryCta = resolve(slide.secondaryCta);

    const next = useCallback(() => {
        setDirection(1);
        setIndex((i) => (i + 1) % total);
    }, [total]);

    const prev = useCallback(() => {
        setDirection(-1);
        setIndex((i) => (i - 1 + total) % total);
    }, [total]);

    const goTo = (i: number) => {
        setDirection(i > index ? 1 : -1);
        setIndex(i);
    };

    useEffect(() => {
        if (paused || reduceMotion) return;
        const t = window.setInterval(next, AUTOPLAY_MS);
        return () => window.clearInterval(t);
    }, [paused, reduceMotion, next]);

    return (
        <section
            id="home"
            aria-roledescription="carousel"
            aria-label="Highlights"
            className="relative isolate min-h-[100svh] w-full select-none overflow-hidden bg-[#030b1e]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
                if (touchX === null) return;
                const dx = touchX - e.changedTouches[0].clientX;
                if (Math.abs(dx) > 50) (dx > 0 ? next : prev)();
                setTouchX(null);
            }}
        >
            {/* Background image */}
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={index}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                >
                    <Image src={slide.image} alt="" fill priority={index === 0} sizes="100vw" className="object-cover" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_90%,rgba(242,106,27,0.2),transparent_34%)]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#030b1ef2] via-[#061636bf] to-[#0b1a3759]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030712b3] via-[#02061726] to-[#02061759]" />
                </motion.div>
            </AnimatePresence>

            {/* Decorative glow and rings */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-10 top-24 h-20 w-28 bg-[radial-gradient(circle,rgba(255,255,255,0.28)_1.2px,transparent_1.2px)] [background-size:10px_10px] opacity-35" />
                <div className="absolute left-0 top-0 h-[32rem] w-[24rem] bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_66%)]" />
                <div className="animate-float-slow absolute -bottom-[22rem] -left-[20rem] h-[50rem] w-[50rem] rounded-full bg-[conic-gradient(from_248deg_at_62%_60%,rgba(242,106,27,0.7),rgba(31,95,209,0.35),rgba(3,11,30,0)_58%)] blur-3xl" />
                <div className="absolute -bottom-[15rem] -left-[15rem] h-[28rem] w-[54rem] rotate-[-13deg] rounded-[100%] border border-[#f26a1b]/40" />
                <div className="absolute -bottom-[9rem] -left-[9rem] h-[17rem] w-[44rem] rotate-[-13deg] rounded-[100%] border border-[#3b6fd8]/35" />
                <div className="absolute -bottom-12 -left-12 h-56 w-[34rem] rotate-[-10deg] bg-gradient-to-r from-[#f26a1b]/55 via-[#1f5fd1]/25 to-transparent blur-xl" />
            </div>

            {/* Content */}
            <div className="container-page relative z-30 flex min-h-[100svh] items-center pb-24 pt-28">
                <div className="max-w-[760px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`content-${index}`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -16, opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                            aria-live="polite"
                        >
                            <div className="mb-6 flex items-start gap-3 text-white/95 sm:mb-7">
                                <div className="relative mt-0.5 size-9 shrink-0 overflow-hidden rounded-md border border-[#f26a1b]/60 bg-[#130f25]/85 shadow-[0_0_22px_rgba(242,106,27,0.35)]">
                                    <Image src="/logo/logo-removebg-preview.png" alt="" fill sizes="36px" className="object-contain p-[2px]" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium sm:text-[0.98rem]">{slide.tag}</span>
                                    <div className="mt-2 h-[2px] w-24 bg-gradient-to-r from-[#f26a1b] to-transparent sm:w-36" />
                                </div>
                            </div>

                            <h1 className="text-balance text-[clamp(2.4rem,6vw,5.75rem)] font-extrabold leading-[0.99] tracking-tight text-white">
                                {slide.titleTop}
                                <br />
                                <span className="bg-gradient-to-r from-[#ff8a2a] via-[#f26a1b] to-[#ff9d4d] bg-clip-text text-transparent">
                                    {slide.titleAccent}
                                </span>
                                {slide.titleBottom ? <> {slide.titleBottom}</> : null}
                            </h1>

                            <p className="mt-6 text-[clamp(1.05rem,1.45vw,1.4rem)] font-semibold leading-[1.6] text-[#6b9bff] sm:mt-7">
                                {slide.subtitle}
                            </p>
                            <p className="mt-4 max-w-[60ch] text-[clamp(1rem,1.3vw,1.25rem)] leading-[1.7] text-slate-100 sm:mt-5">
                                {slide.description}
                            </p>

                            <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                                <Link
                                    href={primaryCta.href}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-gradient-to-r from-[#f26a1b] via-[#c2410c] to-[#1f5fd1] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(242,106,27,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_18px_44px_rgba(31,95,209,0.45)] sm:px-8 sm:py-4 sm:text-[1.05rem]"
                                >
                                    <HugeiconsIcon icon={primaryCta.icon} className="size-5" />
                                    {primaryCta.label}
                                </Link>
                                <Link
                                    href={secondaryCta.href}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1f5fd1] bg-[#040d25]/80 px-6 py-3.5 text-sm font-semibold text-slate-100 shadow-[inset_0_0_0_1px_rgba(242,106,27,0.5)] transition-colors hover:bg-[#07163d] sm:px-8 sm:py-4 sm:text-[1.05rem]"
                                >
                                    <HugeiconsIcon icon={secondaryCta.icon} className="size-5" />
                                    {secondaryCta.label}
                                </Link>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Arrows */}
            <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="absolute left-4 top-1/2 z-40 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:flex"
            >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
            </button>
            <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="absolute right-4 top-1/2 z-40 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:flex"
            >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2">
                {SLIDES.map((s, i) => (
                    <button
                        key={s.tag}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === index}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                    />
                ))}
            </div>
        </section>
    );
}
