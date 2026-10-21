'use client';

import React from 'react';
import { SignUpFormData } from '@/schema/sign-up-schema';
import { GenericHookFormProps } from '@/types/forms';
import { ProgramSelector } from './ProgramSelector';

// ProgramChoice needs setValue and trigger — both present in GenericHookFormProps
type ProgramChoiceProps = Required<
    Pick<GenericHookFormProps<SignUpFormData>, 'register' | 'errors' | 'setValue' | 'trigger'>
>;

export const ProgramChoice: React.FC<ProgramChoiceProps> = ({
    errors,
    setValue,
    trigger,
}) => {
    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Browse the categories below and pick the programme you are enrolling in.
            </p>

            <ProgramSelector
                setValue={setValue}
                trigger={trigger}
                error={errors.program_id?.message}
            />
        </div>
    );
};

