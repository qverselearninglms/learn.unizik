import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import React, { FC } from 'react'

interface AuthContainerHeaderProps {
    heading: string;
    subHeading: string;
    headingClass?: string;
    subHeadingClass?: string;
    Icon?: LucideIcon;
}

export const AuthContainerHeader: FC<AuthContainerHeaderProps> = ({
    heading,
    subHeading,
    headingClass,
    subHeadingClass,
    Icon
}) => {
    return (
        <div className="mb-8 animate-in fade-in-50 duration-700 delay-200 flex items-start gap-5">
            {Icon && (
                <div className="flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon className="h-10 w-10 text-primary transition-colors duration-300" />
                </div>
            )}
            <div className="flex-1">
                <h2 className={cn(
                    "text-3xl font-bold text-foreground mb-2 transition-colors duration-300",
                    headingClass
                )}>
                    {heading}
                </h2>
                <p className={cn(
                    "text-muted-foreground transition-colors duration-300",
                    subHeadingClass
                )}>
                    {subHeading}
                </p>
            </div>
        </div>
    )
}