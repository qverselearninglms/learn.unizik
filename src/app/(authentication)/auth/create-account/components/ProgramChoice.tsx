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
            <div>
                <h5 className="text-2xl font-bold text-accent">Select Program of Study</h5>
                <p className="text-sm text-gray-500 mt-1">
                    Navigate through the categories and enroll in your desired program.
                </p>
            </div>

            <ProgramSelector
                setValue={setValue}
                trigger={trigger}
                error={errors.program_id?.message}
            />
        </div>
    );
};

