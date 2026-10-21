"use client";

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useLoginFormContext } from '@/contexts/FormContext';
import { signInFormData } from '@/schema/auth-schema';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserAdd01Icon } from '@hugeicons/core-free-icons';
import React from 'react'
import { UseFormRegister } from 'react-hook-form';

const RoleSelector = () => {
    const { form, clearOTP, parentOTP } = useLoginFormContext()

    return (
        <div className="mb-5 text-center">
            <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        {/* <FormLabel className='text-accent dark:text-accent/90 text-base font-semibold'>
                            I Am A...
                        </FormLabel> */}
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                            >
                                <FormItem className="flex items-center gap-3 group cursor-pointer">
                                    <FormControl>
                                        <RadioGroupItem
                                            value="general"
                                            className="text-blue-600 dark:text-blue-400 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 group-hover:scale-110"
                                        />
                                    </FormControl>
                                    <FormLabel className="font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-white cursor-pointer">
                                        GENERAL LOGIN
                                    </FormLabel>
                                </FormItem>
                                {/* <FormItem className="flex items-center gap-3 group cursor-pointer">
                                    <FormControl>
                                        <RadioGroupItem
                                            value="parentotprequest"
                                            className="text-blue-600 dark:text-blue-400 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 group-hover:scale-110"
                                        />
                                    </FormControl>
                                    <FormLabel className="font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-white cursor-pointer">
                                        PARENT LOGIN
                                    </FormLabel>
                                </FormItem> */}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {/* {parentOTP && (
                <div className="w-full my-3 text-right">
                    <Button
                        onClick={clearOTP}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300"
                    >
                        Clear OTP
                    </Button>
                </div>
            )} */}
        </div>
    )
}

export default RoleSelector

// Remember me and forgot password section
interface FormActionsProps {
    register: UseFormRegister<signInFormData>;
}
export const FormActions = ({ register }: FormActionsProps) => (
    <div className="flex items-center justify-between animate-in fade-in-50 duration-700 delay-500">
        <div className="flex items-center group cursor-pointer">
            <input
                {...register("rememberMe")}
                id="remember"
                type="checkbox"
                className="size-4 rounded accent-[var(--primary)]"
            />
            <label
                htmlFor="remember"
                className="ml-2 cursor-pointer text-sm text-muted-foreground transition-colors group-hover:text-foreground"
            >
                Remember me
            </label>
        </div>
        <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline dark:text-[oklch(0.8_0.08_250)]"
        >
            Forgot password?
        </Link>
    </div>
);

// Apply section component
export const ApplySection = () => (
    <div className="mt-8 animate-in fade-in-50 delay-700">
        <div className="relative my-6 flex items-center">
            <span className="h-px flex-1 bg-border" />
            <span className="px-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">New here?</span>
            <span className="h-px flex-1 bg-border" />
        </div>
        <Link
            href="/auth/create-account"
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-full border border-input text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5"
        >
            <HugeiconsIcon icon={UserAdd01Icon} className="size-[18px] text-accent" />
            Create a student account
        </Link>
    </div>
);
