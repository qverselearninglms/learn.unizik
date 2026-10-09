import NextAuth, { User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { signInFormData, signInSchema } from "./schema/auth-schema"
import { authApi } from "./lib/services/auth"
import { UserInterface } from "./types/global"
import { RegNumberLoginResponse } from "./types/auth"

export const { auth, handlers, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        // 1. Your Existing Provider (Defaults to id: "credentials")
        Credentials({
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                otp: { label: "OTP", type: "text" },
                rememberMe: { label: "Remember Me", type: "text" },
                userType: { label: "User Type", type: "text" },
            },
            async authorize(credentials) {
                try {
                    await signInSchema.parseAsync(credentials)
                    const response = await authApi.login(credentials as signInFormData)

                    if (!response.status) {
                        throw new Error(response.message || "Login failed");
                    }

                    const { token, user, expires_in } = response.data;
                    if (token) {
                        return {
                            ...user,
                            id: String(user.id),
                            role: user.role.toUpperCase(),
                            access_token: token,
                            expires_in: expires_in ?? 86400,
                        } as unknown as User;
                    }
                    return null;
                } catch (error) {
                    return null
                }
            }
        }),

        // 2. NEW Provider for Reg Number Flow
        Credentials({
            id: "reg-number",
            name: "Registration Number",
            credentials: {
                reg_number: { label: "Reg Number", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.reg_number || !credentials?.password) return null;

                    // Execute API and explicitly type-cast the response to resolve TS2339
                    const response = (await authApi.regNumberLogin({
                        reg_number: credentials.reg_number as string,
                        password: credentials.password as string,
                    })) as unknown as RegNumberLoginResponse;

                    // 1. Check the nested data structure safely
                    if (!response || !response.status || !response.data?.token) {
                        throw new Error(response?.message || "Invalid registration number or password");
                    }

                    // 2. Destructure from response.data instead of the root response
                    const { token, user, expires_in_minutes } = response.data;


                    // Map fields cleanly back into your global session layout
                    return {
                        ...user,
                        id: String(user.id),
                        // reg_number: user.reg_number,
                        // name: fullName,
                        // first_name: user.first_name,
                        role: user.role.toUpperCase(),
                        access_token: token, // maps "token" to what NextAuth expects
                        expires_in: expires_in_minutes * 60, // converts minutes to seconds
                    } as any;

                } catch (error: any) {
                    console.error('Reg Number Auth error:', error);
                    throw new Error(error.message || "Invalid credentials");
                }
            }
        })
    ],
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.user = user as UserInterface
                token.access_token = user.access_token
                token.expires_in = user.expires_in
            }
            return token
        },
        async session({ session, token }) {
            if (token?.user) {
                session.user = {
                    ...(token.user as UserInterface),
                    access_token: token.access_token as string,
                    expires_in: token.expires_in as number,
                    emailVerified: null,
                };
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
})
