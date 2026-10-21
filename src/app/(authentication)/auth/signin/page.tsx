'use client'

import React from 'react'
import AuthContauiner from '../components/AuthContainer';
import { AuthContainerHeader } from '../components/AuthContainerHeader';
import LoginFormContainer from './components/LoginFormContainer';
import { FormProvider } from '@/contexts/FormContext';
import { ApplySection } from './components/LoginFormFields';
import { Login03Icon } from '@hugeicons/core-free-icons';

const LoginFormPage = () => {
    return (
        <AuthContauiner>
            {/* Header */}
            <AuthContainerHeader
                heading="Welcome back"
                subHeading="Sign in with your university email to continue"
                // Icon={Login03Icon}
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
