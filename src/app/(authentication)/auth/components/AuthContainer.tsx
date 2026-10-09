'use client'

import React, { ReactNode } from 'react'
import { BrandingPanel } from '@/components/global/generic-componenets';
import { cn } from '@/lib/utils';

interface AuthContainerProps {
    children: ReactNode;
    className?: string;
}

const AuthContainer = ({ children, className }: AuthContainerProps) => {
    return (
        <div className={cn(
            "min-h-screen flex items-center justify-center px-4",
            "bg-background",
            className
        )}>
            <div className={cn(
                "w-full max-w-5xl",
                "bg-card",
                "rounded-2xl shadow-2xl overflow-hidden",
                "animate-in slide-in-from-bottom-4 duration-700",
                "border border-border"
            )}>
                <div className="grid md:grid-cols-2 min-h-[600px]">
                    {/* Left Panel - Branding */}
                    <BrandingPanel />

                    {/* Right Panel - Login Form */}
                    <div className="p-8 md:p-12 flex flex-col justify-center bg-card">
                        <div className="max-w-md mx-auto w-full">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthContainer