import { cn } from "@/lib/utils";
import Image from "next/image";
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BookOpen01Icon, ComputerVideoIcon, Mortarboard02Icon, UserAdd01Icon } from '@hugeicons/core-free-icons';
import { Logo } from "@/components/layout/Logo";

type BrandingVariant = 'signin' | 'signup';

const COPY: Record<BrandingVariant, { tag: string; top: string; accent: string; bottom?: string; text: string }> = {
    signin: {
        tag: 'Student portal',
        top: 'Welcome back to your',
        accent: 'digital campus',
        text: 'Sign in to see your General Studies courses, complete your enrollment and continue learning.',
    },
    signup: {
        tag: 'New student',
        top: 'Start your',
        accent: 'learning',
        bottom: 'journey',
        text: 'Create your account in a few minutes. Your courses will be waiting for you right after you sign in.',
    },
};

const STEPS: { icon: IconSvgElement; title: string; text: string }[] = [
    { icon: UserAdd01Icon, title: 'Create your account', text: 'Your details and university email' },
    { icon: BookOpen01Icon, title: 'Complete enrollment', text: 'Confirm your GS courses' },
    { icon: ComputerVideoIcon, title: 'Start learning', text: 'Go straight into the LMS' },
];

// Navy brand panel shown beside the sign-in / sign-up forms (mirrors the homepage hero).
export const BrandingPanel = ({ className, variant = 'signin' }: { className?: string; variant?: BrandingVariant }) => {
    const copy = COPY[variant];
    return (
        <div className={cn("relative isolate flex flex-col overflow-hidden bg-[#030b1e] p-8 text-white sm:p-10 xl:p-14", className)}>
            <Image
                src="/campus/ca-1.jpeg"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="-z-20 object-cover"
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-[#030b1ef2] via-[#061636d9] to-[#0b1a37b3]" />
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute right-10 top-10 h-20 w-28 bg-[radial-gradient(circle,rgba(255,255,255,0.28)_1.2px,transparent_1.2px)] [background-size:10px_10px] opacity-30" />
                <div className="animate-float-slow absolute -bottom-[22rem] -left-[20rem] h-[46rem] w-[46rem] rounded-full bg-[conic-gradient(from_248deg_at_62%_60%,rgba(242,106,27,0.65),rgba(31,95,209,0.35),rgba(3,11,30,0)_58%)] blur-3xl" />
                <div className="absolute -bottom-[14rem] -left-[14rem] h-[26rem] w-[50rem] rotate-[-13deg] rounded-[100%] border border-[#f26a1b]/35" />
                <div className="absolute -bottom-[8rem] -left-[8rem] h-[16rem] w-[40rem] rotate-[-13deg] rounded-[100%] border border-[#3b6fd8]/30" />
            </div>

            <Logo tone="light" size="md" />

            <div className="my-auto py-10">
                <div className="flex items-start gap-3">
                    <span className="grid size-9 place-items-center rounded-md border border-[#f26a1b]/60 bg-[#130f25]/85 text-[#ff9d4d] shadow-[0_0_22px_rgba(242,106,27,0.35)]">
                        <HugeiconsIcon icon={Mortarboard02Icon} className="size-5" />
                    </span>
                    <div>
                        <span className="text-sm font-medium text-white/90">{copy.tag}</span>
                        <div className="mt-2 h-[2px] w-24 bg-gradient-to-r from-[#f26a1b] to-transparent" />
                    </div>
                </div>

                <h2 className="mt-6 text-balance text-4xl font-extrabold leading-[1.02] tracking-tight xl:text-5xl">
                    {copy.top}{' '}
                    <span className="bg-gradient-to-r from-[#ff8a2a] via-[#f26a1b] to-[#ff9d4d] bg-clip-text text-transparent">
                        {copy.accent}
                    </span>
                    {copy.bottom && <> {copy.bottom}</>}
                </h2>
                <p className="mt-5 max-w-md leading-relaxed text-slate-200/85">{copy.text}</p>

                <ol className="mt-10 hidden max-w-md space-y-3 md:block">
                    {STEPS.map(({ icon, title, text }, i) => (
                        <li
                            key={title}
                            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md"
                        >
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                                <HugeiconsIcon icon={icon} className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                    <span className="mr-2 text-[#ff9d4d]">0{i + 1}</span>
                                    {title}
                                </p>
                                <p className="text-xs text-white/60">{text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <p className="hidden text-xs font-medium uppercase tracking-[0.2em] text-white/45 md:block">
                Discipline · Self-reliance · Excellence
            </p>
        </div>
    );
};
