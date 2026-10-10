export const gsKeys = {
    all: ['gs-registration'] as const,
    status: ['gs-registration', 'payment-status'] as const,
    courses: ['gs-registration', 'courses'] as const,
    receipt: ['gs-registration', 'receipt'] as const,
    verify: (reference: string, round: number) => ['gs-registration', 'verify', reference, round] as const,
};
