'use client';

import { useCallback, useState } from 'react';
import { gsBranding, gsToast } from '../host';
import { gsConfig } from '../gs.config';
import type { GsReceipt } from '../types';

/** Generates the docket PDF on demand and either downloads it or opens it for printing. */
export function useReceiptPdf(receipt: GsReceipt | undefined) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generate = useCallback(async () => {
        if (!receipt) return null;
        setIsGenerating(true);
        try {
            const { buildReceiptPdf } = await import('../lib/pdf/build-receipt-pdf');
            const result = await buildReceiptPdf(receipt, {
                institution: gsBranding.institution,
                directorate: gsConfig.labels.directorate,
                logoUrl: gsBranding.logoUrl,
            });
            if (!result.passportIncluded) {
                gsToast.warning("We couldn't load your passport photo, so the receipt was created without it.", {
                    description: 'Update your profile photo, then download it again before submitting to the Directorate.',
                });
            }
            return result;
        } catch (err) {
            console.error('[gs-registration] PDF generation failed', err);
            gsToast.error("We couldn't create the PDF. Please try again.");
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, [receipt]);

    const download = useCallback(async () => {
        const result = await generate();
        if (!result) return;
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
    }, [generate]);

    const openForPrint = useCallback(async () => {
        // Open synchronously so popup blockers see a user gesture, then point it at the PDF.
        const win = window.open('', '_blank');
        const result = await generate();
        if (!result) {
            win?.close();
            return;
        }
        const url = URL.createObjectURL(result.blob);
        if (win) win.location.href = url;
        else window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }, [generate]);

    return { download, openForPrint, isGenerating };
}
