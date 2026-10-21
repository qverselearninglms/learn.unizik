"use client";

import React from 'react'
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, LockPasswordIcon, Mail01Icon } from '@hugeicons/core-free-icons';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLoginFormContext } from '@/contexts/FormContext';
import { FormActions } from './LoginFormFields';
import { Button } from '@/components/ui/button';
import { InputField, PasswordInputField } from '@/components/core/forms/input-field';

const LoginFormContainer = () => {
    const { form, onSubmit, isLoggingIn, userType } = useLoginFormContext()

    return (
        <Form  {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-5">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold">Email address</FormLabel>
                                <FormControl>
                                    <InputField type="email" autoComplete="email" icon={Mail01Icon} placeholder="you@unizik.edu.ng" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {(userType === "parent") && <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold">{`OTP (Check your email address)`}</FormLabel>
                                <FormControl>
                                    <InputField icon={LockPasswordIcon} placeholder="Enter the OTP you received in your email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />}

                    {(userType === "general") && <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold">Password</FormLabel>
                                <FormControl>
                                    <PasswordInputField autoComplete="current-password" icon={LockPasswordIcon} placeholder="Enter your password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />}
                </div>

                <FormActions
                    register={form.register}
                />

                <Button
                    type="submit"
                    variant="gradient"
                    size="xl"
                    className="h-12 w-full rounded-full text-base"
                    loading={isLoggingIn}
                    disabled={!form.formState.isValid || isLoggingIn}
                >
                    Sign in
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
                </Button>
            </form>
        </Form>
    )
}

export default LoginFormContainer
