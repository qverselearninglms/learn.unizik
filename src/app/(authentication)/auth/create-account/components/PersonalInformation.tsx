"use client";

import { InputField } from '@/components/core/forms/input-field'
import { SignUpFormData } from '@/schema/sign-up-schema';
import React from 'react'
import { GenericHookFormProps } from '@/types/forms';
import { Controller, useWatch } from 'react-hook-form';
import { DynamicSelect } from '@/components/core/forms/select-menu';
import { useStaticData } from '@/hooks/useStaticData';
import { useLGA, useStates } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon, SmartPhone01Icon, UserIcon } from '@hugeicons/core-free-icons';

type PersonalInformationProps = GenericHookFormProps<SignUpFormData>;

export const PersonalInformation: React.FC<PersonalInformationProps> = ({ register, errors, control }) => {
    const { NewNationality, NewGender } = useStaticData();
    const selectedStateId = useWatch({
        control,
        name: "state",
    });
    const {
        data: states,
        isLoading: isStatesLoading,
        isError,
        refetch,
        isFetching,
    } = useStates();
    const {
        data: lga,
        isLoading: isLgaLoading,
        isError: isLgaError,
        refetch: refetchLga,
        isFetching: isFetchingLga,
    } = useLGA(selectedStateId ? Number(selectedStateId) : undefined);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <InputField
                    id='first_name'
                    {...register('first_name')}
                    label="First Name"
                    icon={UserIcon}
                    placeholder="Enter your first name"
                    error={errors.first_name?.message}
                    required
                />
                <InputField
                    id='last_name'
                    {...register('last_name')}
                    label="Last Name"
                    icon={UserIcon}
                    placeholder="Enter your last name"
                    error={errors.last_name?.message}
                    required
                />
                <div className="col-span-full">
                    <InputField
                        id='other_name'
                        {...register('other_name')}
                        label="Other Name"
                        icon={UserIcon}
                        placeholder="Enter your other names"
                        error={errors.other_name?.message}
                    // required
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {control && (
                    <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                            <DynamicSelect
                                label="Gender"
                                placeholder="Select your gender"
                                options={NewGender}
                                value={field.value}
                                onValueChange={field.onChange}
                                error={errors.gender?.message}
                                required
                            />
                        )}
                    />
                )}
                {control && (
                    <Controller
                        name="nationality"
                        control={control}
                        render={({ field }) => (
                            <DynamicSelect
                                label="Nationality"
                                placeholder="Select your country"
                                options={NewNationality}
                                value={field.value}
                                onValueChange={field.onChange}
                                error={errors.nationality?.message}
                                required
                            // value={selectedCountryId ? String(selectedCountryId) : ""}
                            // onValueChange={(val) => setSelectedCountryId(Number(val))}
                            />
                        )}
                    />
                )}
                {isStatesLoading ? (
                    <p className='flex items-center gap-3 text-sm text-muted-foreground'><HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin text-accent" /> Loading states…</p>
                ) : isError ? (
                    <div className="space-y-2">
                        <p className="text-red-500">Failed to load states. Please try again.</p>
                        <Button
                            type='button'
                            onClick={() => refetch()}
                            loading={isFetching}
                            className="px-3 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Retry
                        </Button>
                    </div>
                ) : control && states && states.length > 0 ? (
                    <Controller
                        name="state"
                        control={control}
                        render={({ field }) => (
                            <DynamicSelect
                                label="State"
                                placeholder="Select your state"
                                options={states}
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}
                                error={errors.state?.message}
                                required
                            />
                        )}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">No states available.</p>
                )}
                {isLgaLoading ? (
                    <p className='flex items-center gap-3 text-sm text-muted-foreground'><HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin text-accent" /> Loading local government areas…</p>
                ) : isLgaError ? (
                    <div className="space-y-2">
                        <p className="text-red-500">Failed to load local government areas. Please try again.</p>
                        <Button
                            type='button'
                            onClick={() => refetchLga()}
                            loading={isFetchingLga}
                            className="px-3 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Retry
                        </Button>
                    </div>
                ) : control && lga && lga.length > 0 ? (
                    <Controller
                        name="local_gov_area"
                        control={control}
                        render={({ field }) => (
                            <DynamicSelect
                                label="Local Government Area"
                                placeholder="Select your local government area"
                                options={lga}
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}
                                error={errors.local_gov_area?.message}
                                required
                            />
                        )}
                    />
                ) : (
                    <p className="self-end pb-3 text-sm text-muted-foreground">{selectedStateId ? 'No local government areas available.' : 'Select a state to see its local government areas.'}</p>
                )}
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <InputField
                    id='phone'
                    {...register('phone')}
                    label="Phone Number"
                    icon={SmartPhone01Icon}
                    inputMode="tel"
                    placeholder="Enter your phone number e.g 08123456789"
                    error={errors.phone?.message}
                    required
                />
            </div>
        </div>
    )
}
