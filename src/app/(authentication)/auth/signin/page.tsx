'use client'

import React from 'react'
import AuthContauiner from '../components/AuthContainer';
import { AuthContainerHeader } from '../components/AuthContainerHeader';
import LoginFormContainer from './components/LoginFormContainer';
import { FormProvider } from '@/contexts/FormContext';
import { ApplySection } from './components/LoginFormFields';
import { LogIn } from 'lucide-react';

const LoginFormPage = () => {
    return (
        <AuthContauiner>
            {/* Header */}
            <AuthContainerHeader
                heading="WELCOME BACK"
                subHeading="Sign in to your account to continue"
                Icon={LogIn}
            />
            {/* Form body */}
            <FormProvider>
                <LoginFormContainer />
            </FormProvider>

            {/* Apply Section */}
            <ApplySection />
        </AuthContauiner >
    );
}

export default LoginFormPage
