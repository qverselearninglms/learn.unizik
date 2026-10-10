"use client";

import { PasswordInputField } from '@/components/core/forms/input-field';
import { Button } from '@/components/ui/button';
import {
    FormField,
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
    Form
} from '@/components/ui/form';
import { useSigninForm } from '../hooks/use-signin';
import Link from 'next/link';
import React from 'react'
import { Input } from '@/components/ui/input';

export const SigninForm = () => {
    const {
        form,
        onSubmit,
        isProcessing,
    } = useSigninForm();
    // In your component
    const validationStatus = form.watch('validationStatus')

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-7">
                <div className="animate-in fade-in-50 duration-700 delay-300">
                    <FormField
                        control={form.control}
                        name="reg_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Enter your Registration number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Eneter Registration Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {(validationStatus === "authrequest") && <div className="animate-in fade-in-50 duration-700 delay-500">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <PasswordInputField placeholder="Enter your password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>}

                <div className="animate-in fade-in-50 duration-700 delay-600">
                    <Button
                        type="submit"
                        variant="gradient"
                        size="xl"
                        className="w-full"
                        loading={isProcessing}
                        disabled={!form.formState.isValid || isProcessing}
                    >
                        Sign in
                    </Button>
                </div>

                {/* <div className="text-center">
                    <Link
                        href="/auth/create-account"
                        className="font-medium text-secondary-600 hover:text-secondary-500"
                    >
                        Create an account
                    </Link>
                </div> */}
            </form>
        </Form>
    )
}
