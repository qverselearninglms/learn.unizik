import React from 'react'
import { redirect } from 'next/navigation';
import { SignupForm } from './components/signup-form';
// import AuthContainer from '@/components/global/AuthContainer';
// import { AuthContainerHeader } from '@/components/core/auth/auth-container-header';
import { UserPlus } from 'lucide-react';
import { AuthContainerHeader } from '../components/AuthContainerHeader';
import AuthContainer from '../components/AuthContainer';
import { BrandingPanel } from '@/components/global/generic-componenets';

const SignupPage = () => {
    // 2. Trigger the redirect immediately
    // redirect('/auth/signin')
    // return null;
    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <BrandingPanel className='hidden lg:flex lg:w-1/3' />
            {/* Right Panel */}
            <div className="w-full lg:w-2/3 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-10/12 h-[90vh] overflow-y-auto pr-10 no-scrollbar">
                    <AuthContainerHeader
                        heading="SIGN UP"
                        subHeading="Create your student account to access the portal"
                        Icon={UserPlus}
                    />
                    <SignupForm />
                </div>
            </div>
        </div>
    );
}

export default SignupPage
