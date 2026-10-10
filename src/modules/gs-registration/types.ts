export type {
    GsCourse,
    GsCoursesPayload,
    GsFee,
    GsInitiatePayload,
    GsInitiateResponse,
    GsPaymentState,
    GsPaymentStatus,
    GsReceipt,
    GsSubmitRegistrationPayload,
    GsVerifyResponse,
} from './schemas';

/** Minimal student shape the module needs. The host adapter (host.ts) produces it. */
export interface GsHostStudent {
    id: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    matricNumber?: string;
    faculty?: string;
    department?: string;
    programme?: string;
    level?: string;
    passportUrl?: string;
}

export type GsStepKey = 'select' | 'pay' | 'receipt';
