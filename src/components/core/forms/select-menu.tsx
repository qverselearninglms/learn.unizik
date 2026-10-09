import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
    onValueChange?: (value: string) => void;
    value?: string;
    defaultValue?: string;
    className?: string;
    size?: "sm" | "default";
    required?: boolean;
}

export const DynamicSelect: React.FC<SelectProps> = ({
    label,
    error,
    options = [],
    placeholder = "Select an option",
    disabled = false,
    value,
    defaultValue,
    onValueChange,
    className = "",
    size = "default",
    required = false,
}) => {
    return (
        <div className={cn("space-y-2", className)}>
            {/* Label */}
            {label && (
                <label className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}

            {/* Select Component */}
            <Select
                disabled={disabled}
                value={value}
                defaultValue={defaultValue}
                onValueChange={onValueChange}
            >
                <SelectTrigger
                    className={cn(
                        'w-full bg-background text-foreground border-input',
                        'focus:ring-2 focus:ring-primary focus:border-transparent',
                        'placeholder:text-muted-foreground',
                        error && 'border-destructive focus:ring-destructive'
                    )}
                    size={size}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>

                <SelectContent className="bg-popover text-popover-foreground border-border">
                    {options.length > 0 ? (
                        options.map((option, index) => (
                            <SelectItem
                                key={`${option.value}-${index}`}
                                value={String(option.value)}
                                className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                                {option.label}
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="" disabled className="text-muted-foreground">
                            No options available
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
            )}
        </div>
    );
};