import { Check } from 'lucide-react';
import React, { FC } from 'react'
import { cn } from '@/lib/utils';

interface ProgressStepperProps {
    steps: {
        id: string;
        title: string;
        description: string;
        icon: React.ComponentType<{ className?: string }>;
    }[];
    getStepStatus: (stepIndex: number) => "completed" | "current" | "upcoming";
    goToStep: (stepIndex: number) => Promise<void>;
    currentStep: number;
}

export const ProgressStepper: FC<ProgressStepperProps> = ({ steps, getStepStatus, goToStep, currentStep }) => {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const status = getStepStatus(index);
                    const Icon = step.icon;

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center flex-1">
                                <button
                                    onClick={() => goToStep(index)}
                                    className={cn(
                                        'w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-200',
                                        status === 'completed' && 'bg-green-500 border-green-500 text-white',
                                        status === 'current' && 'bg-primary border-primary text-primary-foreground',
                                        status === 'upcoming' && 'bg-background border-input text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                    )}
                                >
                                    {status === 'completed' ? (
                                        <Check className="w-6 h-6" />
                                    ) : (
                                        <Icon className="w-6 h-6" />
                                    )}
                                </button>
                                <div className="text-center">
                                    <p className={cn(
                                        'text-sm font-medium',
                                        status === 'current' && 'text-primary',
                                        status === 'completed' && 'text-green-600 dark:text-green-400',
                                        status === 'upcoming' && 'text-muted-foreground'
                                    )}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {index < steps.length - 1 && (
                                <div className={cn(
                                    'flex-1 h-0.5 mx-4 transition-colors duration-200',
                                    index < currentStep ? 'bg-green-500' : 'bg-border'
                                )} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    )
}