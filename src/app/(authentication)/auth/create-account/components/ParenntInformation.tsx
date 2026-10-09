import { InputField } from '@/components/core/forms/input-field'
import { usePrograms } from '@/hooks/usePrograms'
import { SignUpFormData } from '@/schema/sign-up-schema'
import { GenericHookFormProps } from '@/types/forms'
import React from 'react'

type ParentInformationProps = GenericHookFormProps<SignUpFormData>;

export const ParentInformation: React.FC<ParentInformationProps> = ({ register, errors }) => {

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                <InputField
                    id='department'
                    {...register('department')}
                    type="text"
                    label="Department"
                    placeholder="Enter your department"
                    error={errors.department?.message}
                    required
                />

                <InputField
                    id='reg_number'
                    {...register('reg_number')}
                    label="School Registration Number"
                    placeholder="Enter your school registration number"
                    error={errors.reg_number?.message}
                    required
                />
            </div>
            <div className="grid grid-cols-1 gap-4">
                {/* <InputField
                    id='jamb_reg_number'
                    {...register('jamb_reg_number')}
                    type="text"
                    label="Jamb Registration Number"
                    placeholder="Enter your Jamb registration number"
                    error={errors.jamb_reg_number?.message} 
                />*/}

                <InputField
                    id='school_email'
                    {...register('school_email')}
                    label="School Email Address"
                    placeholder="Enter your school email address"
                    error={errors.school_email?.message}
                    required
                />
            </div>
        </div>
    )
}
