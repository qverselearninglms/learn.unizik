import { InputField } from '@/components/core/forms/input-field'
import { DynamicSelect } from '@/components/core/forms/select-menu'
import { LEVEL_OPTIONS, SignUpFormData } from '@/schema/sign-up-schema'
import { GenericHookFormProps } from '@/types/forms'
import React from 'react'
import { Controller } from 'react-hook-form'
import { IdIcon, Mail01Icon } from '@hugeicons/core-free-icons'

type ParentInformationProps = GenericHookFormProps<SignUpFormData>;

const LEVEL_SELECT_OPTIONS = LEVEL_OPTIONS.map((level) => ({ value: String(level), label: `${level} Level` }));

export const ParentInformation: React.FC<ParentInformationProps> = ({ register, errors, control }) => {

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5">
                {control && (
                    <Controller
                        name="level"
                        control={control}
                        render={({ field }) => (
                            <DynamicSelect
                                label="Level"
                                placeholder="Select your level"
                                options={LEVEL_SELECT_OPTIONS}
                                value={field.value ? String(field.value) : undefined}
                                onValueChange={(v) => field.onChange(Number(v))}
                                error={errors.level?.message}
                                required
                            />
                        )}
                    />
                )}

                <InputField
                    id='reg_number'
                    {...register('school_reg_number')}
                    label="School Registration Number"
                    icon={IdIcon}
                    placeholder="Enter your school registration number"
                    error={errors.school_reg_number?.message}
                    required
                />

                <InputField
                    id='school_email'
                    {...register('school_email')}
                    label="School Email Address"
                    icon={Mail01Icon}
                    type="email"
                    placeholder="Enter your school email address"
                    error={errors.school_email?.message}
                    required
                />
            </div>
        </div>
    )
}
