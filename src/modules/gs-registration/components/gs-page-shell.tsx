'use client';

import type { ReactNode } from 'react';
import { GsStepper } from './gs-stepper';
import type { GsStepKey } from '../types';
import { gsConfig } from '../gs.config';

interface Props {
    step: GsStepKey;
    completed?: GsStepKey[];
    title: string;
    description?: string;
    children: ReactNode;
    /** Extra bottom padding when a fixed action bar sits over the page. */
    withActionBar?: boolean;
}

export function GsPageShell({ step, completed, title, description, children, withActionBar }: Props) {
    return (
        <div className="min-h-[calc(100vh-90px)] bg-[var(--ivory)]">
            <div className={`mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 ${withActionBar ? 'pb-44 sm:pb-36' : 'pb-16'}`}>
                <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-xl">
                        <p className="eyebrow">General Studies · {gsConfig.defaults.session}</p>
                        <h1 className="font-display mt-3 text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
                        {description && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>}
                    </div>
                    <GsStepper current={step} completed={completed} />
                </header>
                {children}
            </div>
        </div>
    );
}
