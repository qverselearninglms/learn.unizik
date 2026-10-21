import { useState } from 'react'
import { LockPasswordIcon, Mortarboard02Icon, School01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { academicInfoSchema, accouintInfoSchema, personalInfoSchema, programChoiceSchema } from "@/schema/sign-up-schema";
import { UseFormReturn } from 'react-hook-form';

// Step configuration
export const STEPS = [
    {
        id: 'personal',
        title: 'Personal',
        description: 'About you',
        icon: UserIcon,
        schema: personalInfoSchema,
    },
    {
        id: 'Academics',
        title: 'Academic',
        description: 'Your school details',
        icon: Mortarboard02Icon,
        schema: academicInfoSchema,
    },
    {
        id: 'Programchoice',
        title: 'Programme',
        description: 'What you study',
        icon: School01Icon,
        schema: programChoiceSchema,
    },
    {
        id: 'Account',
        title: 'Account',
        description: 'Your sign-in details',
        icon: LockPasswordIcon,
        schema: accouintInfoSchema,
    },
];

export const useSignupSteps = <T extends Record<string, unknown>>(
    form: UseFormReturn<T>
) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [previousStep, setPreviousStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const delta = currentStep - previousStep;


    // Validate current step
    const validateStep = async (stepIndex: number) => {
        const currentStepSchema = STEPS[stepIndex].schema;
        const currentValues = form.getValues();

        try {
            currentStepSchema.parse(currentValues);
            if (!completedSteps.includes(stepIndex)) {
                setCompletedSteps([...completedSteps, stepIndex]);
            }
            return true;
        } catch (error) {
            // Trigger validation to show errors
            console.error('error', error)
            await form.trigger();
            return false;
        }
    };

    // Navigation handlers
    const nextStep = async () => {
        if (await validateStep(currentStep)) {
            if (currentStep < STEPS.length) {
                setPreviousStep(currentStep);
                setCurrentStep(Math.min(currentStep + 1, STEPS.length - 1));
            }
        }
    };

    const prevStep = () => {
        setPreviousStep(currentStep);
        setCurrentStep(Math.max(currentStep - 1, 0));
    };

    const goToStep = async (stepIndex: number) => {
        if (stepIndex < currentStep || completedSteps.includes(stepIndex)) {
            setCurrentStep(stepIndex);
        } else if (stepIndex === currentStep + 1) {
            await nextStep();
        }
    };

    // Get step status
    const getStepStatus = (stepIndex: number) => {
        if (completedSteps.includes(stepIndex)) return 'completed';
        if (stepIndex === currentStep) return 'current';
        if (stepIndex < currentStep) return 'completed';
        return 'upcoming';
    };

    return {
        delta,
        steps: STEPS,
        setCurrentStep,
        setCompletedSteps,
        currentStep,
        completedSteps,
        nextStep,
        prevStep,
        goToStep,
        getStepStatus,
        validateStep,
    }
}
