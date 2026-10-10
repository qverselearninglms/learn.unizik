/**
 * GS Registration module — public API.
 * Route files import ONLY from here:
 *
 *   import { SelectCoursesView } from '@/modules/gs-registration';
 */
export { SelectCoursesView } from './views/select-courses-view';
export { PayView } from './views/pay-view';
export { ReceiptView } from './views/receipt-view';

export { gsConfig } from './gs.config';
export { useGsPaymentStatus } from './hooks/use-gs-payment-status';
export type { GsReceipt, GsPaymentStatus, GsCourse, GsHostStudent } from './types';
