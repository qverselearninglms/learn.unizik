import { passwordSchema, emailSchema, nameSchema, selectMenuSchema, confirmPasswordSchema, genderSchema, phoneSchema, usernameSchema, regNumberSchema, idNumberSchema } from "@/lib/validations/zod"
import z, { object } from "zod"

// Define Zod Schemas for each step
export const personalInfoSchema = z.object({
    first_name: nameSchema('First name'),
    last_name: nameSchema('Last name'),
    other_name: nameSchema('Other name', true),
    gender: genderSchema,
    nationality: selectMenuSchema('country'),
    // Required by POST /auth/register.
    state: selectMenuSchema('state'),
    local_gov_area: selectMenuSchema('local government area'),
    phone: phoneSchema(),
});

/** Undergraduate levels offered at sign-up. */
export const LEVEL_OPTIONS = [100, 200, 300, 400, 500] as const;

export const academicInfoSchema = z.object({
    // Kept as a number in-form (100, 200, ...); converted to string at the auth API boundary.
    level: z
        .number({ error: 'Please select your level' })
        .int()
        .refine((v) => (LEVEL_OPTIONS as readonly number[]).includes(v), 'Please select your level'),
    school_reg_number: regNumberSchema('School Registration Number'),
    // reg_number: regNumberSchema('School Registration Number'),
    // jamb_reg_number: regNumberSchema('Jamb Registration Number', true),
    school_email: emailSchema("School Email"),
});


export const programChoiceSchema = z.object({
    program_id: idNumberSchema('Program ID', true, 'number'),
    program: z.string().optional(), // This will be populated on the client side based on the selected 
});


export const accouintInfoSchema = z.object({
    email: emailSchema(),
    username: usernameSchema('username'),
    password: passwordSchema,
    confirm_password: confirmPasswordSchema('password'),
}).refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
});

export const signUpSchema = object({
    ...personalInfoSchema.shape,
    ...academicInfoSchema.shape,
    ...programChoiceSchema.shape,
    ...accouintInfoSchema.shape,
});


export type SignUpFormData = z.infer<typeof signUpSchema>;
