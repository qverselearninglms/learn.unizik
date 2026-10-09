import { passwordSchema, emailSchema, nameSchema, selectMenuSchema, confirmPasswordSchema, genderSchema, phoneSchema, usernameSchema, regNumberSchema, idNumberSchema } from "@/lib/validations/zod"
import z, { object } from "zod"

// Define Zod Schemas for each step
export const personalInfoSchema = z.object({
    first_name: nameSchema('First name'),
    last_name: nameSchema('Last name'),
    other_name: nameSchema('Other name', true),
    gender: genderSchema,
    nationality: selectMenuSchema('country'),
    state: selectMenuSchema('state', true),
    local_gov_area: selectMenuSchema('local_gov_area', true),
    phone: phoneSchema(),
});

export const academicInfoSchema = z.object({
    department: nameSchema('Department'),
    reg_number: regNumberSchema('School Registration Number'),
    // jamb_reg_number: regNumberSchema('Jamb Registration Number', true),
    school_email: emailSchema("School Email"),
});


export const programChoiceSchema = z.object({
    program_id: idNumberSchema('Program ID', true, 'number'),
    program: z.string().optional(), // This will be populated on the client side based on the selected 
    level: idNumberSchema('Level', true, 'number'),
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
