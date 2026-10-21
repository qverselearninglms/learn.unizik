import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import React, { FC } from 'react'

const isHugeicon = (icon: LucideIcon | IconSvgElement): icon is IconSvgElement => Array.isArray(icon);

interface AuthContainerHeaderProps {
    heading: string;
    subHeading: string;
    headingClass?: string;
    subHeadingClass?: string;
    /** A Hugeicons icon (preferred) or a legacy lucide component. */
    Icon?: LucideIcon | IconSvgElement;
}

export const AuthContainerHeader: FC<AuthContainerHeaderProps> = ({
    heading,
    subHeading,
    headingClass,
    subHeadingClass,
    Icon
}) => {
    return (
        <div className="mb-9 animate-in fade-in-50 duration-700 delay-200">
            {Icon && (
                <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f26a1b] to-[#1f5fd1] text-white shadow-lg shadow-[#f26a1b]/25">
                    {isHugeicon(Icon) ? <HugeiconsIcon icon={Icon} className="size-6" /> : <Icon className="size-6" />}
                </span>
            )}
            <h2 className={cn(
                "text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl",
                headingClass
            )}>
                {heading}
            </h2>
            <p className={cn(
                "mt-2 text-base text-muted-foreground",
                subHeadingClass
            )}>
                {subHeading}
            </p>
        </div>
    )
}