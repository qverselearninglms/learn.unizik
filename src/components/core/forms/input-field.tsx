"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import React, { useId, useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    required?: boolean;
    /** Optional Hugeicons icon shown inside the field on the left. */
    icon?: IconSvgElement;
}

const fieldClass = (error?: string, withIcon?: boolean) =>
    cn(
        "h-12 w-full rounded-xl border border-input bg-background px-4 text-[15px] text-foreground shadow-xs",
        "placeholder:text-muted-foreground/70",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-foreground/20",
        "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        withIcon && "pl-11",
        error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15",
    );

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
    return (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
            {label} {required && <span className="text-destructive">*</span>}
        </label>
    );
}

function LeadingIcon({ icon }: { icon?: IconSvgElement }) {
    if (!icon) return null;
    return (
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground transition-colors group-focus-within:text-primary">
            <HugeiconsIcon icon={icon} className="size-[18px]" />
        </span>
    );
}

export const PasswordInputField = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, required, id, icon, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const reactId = useId();
        const inputId = id || reactId;

        return (
            <div className="space-y-2">
                {label && <FieldLabel htmlFor={inputId} label={label} required={required} />}

                <div className="group relative">
                    <LeadingIcon icon={icon} />
                    <Input
                        id={inputId}
                        ref={ref}
                        aria-invalid={Boolean(error) || undefined}
                        className={cn(fieldClass(error, Boolean(icon)), "pr-12", className)}
                        {...props}
                        type={showPassword ? "text" : "password"}
                    />

                    <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-2 my-auto grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                    >
                        <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} className="size-[18px]" />
                    </button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        );
    }
);

PasswordInputField.displayName = 'PasswordInputField';

export const InputField = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, required, id, icon, ...props }, ref) => {
        const reactId = useId();
        const inputId = id || reactId;

        return (
            <div className="space-y-2">
                {label && <FieldLabel htmlFor={inputId} label={label} required={required} />}
                <div className="group relative">
                    <LeadingIcon icon={icon} />
                    <Input
                        id={inputId}
                        ref={ref}
                        aria-invalid={Boolean(error) || undefined}
                        className={cn(fieldClass(error, Boolean(icon)), className)}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        );
    }
);

InputField.displayName = 'InputField';
