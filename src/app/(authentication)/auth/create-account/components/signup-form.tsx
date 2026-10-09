'use client';

import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSignup } from '@/hooks/use-signup';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PersonalInformation } from './PersonalInformation';
import { ParentInformation } from './ParenntInformation';
import { AccountInformation } from './AccountInformation';
import { ProgressStepper } from './ProgressStepper';
import { FormErrorList } from '@/components/core/forms/errors';
import { motion } from "framer-motion";
import { ProgramChoice } from './ProgramChoice';
import { useState } from 'react';

export function SignupForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        control,
        setValue,
        getValues,
        watch,
        trigger,
        // HELPERS
        getStepStatus,
        goToStep,
        STEPS: steps,
        currentStep,
        nextStep,
        prevStep,
        delta,
        // DATA & ACTIONS
        error,
        onSubmit,
        isLoading,
    } = useSignup();
    const [trigerSubmit, setTrigerSubmit] = useState(false)

    return (
        <div className="block">

            {/* Progress Stepper */}
            <ProgressStepper steps={steps} getStepStatus={getStepStatus} goToStep={goToStep} currentStep={currentStep} />

            {/* displaying error in the form */}
            <FormErrorList errors={errors} isTriggered={trigerSubmit} />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Personal Information */}
                {currentStep === 0 && (
                    <motion.div
                        initial={{ x: delta >= 1 ? '80%' : '-80%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >

                        <PersonalInformation register={register} errors={errors} control={control} />
                    </motion.div>
                )}

                {/* Step 2: Academic Information */}
                {currentStep === 1 && (
                    <motion.div
                        initial={{ x: delta >= 1 ? '80%' : '-80%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <ParentInformation register={register} errors={errors} control={control} setValue={setValue} getValues={getValues} watch={watch} />
                    </motion.div>
                )}

                {/* Step 2: Academic Information */}
                {currentStep === 2 && (
                    <motion.div
                        initial={{ x: delta >= 1 ? '80%' : '-80%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <ProgramChoice
                            register={register}
                            errors={errors}
                            setValue={setValue}
                            trigger={trigger}
                        />
                    </motion.div>
                )}

                {/* Step 3: Account Information */}
                {currentStep === 3 && (
                    <motion.div
                        initial={{ x: delta >= 1 ? '80%' : '-80%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <AccountInformation register={register} errors={errors} />
                    </motion.div>
                )}

                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center pt-8 border-t border-border mt-20">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="flex items-center px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </button>

                    <div className="text-sm text-muted-foreground">
                        Step {currentStep + 1} of {steps.length}
                    </div>

                    {currentStep === steps.length - 1 ? (
                        <Button
                            type="submit"
                            disabled={!isValid || isLoading}
                            loading={isLoading}
                            className="flex items-center px-6 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        >
                            <Check className="w-4 h-4 ml-1" />
                            Complete Registration
                        </Button>
                    ) : (
                        <Button
                            onClick={nextStep}
                            className="flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 cursor-pointer transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                        Sign in here
                    </Link>
                </div>
            </form>
        </div>
    );
}