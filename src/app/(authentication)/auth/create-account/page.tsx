import React from 'react'
import { UserAdd01Icon } from '@hugeicons/core-free-icons';
import { SignupForm } from './components/signup-form';
import { AuthContainerHeader } from '../components/AuthContainerHeader';
import AuthContainer from '../components/AuthContainer';

const SignupPage = () => {
    return (
        <AuthContainer width="wide" variant="signup">
            <AuthContainerHeader
                heading="Create your account"
                subHeading="Four quick steps and you're in. You'll sign in right after."
                // Icon={UserAdd01Icon}
            />
            <SignupForm />
        </AuthContainer>
    );
}

export default SignupPage
