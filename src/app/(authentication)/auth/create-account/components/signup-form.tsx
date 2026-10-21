'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
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
                <div className="rounded-3xl border border-[var(--hairline)] bg-card p-6 shadow-soft sm:p-8">
                    <div className="mb-6 flex items-center gap-3 border-b border-[var(--hairline)] pb-5">
                        <span className="grid size-10 place-items-center rounded-xl bg-primary/[0.07] text-primary dark:bg-white/[0.06] dark:text-[oklch(0.8_0.08_250)]">
                            <HugeiconsIcon icon={steps[currentStep].icon} className="size-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                                Step {currentStep + 1} of {steps.length}
                            </p>
                            <h3 className="text-lg font-bold text-foreground">{steps[currentStep].description}</h3>
                        </div>
                    </div>

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

                </div>

                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="h-12 rounded-full px-6"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                        Back
                    </Button>

                    {currentStep === steps.length - 1 ? (
                        <Button
                            type="submit"
                            variant="gradient"
                            disabled={!isValid || isLoading}
                            loading={isLoading}
                            onClick={() => setTrigerSubmit(true)}
                            className="h-12 rounded-full px-7 text-base"
                        >
                            <HugeiconsIcon icon={Tick02Icon} className="size-5" />
                            Create account
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="gradient"
                            onClick={nextStep}
                            className="h-12 rounded-full px-7 text-base"
                        >
                            Continue
                            <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
                        </Button>
                    )}
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="font-semibold text-accent underline-offset-4 hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}