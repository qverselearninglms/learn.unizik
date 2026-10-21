import React, { FC } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface ProgressStepperProps {
    steps: {
        id: string;
        title: string;
        description: string;
        icon: IconSvgElement;
    }[];
    getStepStatus: (stepIndex: number) => "completed" | "current" | "upcoming";
    goToStep: (stepIndex: number) => Promise<void>;
    currentStep: number;
}

export const ProgressStepper: FC<ProgressStepperProps> = ({ steps, getStepStatus, goToStep, currentStep }) => {
    const progress = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;

    return (
        <nav aria-label="Sign-up progress" className="mb-8">
            <div className="relative">
                {/* Track */}
                <div aria-hidden className="absolute left-5 right-5 top-5 h-0.5 rounded-full bg-border" />
                <div
                    aria-hidden
                    className="absolute left-5 top-5 h-0.5 rounded-full bg-gradient-to-r from-[#f26a1b] to-[#1f5fd1] transition-[width] duration-500"
                    style={{ width: `calc((100% - 2.5rem) * ${progress / 100})` }}
                />

                <ol className="relative flex justify-between">
                    {steps.map((step, index) => {
                        const status = getStepStatus(index);
                        return (
                            <li key={step.id} className="flex flex-col items-center text-center">
                                <button
                                    type="button"
                                    onClick={() => goToStep(index)}
                                    aria-current={status === 'current' ? 'step' : undefined}
                                    aria-label={`${step.title}${status === 'completed' ? ' (completed)' : ''}`}
                                    className={cn(
                                        'grid size-10 place-items-center rounded-full border-2 bg-background transition-all duration-300',
                                        status === 'completed' && 'border-transparent bg-gradient-to-br from-[#f26a1b] to-[#1f5fd1] text-white',
                                        status === 'current' && 'border-primary text-primary shadow-[0_0_0_6px] shadow-primary/10',
                                        status === 'upcoming' && 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                                    )}
                                >
                                    <HugeiconsIcon icon={status === 'completed' ? Tick02Icon : step.icon} className="size-[18px]" />
                                </button>
                                <span
                                    className={cn(
                                        'mt-2.5 text-xs font-semibold sm:text-sm',
                                        status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                                    )}
                                >
                                    {step.title}
                                </span>
                                <span className="hidden text-xs text-muted-foreground sm:block">{step.description}</span>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    )
}
