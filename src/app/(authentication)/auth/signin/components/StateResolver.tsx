"use client";

import { SigninForm } from './SigninForm';
import { AuthContainerHeader } from '../../components/AuthContainerHeader';
import { Fingerprint } from 'lucide-react';
import AuthSidebar from './AuthSidebar';

export const StateResolver = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen gap-0">
            {/* Left Sidebar Content (Hidden on Mobile) */}
            <div className="min-h-screen hidden lg:block lg:col-span-7 xl:col-span-8">
                <AuthSidebar />
            </div>

            {/* Right Side Form (Takes full width on Mobile) */}
            <div className="min-h-screen  lg:col-span-5 xl:col-span-4 flex flex-col justify-center  px-10 bg-primary-50">
                <AuthContainerHeader
                    heading='Sign in to your account'
                    subHeading='Enter your Registration number below.'
                    Icon={Fingerprint}
                />
                <SigninForm />
            </div>
        </div>
    );
};
