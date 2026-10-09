"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import React, { useId, useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    required?: boolean;
}

export const PasswordInputField = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, required, id, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const reactId = useId();
        const inputId = id || reactId;

        return (
            <div className="space-y-2">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-foreground"
                    >
                        {label} {required && <span className="text-destructive">*</span>}
                    </label>
                )}

                <div className="relative">
                    <Input
                        id={inputId}
                        ref={ref}
                        type={showPassword ? "text" : "password"}
                        className={cn(
                            "w-full pr-10", // leave space for icon
                            "px-3 py-2 rounded-lg shadow-sm",
                            "bg-background text-foreground",
                            "border border-input",
                            "placeholder:text-muted-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-primary",
                            error && "border-destructive focus:ring-destructive",
                            className
                        )}
                        {...props}
                    />

                    <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword((v) => !v)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
            </div>
        );
    }
);

export const InputField = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, required, id, ...props }, ref) => {
        const reactId = useId();
        const inputId = id || reactId;

        return (
            <div className="space-y-2">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-foreground"
                    >
                        {label} {required && <span className="text-destructive">*</span>}
                    </label>
                )}
                <Input
                    id={inputId}
                    ref={ref}
                    className={cn(
                        'w-full px-3 py-2 rounded-lg shadow-sm',
                        'bg-background text-foreground',
                        'border border-input',
                        'placeholder:text-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                        'transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error && 'border-destructive focus:ring-destructive',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
            </div>
        );
    }
);

InputField.displayName = 'InputField';