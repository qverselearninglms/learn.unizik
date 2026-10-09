import { UserRole } from "@/config";
import { UserInterface } from "./global";

export type Department =
    | "accounting"
    | "business-admin"
    | "economics"
    | "finance"
    | "marketing"
    | "management";

export type Level = "100" | "200" | "300" | "400" | "500";

// SIGNUP RESPONSE TYPES
export interface SignupResponse {
    status: number;
    response: string;
    user: UserInterface;
}

// LOGIN TYPES
export interface LoginResponse {
    status: boolean;
    message: string;
    data: {
        user: UserInterface;
        token: string;
        expires_in: number;
    };
}

export interface Student extends UserInterface {
    role: UserRole.STUDENT;
    studentId: string;
    course: string;
    enrollmentDate: string;
    passport: string;
}

export interface Admin extends UserInterface {
    role: UserRole.ADMIN;
    adminId: string;
    department: string;
    passport: string;
}

export interface Director extends UserInterface {
    role: UserRole.DIRECTOR;
    directorId: string;
    department: string;
    passport: string;
}

export interface Teacher extends UserInterface {
    role: UserRole.TEACHER;
    teacherId: string;
    department: string;
    passport: string;
}

export interface Parent extends UserInterface {
    role: UserRole.PARENT;
    parentId: string;
    passport: string;
}

export type AuthUser = Student | Admin | Director | Teacher | Parent;

export interface AuthenState {
    user: AuthUser | null;
    access_token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    parentOTP: boolean;
}

export interface ApiResponse<T = unknown> {
    status: string | number;
    data: T;
    message: string;
    errors?: Record<string, string[]>;

    meta?: {
        count?: number; // <-- ADD THIS
        pagination?: {
            total: number;
            perPage: number;
            currentPage: number;
            lastPage: number;
        };
        [key: string]: any; // allows extra keys safely
    };
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    statusCode: number;
}

export interface PaginationParams {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

// ===============================
// PAYMENT TYPES
// ===============================

export interface Payment {
    id: number;
    student_id: number;
    amount: number;
    reference: string;
    status: "pending" | "successful" | "failed";
    created_at: string;
    updated_at: string;
}

export interface PaymentWithDetails extends Payment {
    student: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        studentId?: string;
        passport?: string;
        course?: string;
    };
}

// reg number authentication types:
export interface RegNumberUser {
    id: number;
    first_name: string;
    last_name: string;
    username: string | null;
    email: string;
    phone: string | null;
    role: string;
    country: string | null;
    state: string | null;
    lga: string | null;
    is_active: number;
    email_verified: number;
    phone_verified: number;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    meta: any | null;
    course_name: string | null;
    school_reg_number: string;
    jamb_reg_number: string | null;
    school_email: string;
    gender: string | null;
    nationality: string | null;
    local_gov_area: string | null;
    academic_semester: string | null;
    reg_number: string;
    start_year: string | null;
    is_applied: number;
    tuition_amount_paid: number | null;
    admission_status: string;
    reason_for_denial: string | null;
    phone_number: string;
    address: string | null;
    program: string;
    program_id: number | null;
    level: number;
    department: string | null;
    faculty: string | null;
}

export interface RegNumberLoginResponse {
    status: boolean;
    message: string;
    data: {
        user: RegNumberUser;
        token: string;
        expires_in_minutes: number;
        expires_at: string;
    };
}