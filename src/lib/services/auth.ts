import { SignUpFormData } from "@/schema/sign-up-schema";
import { apiClient } from "../../core/client";
import type { LoginResponse, SignupResponse } from "@/types/auth";
import { UserInterface } from "@/types/global";
import { forgotPasswordFormData, resetPasswordFormData, signInFormData } from "@/schema/auth-schema";

export const authApi = {
    login: async (credentials: signInFormData): Promise<LoginResponse> => {
        const requestUrl = (credentials.userType === "parent")
            ? `/auth/parent/verify-otp`
            : `/auth/login`;

        const response = await apiClient.post<LoginResponse>(requestUrl, credentials);
        return response as unknown as LoginResponse;
    },

    parentLoginOtpRequest: (parentCredentials: forgotPasswordFormData) =>
        apiClient.post("/auth/parent/request-otp", { ...parentCredentials }),
    // simulateApiRequest(),

    signup: async (data: SignUpFormData): Promise<SignupResponse> => {
        const response = await apiClient.post<SignupResponse>("/auth/register", data);

        return { ...response, user: { email: data.email } } as unknown as SignupResponse;
    },

    logout: () => apiClient.post("/auth/logout"),

    refreshToken: (refreshToken: string) =>
        apiClient.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
            refreshToken,
        }),

    getProfile: () => apiClient.get<UserInterface>("/application/profile"),

    forgotPassword: (forgotCredention: forgotPasswordFormData) =>
        apiClient.post("/auth/password/forgot", { ...forgotCredention }),


    resetPassword: (resetPCredention: resetPasswordFormData) => {
        const { token, email, ...passwordFeilds } = resetPCredention;
        return apiClient.post(`/auth/password/reset?token=${token}&email=${email}`, { ...passwordFeilds })
    },

    verifyResetPasswordToken: (token: string) =>
        apiClient.get(`/verify-token?token=${token}`),

    changePassword: (currentPassword: string, newPassword: string, passwordConfirmation: string) =>
        apiClient.post("/auth/change-password", {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: passwordConfirmation,
        }),

    updateProfile: (data: Partial<UserInterface>) =>
        apiClient.put<UserInterface>("/application/profile", data),

    // SECONDARY LOGIN
    regNumberValidationRequest: (regNumberCredentials: { reg_number: string }) =>
        apiClient.post("/auth/regnumber-validation-request", { ...regNumberCredentials }),

    regNumberLogin: (regNumberLoginCredentials: { reg_number: string, password: string }) =>
        apiClient.post("/auth/login-with-regnumber", { ...regNumberLoginCredentials }),
    // regNumberValidationRequest: async (regNumberCredentials: { reg_number: string }) => {
    //     // Simulate a 1-second network delay
    //     await delay(1000);

    //     // Test tip: enter "0000" in the input to simulate a validation failure
    //     if (regNumberCredentials.reg_number === "0000") {
    //         throw {
    //             message: "Registration number not found in our database.",
    //             errors: { reg_number: ["Please check the number and try again."] }
    //         };
    //     }

    //     // Return mock success response
    //     return {
    //         success: true,
    //         message: "Registration number verified successfully",
    //         reg_number: regNumberCredentials.reg_number,
    //     };
    // },

    // regNumberLogin: async (regNumberLoginCredentials: { reg_number: string; password: string }) => {
    //     // Simulate a 1-second network delay
    //     await delay(1000);

    //     // Test tip: enter "wrong" as the password to simulate an auth failure
    //     if (regNumberLoginCredentials.password === "wrong") {
    //         throw {
    //             message: "Authentication failed.",
    //             errors: { password: ["Incorrect password. Please try again."] }
    //         };
    //     }

    //     // Return mock auth response (tokens, user profile, etc.)
    //     return {
    //         success: true,
    //         message: "Login successful",
    //         access_token: "mock-jwt-token-xyz12345",
    //         user: {
    //             reg_number: regNumberLoginCredentials.reg_number,
    //             name: "Alex Doe",
    //             role: "student"
    //         }
    //     };
    // }

};
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const simulateApiRequest = (): Promise<any> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: 'API request completed after 30 seconds',
                data: { /* your mock data */ }
            });
        }, 500);
    });
};