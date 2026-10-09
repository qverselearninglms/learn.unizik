'use client'

import { DefaultValues, Resolver, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/types/auth";
import { toast } from "sonner";
import { authApi } from "@/lib/services/auth";
import { useRouter } from "next/navigation";
import { RegnumbersignInFormData, RegnumbersignInSchema } from "@/schema/auth-schema";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LOCAL_STORAGE_KEYS } from "@/config";
import { getSession, signIn } from "next-auth/react"; // Import NextAuth components
import { UserInterface } from "@/types/global";

export const useSigninForm = () => {
    const router = useRouter();
    const [accessToken, setAccessToken] = useLocalStorage<string | null>(
        LOCAL_STORAGE_KEYS.accessToken,
        null
    );
    const [user, setUser, removeUser] = useLocalStorage<UserInterface | null>(
        LOCAL_STORAGE_KEYS.user,
        null
    );

    const form = useForm<RegnumbersignInFormData>({
        resolver: zodResolver(RegnumbersignInSchema) as Resolver<RegnumbersignInFormData>,
        mode: "onChange",
        defaultValues: {
            reg_number: "",
            password: "",
            rememberMe: false,
            validationStatus: 'validationRequest',
        } as DefaultValues<RegnumbersignInFormData>,
    });

    const regNumberValidationRequestMutation = useMutation({
        mutationFn: (credentials: { reg_number: string }) =>
            authApi.regNumberValidationRequest(credentials),
        onSuccess: async () => {
            toast.success(`Your Reg Number has been successfully validated!`);
            form.setValue('validationStatus', 'authrequest');
        },
        onError: (error: ApiError) => {
            toast.error(error.message || "Validation failed. Please try again.");
        },
    });

    // UPDATED: Drives login state creation through NextAuth context trees
    const authenticateRegNumberMutation = useMutation({
        mutationFn: async (credentials: { reg_number: string; password: string }) => {
            const result = await signIn('reg-number', {
                reg_number: credentials.reg_number,
                password: credentials.password,
                redirect: false, // Handle routing lifecycle manually below
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            return result;
        },
        onSuccess: async () => {
            // Retrieve fresh authenticated profile state
            const session = await getSession();

            if (session?.user) {
                setUser(session.user as UserInterface & { access_token: string, expires_in: number })
                // Keep local storage keys synchronized with NextAuth tokens
                setAccessToken(session.user.access_token);

                toast.success(`Welcome back, ${session.user.first_name || "Zikite"}!`);
                router.push('/enrollment');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to authenticate. Please try again.");
        }
    });

    const onSubmit = async (data: RegnumbersignInFormData) => {
        if (data.validationStatus === 'validationRequest') {
            return regNumberValidationRequestMutation.mutate({
                reg_number: data.reg_number
            });
        }

        authenticateRegNumberMutation.mutate({
            reg_number: data.reg_number,
            password: data.password
        });
    };

    return {
        form,
        isProcessing: regNumberValidationRequestMutation.isPending || authenticateRegNumberMutation.isPending,
        onSubmit,
    };
};
